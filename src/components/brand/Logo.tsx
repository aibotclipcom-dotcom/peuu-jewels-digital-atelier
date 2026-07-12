import { Link } from "@tanstack/react-router";

export function Logo({
  tagline = false,
  className = "",
}: {
  tagline?: boolean;
  className?: string;
}) {
  return (
    <Link to="/" className={`group inline-block leading-none ${className}`}>
      <img
        src="/peuu-logo.png"
        alt="PEUU JEWELS — Your happiness, our priority"
        className={`h-auto w-full object-contain transition-opacity duration-300 group-hover:opacity-80 ${
          tagline ? "max-h-28" : "max-h-12 sm:max-h-14"
        }`}
      />
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
