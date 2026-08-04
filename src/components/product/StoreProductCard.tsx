import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, Eye, Star } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { formatPrice } from "@/lib/format";
import { getSaleInfo } from "@/lib/pricing";
import { BadgeRow, type BadgeShape } from "@/components/product/BadgeRow";
import type { CatalogProduct } from "@/lib/catalog";

interface Props {
  product: CatalogProduct;
  badges?: BadgeShape[];
  rating?: { average: number; count: number };
  priority?: boolean;
}

function Stars({ value, count }: { value: number; count: number }) {
  return (
    <div className="mt-1 flex items-center gap-1" aria-label={`Rated ${value.toFixed(1)} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3 w-3 ${n <= Math.round(value) ? "fill-gold text-gold" : "text-navy/20"}`}
          strokeWidth={1.4}
        />
      ))}
      <span className="ml-1 text-[0.6rem] text-navy/45">({count})</span>
    </div>
  );
}

/** Storefront card with rating, wishlist, quick view and add to cart. */
export function StoreProductCard({ product, badges = [], rating, priority }: Props) {
  const { add } = useCart();
  const wishlist = useWishlist();
  const [quickView, setQuickView] = useState(false);
  const sale = getSaleInfo(product);
  const img = product.image_urls?.[0] ?? "";
  const img2 = product.image_urls?.[1] ?? img;
  const soldOut = Number(product.stock) <= 0;

  const cartItem = {
    id: product.id,
    name: product.name,
    price: sale.price,
    compareAt: sale.compareAt,
    image: img,
    slug: product.slug,
  };

  return (
    <div className="group">
      <div className="relative aspect-[3/4] overflow-hidden bg-cashmere">
        <Link
          to="/Collection/$slug"
          params={{ slug: product.slug }}
          className="absolute inset-0"
          aria-label={product.name}
        >
          <img
            src={img}
            alt={product.name}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 group-hover:opacity-0"
          />
          <img
            src={img2}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          <BadgeRow badges={badges} size="sm" />
          {sale.onSale && (
            <span className="bg-coral px-2 py-0.5 text-[0.5rem] tracking-luxury uppercase text-alabaster">
              −{sale.percentOff}%
            </span>
          )}
          {soldOut && (
            <span className="bg-navy/80 px-2 py-0.5 text-[0.5rem] tracking-luxury uppercase text-alabaster">
              Sold out
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => wishlist.toggle(product.id)}
            aria-label={wishlist.isSaved(product.id) ? "Remove from wishlist" : "Add to wishlist"}
            className="grid h-9 w-9 place-items-center bg-alabaster/90 text-navy transition-colors hover:bg-alabaster"
          >
            <Heart
              className={`h-4 w-4 ${wishlist.isSaved(product.id) ? "fill-coral text-coral" : ""}`}
              strokeWidth={1.5}
            />
          </button>
          <button
            type="button"
            onClick={() => setQuickView(true)}
            aria-label="Quick view"
            className="grid h-9 w-9 place-items-center bg-alabaster/90 text-navy opacity-0 transition-all hover:bg-alabaster group-hover:opacity-100"
          >
            <Eye className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <button
          type="button"
          disabled={soldOut}
          onClick={() => add(cartItem)}
          className="absolute inset-x-4 bottom-4 translate-y-2 bg-navy py-3 text-[0.6rem] tracking-luxury uppercase text-alabaster opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {soldOut ? "Sold out" : "Add to Selection"}
        </button>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
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
          {rating && rating.count > 0 && <Stars value={rating.average} count={rating.count} />}
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

      <Dialog open={quickView} onOpenChange={setQuickView}>
        <DialogContent className="max-w-3xl gap-0 border-border/60 bg-alabaster p-0">
          <div className="grid gap-0 sm:grid-cols-2">
            <div className="aspect-square overflow-hidden bg-cashmere">
              <img src={img} alt={product.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col p-6 sm:p-8">
              <div className="text-[0.6rem] tracking-luxury uppercase text-navy/45">
                {product.category}
              </div>
              <h2 className="mt-2 font-serif text-2xl text-navy">{product.name}</h2>
              {rating && rating.count > 0 && <Stars value={rating.average} count={rating.count} />}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-serif text-2xl text-navy">{formatPrice(sale.price)}</span>
                {sale.compareAt && (
                  <span className="text-sm text-navy/40 line-through">
                    {formatPrice(sale.compareAt)}
                  </span>
                )}
              </div>
              {product.description && (
                <p className="mt-4 line-clamp-5 text-sm leading-relaxed text-navy/65">
                  {product.description}
                </p>
              )}
              <div className="mt-auto space-y-3 pt-8">
                <button
                  type="button"
                  disabled={soldOut}
                  onClick={() => {
                    add(cartItem);
                    setQuickView(false);
                  }}
                  className="w-full bg-navy py-3.5 text-[0.65rem] tracking-luxury uppercase text-alabaster transition-colors hover:bg-navy-soft disabled:opacity-50"
                >
                  {soldOut ? "Sold out" : "Add to Selection"}
                </button>
                <Link
                  to="/Collection/$slug"
                  params={{ slug: product.slug }}
                  onClick={() => setQuickView(false)}
                  className="block text-center text-[0.65rem] tracking-luxury uppercase text-navy underline underline-offset-4"
                >
                  View full details
                </Link>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
