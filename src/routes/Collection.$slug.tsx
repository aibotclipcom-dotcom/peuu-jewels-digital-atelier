import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Heart, Truck, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { motion } from "framer-motion";
import { getSaleInfo, formatCountdown } from "@/lib/pricing";
import { BadgeRow, type BadgeShape } from "@/components/product/BadgeRow";
import { ProductReviews, Stars } from "@/components/product/ProductReviews";
import { ProductFaqs } from "@/components/product/ProductFaqs";

const SITE = "https://peuujewels.lovable.app";

export const Route = createFileRoute("/Collection/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("products")
      .select(
        "id,slug,name,description,price,compare_at_price,sale_starts_at,sale_ends_at,category,category_id,materials,image_urls,video_urls,spec,care,shipping_info,seo_title,seo_description,og_image,stock,status",
      )
      .eq("slug", params.slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();

    const [{ data: productFaqs }, { data: globalFaqs }] = await Promise.all([
      supabase
        .from("product_faqs")
        .select("question, answer")
        .eq("product_id", data.id)
        .order("sort_order"),
      supabase.from("global_faqs").select("question, answer").order("sort_order"),
    ]);

    return {
      ...data,
      faqs: [...(productFaqs ?? []), ...(globalFaqs ?? [])] as Array<{
        question: string;
        answer: string;
      }>,
    };
  },
  head: ({ params, loaderData }) => {
    const p = loaderData;
    if (!p) {
      return {
        meta: [
          { title: "Piece unavailable — PEUU Jewels" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = p.seo_title?.trim() || `${p.name} — PEUU Jewels`;
    const rawDesc = (p.seo_description?.trim() || p.description || "")
      .replace(/\s+/g, " ")
      .trim();
    const description =
      (rawDesc || "Discover this PEUU Jewels piece — hand-finished, heirloom-quality.").slice(0, 155);
    const rawImage = p.og_image || p.image_urls?.[0];
    const image = rawImage
      ? rawImage.startsWith("http")
        ? rawImage
        : `${SITE}${rawImage}`
      : `${SITE}/necklace.jpeg`;
    const url = `${SITE}/Collection/${params.slug}`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            description: rawDesc,
            image: [image],
            sku: p.id,
            category: p.category,
            brand: { "@type": "Brand", name: "PEUU Jewels" },
            offers: {
              "@type": "Offer",
              price: Number(p.price),
              priceCurrency: "INR",
              availability:
                p.status === "published" && (p.stock ?? 0) > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              url,
            },
          }),
        },
        ...(p.faqs && p.faqs.length > 0
          ? [
              {
                type: "application/ld+json",
                children: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: p.faqs.map((f) => ({
                    "@type": "Question",
                    name: f.question,
                    acceptedAnswer: { "@type": "Answer", text: f.answer },
                  })),
                }),
              },
            ]
          : []),
      ],
    };
  },
  component: ProductDetail,
});

type TabKey = "details" | "spec" | "care" | "shipping";

