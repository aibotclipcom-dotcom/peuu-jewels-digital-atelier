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
 * Continuously scrolling marquee strip shown only on the home page, directly
 * below the hero slider. Items loop seamlessly and pause on hover.
 */
export function HomeNavBar() {
  const { data: items = [] } = useQuery(homeNavItemsQuery);
  const { home_nav } = useSiteSettings();

  if (items.length === 0) return null;

  const animate = home_nav.auto_scroll_enabled;
  // Longer delay setting => slower marquee.
  const durationSec = Math.max(8, home_nav.auto_swipe_delay_seconds * items.length * 1.6);

  const row = (ariaHidden: boolean) => (
    <div className="flex shrink-0 items-center gap-8 pr-8 sm:gap-12 sm:pr-12" aria-hidden={ariaHidden}>
      {items.map((item) => (
        <a
          key={`${ariaHidden ? "dup" : "main"}-${item.id}`}
          href={item.link || "/"}
          tabIndex={ariaHidden ? -1 : undefined}
          className="group flex shrink-0 items-center gap-2 whitespace-nowrap text-[0.68rem] tracking-luxury uppercase text-navy/75 transition-colors hover:text-navy"
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
          <span aria-hidden className="pl-8 text-navy/25 sm:pl-12">
            |
          </span>
        </a>
      ))}
    </div>
  );

  return (
    <nav
      aria-label="Featured categories"
      className="group/marquee w-full overflow-hidden border-y border-border/60 bg-alabaster py-4"
    >
      <div
        className="flex w-max"
        style={
          animate
            ? {
                animation: `home-nav-marquee ${durationSec}s linear infinite`,
              }
            : undefined
        }
      >
        {row(false)}
        {row(true)}
      </div>
    </nav>
  );
}

