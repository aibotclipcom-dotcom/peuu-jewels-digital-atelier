import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  component: AdminCoupons,
});

const cell = "w-full bg-transparent text-sm text-navy outline-none";

function AdminCoupons() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("10");
  const [minOrder, setMinOrder] = useState("0");
  const [usageLimit, setUsageLimit] = useState("");
  const [firstOrder, setFirstOrder] = useState(true);
  const [singleUse, setSingleUse] = useState(true);
  const [expires, setExpires] = useState("");

  async function create() {
    if (!code.trim()) return toast.error("Enter a coupon code.");
    const amount = Number(value) || 0;
    if (amount <= 0) return toast.error("Enter a discount value greater than zero.");
    const { error } = await supabase.from("coupons").insert({
      code: code.trim().toUpperCase(),
      discount_type: type,
      percent_off: type === "percent" ? amount : 0,
      amount_off: type === "fixed" ? amount : 0,
      min_order_amount: Number(minOrder) || 0,
      usage_limit: usageLimit ? Number(usageLimit) : null,
      first_order_only: firstOrder,
      single_use: singleUse,
      active: true,
      expires_at: expires ? new Date(expires).toISOString() : null,
    });
    if (error) return toast.error(error.message);
    setCode("");
    setValue("10");
    setMinOrder("0");
    setUsageLimit("");
    setExpires("");
    toast.success("Coupon added.");
    void qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  }

  async function update(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from("coupons").update(patch as never).eq("id", id);
    if (error) return toast.error(error.message);
    void qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  }

  async function remove(id: string) {
    if (!confirm("Delete coupon?")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) return toast.error(error.message);
    void qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  }

  return (
    <div>
      <span className="text-[0.65rem] tracking-luxury uppercase text-rose">Marketing</span>
      <h1 className="mt-3 font-serif text-4xl text-navy">Coupons</h1>

      <div className="mt-8 grid gap-4 border border-border/60 bg-card p-5 md:grid-cols-4">
        <label className="block">
          <span className="text-[0.55rem] tracking-luxury uppercase text-navy/50">Code</span>
          <input
            className="w-full border-b border-border/70 bg-transparent pb-2 text-sm uppercase outline-none focus:border-navy"
            placeholder="WELCOME10"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-[0.55rem] tracking-luxury uppercase text-navy/50">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "percent" | "fixed")}
            className="w-full border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy"
          >
            <option value="percent">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[0.55rem] tracking-luxury uppercase text-navy/50">
            {type === "percent" ? "% off" : "₹ off"}
          </span>
          <input
            type="number"
            min={1}
            className="w-full border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-[0.55rem] tracking-luxury uppercase text-navy/50">Min order ₹</span>
          <input
            type="number"
            min={0}
            className="w-full border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy"
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-[0.55rem] tracking-luxury uppercase text-navy/50">Usage limit</span>
          <input
            type="number"
            min={1}
            placeholder="Unlimited"
            className="w-full border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-[0.55rem] tracking-luxury uppercase text-navy/50">Expires</span>
          <input
            type="datetime-local"
            className="w-full border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
          />
        </label>
        <label className="flex items-end gap-2 text-[0.6rem] tracking-luxury uppercase text-navy/60">
          <input type="checkbox" checked={firstOrder} onChange={(e) => setFirstOrder(e.target.checked)} />
          First order only
        </label>
        <label className="flex items-end gap-2 text-[0.6rem] tracking-luxury uppercase text-navy/60">
          <input type="checkbox" checked={singleUse} onChange={(e) => setSingleUse(e.target.checked)} />
          One use per customer
        </label>
        <button
          onClick={create}
          className="inline-flex items-center justify-center gap-2 bg-navy px-5 py-2 text-[0.6rem] tracking-luxury uppercase text-alabaster md:col-span-4"
        >
          <Plus className="h-3 w-3" /> Add coupon
        </button>
      </div>

      <div className="mt-6 overflow-x-auto border border-border/60">
        <table className="min-w-full text-sm">
          <thead className="bg-cashmere/40 text-left text-[0.6rem] tracking-luxury uppercase text-navy/55">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Min ₹</th>
              <th className="px-4 py-3">Used / Limit</th>
              <th className="px-4 py-3">First</th>
              <th className="px-4 py-3">1/customer</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Expires</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-navy/50">Loading…</td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-navy/50">No coupons.</td>
              </tr>
            ) : (
              data.map((c) => (
                <tr key={c.id} className="text-navy">
                  <td className="px-4 py-3 font-mono uppercase">{c.code}</td>
                  <td className="px-4 py-3">
                    <select
                      defaultValue={c.discount_type}
                      onChange={(e) => update(c.id, { discount_type: e.target.value })}
                      className={cell}
                    >
                      <option value="percent">%</option>
                      <option value="fixed">₹</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      defaultValue={c.discount_type === "fixed" ? c.amount_off : c.percent_off}
                      onBlur={(e) =>
                        update(
                          c.id,
                          c.discount_type === "fixed"
                            ? { amount_off: Number(e.target.value) || 0 }
                            : { percent_off: Number(e.target.value) || 0 },
                        )
                      }
                      className="w-16 bg-transparent outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      defaultValue={c.min_order_amount}
                      onBlur={(e) => update(c.id, { min_order_amount: Number(e.target.value) || 0 })}
                      className="w-20 bg-transparent outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="tabular-nums text-navy/70">{c.used_count} / </span>
                    <input
                      type="number"
                      placeholder="∞"
                      defaultValue={c.usage_limit ?? ""}
                      onBlur={(e) =>
                        update(c.id, { usage_limit: e.target.value ? Number(e.target.value) : null })
                      }
                      className="w-16 bg-transparent outline-none"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      defaultChecked={c.first_order_only}
                      onChange={(e) => update(c.id, { first_order_only: e.target.checked })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      defaultChecked={c.single_use}
                      onChange={(e) => update(c.id, { single_use: e.target.checked })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      defaultChecked={c.active}
                      onChange={(e) => update(c.id, { active: e.target.checked })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="datetime-local"
                      defaultValue={c.expires_at?.slice(0, 16) ?? ""}
                      onBlur={(e) =>
                        update(c.id, {
                          expires_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                        })
                      }
                      className="bg-transparent text-xs outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(c.id)} className="text-destructive" aria-label="Delete coupon">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
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
