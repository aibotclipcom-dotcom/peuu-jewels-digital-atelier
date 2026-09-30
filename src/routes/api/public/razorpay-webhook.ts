import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Razorpay webhook: the only path that marks an order "confirmed".
 * Configure in Razorpay Dashboard → Webhooks with events payment.captured / order.paid.
 */
export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
        if (!secret) return new Response("Not configured", { status: 500 });

        const body = await request.text();
        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const a = Buffer.from(signature);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: {
          event?: string;
          payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; currency?: string; status?: string } } };
        };
        try {
          event = JSON.parse(body);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }
        if (event.event !== "payment.captured" && event.event !== "order.paid") {
          return new Response("ignored");
        }
        const pay = event.payload?.payment?.entity;
        if (!pay?.order_id || !pay.id || pay.status !== "captured" || pay.currency !== "INR") {
          return new Response("ignored");
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: order } = await supabaseAdmin
          .from("orders")
          .select("id, status, total, razorpay_payment_id")
          .eq("razorpay_order_id", pay.order_id)
          .maybeSingle();

        // Order not saved yet (webhook raced checkout) — ask Razorpay to retry.
        if (!order) return new Response("Order not found yet", { status: 409 });
        if (order.status !== "pending") return new Response("ok");

        if (
          Math.round(Number(order.total) * 100) !== Number(pay.amount) ||
          (order.razorpay_payment_id && order.razorpay_payment_id !== pay.id)
        ) {
          console.error("Webhook amount/payment mismatch for order", order.id);
          return new Response("mismatch");
        }

        const { error } = await supabaseAdmin
          .from("orders")
          .update({ status: "confirmed", razorpay_payment_id: pay.id })
          .eq("id", order.id)
          .eq("status", "pending");
        if (error) return new Response("Update failed", { status: 500 });
        return new Response("ok");
      },
    },
  },
});
