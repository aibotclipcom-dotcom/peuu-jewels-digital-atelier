import { useMemo } from "react";
import { useCart } from "@/hooks/use-cart";
import { useSiteSettings } from "@/lib/settings";
import { computeOrderTotals, type OrderTotals } from "@/lib/cart-math";

/**
 * Client-side preview of the money breakdown. The server recalculates the same
 * figures with database prices before any charge is created.
 */
export function useCartTotals(): OrderTotals & { minOrderValue: number; taxLabel: string; taxPercent: number } {
  const { items, appliedCoupon } = useCart();
  const settings = useSiteSettings();

  return useMemo(() => {
    const totals = computeOrderTotals(
      items.map((i) => ({ price: i.price, compareAt: i.compareAt ?? null, quantity: i.quantity })),
      appliedCoupon,
      settings.shipping,
      settings.cart,
    );
    return {
      ...totals,
      minOrderValue: settings.cart.min_order_value,
      taxLabel: settings.cart.tax_label,
      taxPercent: settings.cart.tax_percent,
    };
  }, [items, appliedCoupon, settings]);
}
