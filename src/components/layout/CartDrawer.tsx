import { useCart } from "@/hooks/use-cart";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatPrice } from "@/lib/format";
import { Minus, Plus, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/payments.functions";

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

export function CartDrawer() {
  const { items, total, open, setOpen, remove, setQuantity, clear } = useCart();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const createOrder = useServerFn(createRazorpayOrder);
  const verifyPayment = useServerFn(verifyRazorpayPayment);

  useEffect(() => {
    if (open) void loadRazorpay();
  }, [open]);

  async function handleConcierge() {
    if (!user) {
      setOpen(false);
      toast("Please sign in to place your request.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .insert({ user_id: user.id, total, status: "pending" })
        .select()
        .single();
      if (error) throw error;
      const { error: itemsErr } = await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: order.id,
          product_id: i.id,
          product_name: i.name,
          quantity: i.quantity,
          unit_price: i.price,
        })),
      );
      if (itemsErr) throw itemsErr;
      clear();
      setOpen(false);
      toast.success("Your request has been received.", {
        description: "A concierge will reach out shortly.",
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePay() {
    if (!user) {
      setOpen(false);
      toast("Please sign in to complete payment.");
      return;
    }
    setPaying(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) throw new Error("Razorpay failed to load");

      const lineItems = items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      }));

      const order = await createOrder({ data: { items: lineItems } });

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "PEUU Jewels",
        description: `${items.length} ${items.length === 1 ? "piece" : "pieces"}`,
        prefill: { email: user.email ?? "" },
        theme: { color: "#0A192F" },
        modal: {
          ondismiss: () => setPaying(false),
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
              },
            });
            clear();
            setOpen(false);
            toast.success("Payment received.", {
              description: "Your order is confirmed — thank you.",
            });
          } catch (e) {
            toast.error((e as Error).message);
          } finally {
            setPaying(false);
          }
        },
      });
      rzp.open();
    } catch (e) {
      toast.error((e as Error).message);
      setPaying(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="w-full max-w-md bg-alabaster p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <SheetTitle className="font-serif text-2xl tracking-tight text-navy">
            Your Selection
          </SheetTitle>
          <p className="text-[0.65rem] tracking-luxury uppercase text-navy/50">
            {items.length} {items.length === 1 ? "piece" : "pieces"}
          </p>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
            <div className="font-serif text-xl text-navy">Your atelier basket is empty.</div>
            <p className="mt-3 max-w-xs text-sm text-navy/60">
              Begin curating your collection from The Boutique.
            </p>
            <Link
              to="/boutique"
              onClick={() => setOpen(false)}
              className="mt-8 line-draw text-[0.7rem] tracking-luxury uppercase text-navy"
            >
              Discover Pieces
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <ul className="divide-y divide-border/60">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4 py-5">
                    <div className="h-24 w-20 shrink-0 overflow-hidden bg-cashmere">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            to="/boutique/$slug"
                            params={{ slug: item.slug }}
                            onClick={() => setOpen(false)}
                            className="block truncate font-serif text-base text-navy"
                          >
                            {item.name}
                          </Link>
                          <div className="mt-1 text-sm text-navy/70">{formatPrice(item.price)}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          className="text-navy/40 hover:text-navy"
                          aria-label="Remove"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                          className="grid h-7 w-7 place-items-center border border-border text-navy hover:bg-cashmere"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm tabular-nums text-navy">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                          className="grid h-7 w-7 place-items-center border border-border text-navy hover:bg-cashmere"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-border/60 bg-cashmere/40 px-6 py-6">
              <div className="flex items-baseline justify-between">
                <span className="text-[0.65rem] tracking-luxury uppercase text-navy/60">Subtotal</span>
                <span className="font-serif text-2xl text-navy">{formatPrice(total)}</span>
              </div>
              <p className="mt-2 text-xs text-navy/55">
                Pay securely via Razorpay or request a concierge call.
              </p>
              <button
                type="button"
                onClick={handlePay}
                disabled={paying || submitting}
                className="mt-5 w-full bg-navy py-4 text-[0.7rem] tracking-luxury uppercase text-alabaster transition-all hover:bg-navy-soft disabled:opacity-60"
              >
                {paying ? "Opening Razorpay…" : user ? "Pay with Razorpay" : "Sign in to pay"}
              </button>
              <button
                type="button"
                onClick={handleConcierge}
                disabled={submitting || paying}
                className="mt-3 w-full border border-navy/20 py-4 text-[0.7rem] tracking-luxury uppercase text-navy transition-all hover:bg-navy/5 disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Request Concierge Call"}
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
