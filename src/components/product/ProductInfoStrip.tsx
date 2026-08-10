import { Truck, Zap, CheckCircle2, XCircle } from "lucide-react";
import { resolveStockStatus, type ProductInfoStrip } from "@/lib/product-info";

export function ProductInfoStripRow({
  info,
  stock,
  className = "",
}: {
  info: ProductInfoStrip;
  stock?: number | null;
  className?: string;
}) {
  const stockStatus = resolveStockStatus(info, stock);
  const hasAny = info.delivery.enabled || info.sales.enabled || !!stockStatus;
  if (!hasAny) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {info.delivery.enabled && info.delivery.text.trim() && (
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-cashmere/40 px-3 py-1.5 text-[0.7rem] text-navy/75">
          <Truck className="h-3.5 w-3.5 shrink-0 text-navy/60" strokeWidth={1.5} />
          Estimated delivery {info.delivery.text}
        </span>
      )}

      {info.sales.enabled && info.sales.quantity > 0 && (
        <span className="inline-flex items-center gap-2 rounded-full border border-coral/50 bg-coral/5 px-3 py-1.5 text-[0.7rem] text-coral">
          <Zap className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
          {info.sales.quantity} quantity sold in last {info.sales.period}
        </span>
      )}

      {stockStatus &&
        (stockStatus.inStock ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-600/40 bg-emerald-600/5 px-3 py-1.5 text-[0.7rem] text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            {stockStatus.text}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-rose/50 bg-rose/5 px-3 py-1.5 text-[0.7rem] text-rose">
            <XCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
            {stockStatus.text}
          </span>
        ))}
    </div>
  );
}

