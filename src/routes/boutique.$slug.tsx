import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { motion } from "framer-motion";

export const Route = createFileRoute("/boutique/$slug")({
  head: () => ({
    meta: [
      { title: "Piece — PEUU Jewels" },
      { name: "description", content: "Discover this PEUU Jewels piece — hand-finished, heirloom-quality." },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const { add } = useCart();
  const { user } = useAuth();
  const [activeImage, setActiveImage] = useState(0);
  const [wished, setWished] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  useQuery({
    queryKey: ["wishlist-check", product?.id, user?.id],
    enabled: !!product && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", user!.id)
        .eq("product_id", product!.id)
        .maybeSingle();
      setWished(!!data);
      return data;
    },
  });

  async function toggleWish() {
    if (!user) {
      toast("Please sign in to save pieces.");
      return;
    }
    if (!product) return;
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

  if (isLoading) {
    return <div className="min-h-screen bg-alabaster pt-40 text-center text-navy/50">Loading…</div>;
  }
  if (!product) {
    return (
      <div className="min-h-screen bg-alabaster pt-40 text-center">
        <p className="font-serif text-2xl text-navy">Piece not found.</p>
        <Link to="/boutique" className="mt-6 inline-block line-draw text-[0.7rem] tracking-luxury uppercase text-navy">
          Return to the Boutique
        </Link>
      </div>
    );
  }

  const images = product.image_urls.length > 0 ? product.image_urls : ["https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1200&q=80"];

  return (
    <main className="min-h-screen bg-alabaster pt-24 sm:pt-28">
      <section className="mx-auto grid max-w-[1400px] gap-12 px-6 py-12 sm:px-10 md:grid-cols-2 md:gap-20">
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="aspect-[4/5] w-full overflow-hidden bg-cashmere"
          >
            <img src={images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
          </motion.div>
          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square overflow-hidden border bg-cashmere ${
                    i === activeImage ? "border-navy" : "border-transparent"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-start pt-4">
          <Link to="/boutique" className="text-[0.65rem] tracking-luxury uppercase text-navy/50 hover:text-navy">
            ← The Boutique
          </Link>
          <span className="mt-6 text-[0.65rem] tracking-luxury uppercase text-rose">
            {product.category}
          </span>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-navy sm:text-5xl">{product.name}</h1>
          <div className="mt-4 font-serif text-3xl text-navy">{formatPrice(Number(product.price))}</div>

          <p className="mt-8 max-w-md text-sm leading-relaxed text-navy/75">{product.description}</p>

          {product.materials.length > 0 && (
            <div className="mt-8">
              <div className="text-[0.6rem] tracking-luxury uppercase text-navy/50">Materials</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.materials.map((m) => (
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
              onClick={() =>
                add({
                  id: product.id,
                  name: product.name,
                  price: Number(product.price),
                  image: images[0],
                  slug: product.slug,
                })
              }
              className="inline-flex items-center gap-3 bg-navy px-10 py-4 text-[0.7rem] tracking-luxury uppercase text-alabaster transition-all hover:bg-navy-soft"
            >
              Add to Selection
              <span className="inline-block h-px w-6 bg-alabaster" />
            </button>
            <button
              type="button"
              onClick={toggleWish}
              className="inline-flex items-center gap-2 border border-navy/20 px-6 py-4 text-[0.7rem] tracking-luxury uppercase text-navy transition-all hover:bg-navy/5"
            >
              <Heart className={`h-4 w-4 ${wished ? "fill-coral text-coral" : ""}`} strokeWidth={1.4} />
              {wished ? "Saved" : "Save"}
            </button>
          </div>

          <div className="mt-12 border-t border-border/60 pt-8 text-xs text-navy/60">
            <p>Complimentary insured delivery · Lifetime polishing · 30-day private return</p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
