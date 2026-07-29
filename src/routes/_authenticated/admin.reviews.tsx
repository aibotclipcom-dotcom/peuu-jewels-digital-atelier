import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Trash2, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: AdminReviews,
});

function AdminReviews() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const [reviewsRes, productsRes] = await Promise.all([
        supabase.from("product_reviews").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("id, name"),
      ]);
      if (reviewsRes.error) throw reviewsRes.error;
      if (productsRes.error) throw productsRes.error;
      const nameById = new Map((productsRes.data ?? []).map((p) => [p.id, p.name]));
      return (reviewsRes.data ?? []).map((r) => ({ ...r, productName: nameById.get(r.product_id) ?? "Unknown piece" }));
    },
  });

  async function approve(id: string, approved: boolean) {
    const { error } = await supabase.from("product_reviews").update({ approved }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(approved ? "Approved." : "Un-approved.");
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  }

  async function toggleVerified(id: string, verified: boolean) {
    const { error } = await supabase.from("product_reviews").update({ verified }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  }

  async function remove(id: string) {
    if (!confirm("Delete review?")) return;
    const { error } = await supabase.from("product_reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  }

  return (
    <div>
      <span className="text-[0.65rem] tracking-luxury uppercase text-rose">Moderation</span>
      <h1 className="mt-3 font-serif text-4xl text-navy">Reviews</h1>

      <div className="mt-8 space-y-3">
        {isLoading ? <p className="text-navy/50">Loading…</p>
          : data.length === 0 ? <p className="text-navy/50">No reviews yet.</p>
          : data.map((r) => (
            <div key={r.id} className={`border p-5 ${r.approved ? "border-border/60 bg-card" : "border-rose/40 bg-rose/5"}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-gold text-gold" : "text-navy/20"}`} />
                      ))}
                    </div>
                    <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">
                      {r.productName}
                    </span>
                  </div>
                  {r.title && <h3 className="mt-2 font-serif text-lg text-navy">{r.title}</h3>}
                  {r.body && <p className="mt-1 text-sm text-navy/70">{r.body}</p>}
                  <p className="mt-2 text-[0.6rem] uppercase tracking-luxury text-navy/40">
                    {new Date(r.created_at).toLocaleString()} · user {r.user_id.slice(0, 8)}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-[0.6rem] tracking-luxury uppercase text-navy/60">
                    <input type="checkbox" checked={r.verified} onChange={(e) => toggleVerified(r.id, e.target.checked)} /> Verified buyer
                  </label>
                  {r.approved ? (
                    <button onClick={() => approve(r.id, false)} className="border border-navy/30 px-3 py-1.5 text-[0.6rem] tracking-luxury uppercase text-navy">Un-approve</button>
                  ) : (
                    <button onClick={() => approve(r.id, true)} className="inline-flex items-center gap-1 bg-navy px-3 py-1.5 text-[0.6rem] tracking-luxury uppercase text-alabaster"><Check className="h-3 w-3" /> Approve</button>
                  )}
                  <button onClick={() => remove(r.id)} className="inline-flex items-center gap-1 text-destructive text-[0.6rem] tracking-luxury uppercase"><Trash2 className="h-3 w-3" /> Delete</button>
                </div>
              </div>
              {r.image_urls?.length > 0 && (
                <div className="mt-4 flex gap-2">
                  {r.image_urls.map((u: string) => (
                    <img key={u} src={u} alt="" className="h-16 w-16 object-cover" />
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
