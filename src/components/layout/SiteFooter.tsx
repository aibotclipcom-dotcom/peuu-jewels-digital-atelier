import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-cashmere/40">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-6 py-20 sm:px-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo tagline />
          <p className="mt-6 max-w-md text-sm leading-relaxed text-navy/70">
            PEUU JEWELS is an independent atelier of fine jewelry — sculpted by hand, finished with
            care, and made to be worn for a lifetime.
          </p>
        </div>
        <div>
          <h4 className="text-[0.65rem] tracking-luxury uppercase text-navy/60">The Maison</h4>
          <ul className="mt-5 space-y-3 text-sm text-navy/80">
            <li><Link to="/boutique" className="line-draw">Boutique</Link></li>
            <li><Link to="/maison" className="line-draw">Heritage</Link></li>
            <li><Link to="/concierge" className="line-draw">Concierge</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[0.65rem] tracking-luxury uppercase text-navy/60">Care</h4>
          <ul className="mt-5 space-y-3 text-sm text-navy/80">
            <li>Lifetime Polishing</li>
            <li>Bespoke Commissions</li>
            <li>Private Appointments</li>
          </ul>
        </div>
        <div>
          <h4 className="text-[0.65rem] tracking-luxury uppercase text-navy/60">Legal</h4>
          <ul className="mt-5 space-y-3 text-sm text-navy/80">
            <li><Link to="/privacy-policy" className="line-draw">Privacy Policy</Link></li>
            <li><Link to="/terms-of-service" className="line-draw">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 px-6 py-6 text-center text-[0.65rem] tracking-luxury uppercase text-navy/50 sm:px-10">
        © {new Date().getFullYear()} PEUU Jewels · Crafted with intention
      </div>
    </footer>
  );
}
