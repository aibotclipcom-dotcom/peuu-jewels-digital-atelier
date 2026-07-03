import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { SiteFooter } from "@/components/layout/SiteFooter";
import {
  ShippingDetailsForm,
  type ShippingValues,
} from "@/components/checkout/ShippingDetailsForm";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Your Account — PEUU Jewels" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const { data: orders = [] } = useQuery({
    queryKey: ["account-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ["account-wishlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist")
        .select("id, product:products(id, name, slug, price, image_urls, category)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const qc = useQueryClient();
  const [savingProfile, setSavingProfile] = useState(false);
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, street_address, city, state, postal_code")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function saveAddress(values: ShippingValues) {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: values.full_name,
          phone: values.phone,
          street_address: values.street_address,
          city: values.city,
          state: values.state,
          postal_code: values.postal_code,
        })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Address & contact details saved.");
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast("Signed out.");
    navigate({ to: "/" });
  }

  return (
    <main className="min-h-screen bg-alabaster pt-24 sm:pt-32">
      <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="text-[0.7rem] tracking-luxury uppercase text-rose">Your Atelier</span>
            <h1 className="mt-3 font-serif text-5xl text-navy">
              {user?.user_metadata?.full_name || user?.email}
            </h1>
          </div>
          <div className="flex gap-4">
            {isAdmin && (
              <Link
                to="/admin"
                className="border border-navy/20 px-5 py-3 text-[0.65rem] tracking-luxury uppercase text-navy hover:bg-navy/5"
              >
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="line-draw text-[0.65rem] tracking-luxury uppercase text-navy"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-16 grid gap-16 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-2xl text-navy">Saved pieces</h2>
            {wishlist.length === 0 ? (
              <p className="mt-4 text-sm text-navy/60">Your wishlist is waiting to be filled.</p>
            ) : (
              <ul className="mt-6 divide-y divide-border/60">
                {wishlist.map((w) => {
                  const p = w.product;
                  if (!p) return null;
                  return (
                    <li key={w.id} className="flex gap-4 py-4">
                      <div className="h-20 w-16 shrink-0 overflow-hidden bg-cashmere">
                        <img src={p.image_urls?.[0]} alt={p.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[0.6rem] tracking-luxury uppercase text-navy/50">{p.category}</div>
                        <Link to="/boutique/$slug" params={{ slug: p.slug }} className="font-serif text-lg text-navy">
                          {p.name}
                        </Link>
                      </div>
                      <div className="text-sm tabular-nums text-navy/80">
                        {formatPrice(Number(p.price))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            <h2 className="font-serif text-2xl text-navy">Order history</h2>
            {orders.length === 0 ? (
              <p className="mt-4 text-sm text-navy/60">No orders yet — your story starts here.</p>
            ) : (
              <ul className="mt-6 space-y-6">
                {orders.map((o) => (
                  <li key={o.id} className="border border-border/60 p-5">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-[0.6rem] tracking-luxury uppercase text-navy/50">
                          {new Date(o.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}
                        </div>
                        <div className="mt-1 font-serif text-lg text-navy">
                          {o.order_items?.length ?? 0} {o.order_items?.length === 1 ? "piece" : "pieces"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-serif text-lg text-navy">{formatPrice(Number(o.total))}</div>
                        <div className="text-[0.6rem] tracking-luxury uppercase text-rose">{o.status}</div>
                      </div>
                    </div>
                    {o.order_items && o.order_items.length > 0 && (
                      <ul className="mt-4 space-y-1 border-t border-border/40 pt-3 text-sm text-navy/70">
                        {o.order_items.map((it) => (
                          <li key={it.id} className="flex justify-between">
                            <span>{it.product_name} × {it.quantity}</span>
                            <span className="tabular-nums">{formatPrice(Number(it.unit_price) * it.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
