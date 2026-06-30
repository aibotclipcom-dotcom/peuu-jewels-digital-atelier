import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, User2, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/boutique", label: "The Boutique" },
  { to: "/maison", label: "Maison" },
  { to: "/concierge", label: "Concierge" },
] as const;

export function SiteNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count, setOpen } = useCart();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-xl bg-alabaster/70 border-b border-border/60"
          : "backdrop-blur-md bg-alabaster/30"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-6 px-5 sm:h-20 sm:px-10">
        <Logo />

        <nav className="hidden items-center gap-10 lg:flex">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group relative text-[0.7rem] tracking-luxury uppercase text-navy/80 transition-colors hover:text-navy"
              >
                {item.label}
                <span
                  className={`absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to={user ? "/account" : "/auth"}
            className="hidden items-center gap-2 rounded-full border border-navy/15 px-4 py-2 text-[0.65rem] tracking-luxury uppercase text-navy transition-all hover:border-navy/40 hover:bg-navy/5 sm:inline-flex"
          >
            <User2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            {user ? "Account" : "VIP Login"}
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-navy transition-colors hover:bg-navy/5"
            aria-label="Open cart"
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.4} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-navy px-1 text-[10px] font-medium text-alabaster">
                {count}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-navy lg:hidden"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/60 bg-alabaster/95 backdrop-blur-xl lg:hidden">
          <nav className="mx-auto flex max-w-[1400px] flex-col px-6 py-6">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="border-b border-border/40 py-4 text-[0.7rem] tracking-luxury uppercase text-navy"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to={user ? "/account" : "/auth"}
              className="border-b border-border/40 py-4 text-[0.7rem] tracking-luxury uppercase text-navy"
            >
              {user ? "Account" : "VIP Login"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
