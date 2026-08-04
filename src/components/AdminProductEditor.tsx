import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { X, UploadCloud, ArrowLeft, ArrowRight, RefreshCw, Plus, Trash2 } from "lucide-react";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function uploadOne(file: File, folder = "products"): Promise<string> {
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${slugify(file.name) || "asset"}`;
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

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(v: string) {
  return v ? new Date(v).toISOString() : null;
}

type Faq = { id?: string; question: string; answer: string };
type Attr = { key: string; value: string };

export function AdminProductEditor({ productId }: { productId?: string }) {
  const isNew = !productId;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ["admin-product", productId],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, parent_id")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: productTypes = [] } = useQuery({
    queryKey: ["admin-types-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_types")
        .select("id, name")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allBadges = [] } = useQuery({
    queryKey: ["admin-badges-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("id, label, bg_color, text_color, border_color")
        .order("priority", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: filterDefs = [] } = useQuery({
    queryKey: ["admin-filters-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filter_definitions")
        .select("id, name, key, options")
        .eq("enabled", true)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: existingBadgeLinks } = useQuery({
    queryKey: ["admin-product-badges", productId],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_badges")
        .select("badge_id")
        .eq("product_id", productId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: existingAttrs } = useQuery({
    queryKey: ["admin-product-attrs", productId],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_attributes")
        .select("filter_key, value")
        .eq("product_id", productId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: existingFaqs } = useQuery({
    queryKey: ["admin-product-faqs", productId],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_faqs")
        .select("id, question, answer")
        .eq("product_id", productId!)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productTypeId, setProductTypeId] = useState("");
  const [price, setPrice] = useState("0");
  const [compareAt, setCompareAt] = useState("");
  const [saleStart, setSaleStart] = useState("");
  const [saleEnd, setSaleEnd] = useState("");
  const [stock, setStock] = useState("0");
  const [description, setDescription] = useState("");
  const [care, setCare] = useState("");
  const [shippingInfo, setShippingInfo] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [materials, setMaterials] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [videoDraft, setVideoDraft] = useState("");
  const [specRows, setSpecRows] = useState<Attr[]>([]);
  const [attrs, setAttrs] = useState<Attr[]>([]);
  const [badgeIds, setBadgeIds] = useState<string[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [urlDraft, setUrlDraft] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [bestSellerSort, setBestSellerSort] = useState("0");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replacingIdx, setReplacingIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setSlug(existing.slug);
    setSku(existing.sku);
    setCategory(existing.category ?? "");
    setCategoryId(existing.category_id ?? "");
    setProductTypeId(existing.product_type_id ?? "");
    setPrice(String(existing.price));
    setCompareAt(existing.compare_at_price != null ? String(existing.compare_at_price) : "");
    setSaleStart(toLocalInput(existing.sale_starts_at));
    setSaleEnd(toLocalInput(existing.sale_ends_at));
    setStock(String(existing.stock));
    setDescription(existing.description ?? "");
    setCare(existing.care ?? "");
    setShippingInfo(existing.shipping_info ?? "");
    setSeoTitle(existing.seo_title ?? "");
    setSeoDescription(existing.seo_description ?? "");
    setOgImage(existing.og_image ?? "");
    setMaterials((existing.materials ?? []).join(", "));
    setImages(existing.image_urls ?? []);
    setVideos(existing.video_urls ?? []);
    setSpecRows(
      Object.entries((existing.spec ?? {}) as Record<string, unknown>).map(([key, value]) => ({
        key,
        value: String(value ?? ""),
      })),
    );
    setStatus(existing.status);
    setIsBestSeller(existing.is_best_seller ?? false);
    setBestSellerSort(String(existing.best_seller_sort ?? 0));
  }, [existing]);

  useEffect(() => {
    if (existingBadgeLinks) setBadgeIds(existingBadgeLinks.map((b) => b.badge_id));
  }, [existingBadgeLinks]);

  useEffect(() => {
    if (existingAttrs)
      setAttrs(existingAttrs.map((a) => ({ key: a.filter_key, value: a.value })));
  }, [existingAttrs]);

  useEffect(() => {
    if (existingFaqs) setFaqs(existingFaqs);
  }, [existingFaqs]);

  useEffect(() => {
    if (isNew && name && !slug) setSlug(slugify(name));
  }, [name, isNew, slug]);

  // Keep the legacy text category in sync with the selected category record.
  useEffect(() => {
    const c = categories.find((x) => x.id === categoryId);
    if (c) setCategory(c.name);
  }, [categoryId, categories]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) uploaded.push(await uploadOne(file));
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

  async function syncRelations(id: string) {
    // Badges
    await supabase.from("product_badges").delete().eq("product_id", id);
    if (badgeIds.length > 0) {
      await supabase
        .from("product_badges")
        .insert(badgeIds.map((badge_id) => ({ product_id: id, badge_id })));
    }

    // Attributes
    await supabase.from("product_attributes").delete().eq("product_id", id);
    const cleanAttrs = attrs.filter((a) => a.key.trim() && a.value.trim());
    if (cleanAttrs.length > 0) {
      await supabase.from("product_attributes").insert(
        cleanAttrs.map((a) => ({
          product_id: id,
          filter_key: a.key.trim(),
          value: a.value.trim(),
        })),
      );
    }

    // FAQs
    await supabase.from("product_faqs").delete().eq("product_id", id);
    const cleanFaqs = faqs.filter((f) => f.question.trim() && f.answer.trim());
    if (cleanFaqs.length > 0) {
      await supabase.from("product_faqs").insert(
        cleanFaqs.map((f, i) => ({
          product_id: id,
          question: f.question.trim(),
          answer: f.answer.trim(),
          sort_order: i,
        })),
      );
    }
  }

  async function handleSave() {
    if (!name.trim() || !sku.trim()) {
      toast.error("Name and SKU are required.");
      return;
    }
    setSaving(true);
    const spec: Record<string, string> = {};
    for (const row of specRows) {
      if (row.key.trim()) spec[row.key.trim()] = row.value;
    }

    const payload = {
      name: name.trim(),
      slug: (slug || slugify(name)).trim(),
      sku: sku.trim(),
      category: category || "Uncategorised",
      category_id: categoryId || null,
      product_type_id: productTypeId || null,
      price: Number(price) || 0,
      compare_at_price: compareAt.trim() ? Number(compareAt) : null,
      sale_starts_at: fromLocalInput(saleStart),
      sale_ends_at: fromLocalInput(saleEnd),
      stock: Number(stock) || 0,
      description,
      care: care || null,
      shipping_info: shippingInfo || null,
      seo_title: seoTitle || null,
      seo_description: seoDescription || null,
      og_image: ogImage || null,
      spec,
      materials: materials
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
      image_urls: images,
      video_urls: videos,
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
        if (data?.id) await syncRelations(data.id);
        toast.success("Piece created.");
        qc.invalidateQueries({ queryKey: ["admin-products"] });
        if (data?.id) navigate({ to: "/admin/products/$id", params: { id: data.id } });
        else navigate({ to: "/admin/products" });
      } else {
        const { error } = await supabase.from("products").update(payload).eq("id", productId!);
        if (error) throw error;
        await syncRelations(productId!);
        toast.success("Piece updated.");
        qc.invalidateQueries({ queryKey: ["admin-products"] });
        qc.invalidateQueries({ queryKey: ["admin-product", productId] });
        qc.invalidateQueries({ queryKey: ["admin-product-badges", productId] });
        qc.invalidateQueries({ queryKey: ["admin-product-attrs", productId] });
        qc.invalidateQueries({ queryKey: ["admin-product-faqs", productId] });
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl pb-20">
      <Link
        to="/admin/products"
        className="text-[0.65rem] tracking-luxury uppercase text-navy/55 hover:text-navy"
      >
        ← Inventory
      </Link>
      <h1 className="mt-4 font-serif text-4xl text-navy">{isNew ? "New Piece" : "Edit Piece"}</h1>

      <Section title="Essentials">
        <Field label="Name" value={name} onChange={setName} />
        <Field label="SKU" value={sku} onChange={setSku} />
        <Field label="Slug (URL)" value={slug} onChange={setSlug} />
        <SelectField
          label="Category"
          value={categoryId}
          onChange={setCategoryId}
          options={[
            { value: "", label: "— none —" },
            ...categories.map((c) => ({
              value: c.id,
              label: c.parent_id ? `— ${c.name}` : c.name,
            })),
          ]}
        />
        <SelectField
          label="Product type"
          value={productTypeId}
          onChange={setProductTypeId}
          options={[
            { value: "", label: "— none —" },
            ...productTypes.map((t) => ({ value: t.id, label: t.name })),
          ]}
        />
        <SelectField
          label="Visibility"
          value={status}
          onChange={(v) => setStatus(v as "draft" | "published")}
          options={[
            { value: "draft", label: "draft" },
            { value: "published", label: "published" },
          ]}
        />
      </Section>

      <Section title="Pricing & stock">
        <Field label="Price (INR ₹)" type="number" value={price} onChange={setPrice} />
        <Field
          label="Reference / compare-at price (₹)"
          type="number"
          value={compareAt}
          onChange={setCompareAt}
          placeholder="Leave blank for no strike-through"
        />
        <Field
          label="Sale starts"
          type="datetime-local"
          value={saleStart}
          onChange={setSaleStart}
        />
        <Field label="Sale ends" type="datetime-local" value={saleEnd} onChange={setSaleEnd} />
        <Field label="Stock" type="number" value={stock} onChange={setStock} />
        <Field
          label="Materials (comma-separated)"
          value={materials}
          onChange={setMaterials}
        />
      </Section>

      <Section title="Media">
        <div className="md:col-span-2">
          <div className="mb-2 text-[0.6rem] tracking-luxury uppercase text-navy/55">
            Images {images.length > 0 && "· first image is the cover"}
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
                className="mt-2 w-full border-0 border-b border-border/70 bg-transparent pb-2 pt-1 text-navy outline-none focus:border-navy"
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

          <div className="mt-6">
            <div className="text-[0.6rem] tracking-luxury uppercase text-navy/55">Videos</div>
            <ul className="mt-2 space-y-2">
              {videos.map((v) => (
                <li key={v} className="flex items-center gap-3 text-xs text-navy/70">
                  <span className="truncate">{v}</span>
                  <button
                    type="button"
                    onClick={() => setVideos(videos.filter((x) => x !== v))}
                    aria-label="Remove video"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-end gap-3">
              <input
                type="text"
                value={videoDraft}
                onChange={(e) => setVideoDraft(e.target.value)}
                placeholder="https://… .mp4"
                className="flex-1 border-0 border-b border-border/70 bg-transparent pb-2 pt-1 text-navy outline-none focus:border-navy"
              />
              <button
                type="button"
                onClick={() => {
                  const v = videoDraft.trim();
                  if (!v) return;
                  setVideos((prev) => [...prev, v]);
                  setVideoDraft("");
                }}
                className="border border-navy px-4 py-2 text-[0.6rem] tracking-luxury uppercase text-navy"
              >
                Add video
              </button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Storytelling">
        <TextareaField
          label="Description"
          value={description}
          onChange={setDescription}
          className="md:col-span-2"
        />
        <TextareaField label="Care instructions" value={care} onChange={setCare} />
        <TextareaField label="Shipping information" value={shippingInfo} onChange={setShippingInfo} />
      </Section>

      <Section title="Specifications">
        <div className="md:col-span-2 space-y-3">
          {specRows.map((row, i) => (
            <div key={i} className="flex gap-3">
              <input
                value={row.key}
                onChange={(e) =>
                  setSpecRows(specRows.map((r, idx) => (idx === i ? { ...r, key: e.target.value } : r)))
                }
                placeholder="Label (e.g. Gold purity)"
                className="w-1/3 border-0 border-b border-border/70 bg-transparent pb-2 text-sm text-navy outline-none focus:border-navy"
              />
              <input
                value={row.value}
                onChange={(e) =>
                  setSpecRows(specRows.map((r, idx) => (idx === i ? { ...r, value: e.target.value } : r)))
                }
                placeholder="Value (e.g. 18K)"
                className="flex-1 border-0 border-b border-border/70 bg-transparent pb-2 text-sm text-navy outline-none focus:border-navy"
              />
              <button
                type="button"
                onClick={() => setSpecRows(specRows.filter((_, idx) => idx !== i))}
                aria-label="Remove specification"
              >
                <Trash2 className="h-4 w-4 text-rose" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSpecRows([...specRows, { key: "", value: "" }])}
            className="inline-flex items-center gap-2 text-[0.62rem] tracking-luxury uppercase text-navy/60 hover:text-navy"
          >
            <Plus className="h-3.5 w-3.5" /> Add specification
          </button>
        </div>
      </Section>

      <Section title="Filter attributes">
        <div className="md:col-span-2 space-y-3">
          <p className="text-xs text-navy/55">
            These power the shop filter sidebar. Keys must match a filter definition key.
          </p>
          {attrs.map((row, i) => (
            <div key={i} className="flex gap-3">
              <select
                value={row.key}
                onChange={(e) =>
                  setAttrs(attrs.map((r, idx) => (idx === i ? { ...r, key: e.target.value } : r)))
                }
                className="w-1/3 border-0 border-b border-border/70 bg-transparent pb-2 text-sm text-navy outline-none focus:border-navy"
              >
                <option value="">— filter —</option>
                {filterDefs.map((f) => (
                  <option key={f.id} value={f.key}>
                    {f.name}
                  </option>
                ))}
              </select>
              <input
                value={row.value}
                onChange={(e) =>
                  setAttrs(attrs.map((r, idx) => (idx === i ? { ...r, value: e.target.value } : r)))
                }
                placeholder="Value"
                list={`opts-${row.key}`}
                className="flex-1 border-0 border-b border-border/70 bg-transparent pb-2 text-sm text-navy outline-none focus:border-navy"
              />
              <datalist id={`opts-${row.key}`}>
                {(() => {
                  const def = filterDefs.find((f) => f.key === row.key);
                  const opts = Array.isArray(def?.options) ? (def!.options as unknown[]) : [];
                  return opts.map((o, idx) => {
                    const v =
                      typeof o === "string" ? o : String((o as { value?: string })?.value ?? "");
                    return <option key={idx} value={v} />;
                  });
                })()}
              </datalist>
              <button
                type="button"
                onClick={() => setAttrs(attrs.filter((_, idx) => idx !== i))}
                aria-label="Remove attribute"
              >
                <Trash2 className="h-4 w-4 text-rose" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setAttrs([...attrs, { key: "", value: "" }])}
            className="inline-flex items-center gap-2 text-[0.62rem] tracking-luxury uppercase text-navy/60 hover:text-navy"
          >
            <Plus className="h-3.5 w-3.5" /> Add attribute
          </button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="md:col-span-2 flex flex-wrap gap-2">
          {allBadges.length === 0 && (
            <p className="text-xs text-navy/55">
              No badges yet — create them under Admin → Badges.
            </p>
          )}
          {allBadges.map((b) => {
            const on = badgeIds.includes(b.id);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() =>
                  setBadgeIds(on ? badgeIds.filter((x) => x !== b.id) : [...badgeIds, b.id])
                }
                style={
                  on
                    ? { color: b.text_color, backgroundColor: b.bg_color, borderColor: b.border_color }
                    : undefined
                }
                className={`border px-3 py-1.5 text-[0.6rem] tracking-luxury uppercase ${
                  on ? "" : "border-border/60 text-navy/55"
                }`}
              >
                {b.label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Product FAQs">
        <div className="md:col-span-2 space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="border border-border/60 p-4">
              <input
                value={f.question}
                onChange={(e) =>
                  setFaqs(faqs.map((r, idx) => (idx === i ? { ...r, question: e.target.value } : r)))
                }
                placeholder="Question"
                className="w-full border-0 border-b border-border/70 bg-transparent pb-2 text-sm text-navy outline-none focus:border-navy"
              />
              <textarea
                value={f.answer}
                onChange={(e) =>
                  setFaqs(faqs.map((r, idx) => (idx === i ? { ...r, answer: e.target.value } : r)))
                }
                rows={3}
                placeholder="Answer"
                className="mt-3 w-full border border-border/70 bg-card p-3 text-sm text-navy outline-none focus:border-navy"
              />
              <button
                type="button"
                onClick={() => setFaqs(faqs.filter((_, idx) => idx !== i))}
                className="mt-3 inline-flex items-center gap-2 text-[0.6rem] tracking-luxury uppercase text-rose"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}
            className="inline-flex items-center gap-2 text-[0.62rem] tracking-luxury uppercase text-navy/60 hover:text-navy"
          >
            <Plus className="h-3.5 w-3.5" /> Add FAQ
          </button>
        </div>
      </Section>

      <Section title="SEO">
        <Field label="SEO title" value={seoTitle} onChange={setSeoTitle} className="md:col-span-2" />
        <TextareaField
          label="SEO description"
          value={seoDescription}
          onChange={setSeoDescription}
          className="md:col-span-2"
        />
        <Field
          label="OG image URL"
          value={ogImage}
          onChange={setOgImage}
          placeholder="Defaults to cover image"
          className="md:col-span-2"
        />
      </Section>

      <div className="mt-12 flex flex-wrap gap-4">
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 border-t border-border/60 pt-8">
      <h2 className="text-[0.62rem] tracking-luxury uppercase text-rose">{title}</h2>
      <div className="mt-6 grid gap-8 md:grid-cols-2">{children}</div>
    </section>
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
  options: Array<{ value: string; label: string }>;
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
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
