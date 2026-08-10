/** Per-product info strip (delivery / recent sales / stock status).
 * Stored inside the existing products.spec jsonb under the reserved "__info" key,
 * so no new table is needed. Reserved keys are hidden from the Specifications tab. */

export type ProductInfoStrip = {
  delivery: { enabled: boolean; text: string };
  sales: { enabled: boolean; quantity: number; period: string };
  stock: { enabled: boolean; text: string };
};

export const INFO_SPEC_KEY = "__info";

export const DEFAULT_PRODUCT_INFO: ProductInfoStrip = {
  delivery: { enabled: true, text: "13 Aug – 17 Aug" },
  sales: { enabled: true, quantity: 1223, period: "7 days" },
  stock: { enabled: true, text: "In stock - ready to ship" },
};

export function isReservedSpecKey(key: string) {
  return key.startsWith("__");
}

export function parseProductInfo(spec: unknown): ProductInfoStrip {
  const raw = (spec as Record<string, unknown> | null)?.[INFO_SPEC_KEY];
  let obj: Record<string, unknown> | null = null;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      obj = null;
    }
  } else if (raw && typeof raw === "object") {
    obj = raw as Record<string, unknown>;
  }
  if (!obj) return DEFAULT_PRODUCT_INFO;

  const d = (obj.delivery ?? {}) as Record<string, unknown>;
  const s = (obj.sales ?? {}) as Record<string, unknown>;
  const st = (obj.stock ?? {}) as Record<string, unknown>;
  return {
    delivery: {
      enabled: d.enabled !== false,
      text: String(d.text ?? DEFAULT_PRODUCT_INFO.delivery.text),
    },
    sales: {
      enabled: s.enabled !== false,
      quantity: Number(s.quantity ?? DEFAULT_PRODUCT_INFO.sales.quantity) || 0,
      period: String(s.period ?? DEFAULT_PRODUCT_INFO.sales.period),
    },
    stock: {
      enabled: st.enabled !== false,
      text: String(st.text ?? DEFAULT_PRODUCT_INFO.stock.text),
    },
  };
}

export function serializeProductInfo(info: ProductInfoStrip) {
  return JSON.stringify(info);
}
