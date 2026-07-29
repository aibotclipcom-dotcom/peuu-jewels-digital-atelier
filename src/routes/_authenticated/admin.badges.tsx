import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/badges")({
  component: AdminBadges,
});

function AdminBadges() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-badges"],
    queryFn: async () => {
      const { data, error } = await supabase.from("badges").select("*").order("priority", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [label, setLabel] = useState("");
  const [bg, setBg] = useState("#1a2340");
  const [fg, setFg] = useState("#ffffff");
  const [priority, setPriority] = useState("0");

  async function create() {
    if (!label.trim()) return;
    const { error } = await supabase.from("badges").insert({
      label: label.trim(), bg_color: bg, text_color: fg, border_color: bg, priority: Number(priority) || 0,
    });
    if (error) return toast.error(error.message);
    setLabel(""); setPriority("0");
    toast.success("Badge added.");
    qc.invalidateQueries({ queryKey: ["admin-badges"] });
  }

  async function update(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from("badges").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-badges"] });
  }

  async function remove(id: string) {
    if (!confirm("Delete badge?")) return;
    const { error } = await supabase.from("badges").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-badges"] });
  }

  return (
    <div>
      <span className="text-[0.65rem] tracking-luxury uppercase text-rose">Merchandising</span>
      <h1 className="mt-3 font-serif text-4xl text-navy">Badges</h1>

      <div className="mt-8 grid gap-3 border border-border/60 bg-card p-5 md:grid-cols-[1.5fr_100px_100px_100px_auto]">
        <input className="border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy" placeholder="Label (e.g. New, Bestseller)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <label className="flex items-center gap-2 text-[0.6rem] tracking-luxury uppercase text-navy/55">BG<input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-7 w-10 border-0" /></label>
        <label className="flex items-center gap-2 text-[0.6rem] tracking-luxury uppercase text-navy/55">TXT<input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-7 w-10 border-0" /></label>
        <input type="number" className="border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy" placeholder="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} />
        <button onClick={create} className="inline-flex items-center gap-2 bg-navy px-5 py-2 text-[0.6rem] tracking-luxury uppercase text-alabaster"><Plus className="h-3 w-3" /> Add</button>
      </div>

      <div className="mt-6 overflow-x-auto border border-border/60">
        <table className="min-w-full text-sm">
          <thead className="bg-cashmere/40 text-left text-[0.6rem] tracking-luxury uppercase text-navy/55">
            <tr><th className="px-4 py-3">Preview</th><th className="px-4 py-3">Label</th><th className="px-4 py-3">BG</th><th className="px-4 py-3">Text</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Start</th><th className="px-4 py-3">End</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? <tr><td colSpan={8} className="px-4 py-8 text-center text-navy/50">Loading…</td></tr>
              : data.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-navy/50">No badges.</td></tr>
              : data.map((b) => (
                <tr key={b.id} className="text-navy">
                  <td className="px-4 py-3"><span style={{ background: b.bg_color, color: b.text_color, borderColor: b.border_color }} className="inline-block border px-2 py-1 text-[0.55rem] tracking-luxury uppercase">{b.label}</span></td>
                  <td className="px-4 py-3"><input defaultValue={b.label} onBlur={(e) => e.target.value !== b.label && update(b.id, { label: e.target.value })} className="w-full bg-transparent outline-none" /></td>
                  <td className="px-4 py-3"><input type="color" defaultValue={b.bg_color} onBlur={(e) => update(b.id, { bg_color: e.target.value, border_color: e.target.value })} className="h-7 w-10 border-0" /></td>
                  <td className="px-4 py-3"><input type="color" defaultValue={b.text_color} onBlur={(e) => update(b.id, { text_color: e.target.value })} className="h-7 w-10 border-0" /></td>
                  <td className="px-4 py-3"><input type="number" defaultValue={b.priority} onBlur={(e) => update(b.id, { priority: Number(e.target.value) })} className="w-16 bg-transparent outline-none" /></td>
                  <td className="px-4 py-3"><input type="datetime-local" defaultValue={b.starts_at?.slice(0,16) ?? ""} onBlur={(e) => update(b.id, { starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} className="bg-transparent text-xs outline-none" /></td>
                  <td className="px-4 py-3"><input type="datetime-local" defaultValue={b.ends_at?.slice(0,16) ?? ""} onBlur={(e) => update(b.id, { ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} className="bg-transparent text-xs outline-none" /></td>
                  <td className="px-4 py-3 text-right"><button onClick={() => remove(b.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
