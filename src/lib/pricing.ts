export type SaleFields = {
  price: number | string;
  compare_at_price?: number | string | null;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
};

export type SaleInfo = {
  price: number;
  compareAt: number | null;
  onSale: boolean;
  percentOff: number;
  endsAt: Date | null;
};

/**
 * Reference pricing: `compare_at_price` is the struck-through reference value.
 * A sale is live when a compare-at price exists, is higher than the price, and
 * the current time falls inside the (optional) sale window.
 */
export function getSaleInfo(p: SaleFields, now: Date = new Date()): SaleInfo {
  const price = Number(p.price) || 0;
  const compareAt =
    p.compare_at_price === null || p.compare_at_price === undefined
      ? null
      : Number(p.compare_at_price) || null;

  const starts = p.sale_starts_at ? new Date(p.sale_starts_at) : null;
  const ends = p.sale_ends_at ? new Date(p.sale_ends_at) : null;

  const withinWindow =
    (!starts || starts <= now) && (!ends || ends > now);

  const onSale = !!compareAt && compareAt > price && withinWindow;

  return {
    price,
    compareAt: onSale ? compareAt : null,
    onSale,
    percentOff: onSale && compareAt ? Math.round(((compareAt - price) / compareAt) * 100) : 0,
    endsAt: onSale ? ends : null,
  };
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "Ended";
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
