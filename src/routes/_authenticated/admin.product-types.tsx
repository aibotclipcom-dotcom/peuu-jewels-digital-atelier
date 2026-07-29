import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/product-types")({
  component: AdminProductTypes,
});

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function AdminProductTypes() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-product-types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_types").select("*").order("sort_order").order("name");
      if (error) throw error;
      return data;
    },
  });

  const [name, setName] = useState("");
  const [sort, setSort] = useState("0");

  async function create() {
    if (!name.trim()) return;
    const { error } = await supabase.from("product_types").insert({ name: name.trim(), slug: slugify(name), sort_order: Number(sort) || 0 });
    if (error) return toast.error(error.message);
    setName(""); setSort("0");
    toast.success("Type added.");
    qc.invalidateQueries({ queryKey: ["admin-product-types"] });
  }

  async function update(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from("product_types").update(patch as never).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-product-types"] });
  }

  async function remove(id: string) {
    if (!confirm("Delete this type?")) return;
    const { error } = await supabase.from("product_types").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-product-types"] });
  }

  return (
    <div>
      <span className="text-[0.65rem] tracking-luxury uppercase text-rose">Taxonomy</span>
      <h1 className="mt-3 font-serif text-4xl text-navy">Product Types</h1>

      <div className="mt-8 grid gap-3 border border-border/60 bg-card p-5 md:grid-cols-[1fr_120px_auto]">
        <input className="border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy" placeholder="Name (e.g. Statement, Everyday)" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="number" className="border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy" placeholder="Sort" value={sort} onChange={(e) => setSort(e.target.value)} />
        <button onClick={create} className="inline-flex items-center gap-2 bg-navy px-5 py-2 text-[0.6rem] tracking-luxury uppercase text-alabaster"><Plus className="h-3 w-3" /> Add</button>
      </div>

      <div className="mt-6 overflow-x-auto border border-border/60">
        <table className="min-w-full text-sm">
          <thead className="bg-cashmere/40 text-left text-[0.6rem] tracking-luxury uppercase text-navy/55">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Sort</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? <tr><td colSpan={4} className="px-4 py-8 text-center text-navy/50">Loading…</td></tr>
              : data.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-navy/50">No types yet.</td></tr>
              : data.map((t) => (
                <tr key={t.id} className="text-navy">
                  <td className="px-4 py-3"><input defaultValue={t.name} onBlur={(e) => e.target.value !== t.name && update(t.id, { name: e.target.value })} className="w-full bg-transparent outline-none" /></td>
                  <td className="px-4 py-3 font-mono text-xs">{t.slug}</td>
                  <td className="px-4 py-3"><input type="number" defaultValue={t.sort_order} onBlur={(e) => update(t.id, { sort_order: Number(e.target.value) })} className="w-16 bg-transparent outline-none" /></td>
                  <td className="px-4 py-3 text-right"><button onClick={() => remove(t.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
