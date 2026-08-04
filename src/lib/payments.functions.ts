import { createServerFn } from "@tanstack/react-start";
import { createHmac } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildQuote, type CartLineInput } from "@/lib/order-pricing";

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

function optionalAddress(s: unknown): ShippingPayload | null {
  if (!s || typeof s !== "object") return null;
  try {
    return validateShipping(s);
  } catch {
    return null;
  }
}

/** Live coupon check for the cart/checkout "Apply" button. */
export const validateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { items: CartLineInput[]; code: string }) => {
    if (!Array.isArray(data?.items)) throw new Error("Cart is empty");
    if (typeof data?.code !== "string" || !data.code.trim()) {
      throw new Error("Enter a discount code.");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const email = (context.claims?.email as string | undefined)?.toLowerCase();
    const quote = await buildQuote(context.supabase, data.items, data.code, email);
    if (!quote.coupon.coupon) {
      return { valid: false as const, reason: quote.coupon.reason ?? "Invalid coupon code." };
    }
    return {
      valid: true as const,
      code: quote.coupon.coupon.code,
      discount: quote.totals.couponDiscount,
      totals: quote.totals,
    };
  });

/** Server-authoritative totals for the cart summary. */
export const quoteCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { items: CartLineInput[]; couponCode?: string }) => {
    if (!Array.isArray(data?.items) || data.items.length === 0) throw new Error("Cart is empty");
    return data;
  })
  .handler(async ({ data, context }) => {
    const email = (context.claims?.email as string | undefined)?.toLowerCase();
    const quote = await buildQuote(context.supabase, data.items, data.couponCode, email);
    return {
      totals: quote.totals,
      couponApplied: quote.coupon.coupon,
      couponReason: quote.coupon.reason,
    };
  });

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { items: CartLineInput[]; couponCode?: string }) => {
    if (!Array.isArray(data?.items) || data.items.length === 0) {
      throw new Error("Cart is empty");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const keyId = process.env["RAZORPAY_KEY_ID"];
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keyId || !keySecret) throw new Error("Razorpay is not configured");

    const email = (context.claims?.email as string | undefined)?.toLowerCase();
    const quote = await buildQuote(context.supabase, data.items, data.couponCode, email);
    const { totals, coupon } = quote;

    if (!Number.isFinite(totals.grandTotal) || totals.grandTotal <= 0) {
      throw new Error("Invalid total");
    }

    const amountPaise = Math.round(totals.grandTotal * 100);
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
        notes: coupon.couponId ? { coupon_id: coupon.couponId } : undefined,
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
      totals,
      couponApplied: coupon.coupon,
      couponReason: coupon.reason,
    };
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      items: CartLineInput[];
      shipping: ShippingPayload;
      billing?: ShippingPayload | null;
      notes?: string;
      couponCode?: string;
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
      const billing = optionalAddress(data.billing);
      const notes = typeof data.notes === "string" ? data.notes.slice(0, 1000) : "";
      return { ...data, shipping, billing, notes };
    },
  )
  .handler(async ({ data, context }) => {
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keySecret) throw new Error("Razorpay is not configured");

    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");

    if (expected !== data.razorpay_signature) {
      throw new Error("Invalid payment signature");
    }

    const { supabase, userId } = context;
    const email = (context.claims?.email as string | undefined)?.toLowerCase();

    // Idempotency — a replayed payment id must never create a second order.
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("razorpay_payment_id", data.razorpay_payment_id)
      .maybeSingle();
    if (existing?.id) return { orderId: existing.id };

    const quote = await buildQuote(supabase, data.items, data.couponCode, email);
    const { totals, coupon, lines } = quote;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total: totals.grandTotal,
        subtotal: totals.itemsTotal,
        discount_total: totals.couponDiscount,
        shipping_total: totals.shipping,
        tax_total: totals.tax,
        coupon_code: coupon.coupon?.code ?? null,
        status: "confirmed",
        payment_method: "razorpay",
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        shipping_address: { ...data.shipping } as Record<string, string>,
        billing_address: (data.billing ?? data.shipping) as unknown as Record<string, string>,
        notes: data.notes || null,
      })
      .select()
      .single();

    if (error) {
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
      lines.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        product_name: i.name,
        quantity: i.quantity,
        unit_price: i.price,
      })),
    );
    if (itemsErr) throw new Error(itemsErr.message);

    if (coupon.couponId) {
      // Redemption + usage counters are written with elevated privileges:
      // RLS intentionally forbids clients from setting used_at / order_id.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      if (email) {
        await supabaseAdmin.from("coupon_redemptions").upsert(
          {
            coupon_id: coupon.couponId,
            email,
            user_id: userId,
            order_id: order.id,
            used_at: new Date().toISOString(),
          },
          { onConflict: "coupon_id,email" },
        );
      }
      const { data: current } = await supabaseAdmin
        .from("coupons")
        .select("used_count")
        .eq("id", coupon.couponId)
        .maybeSingle();
      await supabaseAdmin
        .from("coupons")
        .update({ used_count: (Number(current?.used_count) || 0) + 1 })
        .eq("id", coupon.couponId);
    }

    return { orderId: order.id, totals };
  });
