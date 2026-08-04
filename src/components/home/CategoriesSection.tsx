import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { homeCategoriesQuery } from "@/lib/catalog";

/** Shoppable category cards in a slider layout. */
export function CategoriesSection() {
  const { data: categories = [], isLoading } = useQuery(homeCategoriesQuery);
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: 1 | -1) {
    trackRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  if (!isLoading && categories.length === 0) return null;

  const cards = categories.map((c) => (
    <Link
      key={c.id}
      to="/Collection"
      search={{ category: c.slug }}
      className="group relative w-[260px] shrink-0 snap-start overflow-hidden bg-cashmere"
    >
      <div className="aspect-[4/5] w-full overflow-hidden">
        {c.image_url || c.icon_url ? (
          <img
            src={(c.image_url ?? c.icon_url) as string}
            alt={c.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center gradient-cashmere font-serif text-2xl text-navy/40">
            {c.name}
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/70 to-transparent p-5">
        <div className="font-serif text-xl text-alabaster">{c.name}</div>
        <div className="mt-1 text-[0.6rem] tracking-luxury uppercase text-alabaster/70">
          Shop now
        </div>
      </div>
    </Link>
  ));

  return (
    <section className="bg-alabaster px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div>
          <span className="text-[0.7rem] tracking-luxury uppercase text-rose">Explore</span>
          <h2 className="mt-3 font-serif text-4xl leading-tight text-navy sm:text-5xl">
            Our Categories
          </h2>
        </div>

        {isLoading ? (
          <div className="mt-10 flex gap-5 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] w-[260px] shrink-0 animate-pulse bg-cashmere" />
            ))}
          </div>
        ) : (
          <div className="relative mt-10">
            <div
              ref={trackRef}
              className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {cards}
            </div>
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              aria-label="Previous categories"
              className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center border border-border/60 bg-alabaster text-navy sm:grid"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              aria-label="Next categories"
              className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center border border-border/60 bg-alabaster text-navy sm:grid"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