function ProductDetail() {
  const product = Route.useLoaderData();
  const { add } = useCart();
  const { user } = useAuth();
  const [activeImage, setActiveImage] = useState(0);
  const [wished, setWished] = useState(false);
  const [tab, setTab] = useState<TabKey>("details");
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  const sale = getSaleInfo(product);

  const { data: badges = [] } = useQuery({
    queryKey: ["product-badges", product.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_badges")
        .select("badges(id, label, text_color, bg_color, border_color, priority, starts_at, ends_at)")
        .eq("product_id", product.id);
      if (error) throw error;
      return ((data ?? []) as Array<{ badges: BadgeShape | null }>)
        .map((r) => r.badges)
        .filter(Boolean) as BadgeShape[];
    },
  });

  const { data: related = [] } = useQuery({
    queryKey: ["related", product.category_id, product.id],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id, name, slug, price, image_urls")
        .eq("status", "published")
        .neq("id", product.id)
        .limit(4);
      if (product.category_id) q = q.eq("category_id", product.category_id);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        name: string;
        slug: string;
        price: number;
        image_urls: string[];
      }>;
    },
  });

  const { data: ratingSummary } = useQuery({
    queryKey: ["review-summary", product.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("rating")
        .eq("product_id", product.id)
        .eq("approved", true);
      if (error) throw error;
      const rows = data ?? [];
      if (rows.length === 0) return { avg: 0, count: 0 };
      return {
        avg: rows.reduce((s, r) => s + r.rating, 0) / rows.length,
        count: rows.length,
      };
    },
  });

  useQuery({
    queryKey: ["wishlist-check", product.id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", user!.id)
        .eq("product_id", product.id)
        .maybeSingle();
      setWished(!!data);
      return data;
    },
  });

  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!sale.endsAt) {
      setRemaining(null);
      return;
    }
    const end = sale.endsAt.getTime();
    const tick = () => setRemaining(end - Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [sale.endsAt]);

  async function toggleWish() {
    if (!user) {
      toast("Please sign in to save pieces.");
      return;
    }
    if (wished) {
      await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", product.id);
      setWished(false);
      toast("Removed from wishlist");
    } else {
      await supabase.from("wishlist").insert({ user_id: user.id, product_id: product.id });
      setWished(true);
      toast.success("Saved to your wishlist");
    }
  }

  const images =
    product.image_urls?.length > 0
      ? product.image_urls
      : ["https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1200&q=80"];
  const videos = product.video_urls ?? [];
  const specEntries = Object.entries(
    (product.spec ?? {}) as Record<string, unknown>,
  ).filter(([, v]) => v !== null && v !== "");

  const deliveryFrom = new Date(Date.now() + 3 * 864e5);
  const deliveryTo = new Date(Date.now() + 7 * 864e5);
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  const tabs: Array<{ key: TabKey; label: string; available: boolean }> = [
    { key: "details", label: "Details", available: true },
    { key: "spec", label: "Specifications", available: specEntries.length > 0 },
    { key: "care", label: "Care", available: !!product.care },
    { key: "shipping", label: "Shipping", available: !!product.shipping_info },
  ];

  return (
    <main className="min-h-screen bg-alabaster pt-24 sm:pt-28">
      <nav aria-label="Breadcrumb" className="mx-auto max-w-[1400px] px-6 pt-4 sm:px-10">
        <ol className="flex flex-wrap items-center gap-2 text-[0.6rem] tracking-luxury uppercase text-navy/45">
          <li>
            <Link to="/" className="hover:text-navy">Home</Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link to="/Collection" className="hover:text-navy">The Collection</Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-navy/70">{product.name}</li>
        </ol>
      </nav>

      <section className="mx-auto grid max-w-[1400px] gap-12 px-6 py-10 sm:px-10 md:grid-cols-2 md:gap-20">
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative aspect-[4/5] w-full overflow-hidden bg-cashmere"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setZoom({
                x: ((e.clientX - r.left) / r.width) * 100,
                y: ((e.clientY - r.top) / r.height) * 100,
              });
            }}
            onMouseLeave={() => setZoom(null)}
          >
            <img
              src={images[activeImage]}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300"
              style={
                zoom
                  ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                  : undefined
              }
            />
            <div className="absolute left-4 top-4">
              <BadgeRow badges={badges} />
            </div>
          </motion.div>

          {(images.length > 1 || videos.length > 0) && (
            <div className="mt-4 grid grid-cols-5 gap-3">
              {images.map((src: string, i: number) => (
                <button
                  key={src + i}
                  type="button"
                  aria-label={`View image ${i + 1} of ${product.name}`}
                  aria-pressed={i === activeImage}
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square overflow-hidden border bg-cashmere ${
                    i === activeImage ? "border-navy" : "border-transparent"
                  }`}
                >
                  <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {videos.length > 0 && (
            <div className="mt-4 space-y-4">
              {videos.map((v: string) => (
                <video
                  key={v}
                  src={v}
                  controls
                  playsInline
                  className="w-full bg-cashmere"
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-start pt-2">
          <span className="text-[0.65rem] tracking-luxury uppercase text-rose">
            {product.category}
          </span>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-navy sm:text-5xl">
            {product.name}
          </h1>

          {(ratingSummary?.count ?? 0) > 0 && (
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-[0.7rem] text-navy/60">
              <Stars value={ratingSummary!.avg} />
              {ratingSummary!.avg.toFixed(1)} · {ratingSummary!.count} review
              {ratingSummary!.count === 1 ? "" : "s"}
            </a>
          )}

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="font-serif text-3xl text-navy">{formatPrice(sale.price)}</span>
            {sale.compareAt && (
              <>
                <span className="text-lg text-navy/40 line-through">
                  {formatPrice(sale.compareAt)}
                </span>
                <span className="bg-coral px-2 py-0.5 text-[0.55rem] tracking-luxury uppercase text-alabaster">
                  Save {sale.percentOff}%
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-[0.65rem] text-navy/45">Inclusive of all taxes</p>

          <ProductBenefits benefits={benefits} className="mt-5" />


          {remaining !== null && remaining > 0 && (
            <div className="mt-4 inline-flex w-fit items-center gap-2 border border-coral/40 bg-coral/5 px-3 py-2 text-[0.65rem] tracking-luxury uppercase text-coral">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
              Offer ends in {formatCountdown(remaining)}
            </div>
          )}

          {product.stock !== null && product.stock <= 3 && product.stock > 0 && (
            <p className="mt-4 text-[0.7rem] tracking-luxury uppercase text-rose">
              Only {product.stock} left
            </p>
          )}

          {product.materials?.length > 0 && (
            <div className="mt-8">
              <div className="text-[0.6rem] tracking-luxury uppercase text-navy/50">Materials</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.materials.map((m: string) => (
                  <span key={m} className="border border-border px-3 py-1 text-xs text-navy/80">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-wrap gap-4">
            <button
              type="button"
              disabled={(product.stock ?? 0) <= 0}
              onClick={() =>
                add({
                  id: product.id,
                  name: product.name,
                  price: sale.price,
                  image: images[0],
                  slug: product.slug,
                })
              }
              className="inline-flex items-center gap-3 bg-navy px-10 py-4 text-[0.7rem] tracking-luxury uppercase text-alabaster transition-all hover:bg-navy-soft disabled:opacity-40"
            >
              {(product.stock ?? 0) <= 0 ? "Sold out" : "Add to Selection"}
              <span className="inline-block h-px w-6 bg-alabaster" />
            </button>
            <button
              type="button"
              onClick={toggleWish}
              className="inline-flex items-center gap-2 border border-navy/20 px-6 py-4 text-[0.7rem] tracking-luxury uppercase text-navy transition-all hover:bg-navy/5"
            >
              <Heart
                className={`h-4 w-4 ${wished ? "fill-coral text-coral" : ""}`}
                strokeWidth={1.4}
              />
              {wished ? "Saved" : "Save"}
            </button>
          </div>

          <div className="mt-8 space-y-2 text-[0.72rem] text-navy/65">
            <p className="flex items-center gap-2">
              <Truck className="h-4 w-4" strokeWidth={1.4} />
              Estimated delivery {fmtDate(deliveryFrom)} – {fmtDate(deliveryTo)}
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.4} />
              Complimentary insured delivery · Lifetime polishing
            </p>
          </div>

          {/* Tabs */}
          <div className="mt-12 border-t border-border/60">
            <div className="flex flex-wrap gap-6 pt-5">
              {tabs
                .filter((t) => t.available)
                .map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`pb-2 text-[0.62rem] tracking-luxury uppercase transition-colors ${
                      tab === t.key
                        ? "border-b border-navy text-navy"
                        : "text-navy/45 hover:text-navy"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
            </div>
            <div className="mt-5 max-w-md text-sm leading-relaxed text-navy/75">
              {tab === "details" && <p>{product.description}</p>}
              {tab === "spec" && (
                <dl className="divide-y divide-border/50">
                  {specEntries.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-6 py-2.5">
                      <dt className="text-[0.65rem] tracking-luxury uppercase text-navy/50">{k}</dt>
                      <dd className="text-right text-navy/80">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {tab === "care" && <p>{product.care}</p>}
              {tab === "shipping" && <p>{product.shipping_info}</p>}
            </div>
          </div>
        </div>
      </section>

      <ProductFaqs productId={product.id} />
      <ProductReviews productId={product.id} />

      {related.length > 0 && (
        <section className="mx-auto max-w-[1400px] border-t border-border/60 px-6 py-16 sm:px-10">
          <div className="text-[0.65rem] tracking-luxury uppercase text-rose">You may also like</div>
          <h2 className="mt-3 font-serif text-3xl text-navy sm:text-4xl">Complete the look</h2>
          <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
            {related.map((r) => (
              <Link key={r.id} to="/Collection/$slug" params={{ slug: r.slug }} className="group">
                <div className="aspect-[3/4] overflow-hidden bg-cashmere">
                  <img
                    src={r.image_urls?.[0]}
                    alt={r.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="mt-3 truncate font-serif text-base text-navy">{r.name}</div>
                <div className="text-sm tabular-nums text-navy/70">
                  {formatPrice(Number(r.price))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}
