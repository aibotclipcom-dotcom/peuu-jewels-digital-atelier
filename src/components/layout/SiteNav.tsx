import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, User2, Menu, X, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/brand/Logo";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const STATIC_NAV = [
  { to: "/", label: "Home" },
  { to: "/best-sellers", label: "Best Sellers" },
  { to: "/maison", label: "OUR STORY" },
  { to: "/concierge", label: "Concierge" },
] as const;

type Category = {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  icon_url: string | null;
  banner_url: string | null;
};

export function SiteNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count, setOpen } = useCart();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["nav-categories"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, parent_id, name, slug, icon_url, banner_url")
        .eq("is_visible", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  const parents = categories.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);
  const banner = parents.find((p) => p.banner_url)?.banner_url ?? null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
  }, [pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || megaOpen
          ? "backdrop-blur-xl bg-alabaster/80 border-b border-border/60"
          : "backdrop-blur-md bg-alabaster/30"
      }`}
      onMouseLeave={() => setMegaOpen(false)}
    >
      <AnnouncementBar />
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-6 px-5 sm:h-20 sm:px-10">
        <Logo />

        <nav className="hidden items-center gap-10 lg:flex">
          <Link
            to="/"
            className="group relative text-[0.7rem] tracking-luxury uppercase text-navy/80 transition-colors hover:text-navy"
          >
            Home
            <Dot active={pathname === "/"} />
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setMegaOpen(true)}
          >
            <Link
              to="/Collection"
              className="group relative inline-flex items-center gap-1.5 text-[0.7rem] tracking-luxury uppercase text-navy/80 transition-colors hover:text-navy"
            >
              The Collection
              <ChevronDown
                className={`h-3 w-3 transition-transform ${megaOpen ? "rotate-180" : ""}`}
                strokeWidth={1.6}
              />
              <Dot active={pathname.startsWith("/Collection")} />
            </Link>
          </div>

          {STATIC_NAV.slice(1).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group relative text-[0.7rem] tracking-luxury uppercase text-navy/80 transition-colors hover:text-navy"
            >
              {item.label}
              <Dot active={pathname.startsWith(item.to)} />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to={user ? "/account" : "/auth"}
            className="hidden items-center gap-2 rounded-full border border-navy/15 px-4 py-2 text-[0.65rem] tracking-luxury uppercase text-navy transition-all hover:border-navy/40 hover:bg-navy/5 sm:inline-flex"
          >
            <User2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            {user ? "Account" : "VIP LOGIN"}
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

      {/* Desktop mega menu */}
      {megaOpen && parents.length > 0 && (
        <div className="hidden border-t border-border/50 bg-alabaster/95 backdrop-blur-xl lg:block">
          <div className="mx-auto grid max-w-[1400px] gap-10 px-10 py-10 lg:grid-cols-[1fr_300px]">
            <div className="grid grid-cols-2 gap-x-10 gap-y-8 xl:grid-cols-4">
              {parents.map((p) => (
                <div key={p.id}>
                  <Link
                    to="/Collection"
                    search={{ category: p.slug }}
                    className="flex items-center gap-2 text-[0.65rem] tracking-luxury uppercase text-navy"
                  >
                    {p.icon_url && (
                      <img src={p.icon_url} alt="" className="h-5 w-5 object-contain" />
                    )}
                    {p.name}
                  </Link>
                  <ul className="mt-3 space-y-2">
                    {childrenOf(p.id).map((c) => (
                      <li key={c.id}>
                        <Link
                          to="/Collection"
                          search={{ category: c.slug }}
                          className="text-sm text-navy/60 transition-colors hover:text-navy"
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {banner && (
              <Link to="/Collection" className="relative hidden overflow-hidden bg-cashmere xl:block">
                <img src={banner} alt="" className="h-full w-full object-cover" />
                <span className="absolute bottom-4 left-4 bg-navy/80 px-3 py-1.5 text-[0.6rem] tracking-luxury uppercase text-alabaster">
                  Explore all
                </span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Mobile */}
      {mobileOpen && (
        <div className="max-h-[80vh] overflow-y-auto border-t border-border/60 bg-alabaster/95 backdrop-blur-xl lg:hidden">
          <nav className="mx-auto flex max-w-[1400px] flex-col px-6 py-4">
            <Link to="/" className="border-b border-border/40 py-4 text-[0.7rem] tracking-luxury uppercase text-navy">
              Home
            </Link>

            <button
              type="button"
              onClick={() => setMobileShopOpen((v) => !v)}
              aria-expanded={mobileShopOpen}
              className="flex items-center justify-between border-b border-border/40 py-4 text-[0.7rem] tracking-luxury uppercase text-navy"
            >
              The Collection
              <ChevronDown
                className={`h-4 w-4 transition-transform ${mobileShopOpen ? "rotate-180" : ""}`}
                strokeWidth={1.5}
              />
            </button>
            {mobileShopOpen && (
              <div className="border-b border-border/40 py-3 pl-3">
                <Link
                  to="/Collection"
                  className="block py-2 text-sm text-navy/70"
                >
                  All pieces
                </Link>
                {parents.map((p) => (
                  <div key={p.id} className="py-1">
                    <Link
                      to="/Collection"
                      search={{ category: p.slug }}
                      className="block py-1.5 text-sm text-navy"
                    >
                      {p.name}
                    </Link>
                    {childrenOf(p.id).map((c) => (
                      <Link
                        key={c.id}
                        to="/Collection"
                        search={{ category: c.slug }}
                        className="block py-1.5 pl-4 text-sm text-navy/60"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {STATIC_NAV.slice(1).map((item) => (
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
              {user ? "Account" : "VIP LOGIN"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function Dot({ active }: { active: boolean }) {
  return (
    <span
      className={`absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold transition-opacity ${
        active ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
