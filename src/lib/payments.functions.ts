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

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { items: CartLine[] }) => {
    if (!Array.isArray(data?.items) || data.items.length === 0) {
      throw new Error("Cart is empty");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error("Razorpay is not configured");

    const total = data.items.reduce(
      (s, i) => s + Number(i.price) * Number(i.quantity),
      0,
    );
    if (!Number.isFinite(total) || total <= 0) throw new Error("Invalid total");

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
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Razorpay create order failed:", text);
      throw new Error("Could not create payment order");
    }
    const order = (await res.json()) as { id: string; amount: number; currency: string };

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
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
    }) => {
      if (
        !data?.razorpay_order_id ||
        !data?.razorpay_payment_id ||
        !data?.razorpay_signature ||
        !Array.isArray(data?.items)
      ) {
        throw new Error("Missing payment payload");
      }
      return data;
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

    const total = data.items.reduce(
      (s, i) => s + Number(i.price) * Number(i.quantity),
      0,
    );

    const { supabase, userId } = context;

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total,
        status: "confirmed",
        payment_method: "razorpay",
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const { error: itemsErr } = await supabase.from("order_items").insert(
      data.items.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        product_name: i.name,
        quantity: i.quantity,
        unit_price: i.price,
      })),
    );
    if (itemsErr) throw new Error(itemsErr.message);

    return { orderId: order.id };
  });
