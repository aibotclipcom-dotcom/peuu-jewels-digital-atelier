export type BadgeShape = {
  id: string;
  label: string;
  text_color: string;
  bg_color: string;
  border_color: string;
  priority?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

export function isBadgeLive(b: BadgeShape, now: Date = new Date()) {
  const starts = b.starts_at ? new Date(b.starts_at) : null;
  const ends = b.ends_at ? new Date(b.ends_at) : null;
  return (!starts || starts <= now) && (!ends || ends > now);
}

export function BadgeRow({
  badges,
  className = "",
  size = "md",
}: {
  badges: BadgeShape[];
  className?: string;
  size?: "sm" | "md";
}) {
  const live = badges
    .filter((b) => isBadgeLive(b))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  if (live.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {live.map((b) => (
        <span
          key={b.id}
          style={{ color: b.text_color, backgroundColor: b.bg_color, borderColor: b.border_color }}
          className={`inline-block border tracking-luxury uppercase ${
            size === "sm" ? "px-2 py-0.5 text-[0.5rem]" : "px-2.5 py-1 text-[0.55rem]"
          }`}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}
