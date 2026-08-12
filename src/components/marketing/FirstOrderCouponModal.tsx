import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { claimWelcomeCoupon } from "@/lib/coupons.functions";
import { toast } from "sonner";

const STORAGE_KEY = "peuu_welcome_modal";
const COUPON_STORAGE = "peuu_coupon_code";
const COUPON_CODE = "WELCOME10";

export function FirstOrderCouponModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;
    const t = window.setTimeout(() => setOpen(true), 4000);
    return () => window.clearTimeout(t);
  }, []);

  function dismiss() {
    setOpen(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
  }

  async function claim(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const { data: rows } = await supabase.rpc("lookup_coupon", { _code: COUPON_CODE });
      const coupon = Array.isArray(rows) ? rows[0] : null;
      if (!coupon || !coupon.active) throw new Error("Offer unavailable.");

      const { data: existing } = await supabase
        .from("coupon_redemptions")
        .select("used_at")
        .eq("coupon_id", coupon.id)
        .eq("email", clean)
        .maybeSingle();
      if (existing?.used_at) {
        toast.info("This offer has already been used on this email.");
      } else {
        await supabase
          .from("coupon_redemptions")
          .upsert({ coupon_id: coupon.id, email: clean }, { onConflict: "coupon_id,email" });
      }
      window.localStorage.setItem(COUPON_STORAGE, COUPON_CODE);
      toast.success(`Code ${COUPON_CODE} applied to your first order.`);
      dismiss();
    } catch (err) {
      toast.error((err as Error).message || "Could not claim offer.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md border border-border/60 bg-alabaster p-8 shadow-2xl">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center text-navy/60 hover:text-navy"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="text-[0.65rem] tracking-luxury uppercase text-rose">The Maison</div>
        <h2 className="mt-3 font-serif text-3xl text-navy">A welcome gesture</h2>
        <p className="mt-3 text-sm text-navy/65">
          Enjoy <strong>10% off</strong> your first PEUU piece. Enter your email and we&apos;ll
          set aside the code <span className="font-mono">{COUPON_CODE}</span> for your first
          order.
        </p>
        <form onSubmit={claim} className="mt-6 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-border/60 bg-alabaster px-4 py-3 text-sm text-navy placeholder:text-navy/30 focus:border-navy focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy py-3 text-[0.7rem] tracking-luxury uppercase text-alabaster hover:bg-navy-soft disabled:opacity-60"
          >
            {loading ? "Claiming…" : "Claim 10% off"}
          </button>
        </form>
        <button
          type="button"
          onClick={dismiss}
          className="mt-3 w-full text-[0.65rem] tracking-luxury uppercase text-navy/50 hover:text-navy"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}
