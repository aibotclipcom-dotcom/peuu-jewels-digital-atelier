import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/products/")({
  component: AdminProductsIndex,
});

function AdminProductsIndex() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function handleDelete(id: string) {
    if (!confirm("Remove this piece from the inventory?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Piece removed.");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }

  async function toggleStatus(id: string, status: "draft" | "published") {
    const next = status === "published" ? "draft" : "published";
    const { error } = await supabase.from("products").update({ status: next }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(next === "published" ? "Now published." : "Moved to drafts.");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[0.65rem] tracking-luxury uppercase text-rose">Inventory</span>
          <h1 className="mt-3 font-serif text-4xl text-navy">All Pieces</h1>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 bg-navy px-6 py-3 text-[0.65rem] tracking-luxury uppercase text-alabaster hover:bg-navy-soft"
        >
          <Plus className="h-3.5 w-3.5" /> New Piece
        </Link>
      </div>

      <div className="mt-10 overflow-x-auto border border-border/60">
        <table className="min-w-full text-sm">
          <thead className="bg-cashmere/40 text-left text-[0.6rem] tracking-luxury uppercase text-navy/55">
            <tr>
              <th className="px-5 py-4">Piece</th>
              <th className="px-5 py-4">SKU</th>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4 text-right">Price</th>
              <th className="px-5 py-4 text-right">Stock</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-navy/50">Loading inventory…</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-navy/50">No pieces yet.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="text-navy">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-10 shrink-0 overflow-hidden bg-cashmere">
                        {p.image_urls?.[0] && <img src={p.image_urls[0]} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="font-serif">{p.name}</div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-navy/60">{p.sku}</td>
                  <td className="px-5 py-4 text-xs">{p.category}</td>
                  <td className="px-5 py-4 text-right tabular-nums">{formatPrice(Number(p.price))}</td>
                  <td className="px-5 py-4 text-right tabular-nums">{p.stock}</td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => toggleStatus(p.id, p.status)}
                      className={`px-2 py-1 text-[0.55rem] tracking-luxury uppercase ${
                        p.status === "published"
                          ? "bg-navy text-alabaster"
                          : "border border-border text-navy/65"
                      }`}
                    >
                      {p.status}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        to="/admin/products/$id"
                        params={{ id: p.id }}
                        className="grid h-8 w-8 place-items-center border border-border text-navy hover:bg-cashmere"
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="grid h-8 w-8 place-items-center border border-border text-destructive hover:bg-destructive/10"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}