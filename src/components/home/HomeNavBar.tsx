import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/lib/settings";

export interface HomeNavItem {
  id: string;
  name: string;
  link: string;
  image_url: string | null;
  badge_label: string | null;
}

export const homeNavItemsQuery = {
  queryKey: ["home-nav-items"] as const,
  staleTime: 5 * 60 * 1000,
  queryFn: async (): Promise<HomeNavItem[]> => {
    const { data, error } = await supabase
      .from("home_nav_items" as never)
      .select("id, name, link, image_url, badge_label, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order")
      .order("created_at");
    if (error) throw error;
    return ((data ?? []) as unknown as HomeNavItem[]).filter((i) => i.name.trim().length > 0);
  },
};

/**
 * Horizontal category/navigation strip shown only on the home page, directly
 * below the hero slider. Auto-scrolls only when the items overflow.
 */
export function HomeNavBar() {
  const { data: items = [] } = useQuery(homeNavItemsQuery);
  const { home_nav } = useSiteSettings();
  const trackRef = useRef<HTMLDivElement>(null);

  const delayMs = Math.max(2, home_nav.auto_swipe_delay_seconds) * 1000;
  const autoScroll = home_nav.auto_scroll_enabled;

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !autoScroll || items.length === 0) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;

    const id = window.setInterval(() => {
      const overflow = el.scrollWidth - el.clientWidth;
      if (overflow <= 8) return; // everything fits — no forced motion
      const next = el.scrollLeft + el.clientWidth * 0.6;
      el.scrollTo({ left: next >= overflow - 4 ? 0 : next, behavior: "smooth" });
    }, delayMs);

    return () => window.clearInterval(id);
  }, [items.length, delayMs, autoScroll]);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Featured categories"
      className="w-full overflow-hidden border-y border-border/60 bg-alabaster"
    >
      <div
        ref={trackRef}
        className="mx-auto flex max-w-[1400px] snap-x gap-6 overflow-x-auto px-6 py-4 [scrollbar-width:none] sm:gap-10 sm:px-10 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <a
            key={item.id}
            href={item.link || "/"}
            className="group flex shrink-0 snap-start items-center gap-2 whitespace-nowrap text-[0.68rem] tracking-luxury uppercase text-navy/75 transition-colors hover:text-navy"
          >
            {item.image_url && (
              <img
                src={item.image_url}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-7 w-7 shrink-0 rounded-full object-cover"
              />
            )}
            <span className="line-draw">{item.name}</span>
            {item.badge_label && (
              <span className="shrink-0 bg-rose/15 px-2 py-0.5 text-[0.55rem] tracking-luxury uppercase text-rose">
                {item.badge_label}
              </span>
            )}
          </a>
        ))}
      </div>
    </nav>
  );
}
