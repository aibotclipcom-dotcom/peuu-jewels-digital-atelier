import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/global-faqs")({
  component: AdminGlobalFaqs,
});

function AdminGlobalFaqs() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-global-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("global_faqs").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [sort, setSort] = useState("0");

  async function create() {
    if (!q.trim() || !a.trim()) return;
    const { error } = await supabase.from("global_faqs").insert({ question: q.trim(), answer: a.trim(), sort_order: Number(sort) || 0 });
    if (error) return toast.error(error.message);
    setQ(""); setA(""); setSort("0");
    toast.success("FAQ added.");
    qc.invalidateQueries({ queryKey: ["admin-global-faqs"] });
  }

  async function update(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from("global_faqs").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-global-faqs"] });
  }

  async function remove(id: string) {
    if (!confirm("Delete FAQ?")) return;
    const { error } = await supabase.from("global_faqs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-global-faqs"] });
  }

  return (
    <div>
      <span className="text-[0.65rem] tracking-luxury uppercase text-rose">Content</span>
      <h1 className="mt-3 font-serif text-4xl text-navy">Global FAQs</h1>

      <div className="mt-8 grid gap-3 border border-border/60 bg-card p-5">
        <input className="border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy" placeholder="Question" value={q} onChange={(e) => setQ(e.target.value)} />
        <textarea className="border border-border/70 bg-transparent p-3 text-sm outline-none focus:border-navy" rows={3} placeholder="Answer" value={a} onChange={(e) => setA(e.target.value)} />
        <div className="flex gap-3">
          <input type="number" className="w-24 border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy" placeholder="Sort" value={sort} onChange={(e) => setSort(e.target.value)} />
          <button onClick={create} className="inline-flex items-center gap-2 bg-navy px-5 py-2 text-[0.6rem] tracking-luxury uppercase text-alabaster"><Plus className="h-3 w-3" /> Add</button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading ? <p className="text-navy/50">Loading…</p>
          : data.length === 0 ? <p className="text-navy/50">No FAQs yet.</p>
          : data.map((f) => (
            <div key={f.id} className="border border-border/60 bg-card p-5">
              <div className="flex items-start gap-3">
                <input defaultValue={f.question} onBlur={(e) => e.target.value !== f.question && update(f.id, { question: e.target.value })} className="flex-1 border-b border-border/40 bg-transparent pb-2 font-serif text-lg text-navy outline-none focus:border-navy" />
                <input type="number" defaultValue={f.sort_order} onBlur={(e) => update(f.id, { sort_order: Number(e.target.value) })} className="w-16 border-b border-border/40 bg-transparent pb-2 text-sm outline-none" />
                <button onClick={() => remove(f.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <textarea defaultValue={f.answer} onBlur={(e) => e.target.value !== f.answer && update(f.id, { answer: e.target.value })} rows={3} className="mt-3 w-full border border-border/40 bg-transparent p-3 text-sm text-navy/80 outline-none focus:border-navy" />
            </div>
          ))}
      </div>
    </div>
  );
}
