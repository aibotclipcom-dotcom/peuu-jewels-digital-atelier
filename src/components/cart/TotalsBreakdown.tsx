import { formatPrice } from "@/lib/format";
import { useCartTotals } from "@/hooks/use-cart-totals";

function Row({
  label,
  value,
  accent,
  strong,
}: {
  label: string;
  value: string;
  accent?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-1.5">
      <span
        className={`text-[0.65rem] tracking-luxury uppercase ${
          strong ? "text-navy" : "text-navy/60"
        }`}
      >
        {label}
      </span>
      <span
        className={
          strong
            ? "font-serif text-2xl text-navy"
            : `text-sm tabular-nums ${accent ? "text-green-700" : "text-navy/80"}`
        }
      >
        {value}
      </span>
    </div>
  );
}

/** Subtotal → Product discount → Coupon → Shipping → Tax → Grand total. */
export function TotalsBreakdown() {
  const t = useCartTotals();

  return (
    <div>
      <Row label="Subtotal" value={formatPrice(t.subtotal)} />
      {t.productDiscount > 0 && (
        <Row label="Product discount" value={`− ${formatPrice(t.productDiscount)}`} accent />
      )}
      {t.couponDiscount > 0 && (
        <Row label="Coupon discount" value={`− ${formatPrice(t.couponDiscount)}`} accent />
      )}
      <Row
        label="Shipping"
        value={t.shipping === 0 ? "Free" : formatPrice(t.shipping)}
        accent={t.shipping === 0}
      />
      {t.taxPercent > 0 && (
        <Row label={`${t.taxLabel} (${t.taxPercent}%)`} value={formatPrice(t.tax)} />
      )}
      <div className="mt-3 border-t border-border/60 pt-3">
        <Row label="Grand total" value={formatPrice(t.grandTotal)} strong />
      </div>
      {t.freeShippingRemaining > 0 && t.itemsTotal > 0 && (
        <p className="mt-2 text-[0.7rem] text-navy/60">
          Add {formatPrice(t.freeShippingRemaining)} more to unlock free shipping.
        </p>
      )}
    </div>
  );
}
