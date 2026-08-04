import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getSaleInfo } from "@/lib/pricing";
import { BadgeRow, type BadgeShape } from "@/components/product/BadgeRow";

type Search = {
  category?: string;
  type?: string;
  sort?: string;
  attrs?: string;
  q?: string;
};

export const Route = createFileRoute("/Collection/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    category: typeof search.category === "string" ? search.category : undefined,
    type: typeof search.type === "string" ? search.type : undefined,
    sort: typeof search.sort === "string" ? search.sort : undefined,
    attrs: typeof search.attrs === "string" ? search.attrs : undefined,
    q: typeof search.q === "string" && search.q.trim() ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "The Collection — PEUU Jewels" },
      {
        name: "description",
        content:
          "Browse the PEUU Jewels collection — handcrafted necklaces, rings, bracelets and earrings, filtered by style, material and price.",
      },
      { property: "og:title", content: "The Collection — PEUU Jewels" },
      {
        property: "og:description",
        content: "An editorial selection of fine jewelry from PEUU Jewels.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CollectionPage,
});

type Category = { id: string; parent_id: string | null; name: string; slug: string };
type ProductType = { id: string; name: string; slug: string };
type FilterDef = {
  id: string;
  name: string;
  key: string;
  type: string;
  options: unknown;
  sort_order: number;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  image_urls: string[];
  category: string;
  category_id: string | null;
  product_type_id: string | null;
  materials: string[];
  created_at: string;
};

const SORTS = [
  { key: "new", label: "Newest" },
  { key: "price-asc", label: "Price ↑" },
  { key: "price-desc", label: "Price ↓" },
  { key: "name", label: "A–Z" },
];

function parseAttrs(raw?: string): Record<string, string[]> {
  if (!raw) return {};
  const out: Record<string, string[]> = {};
  for (const part of raw.split(";")) {
    const [k, v] = part.split(":");
    if (k && v) out[k] = v.split(",").filter(Boolean);
  }
  return out;
}

function serializeAttrs(map: Record<string, string[]>): string | undefined {
  const parts = Object.entries(map)
    .filter(([, v]) => v.length > 0)
    .map(([k, v]) => `${k}:${v.join(",")}`);
  return parts.length ? parts.join(";") : undefined;
}

function CollectionPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/Collection" });
  const [panelOpen, setPanelOpen] = useState(false);

  const activeAttrs = parseAttrs(search.attrs);

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
      return (data ?? []) as Category[];
    },
  });

  const { data: types = [] } = useQuery({
    queryKey: ["product-types"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_types")
        .select("id, name, slug")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as ProductType[];
    },
  });

  const { data: filters = [] } = useQuery({
    queryKey: ["filter-definitions"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filter_definitions")
        .select("id, name, key, type, options, sort_order")
        .eq("enabled", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as FilterDef[];
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, slug, price, compare_at_price, sale_starts_at, sale_ends_at, image_urls, category, category_id, product_type_id, materials, created_at",
        )
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProductRow[];
    },
  });

  const { data: attributes = [] } = useQuery({
    queryKey: ["product-attributes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_attributes")
        .select("product_id, filter_key, value");
      if (error) throw error;
      return (data ?? []) as Array<{ product_id: string; filter_key: string; value: string }>;
    },
  });

  const { data: productBadges = [] } = useQuery({
    queryKey: ["product-badges-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_badges")
        .select("product_id, badges(id, label, text_color, bg_color, border_color, priority, starts_at, ends_at)");
      if (error) throw error;
      return (data ?? []) as Array<{ product_id: string; badges: BadgeShape | null }>;
    },
  });

  const badgeMap = useMemo(() => {
    const m = new Map<string, BadgeShape[]>();
    for (const row of productBadges) {
      if (!row.badges) continue;
      m.set(row.product_id, [...(m.get(row.product_id) ?? []), row.badges]);
    }
    return m;
  }, [productBadges]);

  const attrMap = useMemo(() => {
    const m = new Map<string, Record<string, string[]>>();
    for (const a of attributes) {
      const entry = m.get(a.product_id) ?? {};
      entry[a.filter_key] = [...(entry[a.filter_key] ?? []), a.value];
      m.set(a.product_id, entry);
    }
    return m;
  }, [attributes]);

  const activeCategory = categories.find((c) => c.slug === search.category) ?? null;
  const descendantIds = useMemo(() => {
    if (!activeCategory) return null;
    const ids = new Set([activeCategory.id]);
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
    return ids;
  }, [activeCategory, categories]);

  const filtered = useMemo(() => {
    let list = products.slice();

    if (search.q) {
      const q = search.q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category ?? "").toLowerCase().includes(q) ||
          (p.materials ?? "").toString().toLowerCase().includes(q),
      );
    }


    if (descendantIds) {
      list = list.filter(
        (p) =>
          (p.category_id && descendantIds.has(p.category_id)) ||
          (!p.category_id && p.category?.toLowerCase() === activeCategory?.name.toLowerCase()),
      );
    }

    if (search.type) {
      const t = types.find((x) => x.slug === search.type);
      if (t) list = list.filter((p) => p.product_type_id === t.id);
    }

    const attrEntries = Object.entries(activeAttrs);
    if (attrEntries.length > 0) {
      list = list.filter((p) => {
        const owned = attrMap.get(p.id) ?? {};
        return attrEntries.every(([key, values]) =>
          values.some((v) => (owned[key] ?? []).includes(v)),
        );
      });
    }

    switch (search.sort) {
      case "price-asc":
        list.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-desc":
        list.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    return list;
  }, [products, descendantIds, activeCategory, search.type, search.sort, types, activeAttrs, attrMap]);

  function setCategory(slug?: string) {
    navigate({ search: (prev: Search) => ({ ...prev, category: slug }) });
  }
  function setType(slug?: string) {
    navigate({ search: (prev: Search) => ({ ...prev, type: slug }) });
  }
  function setSort(key: string) {
    navigate({ search: (prev: Search) => ({ ...prev, sort: key === "new" ? undefined : key }) });
  }
  function toggleAttr(key: string, value: string) {
    const next = { ...activeAttrs };
    const cur = next[key] ?? [];
    next[key] = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    navigate({ search: (prev: Search) => ({ ...prev, attrs: serializeAttrs(next) }) });
  }

  function clearAll() {
    navigate({ search: {} });
  }

  const activeCount =
    (search.category ? 1 : 0) +
    (search.type ? 1 : 0) +
    Object.values(activeAttrs).reduce((s, v) => s + v.length, 0);

  const parents = categories.filter((c) => !c.parent_id);
  const sizePattern = ["tall", "short", "tall", "wide", "tall", "short"] as const;

  const filterPanel = (
    <div className="space-y-8">
      <FilterGroup title="Category">
        <FilterPill active={!search.category} onClick={() => setCategory(undefined)}>
          All
        </FilterPill>
        {parents.map((c) => (
          <div key={c.id} className="w-full">
            <FilterPill active={search.category === c.slug} onClick={() => setCategory(c.slug)}>
              {c.name}
            </FilterPill>
            {categories
              .filter((s) => s.parent_id === c.id)
              .map((s) => (
                <FilterPill
                  key={s.id}
                  active={search.category === s.slug}
                  onClick={() => setCategory(s.slug)}
                  indent
                >
                  {s.name}
                </FilterPill>
              ))}
          </div>
        ))}
      </FilterGroup>

      {types.length > 0 && (
        <FilterGroup title="Type">
          <FilterPill active={!search.type} onClick={() => setType(undefined)}>
            All
          </FilterPill>
          {types.map((t) => (
            <FilterPill key={t.id} active={search.type === t.slug} onClick={() => setType(t.slug)}>
              {t.name}
            </FilterPill>
          ))}
        </FilterGroup>
      )}

      {filters.map((f) => {
        const opts = Array.isArray(f.options) ? (f.options as unknown[]) : [];
        if (opts.length === 0) return null;
        return (
          <FilterGroup key={f.id} title={f.name}>
            {opts.map((raw) => {
              const value =
                typeof raw === "string"
                  ? raw
                  : String((raw as { value?: string; label?: string })?.value ?? "");
              const label =
                typeof raw === "string"
                  ? raw
                  : String((raw as { label?: string; value?: string })?.label ?? value);
              if (!value) return null;
              return (
                <FilterPill
                  key={value}
                  active={(activeAttrs[f.key] ?? []).includes(value)}
                  onClick={() => toggleAttr(f.key, value)}
                >
                  {label}
                </FilterPill>
              );
            })}
          </FilterGroup>
        );
      })}

      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="text-[0.65rem] tracking-luxury uppercase text-rose underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-alabaster pt-28 sm:pt-32">
      <section className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <div className="flex flex-col items-start gap-6">
          <span className="text-[0.7rem] tracking-luxury uppercase text-rose">The Collection</span>
          <h1 className="font-serif text-5xl leading-tight text-navy sm:text-7xl">
            {activeCategory ? (
              <>
                {activeCategory.name}
              </>
            ) : (
              <>
                A curated <em className="italic text-coral/90">selection</em>.
              </>
            )}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-navy/70">
            Every piece in the Maison is hand-finished and inspected by our master jeweler before
            it leaves the atelier.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-y border-border/70 py-4">
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="inline-flex items-center gap-2 text-[0.65rem] tracking-luxury uppercase text-navy lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
            Filters {activeCount > 0 && `(${activeCount})`}
          </button>
          <div className="text-[0.65rem] tracking-luxury uppercase text-navy/50">
            {filtered.length} piece{filtered.length === 1 ? "" : "s"}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSort(s.key)}
                className={`px-3 py-1.5 text-[0.6rem] tracking-luxury uppercase transition-colors ${
                  (search.sort ?? "new") === s.key
                    ? "bg-navy text-alabaster"
                    : "text-navy/55 hover:text-navy"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1400px] gap-10 px-6 pb-32 pt-10 sm:px-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-32">{filterPanel}</div>
        </aside>

        <div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse bg-cashmere" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-32 text-center font-serif text-2xl text-navy/60">
              No pieces match these filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-14 md:grid-cols-3">
              {filtered.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  badges={badgeMap.get(p.id) ?? []}
                  size={sizePattern[i % sizePattern.length]}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {panelOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-navy/40" onClick={() => setPanelOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm overflow-y-auto bg-alabaster p-6">
            <div className="flex items-center justify-between">
              <span className="text-[0.65rem] tracking-luxury uppercase text-navy">Filters</span>
              <button type="button" onClick={() => setPanelOpen(false)} aria-label="Close filters">
                <X className="h-5 w-5 text-navy" />
              </button>
            </div>
            <div className="mt-8">{filterPanel}</div>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="mt-10 w-full bg-navy py-4 text-[0.65rem] tracking-luxury uppercase text-alabaster"
            >
              Show {filtered.length} pieces
            </button>
          </div>
        </div>
      )}

      <SiteFooter />
    </main>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[0.6rem] tracking-luxury uppercase text-navy/45">{title}</div>
      <div className="mt-3 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
  indent,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  indent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block px-3 py-1.5 text-left text-[0.62rem] tracking-luxury uppercase transition-colors ${
        indent ? "ml-3" : ""
      } ${active ? "bg-navy text-alabaster" : "border border-border/60 text-navy/60 hover:text-navy"}`}
    >
      {children}
    </button>
  );
}

