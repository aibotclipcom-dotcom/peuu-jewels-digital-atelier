import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/filters")({
  component: AdminFilters,
});

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");

function AdminFilters() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-filters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("filter_definitions").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const [name, setName] = useState("");
  const [type, setType] = useState<"select" | "multiselect" | "range" | "bool">("select");
  const [options, setOptions] = useState("");
  const [sort, setSort] = useState("0");

  async function create() {
    if (!name.trim()) return;
    const opts = options.split(",").map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase.from("filter_definitions").insert({
      name: name.trim(), key: slugify(name), type, options: opts, sort_order: Number(sort) || 0,
    });
    if (error) return toast.error(error.message);
    setName(""); setOptions(""); setSort("0");
    toast.success("Filter added.");
    qc.invalidateQueries({ queryKey: ["admin-filters"] });
  }

  async function update(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from("filter_definitions").update(patch as never).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-filters"] });
  }

  async function remove(id: string) {
    if (!confirm("Delete filter?")) return;
    const { error } = await supabase.from("filter_definitions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-filters"] });
  }

  return (
    <div>
      <span className="text-[0.65rem] tracking-luxury uppercase text-rose">Discovery</span>
      <h1 className="mt-3 font-serif text-4xl text-navy">Shop Filters</h1>
      <p className="mt-2 max-w-2xl text-sm text-navy/60">Define arbitrary filters (metal, gemstone, occasion…). For select/multiselect, list options comma-separated.</p>

      <div className="mt-8 grid gap-3 border border-border/60 bg-card p-5 md:grid-cols-[1fr_140px_2fr_100px_auto]">
        <input className="border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy" placeholder="Name (e.g. Metal)" value={name} onChange={(e) => setName(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy">
          <option value="select">select</option>
          <option value="multiselect">multiselect</option>
          <option value="range">range</option>
          <option value="bool">bool</option>
        </select>
        <input className="border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy" placeholder="Options: Gold, Silver, Rose" value={options} onChange={(e) => setOptions(e.target.value)} />
        <input type="number" className="border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy" placeholder="Sort" value={sort} onChange={(e) => setSort(e.target.value)} />
        <button onClick={create} className="inline-flex items-center gap-2 bg-navy px-5 py-2 text-[0.6rem] tracking-luxury uppercase text-alabaster"><Plus className="h-3 w-3" /> Add</button>
      </div>

      <div className="mt-6 overflow-x-auto border border-border/60">
        <table className="min-w-full text-sm">
          <thead className="bg-cashmere/40 text-left text-[0.6rem] tracking-luxury uppercase text-navy/55">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Key</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Options</th><th className="px-4 py-3">Sort</th><th className="px-4 py-3">Enabled</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-navy/50">Loading…</td></tr>
              : data.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-navy/50">No filters yet.</td></tr>
              : data.map((f) => (
                <tr key={f.id} className="text-navy">
                  <td className="px-4 py-3"><input defaultValue={f.name} onBlur={(e) => e.target.value !== f.name && update(f.id, { name: e.target.value })} className="w-full bg-transparent outline-none" /></td>
                  <td className="px-4 py-3 font-mono text-xs">{f.key}</td>
                  <td className="px-4 py-3 text-xs">{f.type}</td>
                  <td className="px-4 py-3"><input defaultValue={Array.isArray(f.options) ? f.options.join(", ") : ""} onBlur={(e) => update(f.id, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} className="w-full bg-transparent text-xs outline-none" /></td>
                  <td className="px-4 py-3"><input type="number" defaultValue={f.sort_order} onBlur={(e) => update(f.id, { sort_order: Number(e.target.value) })} className="w-16 bg-transparent outline-none" /></td>
                  <td className="px-4 py-3"><input type="checkbox" defaultChecked={f.enabled} onChange={(e) => update(f.id, { enabled: e.target.checked })} /></td>
                  <td className="px-4 py-3 text-right"><button onClick={() => remove(f.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
