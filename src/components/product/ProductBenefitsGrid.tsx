import { Truck, ShieldCheck, Crown, type LucideIcon } from "lucide-react";

const HIGHLIGHTS: { icon: LucideIcon; label: string }[] = [
  { icon: Truck, label: "Free Shipping" },
  { icon: ShieldCheck, label: "Skin Safe Jewellery" },
  { icon: Crown, label: "18K Gold Tone Plated" },
];

export function ProductBenefitsGrid({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-cashmere/40 ${className}`}>
      <div className="grid grid-cols-3 divide-x divide-border/30">
        {HIGHLIGHTS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center justify-center gap-2 px-2 py-4 text-center"
          >
            <Icon className="h-5 w-5 text-rose" strokeWidth={1.4} />
            <span className="text-[0.6rem] font-medium tracking-luxury uppercase text-navy/80">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
