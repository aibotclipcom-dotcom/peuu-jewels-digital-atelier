import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { validateCoupon } from "@/lib/payments.functions";
import { formatPrice } from "@/lib/format";

/** Discount code input with an explicit Apply action and clear feedback. */
export function CouponField({ compact = false }: { compact?: boolean }) {
  const { items, couponCode, setCouponCode, appliedCoupon, setAppliedCoupon, clearCoupon } = useCart();
  const { user } = useAuth();
  const apply = useServerFn(validateCoupon);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  async function handleApply() {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setError("Enter a discount code.");
      return;
    }
    if (!user) {
      setError("Please sign in to apply a discount code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apply({
        data: { code, items: items.map((i) => ({ id: i.id, quantity: i.quantity, name: i.name })) },
      });
      if (!res.valid) {
        setAppliedCoupon(null);
        setDiscount(0);
        setError(res.reason);
        return;
      }
      setCouponCode(res.code);
      setDiscount(res.discount);
      setAppliedCoupon({
        code: res.code,
        discount_type: res.discount > 0 ? "fixed" : "fixed",
        percent_off: 0,
        amount_off: res.discount,
      });
      toast.success(`Coupon ${res.code} applied`, {
        description: `You saved ${formatPrice(res.discount)}.`,
      });
    } catch (e) {
      setError((e as Error).message);
      setAppliedCoupon(null);
    } finally {
      setLoading(false);
    }
  }

  function handleRemove() {
    clearCoupon();
    setDiscount(0);
    setError(null);
  }

  return (
    <div className={compact ? "" : "mt-6 border-t border-border/60 pt-5"}>
      <label
        htmlFor="coupon-code"
        className="text-[0.6rem] tracking-luxury uppercase text-navy/60"
      >
        Discount code
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="coupon-code"
          type="text"
          value={couponCode}
          disabled={!!appliedCoupon || loading}
          onChange={(e) => {
            setCouponCode(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleApply();
            }
          }}
          placeholder="e.g. WELCOME10"
          className="min-w-0 flex-1 border border-border/60 bg-alabaster px-3 py-2 text-sm text-navy placeholder:text-navy/30 focus:border-navy focus:outline-none disabled:opacity-60"
        />
        {appliedCoupon ? (
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex items-center gap-1.5 border border-border/60 px-4 text-[0.65rem] tracking-luxury uppercase text-navy/70 transition-colors hover:bg-cashmere"
          >
            <X className="h-3.5 w-3.5" /> Remove
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleApply()}
            disabled={loading || items.length === 0}
            className="inline-flex min-w-[92px] items-center justify-center gap-2 bg-navy px-4 text-[0.65rem] tracking-luxury uppercase text-alabaster transition-colors hover:bg-navy-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {loading ? "Checking" : "Apply"}
          </button>
        )}
      </div>
      {appliedCoupon && (
        <p className="mt-2 flex items-center gap-1.5 text-[0.7rem] text-green-700">
          <Check className="h-3.5 w-3.5" />
          {appliedCoupon.code} applied{discount > 0 ? ` — ${formatPrice(discount)} off` : ""}
        </p>
      )}
      {error && <p className="mt-2 text-[0.7rem] text-rose">{error}</p>}
    </div>
  );
}
