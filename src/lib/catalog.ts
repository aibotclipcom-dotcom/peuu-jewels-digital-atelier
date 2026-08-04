import { supabase } from "@/integrations/supabase/client";
import type { BadgeShape } from "@/components/product/BadgeRow";

export type CatalogProduct = {
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
  description: string | null;
  stock: number;
  is_best_seller: boolean;
  best_seller_sort: number;
  created_at: string;
};

const PRODUCT_COLUMNS =
  "id, name, slug, price, compare_at_price, sale_starts_at, sale_ends_at, image_urls, category, category_id, product_type_id, description, stock, is_best_seller, best_seller_sort, created_at";

export const bestSellersQuery = (limit?: number) => ({
  queryKey: ["best-sellers", limit ?? "all"] as const,
  staleTime: 60 * 1000,
  queryFn: async (): Promise<CatalogProduct[]> => {
    let q = supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("status", "published")
      .eq("is_best_seller", true)
      .order("best_seller_sort", { ascending: true })
      .order("created_at", { ascending: false });
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as CatalogProduct[];
  },
});

export const homeCategoriesQuery = {
  queryKey: ["home-categories"] as const,
  staleTime: 5 * 60 * 1000,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, image_url, icon_url, sort_order")
      .is("parent_id", null)
      .eq("is_visible", true)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []) as Array<{
      id: string;
      name: string;
      slug: string;
      image_url: string | null;
      icon_url: string | null;
      sort_order: number;
    }>;
  },
};

/** Average approved rating per product, used on listing cards. */
export const ratingsQuery = {
  queryKey: ["product-ratings"] as const,
  staleTime: 5 * 60 * 1000,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("product_reviews")
      .select("product_id, rating")
      .eq("approved", true);
    if (error) throw error;
    const agg = new Map<string, { sum: number; count: number }>();
    for (const r of (data ?? []) as Array<{ product_id: string; rating: number }>) {
      const cur = agg.get(r.product_id) ?? { sum: 0, count: 0 };
      cur.sum += Number(r.rating) || 0;
      cur.count += 1;
      agg.set(r.product_id, cur);
    }
    const out = new Map<string, { average: number; count: number }>();
    for (const [id, v] of agg) out.set(id, { average: v.sum / v.count, count: v.count });
    return out;
  },
};

export const badgesQuery = {
  queryKey: ["product-badges-all"] as const,
  staleTime: 5 * 60 * 1000,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("product_badges")
      .select(
        "product_id, badges(id, label, text_color, bg_color, border_color, priority, starts_at, ends_at)",
      );
    if (error) throw error;
    const m = new Map<string, BadgeShape[]>();
    for (const row of (data ?? []) as Array<{ product_id: string; badges: BadgeShape | null }>) {
      if (!row.badges) continue;
      m.set(row.product_id, [...(m.get(row.product_id) ?? []), row.badges]);
    }
    return m;
  },
};
