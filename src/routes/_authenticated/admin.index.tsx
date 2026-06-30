import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, orders, messages] = await Promise.all([
        supabase.from("products").select("id, status, price, stock"),
        supabase.from("orders").select("id, total, status"),
        supabase.from("contact_messages").select("id"),
      ]);
      const productList = products.data ?? [];
      const orderList = orders.data ?? [];
      return {
        totalProducts: productList.length,
        published: productList.filter((p) => p.status === "published").length,
        drafts: productList.filter((p) => p.status === "draft").length,
        orders: orderList.length,
        revenue: orderList.reduce((s, o) => s + Number(o.total), 0),
        messages: messages.data?.length ?? 0,
      };
    },
  });

  const tiles = [
    { label: "Published pieces", value: stats?.published ?? 0 },
    { label: "Drafts", value: stats?.drafts ?? 0 },
    { label: "Orders", value: stats?.orders ?? 0 },
    { label: "Concierge notes", value: stats?.messages ?? 0 },
  ];

  return (
    <div>
      <span className="text-[0.65rem] tracking-luxury uppercase text-rose">Overview</span>
      <h1 className="mt-3 font-serif text-4xl text-navy">Atelier Console</h1>
      <p className="mt-3 max-w-xl text-sm text-navy/65">
        Everything the Maison oversees, in one quiet place.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="border border-border/60 bg-card p-6">
            <div className="text-[0.6rem] tracking-luxury uppercase text-navy/55">{t.label}</div>
            <div className="mt-3 font-serif text-4xl text-navy">{t.value}</div>
          </div>
        ))}
        <div className="border border-border/60 bg-navy p-6 text-alabaster sm:col-span-2 lg:col-span-4">
          <div className="text-[0.6rem] tracking-luxury uppercase text-gold-soft">
            Gross order value
          </div>
          <div className="mt-3 font-serif text-5xl">{formatPrice(stats?.revenue ?? 0)}</div>
        </div>
      </div>
    </div>
  );
}
