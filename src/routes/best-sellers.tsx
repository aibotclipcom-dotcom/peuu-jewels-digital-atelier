import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { StoreProductCard } from "@/components/product/StoreProductCard";
import { badgesQuery, bestSellersQuery, ratingsQuery } from "@/lib/catalog";
import { getSaleInfo } from "@/lib/pricing";

type Search = { category?: string; sort?: string; q?: string; page?: number };

const PAGE_SIZE = 12;

const SORTS = [
  { key: "curated", label: "Curated" },
  { key: "price-asc", label: "Price ↑" },
  { key: "price-desc", label: "Price ↓" },
  { key: "name", label: "A–Z" },
];

export const Route = createFileRoute("/best-sellers")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    category: typeof search.category === "string" ? search.category : undefined,
    sort: typeof search.sort === "string" ? search.sort : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
    page: Number(search.page) > 1 ? Number(search.page) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Best Sellers — PEUU Jewels" },
      {
        name: "description",
        content:
          "The most loved pieces from PEUU Jewels — our best selling necklaces, rings, bracelets and earrings, handpicked by the atelier.",
      },
      { property: "og:title", content: "Best Sellers — PEUU Jewels" },
      {
        property: "og:description",
        content: "Shop the PEUU Jewels pieces our clients return to again and again.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://peuujewels.lovable.app/best-sellers" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://peuujewels.lovable.app/best-sellers" }],
  }),
  component: BestSellersPage,
});

function BestSellersPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/best-sellers" });
  const page = search.page ?? 1;

  const { data: products = [], isLoading } = useQuery(bestSellersQuery());
  const { data: ratings } = useQuery(ratingsQuery);
  const { data: badges } = useQuery(badgesQuery);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, parent_id, name, slug")
        .eq("is_visible", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; parent_id: string | null; name: string; slug: string }>;
    },
  });

  const filtered = useMemo(() => {
    let list = products.slice();
    const active = categories.find((c) => c.slug === search.category);
    if (active) {
      const ids = new Set([active.id]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const c of categories) {
          if (c.parent_id && ids.has(c.parent_id) && !ids.has(c.id)) {
            ids.add(c.id);
            grew = true;
          }
        }
      }
      list = list.filter(
        (p) =>
          (p.category_id && ids.has(p.category_id)) ||
          (!p.category_id && p.category?.toLowerCase() === active.name.toLowerCase()),
      );
    }

    const q = (search.q ?? "").trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }

    switch (search.sort) {
      case "price-asc":
        list.sort((a, b) => getSaleInfo(a).price - getSaleInfo(b).price);
        break;
      case "price-desc":
        list.sort((a, b) => getSaleInfo(b).price - getSaleInfo(a).price);
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    return list;
  }, [products, categories, search.category, search.q, search.sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const update = (patch: Partial<Search>) =>
    navigate({ search: (prev: Search) => ({ ...prev, ...patch, page: undefined }) });

  const parents = categories.filter((c) => !c.parent_id);

  return (
    <main className="min-h-screen bg-alabaster pt-28 sm:pt-32">
      <section className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <span className="text-[0.7rem] tracking-luxury uppercase text-rose">Most loved</span>
        <h1 className="mt-4 font-serif text-5xl leading-tight text-navy sm:text-7xl">
          Best <em className="italic text-coral/90">Sellers</em>.
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-navy/70">
          The pieces our clients return to again and again — selected by the atelier and refreshed
          each season.
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-3 border-y border-border/70 py-4">
          <div className="relative min-w-[220px] flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/35" />
            <input
              type="search"
              value={search.q ?? ""}
              onChange={(e) => update({ q: e.target.value || undefined })}
              placeholder="Search best sellers"
              aria-label="Search best sellers"
              className="w-full border border-border/60 bg-alabaster py-2 pl-9 pr-3 text-sm text-navy placeholder:text-navy/35 focus:border-navy focus:outline-none"
            />
          </div>

          <select
            value={search.category ?? ""}
            onChange={(e) => update({ category: e.target.value || undefined })}
            aria-label="Filter by category"
            className="border border-border/60 bg-alabaster px-3 py-2 text-[0.65rem] tracking-luxury uppercase text-navy focus:border-navy focus:outline-none"
          >
            <option value="">All categories</option>
            {parents.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap items-center gap-1">
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => update({ sort: s.key === "curated" ? undefined : s.key })}
                className={`px-3 py-1.5 text-[0.6rem] tracking-luxury uppercase transition-colors ${
                  (search.sort ?? "curated") === s.key
                    ? "bg-navy text-alabaster"
                    : "text-navy/55 hover:text-navy"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="ml-auto text-[0.65rem] tracking-luxury uppercase text-navy/50">
            {filtered.length} piece{filtered.length === 1 ? "" : "s"}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 pb-32 pt-12 sm:px-10">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse bg-cashmere" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="py-32 text-center font-serif text-2xl text-navy/60">
            No best sellers match this search.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((p, i) => (
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

        {pageCount > 1 && (
          <nav className="mt-16 flex items-center justify-center gap-2" aria-label="Pagination">
            {Array.from({ length: pageCount }).map((_, i) => {
              const n = i + 1;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    navigate({ search: (prev: Search) => ({ ...prev, page: n === 1 ? undefined : n }) })
                  }
                  aria-current={n === safePage ? "page" : undefined}
                  className={`h-9 w-9 border text-[0.65rem] tabular-nums transition-colors ${
                    n === safePage
                      ? "border-navy bg-navy text-alabaster"
                      : "border-border/60 text-navy/60 hover:text-navy"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </nav>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
