import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, UploadCloud, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategories,
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function uploadImage(file: File): Promise<string> {
  const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${
    slugify(file.name) || "asset"
  }`;
  const { error: upErr } = await supabase.storage
    .from("peuu-assets")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;
  const { data: signed, error: signErr } = await supabase.storage
    .from("peuu-assets")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (signErr) throw signErr;
  return signed.signedUrl;
}

function CategoryImageCell({
  url,
  onChange,
}: {
  url: string | null;
  onChange: (v: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <div className="h-12 w-12 shrink-0 overflow-hidden border border-border/60 bg-alabaster">
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <label className="cursor-pointer text-navy/60 hover:text-navy" title="Upload image">
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UploadCloud className="h-4 w-4" />
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setBusy(true);
            try {
              onChange(await uploadImage(file));
            } catch (err) {
              toast.error((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {url && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-[0.6rem] uppercase tracking-luxury text-destructive"
        >
          Clear
        </button>
      )}
    </div>
  );
}

function AdminCategories() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order").order("name");
      if (error) throw error;
      return data;
    },
  });

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sort, setSort] = useState("0");
  const [parentId, setParentId] = useState<string>("");

  async function create() {
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").insert({
      name: name.trim(),
      slug: (slug.trim() || slugify(name)),
      sort_order: Number(sort) || 0,
      parent_id: parentId || null,
    });
    if (error) return toast.error(error.message);
    setName(""); setSlug(""); setSort("0"); setParentId("");
    toast.success("Category added.");
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
  }

  async function update(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from("categories").update(patch as never).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
  }

  async function remove(id: string) {
    if (!confirm("Delete category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted.");
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
  }

  return (
    <div>
      <span className="text-[0.65rem] tracking-luxury uppercase text-rose">Taxonomy</span>
      <h1 className="mt-3 font-serif text-4xl text-navy">Categories</h1>

      <div className="mt-8 grid gap-3 border border-border/60 bg-card p-5 md:grid-cols-[1.2fr_1fr_120px_1fr_auto]">
        <input className="border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy" placeholder="slug (auto)" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input type="number" className="border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy" placeholder="Sort" value={sort} onChange={(e) => setSort(e.target.value)} />
        <select className="border-b border-border/70 bg-transparent pb-2 text-sm outline-none focus:border-navy" value={parentId} onChange={(e) => setParentId(e.target.value)}>
          <option value="">— No parent —</option>
          {data.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={create} className="inline-flex items-center gap-2 bg-navy px-5 py-2 text-[0.6rem] tracking-luxury uppercase text-alabaster">
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>

      <div className="mt-6 overflow-x-auto border border-border/60">
        <table className="min-w-full text-sm">
          <thead className="bg-cashmere/40 text-left text-[0.6rem] tracking-luxury uppercase text-navy/55">
            <tr>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Parent</th>
              <th className="px-4 py-3">Sort</th>
              <th className="px-4 py-3">Visible</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-navy/50">Loading…</td></tr>
              : data.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-navy/50">No categories.</td></tr>
              : data.map((c) => (
                <tr key={c.id} className="text-navy">
                  <td className="px-4 py-3">
                    <CategoryImageCell
                      url={c.image_url}
                      onChange={(v) => update(c.id, { image_url: v })}
                    />
                  </td>
                  <td className="px-4 py-3"><input defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && update(c.id, { name: e.target.value })} className="w-full bg-transparent outline-none" /></td>
                  <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
                  <td className="px-4 py-3">
                    <select defaultValue={c.parent_id ?? ""} onChange={(e) => update(c.id, { parent_id: e.target.value || null })} className="bg-transparent text-xs outline-none">
                      <option value="">—</option>
                      {data.filter((x) => x.id !== c.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3"><input type="number" defaultValue={c.sort_order} onBlur={(e) => update(c.id, { sort_order: Number(e.target.value) })} className="w-16 bg-transparent outline-none" /></td>
                  <td className="px-4 py-3"><input type="checkbox" defaultChecked={c.is_visible} onChange={(e) => update(c.id, { is_visible: e.target.checked })} /></td>
                  <td className="px-4 py-3 text-right"><button onClick={() => remove(c.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
