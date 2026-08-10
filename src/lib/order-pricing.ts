import { getSaleInfo } from "@/lib/pricing";
import { parseSettings, type SettingsRow, type SiteSettings } from "@/lib/settings-schema";
import {
  computeOrderTotals,
  type AppliedCoupon,
  type OrderTotals,
} from "@/lib/cart-math";

/** Minimal shape of a Supabase client (browser or server) used for reads. */
export type Db = { from: (t: string) => any; rpc: (fn: string, args?: any) => any };

export interface CartLineInput {
  id: string;
  quantity: number;
  name?: string;
}

export interface ServerPricedLine {
  id: string;
  name: string;
  quantity: number;
  price: number;
  compareAt: number | null;
  /** Inventory available at quote time. */
  stock: number;
}


export interface CouponResult {
  coupon: AppliedCoupon | null;
  couponId: string | null;
  singleUse: boolean;
  reason: string | null;
}

export async function loadSettings(db: Db): Promise<SiteSettings> {
  const { data } = await db.from("site_settings").select("key, value");
  return parseSettings((data ?? []) as SettingsRow[]);
}

/** Merges duplicate ids and rejects malformed quantities. */
export function normalizeItems(items: CartLineInput[]): CartLineInput[] {
  const merged = new Map<string, CartLineInput>();
  for (const i of items) {
    const id = String(i?.id ?? "").trim();
    const quantity = Math.floor(Number(i?.quantity));
    if (!id) throw new Error("Invalid item id");
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Invalid item quantity");
    const prev = merged.get(id);
    if (prev) prev.quantity += quantity;
    else merged.set(id, { id, quantity, name: String(i?.name ?? "") });
  }
  const list = [...merged.values()];
  if (list.length === 0) throw new Error("Cart is empty");
  return list;
}

/** Prices every line from the database — never from client input. */
export async function priceLines(db: Db, items: CartLineInput[]): Promise<ServerPricedLine[]> {
  const ids = items.map((i) => i.id);
  const { data, error } = await db
    .from("products")
    .select("id, name, price, compare_at_price, sale_starts_at, sale_ends_at, stock, status")
    .eq("status", "published")
    .in("id", ids);
  if (error) throw new Error(error.message);

  const map = new Map<string, ServerPricedLine>();
  for (const p of (data ?? []) as Array<Record<string, unknown>>) {
    const sale = getSaleInfo({
      price: p.price as number,
      compare_at_price: p.compare_at_price as number | null,
      sale_starts_at: p.sale_starts_at as string | null,
      sale_ends_at: p.sale_ends_at as string | null,
    });
    map.set(p.id as string, {
      id: p.id as string,
      name: String(p.name ?? ""),
      quantity: 0,
      price: sale.price,
      compareAt: sale.compareAt,
      stock: Math.max(0, Math.floor(Number(p.stock) || 0)),
    });
  }

  return items.map((i) => {
    const found = map.get(i.id);
    if (!found) throw new Error(`Product not available: ${i.name || i.id}`);
    if (!Number.isFinite(found.price) || found.price <= 0) {
      throw new Error(`Invalid product price: ${found.name}`);
    }
    if (found.stock <= 0) throw new Error(`${found.name} is sold out.`);
    if (i.quantity > found.stock) {
      throw new Error(`Only ${found.stock} left of ${found.name}.`);
    }
    return { ...found, quantity: i.quantity };
  });
}


/**
 * Validates a coupon against every configured rule and returns a human
 * readable reason when it cannot be applied.
 */
export async function resolveCoupon(
  db: Db,
  code: string | undefined,
  email: string | undefined,
  itemsTotal: number,
): Promise<CouponResult> {
  const empty: CouponResult = { coupon: null, couponId: null, singleUse: false, reason: null };
  const normalized = (code ?? "").trim().toUpperCase();
  if (!normalized) return empty;

  // Coupons are not publicly listable; look up the exact submitted code only.
  const { data: rows } = await db.rpc("lookup_coupon", { _code: normalized });
  const row = Array.isArray(rows) ? rows[0] : rows;

  if (!row) return { ...empty, reason: "Invalid coupon code." };
  if (!row.active) return { ...empty, reason: "This coupon is no longer active." };
  if (row.expires_at && new Date(row.expires_at as string) < new Date()) {
    return { ...empty, reason: "This coupon has expired." };
  }
  const minOrder = Number(row.min_order_amount) || 0;
  if (minOrder > 0 && itemsTotal < minOrder) {
    return { ...empty, reason: `This coupon requires a minimum order of ₹${minOrder}.` };
  }
  if (row.usage_limit != null && Number(row.used_count) >= Number(row.usage_limit)) {
    return { ...empty, reason: "This coupon has reached its usage limit." };
  }

  if ((row.first_order_only || row.single_use) && email) {
    const { data: red } = await db
      .from("coupon_redemptions")
      .select("used_at")
      .eq("coupon_id", row.id)
      .eq("email", email.toLowerCase())
      .maybeSingle();
    if (red?.used_at) return { ...empty, reason: "You have already used this coupon." };
  }

  return {
    coupon: {
      code: String(row.code),
      discount_type: row.discount_type === "fixed" ? "fixed" : "percent",
      percent_off: Number(row.percent_off) || 0,
      amount_off: Number(row.amount_off) || 0,
    },
    couponId: String(row.id),
    singleUse: !!row.single_use || !!row.first_order_only,
    reason: null,
  };
}

export interface QuoteResult {
  lines: ServerPricedLine[];
  totals: OrderTotals;
  settings: SiteSettings;
  coupon: CouponResult;
}

/** Builds the authoritative money breakdown for a cart. */
export async function buildQuote(
  db: Db,
  items: CartLineInput[],
  couponCode: string | undefined,
  email: string | undefined,
): Promise<QuoteResult> {
  const settings = await loadSettings(db);
  const normalized = normalizeItems(items);
  const lines = await priceLines(db, normalized);

  const bare = computeOrderTotals(lines, null, settings.shipping, settings.cart);
  if (bare.itemsTotal < settings.cart.min_order_value) {
    throw new Error(`Minimum order value is ₹${settings.cart.min_order_value}.`);
  }

  const coupon = await resolveCoupon(db, couponCode, email, bare.itemsTotal);
  const totals = computeOrderTotals(lines, coupon.coupon, settings.shipping, settings.cart);

  return { lines, totals, settings, coupon };
}
