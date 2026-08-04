import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { StoreProductCard } from "@/components/product/StoreProductCard";
import { badgesQuery, bestSellersQuery, ratingsQuery } from "@/lib/catalog";

/** Curated best sellers, ordered by the admin-controlled sort value. */
export function BestSellersSection({ limit = 8 }: { limit?: number }) {
  const { data: products = [], isLoading } = useQuery(bestSellersQuery(limit));
  const { data: ratings } = useQuery(ratingsQuery);
  const { data: badges } = useQuery(badgesQuery);

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="bg-cashmere/25 px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="text-[0.7rem] tracking-luxury uppercase text-rose">Most loved</span>
            <h2 className="mt-3 font-serif text-4xl leading-tight text-navy sm:text-5xl">
              Best Sellers
            </h2>
          </div>
          <Link
            to="/best-sellers"
            className="line-draw text-[0.7rem] tracking-luxury uppercase text-navy"
          >
            View all best sellers
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse bg-cashmere" />
            ))}
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <StoreProductCard
                key={p.id}
                product={p}
                priority={i < 4}
                badges={badges?.get(p.id) ?? []}
                rating={ratings?.get(p.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
