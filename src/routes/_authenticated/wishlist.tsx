import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist } from "@/hooks/use-wishlist";
import { formatPrice } from "@/lib/format";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/_authenticated/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — PEUU Jewels" },
      {
        name: "description",
        content: "Every PEUU Jewels piece you have saved, kept in one place for your next order.",
      },
      { property: "og:title", content: "Wishlist — PEUU Jewels" },
      {
        property: "og:description",
        content: "Every PEUU Jewels piece you have saved, kept in one place for your next order.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { user } = useAuth();
  const { toggle } = useWishlist();

  const { data: items = [], isLoading } = useQuery({
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

  return (
    <main className="min-h-screen bg-alabaster pt-24 sm:pt-32">
      <section className="mx-auto max-w-6xl px-6 py-12 sm:px-10">
        <span className="text-[0.7rem] tracking-luxury uppercase text-rose">Your Atelier</span>
        <h1 className="mt-3 font-serif text-5xl text-navy">Wishlist</h1>
        <p className="mt-4 max-w-xl text-sm text-navy/60">
          The pieces you have saved, kept together until you are ready.
        </p>

        {isLoading ? (
          <p className="mt-16 text-sm text-navy/50">Loading your wishlist…</p>
        ) : items.length === 0 ? (
          <div className="mt-16 border border-border/60 bg-white/60 p-12 text-center">
            <Heart className="mx-auto h-6 w-6 text-rose" strokeWidth={1.4} />
            <p className="mt-4 text-sm text-navy/60">Your wishlist is waiting to be filled.</p>
            <Link
              to="/Collection"
              className="mt-6 inline-block border border-navy/20 px-6 py-3 text-[0.65rem] tracking-luxury uppercase text-navy hover:bg-navy/5"
            >
              Browse the collection
            </Link>
          </div>
        ) : (
          <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((w) => {
              const p = w.product;
              if (!p) return null;
              return (
                <li key={w.id} className="group border border-border/60 bg-white/60">
                  <Link
                    to="/Collection/$slug"
                    params={{ slug: p.slug }}
                    className="block aspect-[4/5] overflow-hidden bg-cashmere"
                  >
                    <img
                      src={p.image_urls?.[0]}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </Link>
                  <div className="flex items-start justify-between gap-4 p-5">
                    <div>
                      <div className="text-[0.6rem] tracking-luxury uppercase text-navy/50">
                        {p.category}
                      </div>
                      <Link
                        to="/Collection/$slug"
                        params={{ slug: p.slug }}
                        className="mt-1 block font-serif text-lg text-navy"
                      >
                        {p.name}
                      </Link>
                      <div className="mt-2 text-sm tabular-nums text-navy/80">
                        {formatPrice(Number(p.price))}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${p.name} from wishlist`}
                      onClick={() => toggle(p.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-navy/50 transition-colors hover:bg-navy/5 hover:text-navy"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.4} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
