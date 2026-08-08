export interface AnnouncementSettings {
  enabled: boolean;
  text: string;
  bg_color: string;
  text_color: string;
  link: string;
}

export interface ShippingSettings {
  free_shipping_enabled: boolean;
  free_shipping_threshold: number;
  shipping_charge: number;
}

export interface CartSettings {
  min_order_value: number;
  tax_percent: number;
  tax_label: string;
}

export interface HeroSettings {
  auto_slide_delay_seconds: number;
}

export interface SiteSettings {
  announcement: AnnouncementSettings;
  shipping: ShippingSettings;
  cart: CartSettings;
  hero: HeroSettings;
}

/**
 * Fallbacks used only when a settings row is missing or malformed. Everything
 * here is admin-editable from /admin/settings — never hardcode these values in
 * components.
 */
export const DEFAULT_SETTINGS: SiteSettings = {
  announcement: {
    enabled: false,
    text: "",
    bg_color: "#0A192F",
    text_color: "#FAF7F2",
    link: "",
  },
  shipping: {
    free_shipping_enabled: true,
    free_shipping_threshold: 599,
    shipping_charge: 70,
  },
  cart: {
    min_order_value: 300,
    tax_percent: 0,
    tax_label: "Tax",
  },
  hero: {
    auto_slide_delay_seconds: 5,
  },
};

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

export type SettingsRow = { key: string; value: unknown };

/** Normalises raw jsonb rows into a fully-populated settings object. */
export function parseSettings(rows: SettingsRow[] | null | undefined): SiteSettings {
  const map = new Map<string, Record<string, unknown>>();
  for (const r of rows ?? []) {
    if (r && typeof r.value === "object" && r.value !== null) {
      map.set(r.key, r.value as Record<string, unknown>);
    }
  }
  const a = map.get("announcement") ?? {};
  const s = map.get("shipping") ?? {};
  const c = map.get("cart") ?? {};
  const h = map.get("hero") ?? {};
  const d = DEFAULT_SETTINGS;

  return {
    announcement: {
      enabled: bool(a.enabled, d.announcement.enabled),
      text: str(a.text, d.announcement.text),
      bg_color: str(a.bg_color, d.announcement.bg_color),
      text_color: str(a.text_color, d.announcement.text_color),
      link: typeof a.link === "string" ? a.link : "",
    },
    shipping: {
      free_shipping_enabled: bool(s.free_shipping_enabled, d.shipping.free_shipping_enabled),
      free_shipping_threshold: num(s.free_shipping_threshold, d.shipping.free_shipping_threshold),
      shipping_charge: num(s.shipping_charge, d.shipping.shipping_charge),
    },
    cart: {
      min_order_value: num(c.min_order_value, d.cart.min_order_value),
      tax_percent: num(c.tax_percent, d.cart.tax_percent),
      tax_label: str(c.tax_label, d.cart.tax_label),
    },
    hero: {
      auto_slide_delay_seconds: Math.min(
        60,
        Math.max(2, num(h.auto_slide_delay_seconds, d.hero.auto_slide_delay_seconds)),
      ),
    },
  };
}