function ProductCard({
  product,
  badges,
  size,
  index,
}: {
  product: ProductRow;
  badges: BadgeShape[];
  size: "tall" | "short" | "wide";
  index: number;
}) {
  const { add } = useCart();
  const [hover, setHover] = useState(false);
  const img1 = product.image_urls[0];
  const img2 = product.image_urls[1] ?? img1;
  const sale = getSaleInfo(product);

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
        to="/Collection/$slug"
        params={{ slug: product.slug }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={`relative block w-full overflow-hidden bg-cashmere ${aspect}`}
      >
        <img
          src={img1}
          alt={product.name}
          loading={index < 4 ? "eager" : "lazy"}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out ${
            hover ? "opacity-0" : "opacity-100"
          }`}
        />
        <img
          src={img2}
          alt=""
          aria-hidden
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out ${
            hover ? "opacity-100" : "opacity-0"
          }`}
        />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          <BadgeRow badges={badges} size="sm" />
          {sale.onSale && (
            <span className="bg-coral px-2 py-0.5 text-[0.5rem] tracking-luxury uppercase text-alabaster">
              −{sale.percentOff}%
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            add({
              id: product.id,
              name: product.name,
              price: sale.price,
              compareAt: sale.compareAt,
              image: img1,
              slug: product.slug,
            });
          }}
          className="absolute inset-x-4 bottom-4 translate-y-2 bg-navy py-3 text-[0.6rem] tracking-luxury uppercase text-alabaster opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100"
        >
          Add to Selection
        </button>
      </Link>

      <div className="mt-5 flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[0.6rem] tracking-luxury uppercase text-navy/45">
            {product.category}
          </div>
          <Link
            to="/Collection/$slug"
            params={{ slug: product.slug }}
            className="mt-1 block truncate font-serif text-lg text-navy"
          >
            {product.name}
          </Link>
        </div>
        <div className="shrink-0 text-right text-sm tabular-nums text-navy/80">
          {sale.compareAt && (
            <div className="text-[0.7rem] text-navy/40 line-through">
              {formatPrice(sale.compareAt)}
            </div>
          )}
          {formatPrice(sale.price)}
        </div>
      </div>
    </motion.div>
  );
}
