import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, UploadCloud, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { siteSettingsQuery, DEFAULT_SETTINGS } from "@/lib/settings";
import { HeroSlideMedia, heroSlidesQuery, type HeroSlide } from "@/components/home/HeroCarousel";

export const Route = createFileRoute("/_authenticated/admin/hero-slides")({
  head: () => ({ meta: [{ title: "Home Hero Slider — Atelier Console" }] }),
  component: AdminHeroSlides,
});

type Row = HeroSlide & {
  sort_order: number;
  is_active: boolean;
};

const inputCls =
  "mt-1 w-full border border-border/60 bg-alabaster px-3 py-2 text-sm text-navy focus:border-navy focus:outline-none";

async function uploadMedia(file: File): Promise<string> {
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `hero/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safe || "asset"}`;
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

function AdminHeroSlides() {
  const qc = useQueryClient();

  const { data: slides = [], isLoading } = useQuery({
    queryKey: ["admin-hero-slides"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("hero_slides")
        .select("*")
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-hero-slides"] });
    void qc.invalidateQueries({ queryKey: heroSlidesQuery.queryKey });
  };

  async function addSlide() {
    const { error } = await supabase.from("hero_slides").insert({
      sort_order: (slides.at(-1)?.sort_order ?? 0) + 1,
      is_active: false,
    } as never);
    if (error) return toast.error(error.message);
    toast.success("Slide added — add media and publish it.");
    refresh();
  }

  async function update(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from("hero_slides").update(patch as never).eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this slide?")) return;
    const { error } = await supabase.from("hero_slides").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Slide deleted.");
    refresh();
  }

  async function move(i: number, dir: -1 | 1) {
    const a = slides[i];
    const b = slides[i + dir];
    if (!a || !b) return;
    await supabase.from("hero_slides").update({ sort_order: b.sort_order } as never).eq("id", a.id);
    await supabase.from("hero_slides").update({ sort_order: a.sort_order } as never).eq("id", b.id);
    refresh();
  }

  return (
    <div className="max-w-4xl">
      <span className="text-[0.65rem] tracking-luxury uppercase text-rose">Storefront</span>
      <h1 className="mt-3 font-serif text-4xl text-navy">Home Hero Slider</h1>
      <p className="mt-3 text-sm text-navy/60">
        Full-width slides at the very top of the home page. Inactive slides are never shown.
      </p>

      <DelaySetting />

      <button
        type="button"
        onClick={addSlide}
        className="mt-8 inline-flex items-center gap-2 bg-navy px-6 py-3 text-[0.7rem] tracking-luxury uppercase text-alabaster"
      >
        <Plus className="h-3.5 w-3.5" /> Add slide
      </button>

      {isLoading && <p className="mt-6 text-sm text-navy/60">Loading…</p>}

      <div className="mt-8 space-y-6">
        {slides.map((slide, i) => (
          <SlideCard
            key={slide.id}
            slide={slide}
            onSave={(patch) => update(slide.id, patch)}
            onDelete={() => remove(slide.id)}
            onMoveUp={i > 0 ? () => void move(i, -1) : undefined}
            onMoveDown={i < slides.length - 1 ? () => void move(i, 1) : undefined}
          />
        ))}
        {!isLoading && slides.length === 0 && (
          <p className="text-sm text-navy/55">
            No slides yet. The home page keeps working normally until you add one.
          </p>
        )}
      </div>
    </div>
  );
}

function DelaySetting() {
  const qc = useQueryClient();
  const { data } = useQuery(siteSettingsQuery);
  const [seconds, setSeconds] = useState(DEFAULT_SETTINGS.hero.auto_slide_delay_seconds);

  useEffect(() => {
    if (data) setSeconds(data.hero.auto_slide_delay_seconds);
  }, [data]);

  const save = useMutation({
    mutationFn: async (v: number) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert([{ key: "hero", value: { auto_slide_delay_seconds: v } }] as never, {
          onConflict: "key",
        });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: siteSettingsQuery.queryKey });
      toast.success("Auto-slide delay saved");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <section className="mt-8 border border-border/60 bg-cashmere/20 p-6">
      <h2 className="text-[0.65rem] tracking-luxury uppercase text-navy/60">Auto slide</h2>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">
            Auto slide delay (seconds)
          </span>
          <input
            type="number"
            min={2}
            max={60}
            step="1"
            value={seconds}
            onChange={(e) => setSeconds(Math.max(2, Math.min(60, Number(e.target.value) || 2)))}
            className={`${inputCls} w-40`}
          />
        </label>
        <button
          type="button"
          onClick={() => save.mutate(seconds)}
          disabled={save.isPending}
          className="inline-flex items-center gap-2 bg-navy px-6 py-2.5 text-[0.7rem] tracking-luxury uppercase text-alabaster disabled:opacity-60"
        >
          {save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
        </button>
      </div>
    </section>
  );
}

function SlideCard({
  slide,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  slide: Row;
  onSave: (patch: Record<string, unknown>) => void | Promise<void>;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const [form, setForm] = useState<Row>(slide);
  const [busy, setBusy] = useState(false);

  useEffect(() => setForm(slide), [slide]);

  const set = (patch: Partial<Row>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="border border-border/60 bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-[0.65rem] tracking-luxury uppercase text-navy/65">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => {
                set({ is_active: e.target.checked });
                void onSave({ is_active: e.target.checked });
              }}
              className="h-4 w-4 accent-navy"
            />
            Active
          </label>
          <span className="text-[0.6rem] uppercase tracking-luxury text-navy/40">
            #{form.sort_order}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onMoveUp && (
            <button type="button" onClick={onMoveUp} className="p-2 text-navy/60 hover:text-navy" aria-label="Move up">
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
          {onMoveDown && (
            <button type="button" onClick={onMoveDown} className="p-2 text-navy/60 hover:text-navy" aria-label="Move down">
              <ArrowDown className="h-4 w-4" />
            </button>
          )}
          <button type="button" onClick={onDelete} className="p-2 text-destructive" aria-label="Delete slide">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <div className="aspect-[16/9] w-full overflow-hidden border border-border/60 bg-alabaster">
            <HeroSlideMedia slide={form} active={false} />
          </div>
          <p className="mt-2 text-[0.6rem] uppercase tracking-luxury text-navy/40">Preview</p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">Media type</span>
            <select
              value={form.media_type}
              onChange={(e) => set({ media_type: e.target.value })}
              className={inputCls}
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </label>

          <label className="block">
            <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">Media URL</span>
            <input
              type="text"
              value={form.media_url}
              onChange={(e) => set({ media_url: e.target.value })}
              placeholder="https://… or /necklace.jpeg"
              className={inputCls}
            />
          </label>

          <label className="inline-flex cursor-pointer items-center gap-2 text-[0.65rem] tracking-luxury uppercase text-navy/65">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            Upload file
            <input
              type="file"
              accept={form.media_type === "video" ? "video/*" : "image/*"}
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setBusy(true);
                try {
                  const url = await uploadMedia(file);
                  set({ media_url: url });
                  await onSave({ media_url: url, media_type: form.media_type });
                } catch (err) {
                  toast.error((err as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>

          <label className="block">
            <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">
              Mobile media URL (optional)
            </span>
            <input
              type="text"
              value={form.mobile_media_url ?? ""}
              onChange={(e) => set({ mobile_media_url: e.target.value || null })}
              className={inputCls}
            />
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Heading" value={form.heading} onChange={(v) => set({ heading: v })} />
        <Field label="Subheading" value={form.subheading} onChange={(v) => set({ subheading: v })} />
        <Field label="CTA text" value={form.cta_text} onChange={(v) => set({ cta_text: v })} />
        <Field label="CTA link" value={form.cta_link} onChange={(v) => set({ cta_link: v })} />
        <label className="block sm:col-span-2">
          <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">Description</span>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">Sort order</span>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => set({ sort_order: Number(e.target.value) || 0 })}
            className={inputCls}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() =>
          void onSave({
            media_type: form.media_type,
            media_url: form.media_url,
            mobile_media_url: form.mobile_media_url,
            heading: form.heading,
            subheading: form.subheading,
            description: form.description,
            cta_text: form.cta_text,
            cta_link: form.cta_link,
            sort_order: form.sort_order,
            is_active: form.is_active,
          })
        }
        className="mt-6 bg-navy px-6 py-3 text-[0.7rem] tracking-luxury uppercase text-alabaster"
      >
        Save slide
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">{label}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </label>
  );
}
