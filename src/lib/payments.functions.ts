import { createServerFn } from "@tanstack/react-start";
import { createHmac } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

interface CartLine {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ShippingPayload {
  full_name: string;
  phone: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
}

function validateShipping(s: unknown): ShippingPayload {
  const o = (s ?? {}) as Record<string, unknown>;
  const req = (k: keyof ShippingPayload) => {
    const v = o[k];
    if (typeof v !== "string" || v.trim().length < 2) {
      throw new Error(`Missing shipping field: ${k}`);
    }
    return v.trim();
  };
  return {
    full_name: req("full_name"),
    phone: req("phone"),
    street_address: req("street_address"),
    city: req("city"),
    state: req("state"),
    postal_code: req("postal_code"),
  };
}

function normalizeItems(items: CartLine[]) {
  const normalized = items.map((i) => {
    const id = String(i?.id ?? "").trim();
    const quantity = Math.floor(Number(i?.quantity));
    if (!id) throw new Error("Invalid item id");
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Invalid item quantity");
    }
    return { id, quantity, name: String(i?.name ?? "") };
  });
  // Merge duplicate product ids to prevent inflated totals via repeated lines.
  const merged = new Map<string, { id: string; quantity: number; name: string }>();
  for (const it of normalized) {
    const prev = merged.get(it.id);
    if (prev) prev.quantity += it.quantity;
    else merged.set(it.id, { ...it });
  }
  return [...merged.values()];
}

async function loadProductPrices(
  supabase: { from: (t: string) => any },
  ids: string[],
) {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price")
    .in("id", ids);
  if (error) throw new Error(error.message);
  const map = new Map<string, { name: string; price: number }>();
  for (const p of (data ?? []) as Array<{ id: string; name: string; price: number }>) {
    map.set(p.id, { name: p.name, price: Number(p.price) });
  }
  return map;
}


const MIN_ORDER_INR = 300;

async function resolveCoupon(
  supabase: { from: (t: string) => any },
  code: string | undefined,
  email: string | undefined,
): Promise<{ id: string; percent_off: number } | null> {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const { data: coupon } = await supabase
    .from("coupons")
    .select("id, percent_off, first_order_only, active, expires_at")
    .eq("code", normalized)
    .maybeSingle();
  if (!coupon || !coupon.active) return null;
  if (coupon.expires_at && new Date(coupon.expires_at as string) < new Date()) return null;
  if (coupon.first_order_only && email) {
    const { data: red } = await supabase
      .from("coupon_redemptions")
      .select("used_at")
      .eq("coupon_id", coupon.id)
      .eq("email", email.toLowerCase())
      .maybeSingle();
    if (red?.used_at) return null;
  }
  return { id: coupon.id as string, percent_off: Number(coupon.percent_off) };
}

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { items: CartLine[]; couponCode?: string }) => {
    if (!Array.isArray(data?.items) || data.items.length === 0) {
      throw new Error("Cart is empty");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error("Razorpay is not configured");

    const items = normalizeItems(data.items);
    const priceMap = await loadProductPrices(context.supabase, items.map((i) => i.id));

    let subtotal = 0;
    for (const i of items) {
      const p = priceMap.get(i.id);
      if (!p) throw new Error(`Product not available: ${i.id}`);
      if (!Number.isFinite(p.price) || p.price <= 0) {
        throw new Error(`Invalid product price: ${i.id}`);
      }
      subtotal += p.price * i.quantity;
    }
    if (!Number.isFinite(subtotal) || subtotal <= 0) throw new Error("Invalid total");
    if (subtotal < MIN_ORDER_INR) {
      throw new Error(`Minimum order value is ₹${MIN_ORDER_INR}.`);
    }

    const coupon = await resolveCoupon(
      context.supabase,
      data.couponCode,
      context.claims?.email as string | undefined,
    );
    const discount = coupon ? Math.round(subtotal * (coupon.percent_off / 100)) : 0;
    const total = Math.max(0, subtotal - discount);

    const amountPaise = Math.round(total * 100);
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: `peuu_${Date.now()}`,
        payment_capture: 1,
        notes: coupon ? { coupon_id: coupon.id } : undefined,
      }),
    });

    if (!res.ok) {
      console.error("Razorpay create order failed with status", res.status);
      throw new Error("Could not create payment order");
    }
    const order = (await res.json()) as { id: string; amount: number; currency: string };

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      subtotal,
      discount,
      total,
      couponApplied: coupon ? { code: (data.couponCode ?? "").toUpperCase(), percent_off: coupon.percent_off } : null,
    };
  });


export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      items: CartLine[];
      shipping: ShippingPayload;
      notes?: string;
    }) => {
      if (
        !data?.razorpay_order_id ||
        !data?.razorpay_payment_id ||
        !data?.razorpay_signature ||
        !Array.isArray(data?.items)
      ) {
        throw new Error("Missing payment payload");
      }
      const shipping = validateShipping(data.shipping);
      const notes = typeof data.notes === "string" ? data.notes.slice(0, 1000) : "";
      return { ...data, shipping, notes };
    },
  )
  .handler(async ({ data, context }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Razorpay is not configured");

    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");

    if (expected !== data.razorpay_signature) {
      throw new Error("Invalid payment signature");
    }

    const { supabase, userId } = context;

    // Idempotency: if this payment has already been recorded, return it.
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("razorpay_payment_id", data.razorpay_payment_id)
      .maybeSingle();
    if (existing?.id) {
      return { orderId: existing.id };
    }

    const items = normalizeItems(data.items);
    const priceMap = await loadProductPrices(supabase, items.map((i) => i.id));

    let total = 0;
    const priced = items.map((i) => {
      const p = priceMap.get(i.id);
      if (!p) throw new Error(`Product not available: ${i.id}`);
      if (!Number.isFinite(p.price) || p.price <= 0) {
        throw new Error(`Invalid product price: ${i.id}`);
      }
      total += p.price * i.quantity;
      return { ...i, name: p.name || i.name, unit_price: p.price };
    });

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total,
        status: "confirmed",
        payment_method: "razorpay",
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        shipping_address: { ...data.shipping } as Record<string, string>,
        notes: data.notes || null,
      })
      .select()
      .single();
    if (error) {
      // Unique-violation race: another call already inserted this payment.
      const code = (error as { code?: string }).code;
      if (code === "23505") {
        const { data: dup } = await supabase
          .from("orders")
          .select("id")
          .eq("razorpay_payment_id", data.razorpay_payment_id)
          .maybeSingle();
        if (dup?.id) return { orderId: dup.id };
      }
      throw new Error(error.message);
    }

    const { error: itemsErr } = await supabase.from("order_items").insert(
      priced.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        product_name: i.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
    );
    if (itemsErr) throw new Error(itemsErr.message);

    return { orderId: order.id };
  });
