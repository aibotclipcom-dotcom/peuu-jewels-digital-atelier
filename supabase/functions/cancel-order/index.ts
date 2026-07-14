// Supabase Edge Function: cancel-order
// Cancels an order within the 24-hour window and initiates a Razorpay refund
// when applicable. All sensitive credentials are read from Deno.env; no keys
// live in the frontend.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const ALLOWED_ORIGIN_SUFFIXES = [".lovable.app", ".lovableproject.com"];
const ALLOWED_ORIGIN_EXACT = new Set<string>([
  "https://peuujewels.in",
  "https://www.peuujewels.in",
]);

function corsFor(origin: string | null) {
  const allow =
    origin &&
    (ALLOWED_ORIGIN_EXACT.has(origin) ||
      ALLOWED_ORIGIN_SUFFIXES.some((s) => {
        try {
          return new URL(origin).hostname.endsWith(s);
        } catch {
          return false;
        }
      }))
      ? origin
      : "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;
const BLOCKED_STATUSES = new Set(["cancelled", "shipped", "delivered"]);

Deno.serve(async (req) => {
  const cors = corsFor(req.headers.get("Origin"));
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
  const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

  if (!SUPABASE_URL || !SERVICE_ROLE || !ANON_KEY) {
    return json(500, { error: "Server not configured" });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json(401, { error: "Unauthorized" });

  // Resolve caller identity from JWT.
  const authClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: userData, error: userErr } = await authClient.auth.getUser(token);
  if (userErr || !userData?.user) return json(401, { error: "Unauthorized" });
  const userId = userData.user.id;

  let payload: { orderId?: string; reason?: string };
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }
  const orderId = typeof payload.orderId === "string" ? payload.orderId.trim() : "";
  const reason = typeof payload.reason === "string"
    ? payload.reason.slice(0, 500)
    : "";
  if (!orderId) return json(400, { error: "orderId required" });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: order, error: fetchErr } = await admin
    .from("orders")
    .select(
      "id, user_id, status, created_at, payment_method, razorpay_payment_id, total",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (fetchErr) return json(500, { error: fetchErr.message });
  if (!order) return json(404, { error: "Order not found" });
  if (order.user_id !== userId) return json(403, { error: "Forbidden" });
  if (BLOCKED_STATUSES.has(String(order.status))) {
    return json(409, { error: `Order cannot be cancelled (status: ${order.status})` });
  }

  // Server-side 24h re-check — do NOT trust the client clock.
  const createdAtMs = new Date(order.created_at).getTime();
  if (!Number.isFinite(createdAtMs)) return json(500, { error: "Invalid order timestamp" });
  const elapsed = Date.now() - createdAtMs;
  if (elapsed >= CANCELLATION_WINDOW_MS) {
    return json(409, { error: "Cancellation window (24h) has expired" });
  }

  // Attempt refund when payment was captured via Razorpay.
  let refundId: string | null = null;
  let refundStatus: string | null = null;
  if (
    order.payment_method === "razorpay" &&
    order.razorpay_payment_id &&
    RAZORPAY_KEY_ID &&
    RAZORPAY_KEY_SECRET
  ) {
    const basic = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const res = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(order.razorpay_payment_id)}/refund`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ speed: "normal" }),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      console.error("Razorpay refund failed:", res.status, text);
      return json(502, { error: "Refund failed. Please contact concierge." });
    }
    const refund = (await res.json()) as { id?: string; status?: string };
    refundId = refund.id ?? null;
    refundStatus = refund.status ?? null;
  }

  const { error: updateErr } = await admin
    .from("orders")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason || null,
      refund_id: refundId,
      refund_status: refundStatus,
    })
    .eq("id", order.id);

  if (updateErr) return json(500, { error: updateErr.message });

  return json(200, {
    ok: true,
    orderId: order.id,
    refund: refundId ? { id: refundId, status: refundStatus } : null,
  });
});
