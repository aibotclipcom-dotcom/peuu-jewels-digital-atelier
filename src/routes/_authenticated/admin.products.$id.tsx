import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { X, UploadCloud } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  component: ProductEditor,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function ProductEditor() {
  const { id } = useParams({ from: "/_authenticated/admin/products/$id" });
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ["admin-product", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
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
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const path = `products/${Date.now()}-${slugify(file.name) || "image"}`;
        const { error: upErr } = await supabase.storage.from("peuu-assets").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (upErr) throw upErr;
        const { data: signed, error: signErr } = await supabase.storage
          .from("peuu-assets")
          .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        if (signErr) throw signErr;
        uploaded.push(signed.signedUrl);
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

  async function handleSave() {
    setSaving(true);
    const payload = {
      name,
      slug: slug || slugify(name),
      sku,
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
        const { error, data } = await supabase.from("products").insert(payload).select().single();
        if (error) throw error;
        toast.success("Piece created.");
        qc.invalidateQueries({ queryKey: ["admin-products"] });
        navigate({ to: "/admin/products/$id", params: { id: data.id } });
      } else {
        const { error } = await supabase.from("products").update(payload).eq("id", id);
        if (error) throw error;
        toast.success("Piece updated.");
        qc.invalidateQueries({ queryKey: ["admin-products"] });
        qc.invalidateQueries({ queryKey: ["admin-product", id] });
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
        <Input label="Name" value={name} onChange={setName} />
        <Input label="SKU" value={sku} onChange={setSku} />
        <Input label="Slug (URL)" value={slug} onChange={setSlug} />
        <SelectField
          label="Category"
          value={category}
          onChange={setCategory}
          options={["Necklaces", "Rings", "Bracelets", "Earrings"]}
        />
        <Input label="Price (USD)" type="number" value={price} onChange={setPrice} />
        <Input label="Stock" type="number" value={stock} onChange={setStock} />
        <Input
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
          <div className="mb-2 text-[0.6rem] tracking-luxury uppercase text-navy/55">Images</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((src, i) => (
              <div key={src + i} className="relative aspect-[3/4] overflow-hidden bg-cashmere">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center bg-navy/80 text-alabaster"
                  aria-label="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
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
          <Input
            label="Or paste image URL"
            value=""
            onChange={(v) => {
              if (v.trim()) setImages([...images, v.trim()]);
            }}
            className="mt-4"
            placeholder="https://…"
          />
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

function Input({
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
