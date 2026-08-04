import type { CartSettings, ShippingSettings } from "@/lib/settings-schema";

export interface PricedLine {
  /** Effective (payable) unit price. */
  price: number;
  /** Reference / compare-at unit price when the piece is on sale. */
  compareAt?: number | null;
  quantity: number;
}

export interface AppliedCoupon {
  code: string;
  discount_type: "percent" | "fixed";
  percent_off: number;
  amount_off: number;
}

export interface OrderTotals {
  /** Sum of reference prices (compare-at when present, else price). */
  subtotal: number;
  /** Automatic on-sale saving already reflected in the item prices. */
  productDiscount: number;
  couponDiscount: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  /** Amount remaining to unlock free shipping, 0 when already free. */
  freeShippingRemaining: number;
  itemsTotal: number;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function couponDiscountFor(amount: number, coupon: AppliedCoupon | null): number {
  if (!coupon || amount <= 0) return 0;
  const raw =
    coupon.discount_type === "fixed"
      ? Number(coupon.amount_off) || 0
      : (amount * (Number(coupon.percent_off) || 0)) / 100;
  return round2(Math.max(0, Math.min(amount, raw)));
}

/**
 * Single source of truth for money. Calculation order:
 * Subtotal → Product discount → Coupon → Shipping → Tax → Grand total.
 * Used by the cart, checkout, Razorpay order creation and order records so the
 * figures can never drift apart.
 */
export function computeOrderTotals(
  lines: PricedLine[],
  coupon: AppliedCoupon | null,
  shippingSettings: ShippingSettings,
  cartSettings: CartSettings,
): OrderTotals {
  let subtotal = 0;
  let itemsTotal = 0;
  for (const l of lines) {
    const qty = Math.max(0, Math.floor(Number(l.quantity) || 0));
    const price = Math.max(0, Number(l.price) || 0);
    const ref = l.compareAt && l.compareAt > price ? Number(l.compareAt) : price;
    subtotal += ref * qty;
    itemsTotal += price * qty;
  }
  subtotal = round2(subtotal);
  itemsTotal = round2(itemsTotal);

  const productDiscount = round2(Math.max(0, subtotal - itemsTotal));
  const couponDiscount = couponDiscountFor(itemsTotal, coupon);
  const afterDiscounts = round2(Math.max(0, itemsTotal - couponDiscount));

  const freeEligible =
    shippingSettings.free_shipping_enabled &&
    afterDiscounts >= shippingSettings.free_shipping_threshold;
  const shipping =
    itemsTotal <= 0 ? 0 : freeEligible ? 0 : round2(Math.max(0, shippingSettings.shipping_charge));

  const tax = round2((afterDiscounts * (Number(cartSettings.tax_percent) || 0)) / 100);
  const grandTotal = round2(afterDiscounts + shipping + tax);

  return {
    subtotal,
    productDiscount,
    couponDiscount,
    shipping,
    tax,
    grandTotal,
    freeShippingRemaining:
      shippingSettings.free_shipping_enabled && !freeEligible
        ? round2(Math.max(0, shippingSettings.free_shipping_threshold - afterDiscounts))
        : 0,
    itemsTotal,
  };
}
