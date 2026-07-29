import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  component: AdminCoupons,
});

function AdminCoupons() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("10");
  const [firstOrder, setFirstOrder] = useState(true);
  const [expires, setExpires] = useState("");

  async function create() {
    if (!code.trim()) return;
    const { error } = await supabase.from("coupons").insert({
      code: code.trim().toUpperCase(),
      percent_off: Number(percent) || 0,
      first_order_only: firstOrder,
      active: true,
      expires_at: expires ? new Date(expires).toISOString() : null,
    });
    if (error) return toast.error(error.message);
    setCode(""); setPercent("10"); setExpires("");
    toast.success("Coupon added.");
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  }

  async function update(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from("coupons").update(patch as never).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  }

  async function remove(id: string) {
    if (!confirm("Delete coupon?")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  }

  return (
    <div>
      <span className="text-[0.65rem] tracking-luxury uppercase text-rose">Marketing</span>
      <h1 className="mt-3 font-serif text-4xl text-navy">Coupons</h1>

      <div className="mt-8 grid gap-3 border border-border/60 bg-card p-5 md:grid-cols-[1fr_100px_140px_1fr_auto]">
        <input className="border-b border-border/70 bg-transparent pb-2 text-sm uppercase outline-none focus:border-navy" placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value)} />
        <input type="number" min={1} max={100} className="border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy" placeholder="% off" value={percent} onChange={(e) => setPercent(e.target.value)} />
        <label className="flex items-center gap-2 text-[0.6rem] tracking-luxury uppercase text-navy/60"><input type="checkbox" checked={firstOrder} onChange={(e) => setFirstOrder(e.target.checked)} /> First order only</label>
        <input type="datetime-local" className="border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy" value={expires} onChange={(e) => setExpires(e.target.value)} />
        <button onClick={create} className="inline-flex items-center gap-2 bg-navy px-5 py-2 text-[0.6rem] tracking-luxury uppercase text-alabaster"><Plus className="h-3 w-3" /> Add</button>
      </div>

      <div className="mt-6 overflow-x-auto border border-border/60">
        <table className="min-w-full text-sm">
          <thead className="bg-cashmere/40 text-left text-[0.6rem] tracking-luxury uppercase text-navy/55">
            <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">% Off</th><th className="px-4 py-3">First-order</th><th className="px-4 py-3">Active</th><th className="px-4 py-3">Expires</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-navy/50">Loading…</td></tr>
              : data.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-navy/50">No coupons.</td></tr>
              : data.map((c) => (
                <tr key={c.id} className="text-navy">
                  <td className="px-4 py-3 font-mono uppercase">{c.code}</td>
                  <td className="px-4 py-3"><input type="number" defaultValue={c.percent_off} onBlur={(e) => update(c.id, { percent_off: Number(e.target.value) })} className="w-16 bg-transparent outline-none" /></td>
                  <td className="px-4 py-3"><input type="checkbox" defaultChecked={c.first_order_only} onChange={(e) => update(c.id, { first_order_only: e.target.checked })} /></td>
                  <td className="px-4 py-3"><input type="checkbox" defaultChecked={c.active} onChange={(e) => update(c.id, { active: e.target.checked })} /></td>
                  <td className="px-4 py-3"><input type="datetime-local" defaultValue={c.expires_at?.slice(0,16) ?? ""} onBlur={(e) => update(c.id, { expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} className="bg-transparent text-xs outline-none" /></td>
                  <td className="px-4 py-3 text-right"><button onClick={() => remove(c.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
