export interface AnnouncementSettings {
  enabled: boolean;
  text: string;
  bg_color: string;
  text_color: string;
  link: string;
  auto_swipe_delay_seconds: number;
}

export interface HomeNavSettings {
  auto_swipe_delay_seconds: number;
  auto_scroll_enabled: boolean;
  bg_color: string;
  text_color: string;
  border_color: string;
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
  overlay_enabled: boolean;
  overlay_color: string;
  overlay_opacity: number;
}

export interface SiteSettings {
  announcement: AnnouncementSettings;
  home_nav: HomeNavSettings;
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
    auto_swipe_delay_seconds: 5,
  },
  home_nav: {
    auto_swipe_delay_seconds: 5,
    auto_scroll_enabled: true,
    bg_color: "#FAF7F2",
    text_color: "#0A192F",
    border_color: "#E2DDD5",
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
    overlay_enabled: false,
    overlay_color: "#0A192F",
    overlay_opacity: 35,
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
  const n = map.get("home_nav") ?? {};
  const d = DEFAULT_SETTINGS;

  return {
    announcement: {
      enabled: bool(a.enabled, d.announcement.enabled),
      text: str(a.text, d.announcement.text),
      bg_color: str(a.bg_color, d.announcement.bg_color),
      text_color: str(a.text_color, d.announcement.text_color),
      link: typeof a.link === "string" ? a.link : "",
      auto_swipe_delay_seconds: Math.min(
        60,
        Math.max(2, num(a.auto_swipe_delay_seconds, d.announcement.auto_swipe_delay_seconds)),
      ),
    },
    home_nav: {
      auto_swipe_delay_seconds: Math.min(
        60,
        Math.max(2, num(n.auto_swipe_delay_seconds, d.home_nav.auto_swipe_delay_seconds)),
      ),
      auto_scroll_enabled: bool(n.auto_scroll_enabled, d.home_nav.auto_scroll_enabled),
      bg_color: str(n.bg_color, d.home_nav.bg_color),
      text_color: str(n.text_color, d.home_nav.text_color),
      border_color: str(n.border_color, d.home_nav.border_color),
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
      overlay_enabled: bool(h.overlay_enabled, d.hero.overlay_enabled),
      overlay_color: str(h.overlay_color, d.hero.overlay_color),
      overlay_opacity: Math.min(100, num(h.overlay_opacity, d.hero.overlay_opacity)),
    },
  };
}
