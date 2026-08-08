import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-cashmere/40">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-6 py-20 sm:px-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo tagline />
          <p className="mt-6 max-w-md text-sm leading-relaxed text-navy/70 whitespace-pre-line">
            PEUU JEWELS{"\u00a0\n"}
            <div className="font-medium text-navy tracking-luxury uppercase text-[0.7rem] mt-2 mb-1">YOUR HAPPINESS OUR PRIORITY</div>
            <div className="text-navy/60">{"\n"}</div>
          </p>
        </div>
        <div>
          <h4 className="text-[0.65rem] tracking-luxury uppercase text-navy/60">The Maison</h4>
          <ul className="mt-5 space-y-3 text-sm text-navy/80">
            <li><Link to="/Collection" className="line-draw">Collection</Link></li>
            <li><Link to="/maison" className="line-draw">Our Story</Link></li>
            <li><Link to="/bespoke" className="line-draw"></Link></li>
            <li><Link to="/concierge" className="line-draw">Contact Us</Link></li>
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
