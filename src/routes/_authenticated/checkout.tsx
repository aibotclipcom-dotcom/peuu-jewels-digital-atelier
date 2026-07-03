import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/format";
import {
  ShippingDetailsForm,
  type ShippingValues,
} from "@/components/checkout/ShippingDetailsForm";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "@/lib/payments.functions";

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const s = document.createElement("script");
    s.src = RAZORPAY_SCRIPT;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — PEUU Jewels" },
      { name: "description", content: "Complete your PEUU Jewels order." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { user } = useAuth();
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const createOrder = useServerFn(createRazorpayOrder);
  const verifyPayment = useServerFn(verifyRazorpayPayment);
  const [submitting, setSubmitting] = useState(false);
  const [savePreference, setSavePreference] = useState(true);

  useEffect(() => {
    void loadRazorpay();
  }, []);

  useEffect(() => {
    if (items.length === 0 && !submitting) {
      navigate({ to: "/boutique", replace: true });
    }
  }, [items.length, navigate, submitting]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "full_name, phone, street_address, city, state, postal_code",
        )
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function handleSubmit(values: ShippingValues) {
    if (!user) {
      toast.error("Please sign in to complete your order.");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    setSubmitting(true);
    try {
      if (savePreference) {
        const { error: pErr } = await supabase
          .from("profiles")
          .update({
            full_name: values.full_name,
            phone: values.phone,
            street_address: values.street_address,
            city: values.city,
            state: values.state,
            postal_code: values.postal_code,
          })
          .eq("id", user.id);
        if (pErr) console.warn("Profile save failed:", pErr.message);
      }

      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) throw new Error("Razorpay failed to load");

      const lineItems = items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      }));

      const shipping = {
        full_name: values.full_name,
        phone: values.phone,
        street_address: values.street_address,
        city: values.city,
        state: values.state,
        postal_code: values.postal_code,
      };
      const notes = values.notes ?? "";

      const order = await createOrder({ data: { items: lineItems } });

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "PEUU Jewels",
        description: `${items.length} ${items.length === 1 ? "piece" : "pieces"}`,
        prefill: {
          email: user.email ?? "",
          name: values.full_name,
          contact: values.phone,
        },
        theme: { color: "#0A192F" },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifyPayment({
              data: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                items: lineItems,
                shipping,
                notes,
              },
            });
            clear();
            toast.success("Payment received.", {
              description: "Your order is confirmed — thank you.",
            });
            navigate({ to: "/account" });
          } catch (e) {
            toast.error((e as Error).message);
          } finally {
            setSubmitting(false);
          }
        },
      });
      rzp.open();
    } catch (e) {
      toast.error((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-alabaster pt-24 sm:pt-32">
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 sm:px-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="text-[0.7rem] tracking-luxury uppercase text-rose">Checkout</div>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-navy sm:text-5xl">
            Delivery details
          </h1>
          <p className="mt-3 max-w-lg text-sm text-navy/60">
            Please complete the details below. Your order can only be finalized once we have
            your full shipping and contact information.
          </p>

          <div className="mt-10">
            <ShippingDetailsForm
              submitLabel="Continue to Payment"
              submitting={submitting}
              defaultValues={{
                full_name:
                  profile?.full_name ??
                  (user?.user_metadata?.full_name as string | undefined) ??
                  "",
                phone: profile?.phone ?? "",
                street_address: profile?.street_address ?? "",
                city: profile?.city ?? "",
                state: profile?.state ?? "",
                postal_code: profile?.postal_code ?? "",
              }}
              onSubmit={handleSubmit}
              footer={
                <label className="flex items-center gap-3 text-[0.75rem] text-navy/70">
                  <input
                    type="checkbox"
                    checked={savePreference}
                    onChange={(e) => setSavePreference(e.target.checked)}
                    className="h-4 w-4 accent-navy"
                  />
                  Save these details to my profile for next time
                </label>
              }
            />
          </div>
        </div>

        <aside className="h-fit border border-border/60 bg-cashmere/30 p-6 sm:p-8 lg:sticky lg:top-32">
          <div className="text-[0.65rem] tracking-luxury uppercase text-navy/60">Order Summary</div>
          <ul className="mt-6 divide-y divide-border/60">
            {items.map((i) => (
              <li key={i.id} className="flex gap-3 py-4">
                <div className="h-16 w-14 shrink-0 overflow-hidden bg-alabaster">
                  <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-serif text-sm text-navy">{i.name}</div>
                  <div className="text-[0.7rem] text-navy/55">Qty {i.quantity}</div>
                </div>
                <div className="text-sm tabular-nums text-navy/80">
                  {formatPrice(i.price * i.quantity)}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-baseline justify-between border-t border-border/60 pt-5">
            <span className="text-[0.65rem] tracking-luxury uppercase text-navy/60">Total</span>
            <span className="font-serif text-2xl text-navy">{formatPrice(total)}</span>
          </div>
          <p className="mt-4 text-[0.7rem] leading-relaxed text-navy/55">
            By placing this order you agree to our{" "}
            <Link to="/terms-of-service" className="underline">Terms of Service</Link> and{" "}
            <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.
          </p>
        </aside>
      </section>
    </main>
  );
}
