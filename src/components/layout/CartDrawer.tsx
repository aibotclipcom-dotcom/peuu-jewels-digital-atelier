import { useCart } from "@/hooks/use-cart";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatPrice } from "@/lib/format";
import { Minus, Plus, X } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";

export function CartDrawer() {
  const { items, total, open, setOpen, remove, setQuantity } = useCart();
  const navigate = useNavigate();

  function handleContinue() {
    setOpen(false);
    navigate({ to: "/checkout" });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="w-full max-w-md bg-alabaster p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <SheetTitle className="font-serif text-2xl tracking-tight text-navy">
            Your Selection
          </SheetTitle>
          <p className="text-[0.65rem] tracking-luxury uppercase text-navy/50">
            {items.length} {items.length === 1 ? "piece" : "pieces"}
          </p>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
            <div className="font-serif text-xl text-navy">Your atelier basket is empty.</div>
            <p className="mt-3 max-w-xs text-sm text-navy/60">
              Begin curating your collection from The Boutique.
            </p>
            <Link
              to="/boutique"
              onClick={() => setOpen(false)}
              className="mt-8 line-draw text-[0.7rem] tracking-luxury uppercase text-navy"
            >
              Discover Pieces
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <ul className="divide-y divide-border/60">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4 py-5">
                    <div className="h-24 w-20 shrink-0 overflow-hidden bg-cashmere">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            to="/boutique/$slug"
                            params={{ slug: item.slug }}
                            onClick={() => setOpen(false)}
                            className="block truncate font-serif text-base text-navy"
                          >
                            {item.name}
                          </Link>
                          <div className="mt-1 text-sm text-navy/70">{formatPrice(item.price)}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          className="text-navy/40 hover:text-navy"
                          aria-label="Remove"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                          className="grid h-7 w-7 place-items-center border border-border text-navy hover:bg-cashmere"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm tabular-nums text-navy">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                          className="grid h-7 w-7 place-items-center border border-border text-navy hover:bg-cashmere"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-border/60 bg-cashmere/40 px-6 py-6">
              <div className="flex items-baseline justify-between">
                <span className="text-[0.65rem] tracking-luxury uppercase text-navy/60">Subtotal</span>
                <span className="font-serif text-2xl text-navy">{formatPrice(total)}</span>
              </div>
              <p className="mt-2 text-xs text-navy/55">
                Shipping details are collected on the next step.
              </p>
              <button
                type="button"
                onClick={handleContinue}
                className="mt-5 w-full bg-navy py-4 text-[0.7rem] tracking-luxury uppercase text-alabaster transition-all hover:bg-navy-soft"
              >
                Continue to Checkout
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
