import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/lib/settings";

export interface Announcement {
  id: string;
  text: string;
  link: string | null;
  link_text: string | null;
  bg_color: string;
  text_color: string;
}

export const announcementsQuery = {
  queryKey: ["announcements"] as const,
  staleTime: 5 * 60 * 1000,
  queryFn: async (): Promise<Announcement[]> => {
    const { data, error } = await supabase
      .from("announcements" as never)
      .select("id, text, link, link_text, bg_color, text_color, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order")
      .order("created_at");
    if (error) throw error;
    return ((data ?? []) as unknown as Announcement[]).filter((a) => a.text.trim().length > 0);
  },
};

/**
 * Slim promotional bar rendered above the navbar on every page. Content,
 * colours and rotation delay are all managed from the admin dashboard.
 */
export function AnnouncementBar() {
  const { announcement } = useSiteSettings();
  const { data: items = [] } = useQuery(announcementsQuery);
  const [index, setIndex] = useState(0);

  const delayMs = Math.max(2, announcement.auto_swipe_delay_seconds) * 1000;

  useEffect(() => {
    if (items.length < 2) {
      setIndex(0);
      return;
    }
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, delayMs);
    return () => window.clearInterval(id);
  }, [items.length, delayMs]);

  // Legacy single-message fallback from store settings.
  if (items.length === 0) {
    if (!announcement.enabled || !announcement.text.trim()) return null;
    return (
      <Bar
        bg={announcement.bg_color}
        fg={announcement.text_color}
        text={announcement.text}
        link={announcement.link || null}
        linkText={null}
      />
    );
  }

  const current = items[Math.min(index, items.length - 1)]!;

  return (
    <Bar
      key={current.id}
      bg={current.bg_color}
      fg={current.text_color}
      text={current.text}
      link={current.link}
      linkText={current.link_text}
      animate={items.length > 1}
    />
  );
}

function Bar({
  bg,
  fg,
  text,
  link,
  linkText,
  animate,
}: {
  bg: string;
  fg: string;
  text: string;
  link: string | null;
  linkText: string | null;
  animate?: boolean;
}) {
  const content = (
    <span
      className={`block w-full text-center text-[0.65rem] leading-relaxed tracking-luxury uppercase ${
        animate ? "animate-in fade-in duration-500" : ""
      }`}
    >
      {text}
      {link && linkText ? <span className="ml-2 underline underline-offset-4">{linkText}</span> : null}
    </span>
  );

  return (
    <div
      style={{ backgroundColor: bg, color: fg }}
      className="w-full overflow-hidden px-4 py-2"
      role="region"
      aria-label="Announcement"
    >
      {link ? (
        <a href={link} className="block underline-offset-4 hover:underline">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
