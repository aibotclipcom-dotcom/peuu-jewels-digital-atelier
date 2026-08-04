import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

function AdminOrders() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function updateStatus(id: string, status: (typeof STATUSES)[number]) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Order updated.");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  return (
    <div>
      <span className="text-[0.65rem] tracking-luxury uppercase text-rose">Orders</span>
      <h1 className="mt-3 font-serif text-4xl text-navy">Client Requests</h1>

      <div className="mt-10 space-y-5">
        {isLoading ? (
          <p className="text-sm text-navy/55">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-navy/55">No orders yet.</p>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="border border-border/60 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-[0.6rem] tracking-luxury uppercase text-navy/55">
                    {new Date(o.created_at).toLocaleString()}
                  </div>
                  <div className="mt-1 font-mono text-xs text-navy/55">#{o.id.slice(0, 8)}</div>
                </div>
                <div className="text-right">
                  <div className="font-serif text-2xl text-navy">{formatPrice(Number(o.total))}</div>
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value as (typeof STATUSES)[number])}
                    className="mt-2 border border-border bg-card px-2 py-1 text-[0.6rem] tracking-luxury uppercase text-navy"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <ul className="mt-5 divide-y divide-border/40 border-t border-border/40 pt-3 text-sm text-navy/75">
                {o.order_items?.map((it) => (
                  <li key={it.id} className="flex justify-between py-2">
                    <span>{it.product_name} × {it.quantity}</span>
                    <span className="tabular-nums">{formatPrice(Number(it.unit_price) * it.quantity)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 grid gap-6 border-t border-border/40 pt-4 sm:grid-cols-3">
                <dl className="space-y-1 text-xs text-navy/70">
                  <div className="text-[0.55rem] tracking-luxury uppercase text-navy/45">Totals</div>
                  <Row label="Subtotal" value={o.subtotal} />
                  {Number(o.discount_total) > 0 && (
                    <Row label="Discount" value={-Number(o.discount_total)} />
                  )}
                  <Row label="Shipping" value={o.shipping_total} />
                  {Number(o.tax_total) > 0 && <Row label="Tax" value={o.tax_total} />}
                  <Row label="Total" value={o.total} strong />
                  {o.coupon_code && (
                    <div className="pt-1 font-mono text-[0.65rem] uppercase text-rose">
                      {o.coupon_code}
                    </div>
                  )}
                </dl>
                <Address title="Shipping address" value={o.shipping_address} />
                <Address title="Billing address" value={o.billing_address ?? o.shipping_address} />
              </div>
              {o.notes && (
                <p className="mt-4 border-t border-border/40 pt-3 text-xs italic text-navy/60">
                  “{o.notes}”
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
