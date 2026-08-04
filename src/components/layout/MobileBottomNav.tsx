import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Search, Gem, ShoppingBag, User2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count, setOpen } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");

  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    const q = term.trim();
    setSearchOpen(false);
    navigate({ to: "/Collection", search: q ? { q } : {} });
  }

  const isHome = pathname === "/";
  const isShop = pathname.startsWith("/Collection") || pathname.startsWith("/best-sellers");
  const isAccount = pathname.startsWith("/account") || pathname.startsWith("/auth");

  return (
    <>
      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-navy/40 backdrop-blur-sm lg:hidden md:hidden">
          <div className="absolute inset-x-0 top-0 animate-fade-in border-b border-border/60 bg-alabaster px-5 pb-5 pt-6">
            <div className="flex items-center justify-between">
              <span className="text-[0.6rem] tracking-luxury uppercase text-navy/60">
                Search the collection
              </span>
              <button
                type="button"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
                className="text-navy/60"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            <form onSubmit={submitSearch} className="mt-4 flex items-center gap-3 border-b border-navy/20 pb-2">
              <Search className="h-4 w-4 shrink-0 text-navy/50" strokeWidth={1.5} />
              <input
                autoFocus
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Rings, necklaces, gold…"
                className="min-w-0 flex-1 bg-transparent text-sm text-navy outline-none placeholder:text-navy/35"
              />
              <button
                type="submit"
                className="shrink-0 text-[0.6rem] tracking-luxury uppercase text-navy"
              >
                Go
              </button>
            </form>
          </div>
        </div>
      )}

      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-[55] border-t border-border/60 bg-alabaster/90 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          <Item as="link" to="/" label="Home" active={isHome} icon={<Home className="h-[18px] w-[18px]" strokeWidth={1.4} />} />
          <Item
            as="button"
            label="Search"
            active={searchOpen}
            onClick={() => setSearchOpen(true)}
            icon={<Search className="h-[18px] w-[18px]" strokeWidth={1.4} />}
          />
          <Item as="link" to="/Collection" label="Shop" active={isShop} icon={<Gem className="h-[18px] w-[18px]" strokeWidth={1.4} />} />
          <Item
            as="button"
            label="Cart"
            active={false}
            onClick={() => setOpen(true)}
            badge={count}
            icon={<ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.4} />}
          />
          <Item
            as="link"
            to={user ? "/account" : "/auth"}
            label={user ? "Account" : "Login"}
            active={isAccount}
            icon={<User2 className="h-[18px] w-[18px]" strokeWidth={1.4} />}
          />
        </ul>
      </nav>
    </>
  );
}

type ItemProps = {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  badge?: number;
} & (
  | { as: "link"; to: string; onClick?: never }
  | { as: "button"; onClick: () => void; to?: never }
);

function Item({ label, icon, active, badge, ...rest }: ItemProps) {
  const inner = (
    <>
      <span className="relative">
        {icon}
        {badge && badge > 0 ? (
          <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-navy px-1 text-[10px] font-medium text-alabaster">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="text-[0.55rem] tracking-luxury uppercase">{label}</span>
      <span
        className={cn(
          "absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
      />
    </>
  );

  const className = cn(
    "relative flex w-full flex-col items-center justify-center gap-1.5 py-2.5",
    "transition-all duration-200 active:scale-95 active:bg-navy/5",
    active ? "text-navy" : "text-navy/55",
  );

  return (
    <li className="flex">
      {rest.as === "link" ? (
        <Link to={rest.to} className={className} aria-current={active ? "page" : undefined}>
          {inner}
        </Link>
      ) : (
        <button type="button" onClick={rest.onClick} className={className} aria-label={label}>
          {inner}
        </button>
      )}
    </li>
  );
}
