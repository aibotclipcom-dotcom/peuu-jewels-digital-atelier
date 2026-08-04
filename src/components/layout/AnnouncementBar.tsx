import { useSiteSettings } from "@/lib/settings";

/**
 * Sticky promotional bar. Colours, copy, link and visibility are all managed
 * from the admin settings screen.
 */
export function AnnouncementBar() {
  const { announcement } = useSiteSettings();
  if (!announcement.enabled || !announcement.text.trim()) return null;

  const content = (
    <span className="block truncate text-center text-[0.65rem] tracking-luxury uppercase">
      {announcement.text}
    </span>
  );

  return (
    <div
      style={{ backgroundColor: announcement.bg_color, color: announcement.text_color }}
      className="w-full px-4 py-2"
      role="region"
      aria-label="Announcement"
    >
      {announcement.link ? (
        <a href={announcement.link} className="block underline-offset-4 hover:underline">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
