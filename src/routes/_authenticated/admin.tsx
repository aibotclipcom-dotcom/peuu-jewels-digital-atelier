import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/brand/Logo";
import { LayoutGrid, Package, ScrollText, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Atelier Console — PEUU Jewels" }] }),
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (error || !data) throw redirect({ to: "/account" });
  },
  component: AdminLayout,
});

type NavItem = {
  to: "/admin" | "/admin/products" | "/admin/orders";
  label: string;
  icon: typeof LayoutGrid;
  exact?: boolean;
};
const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutGrid, exact: true },
  { to: "/admin/products", label: "Inventory", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ScrollText },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-alabaster">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-border/60 bg-cashmere/30 px-6 py-8 lg:flex lg:flex-col">
          <Logo />
          <div className="mt-3 text-[0.55rem] tracking-luxury uppercase text-rose">
            Atelier Console
          </div>

          <nav className="mt-12 flex flex-col gap-1">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-3 text-[0.7rem] tracking-luxury uppercase transition-colors ${
                    active ? "bg-navy text-alabaster" : "text-navy/65 hover:bg-navy/5 hover:text-navy"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" strokeWidth={1.4} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            to="/"
            className="mt-auto flex items-center gap-2 pt-6 text-[0.65rem] tracking-luxury uppercase text-navy/55 hover:text-navy"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Boutique
          </Link>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between border-b border-border/60 bg-alabaster/80 px-6 py-5 backdrop-blur sm:px-10 lg:hidden">
            <Logo />
            <Link to="/" className="text-[0.65rem] tracking-luxury uppercase text-navy/60">
              ← Site
            </Link>
          </header>

          <nav className="flex gap-1 overflow-x-auto border-b border-border/60 px-4 lg:hidden">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-4 py-3 text-[0.65rem] tracking-luxury uppercase ${
                    active ? "border-b-2 border-navy text-navy" : "text-navy/55"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <main className="flex-1 px-6 py-10 sm:px-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
