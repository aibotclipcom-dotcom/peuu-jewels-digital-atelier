import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { X, UploadCloud, ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function uploadOne(file: File): Promise<string> {
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${slugify(file.name) || "image"}`;
  const { error: upErr } = await supabase.storage.from("peuu-assets").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (upErr) throw upErr;
  const { data: signed, error: signErr } = await supabase.storage
    .from("peuu-assets")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (signErr) throw signErr;
  return signed.signedUrl;
}

export function AdminProductEditor({ productId }: { productId?: string }) {
  const isNew = !productId;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ["admin-product", productId],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", productId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Necklaces");
  const [price, setPrice] = useState("0");
  const [stock, setStock] = useState("0");
  const [description, setDescription] = useState("");
  const [materials, setMaterials] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [urlDraft, setUrlDraft] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replacingIdx, setReplacingIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setSlug(existing.slug);
      setSku(existing.sku);
      setCategory(existing.category);
      setPrice(String(existing.price));
      setStock(String(existing.stock));
      setDescription(existing.description ?? "");
      setMaterials((existing.materials ?? []).join(", "));
      setImages(existing.image_urls ?? []);
      setStatus(existing.status);
    }
  }, [existing]);

  useEffect(() => {
    if (isNew && name && !slug) setSlug(slugify(name));
  }, [name, isNew, slug]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        uploaded.push(await uploadOne(file));
      }
      setImages((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleReplace(files: FileList | null) {
    if (!files || files.length === 0 || replacingIdx === null) return;
    setUploading(true);
    try {
      const url = await uploadOne(files[0]);
      setImages((prev) => prev.map((src, i) => (i === replacingIdx ? url : src)));
      toast.success("Image replaced.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
      setReplacingIdx(null);
      if (replaceRef.current) replaceRef.current.value = "";
    }
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = images.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setImages(next);
  }

  function addUrl() {
    const v = urlDraft.trim();
    if (!v) return;
    setImages((prev) => [...prev, v]);
    setUrlDraft("");
  }

  async function handleSave() {
    if (!name.trim() || !sku.trim()) {
      toast.error("Name and SKU are required.");
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      slug: (slug || slugify(name)).trim(),
      sku: sku.trim(),
      category,
      price: Number(price) || 0,
      stock: Number(stock) || 0,
      description,
      materials: materials
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
      image_urls: images,
      status,
    };
    try {
      if (isNew) {
        const { error, data } = await supabase
          .from("products")
          .insert(payload)
          .select()
          .maybeSingle();
        if (error) throw error;
        toast.success("Piece created.");
        qc.invalidateQueries({ queryKey: ["admin-products"] });
        if (data?.id) {
          navigate({ to: "/admin/products/$id", params: { id: data.id } });
        } else {
          navigate({ to: "/admin/products" });
        }
      } else {
        const { error } = await supabase.from("products").update(payload).eq("id", productId);
        if (error) throw error;
        toast.success("Piece updated.");
        qc.invalidateQueries({ queryKey: ["admin-products"] });
        qc.invalidateQueries({ queryKey: ["admin-product", productId] });
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/admin/products"
        className="text-[0.65rem] tracking-luxury uppercase text-navy/55 hover:text-navy"
      >
        ← Inventory
      </Link>
      <h1 className="mt-4 font-serif text-4xl text-navy">
        {isNew ? "New Piece" : "Edit Piece"}
      </h1>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <Field label="Name" value={name} onChange={setName} />
        <Field label="SKU" value={sku} onChange={setSku} />
        <Field label="Slug (URL)" value={slug} onChange={setSlug} />
        <SelectField
          label="Category"
          value={category}
          onChange={setCategory}
          options={["Necklaces", "Rings", "Bracelets", "Earrings"]}
        />
        <Field label="Price (INR ₹)" type="number" value={price} onChange={setPrice} />
        <Field label="Stock" type="number" value={stock} onChange={setStock} />
        <Field
          label="Materials (comma-separated)"
          value={materials}
          onChange={setMaterials}
          className="md:col-span-2"
        />
        <TextareaField
          label="Description"
          value={description}
          onChange={setDescription}
          className="md:col-span-2"
        />

        <div className="md:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">
              Images {images.length > 0 && `· first image is the cover`}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((src, i) => (
              <div key={src + i} className="group relative aspect-[3/4] overflow-hidden bg-cashmere">
                <img src={src} alt="" className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-1 top-1 bg-navy/85 px-1.5 py-0.5 text-[0.5rem] tracking-luxury uppercase text-alabaster">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center bg-navy/80 text-alabaster"
                  aria-label="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-navy/70 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="grid h-6 w-6 place-items-center text-alabaster disabled:opacity-30"
                    aria-label="Move left"
                  >
                    <ArrowLeft className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplacingIdx(i);
                      replaceRef.current?.click();
                    }}
                    className="grid h-6 w-6 place-items-center text-alabaster"
                    aria-label="Replace"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === images.length - 1}
                    className="grid h-6 w-6 place-items-center text-alabaster disabled:opacity-30"
                    aria-label="Move right"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
            <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-border bg-cashmere/30 text-center text-[0.6rem] tracking-luxury uppercase text-navy/55 hover:bg-cashmere/60">
              <UploadCloud className="h-5 w-5" strokeWidth={1.4} />
              {uploading ? "Uploading…" : "Upload"}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
            </label>
          </div>

          <input
            ref={replaceRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleReplace(e.target.files)}
          />

          <div className="mt-4 flex items-end gap-3">
            <label className="block flex-1">
              <span className="block text-[0.6rem] tracking-luxury uppercase text-navy/55">
                Or paste image URL
              </span>
              <input
                type="text"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addUrl();
                  }
                }}
                placeholder="https://…"
                className="mt-2 w-full border-0 border-b border-border/70 bg-transparent pb-2 pt-1 text-navy outline-none transition-colors focus:border-navy"
              />
            </label>
            <button
              type="button"
              onClick={addUrl}
              disabled={!urlDraft.trim()}
              className="border border-navy px-4 py-2 text-[0.6rem] tracking-luxury uppercase text-navy disabled:opacity-40"
            >
              Add URL
            </button>
          </div>
        </div>

        <SelectField
          label="Visibility"
          value={status}
          onChange={(v) => setStatus(v as "draft" | "published")}
          options={["draft", "published"]}
          className="md:col-span-2"
        />
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !name || !sku}
          className="bg-navy px-10 py-4 text-[0.7rem] tracking-luxury uppercase text-alabaster transition-all hover:bg-navy-soft disabled:opacity-60"
        >
          {saving ? "Saving…" : isNew ? "Create Piece" : "Save Changes"}
        </button>
        <Link
          to="/admin/products"
          className="px-6 py-4 text-[0.7rem] tracking-luxury uppercase text-navy/65 hover:text-navy"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  className = "",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
  placeholder?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[0.6rem] tracking-luxury uppercase text-navy/55">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full border-0 border-b border-border/70 bg-transparent pb-2 pt-1 text-navy outline-none transition-colors focus:border-navy"
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[0.6rem] tracking-luxury uppercase text-navy/55">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="mt-2 w-full border border-border/70 bg-card p-3 text-sm text-navy outline-none transition-colors focus:border-navy"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[0.6rem] tracking-luxury uppercase text-navy/55">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border-0 border-b border-border/70 bg-transparent pb-2 pt-1 text-navy outline-none focus:border-navy"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}