import { Link } from "@tanstack/react-router";

export function Logo({ tagline = false }: { tagline?: boolean }) {
  return (
    <Link to="/" className="group inline-flex flex-col items-start leading-none">
      <span className="font-serif text-[1.35rem] tracking-[0.22em] text-navy sm:text-2xl">
        PEUU&nbsp;JEWELS
      </span>
      {tagline && (
        <span className="mt-1 text-[0.6rem] tracking-[0.42em] text-rose">
          YOUR HAPPINESS · OUR PRIORITY
        </span>
      )}
    </Link>
  );
}

export function FloralMark({ className = "" }: { className?: string }) {
  // Minimal vector reference to the brand floral motif.
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.8"
      aria-hidden
    >
      <path d="M32 16c4 4 4 12 0 18-4-6-4-14 0-18z" />
      <path d="M32 34c-6-2-10-8-10-14 6 0 12 4 14 10" />
      <path d="M32 34c6-2 10-8 10-14-6 0-12 4-14 10" />
      <circle cx="32" cy="34" r="2.5" />
      <path d="M46 22c2-1 4 0 4 2-1 1-3 1-4 0z" />
    </svg>
  );
}
