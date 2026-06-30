import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
import { motion } from "framer-motion";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/boutique")({
  head: () => ({
    meta: [
      { title: "The Boutique — PEUU Jewels" },
      { name: "description", content: "Browse the PEUU Jewels collection — handcrafted necklaces, rings, bracelets and earrings." },
      { property: "og:title", content: "The Boutique — PEUU Jewels" },
      { property: "og:description", content: "An editorial selection of fine jewelry from PEUU Jewels." },
    ],
  }),
  component: BoutiquePage,
});

const CATEGORIES = ["All", "Necklaces", "Rings", "Bracelets", "Earrings"] as const;

function BoutiquePage() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", "published", category],
    queryFn: async () => {
      let q = supabase.from("products").select("*").eq("status", "published").order("created_at", { ascending: false });
      if (category !== "All") q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  // Asymmetric size pattern — repeats across grid for an editorial layout
  const sizePattern = ["tall", "short", "tall", "wide", "tall", "short"] as const;

  return (
    <main className="min-h-screen bg-alabaster pt-28 sm:pt-32">
      <section className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <div className="flex flex-col items-start gap-6">
          <span className="text-[0.7rem] tracking-luxury uppercase text-rose">The Boutique</span>
          <h1 className="font-serif text-5xl leading-tight text-navy sm:text-7xl">
            A curated <em className="italic text-coral/90">selection</em>.
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-navy/70">
            Every piece in the Maison is hand-finished and inspected by our master jeweler before
            it leaves the atelier.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-2 border-y border-border/70 py-4">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`px-4 py-2 text-[0.65rem] tracking-luxury uppercase transition-all ${
                category === c
                  ? "bg-navy text-alabaster"
                  : "text-navy/60 hover:text-navy"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 pb-32 pt-12 sm:px-10">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse bg-cashmere" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-32 text-center font-serif text-2xl text-navy/60">
            No pieces in this collection yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} size={sizePattern[i % sizePattern.length]} index={i} />
            ))}
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_urls: string[];
  category: string;
  materials: string[];
};

function ProductCard({
  product,
  size,
  index,
}: {
  product: Product;
  size: "tall" | "short" | "wide";
  index: number;
}) {
  const { add } = useCart();
  const [hover, setHover] = useState(false);
  const img1 = product.image_urls[0];
  const img2 = product.image_urls[1] ?? img1;

  const aspect =
    size === "tall" ? "aspect-[3/4.4]" : size === "short" ? "aspect-[3/3.6]" : "aspect-[3/3.9]";
  const offset = index % 3 === 1 ? "md:mt-12" : index % 3 === 2 ? "md:mt-6" : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, delay: (index % 4) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={`group ${offset}`}
    >
      <Link
        to="/boutique/$slug"
        params={{ slug: product.slug }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`relative block w-full overflow-hidden bg-cashmere ${aspect}`}
      >
        <img
          src={img1}
          alt={product.name}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out ${
            hover ? "opacity-0" : "opacity-100"
          }`}
        />
        <img
          src={img2}
          alt=""
          aria-hidden
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out ${
            hover ? "opacity-100" : "opacity-0"
          }`}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            add({ id: product.id, name: product.name, price: Number(product.price), image: img1, slug: product.slug });
          }}
          className="absolute inset-x-4 bottom-4 translate-y-2 bg-navy py-3 text-[0.6rem] tracking-luxury uppercase text-alabaster opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
        >
          Add to Selection
        </button>
      </Link>

      <div className="mt-5 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[0.6rem] tracking-luxury uppercase text-navy/45">{product.category}</div>
          <Link
            to="/boutique/$slug"
            params={{ slug: product.slug }}
            className="mt-1 block truncate font-serif text-lg text-navy"
          >
            {product.name}
          </Link>
        </div>
        <div className="shrink-0 text-sm tabular-nums text-navy/80">
          {formatPrice(Number(product.price))}
        </div>
      </div>
    </motion.div>
  );
}
