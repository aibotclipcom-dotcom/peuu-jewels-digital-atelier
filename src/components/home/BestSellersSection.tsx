import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StoreProductCard } from "@/components/product/StoreProductCard";
import { badgesQuery, bestSellersQuery, ratingsQuery } from "@/lib/catalog";

/** Curated best sellers, shown as a horizontal slider. */
export function BestSellersSection({ limit = 8 }: { limit?: number }) {
  const { data: products = [], isLoading } = useQuery(bestSellersQuery(limit));
  const { data: ratings } = useQuery(ratingsQuery);
  const { data: badges } = useQuery(badgesQuery);
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: 1 | -1) {
    trackRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  if (!isLoading && products.length === 0) return null;

  return (
    <section className="bg-alabaster px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="text-center">
          <h2 className="font-serif text-4xl leading-tight text-navy sm:text-5xl">Best Sellers</h2>
        </div>

        {isLoading ? (
          <div className="mt-12 flex gap-5 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] w-[260px] shrink-0 animate-pulse bg-cashmere" />
            ))}
          </div>
        ) : (
          <div className="relative mt-12">
            <div
              ref={trackRef}
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {products.map((p, i) => (
                <div key={p.id} className="w-[260px] shrink-0 snap-start">
                  <StoreProductCard
                    product={p}
                    priority={i < 4}
                    badges={badges?.get(p.id) ?? []}
                    rating={ratings?.get(p.id)}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Previous best sellers"
              className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center border border-border/60 bg-alabaster text-navy sm:grid"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Next best sellers"
              className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center border border-border/60 bg-alabaster text-navy sm:grid"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mt-14 text-center">
          <Link
            to="/best-sellers"
            className="line-draw text-[0.7rem] tracking-luxury uppercase text-navy"
          >
            View all best sellers
          </Link>
        </div>
      </div>
    </section>
  );
}
