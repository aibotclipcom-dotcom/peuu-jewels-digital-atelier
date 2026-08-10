import {
  Sparkles,
  ShieldCheck,
  Crown,
  Gem,
  Leaf,
  Droplets,
  BadgeCheck,
  Heart,
  Truck,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";

export const BENEFIT_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  shield: ShieldCheck,
  crown: Crown,
  gem: Gem,
  leaf: Leaf,
  droplets: Droplets,
  check: BadgeCheck,
  heart: Heart,
  truck: Truck,
  refresh: RefreshCw,
};

export type ProductBenefit = {
  id: string;
  title: string;
  icon: string;
  description?: string | null;
};

export const DEFAULT_BENEFITS: ProductBenefit[] = [
  { id: "default-anti-tarnish", title: "Anti-Tarnish", icon: "sparkles" },
  { id: "default-skin-safe", title: "Skin Safe Jewellery", icon: "shield" },
  { id: "default-gold-tone", title: "18K Gold Tone Plated", icon: "crown" },
];

export function ProductBenefits({
  benefits,
  className = "",
}: {
  benefits?: ProductBenefit[];
  className?: string;
}) {
  const list = benefits && benefits.length > 0 ? benefits : DEFAULT_BENEFITS;

  return (
    <ul
      className={`-mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 ${className}`}
    >
      {list.map((b) => {
        const Icon = BENEFIT_ICONS[b.icon] ?? Sparkles;
        return (
          <li
            key={b.id}
            title={b.description ?? undefined}
            className="flex shrink-0 snap-start items-center gap-2 rounded-full border border-rose/30 bg-cashmere/40 py-1.5 pl-1.5 pr-3.5"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full border border-rose/25 bg-alabaster">
              <Icon className="h-3.5 w-3.5 text-rose" strokeWidth={1.5} />
            </span>
            <span className="whitespace-nowrap text-[0.7rem] font-medium tracking-wide text-navy/80">
              {b.title}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
