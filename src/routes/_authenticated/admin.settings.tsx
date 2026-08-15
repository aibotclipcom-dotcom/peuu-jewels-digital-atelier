import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_SETTINGS,
  siteSettingsQuery,
  type SiteSettings,
} from "@/lib/settings";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({ meta: [{ title: "Store Settings — Atelier Console" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  const qc = useQueryClient();
  const { data } = useQuery(siteSettingsQuery);
  const [form, setForm] = useState<SiteSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async (next: SiteSettings) => {
      const rows = [
        { key: "announcement", value: next.announcement },
        { key: "shipping", value: next.shipping },
        { key: "cart", value: next.cart },
        { key: "closing_video", value: next.closing_video },
      ];
      const { error } = await supabase
        .from("site_settings")
        .upsert(rows as never, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: siteSettingsQuery.queryKey });
      toast.success("Store settings saved");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const set = <K extends keyof SiteSettings>(section: K, patch: Partial<SiteSettings[K]>) =>
    setForm((f) => ({ ...f, [section]: { ...f[section], ...patch } }));

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl text-navy">Store Settings</h1>
      <p className="mt-2 text-sm text-navy/60">
        Announcement bar, shipping rules and cart rules for the whole storefront.
      </p>

      <Section title="Announcement bar">
        <Toggle
          label="Show the announcement bar"
          checked={form.announcement.enabled}
          onChange={(v) => set("announcement", { enabled: v })}
        />
        <Text
          label="Message"
          value={form.announcement.text}
          onChange={(v) => set("announcement", { text: v })}
          placeholder="Free shipping on orders over ₹599"
        />
        <Text
          label="Link (optional)"
          value={form.announcement.link}
          onChange={(v) => set("announcement", { link: v })}
          placeholder="/best-sellers"
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <Color
            label="Background colour"
            value={form.announcement.bg_color}
            onChange={(v) => set("announcement", { bg_color: v })}
          />
          <Color
            label="Text colour"
            value={form.announcement.text_color}
            onChange={(v) => set("announcement", { text_color: v })}
          />
        </div>
        <div
          className="mt-2 px-4 py-2 text-center text-[0.65rem] tracking-luxury uppercase"
          style={{
            backgroundColor: form.announcement.bg_color,
            color: form.announcement.text_color,
          }}
        >
          {form.announcement.text || "Preview"}
        </div>
      </Section>

      <Section title="Shipping">
        <Toggle
          label="Offer free shipping above a threshold"
          checked={form.shipping.free_shipping_enabled}
          onChange={(v) => set("shipping", { free_shipping_enabled: v })}
        />
        <Num
          label="Free shipping threshold (₹)"
          value={form.shipping.free_shipping_threshold}
          onChange={(v) => set("shipping", { free_shipping_threshold: v })}
        />
        <Num
          label="Standard shipping charge (₹)"
          value={form.shipping.shipping_charge}
          onChange={(v) => set("shipping", { shipping_charge: v })}
        />
      </Section>

      <Section title="Cart & tax">
        <Num
          label="Minimum order value (₹)"
          value={form.cart.min_order_value}
          onChange={(v) => set("cart", { min_order_value: v })}
        />
        <Num
          label="Tax percentage (0 when prices already include tax)"
          value={form.cart.tax_percent}
          onChange={(v) => set("cart", { tax_percent: v })}
        />
        <Text
          label="Tax label"
          value={form.cart.tax_label}
          onChange={(v) => set("cart", { tax_label: v })}
          placeholder="GST"
        />
      </Section>

      <Section title='"Something made for you, alone." — video'>
        <Toggle
          label="Show the video in this section"
          checked={form.closing_video.enabled}
          onChange={(v) => set("closing_video", { enabled: v })}
        />
        <Text
          label="Video URL (.mp4 / .webm)"
          value={form.closing_video.url}
          onChange={(v) => set("closing_video", { url: v })}
          placeholder="https://example.com/showcase.mp4"
        />
        <Upload
          label="…or upload a video (max 50MB)"
          accept="video/*"
          maxMb={50}
          onUploaded={(url) => set("closing_video", { url })}
        />
        <Text
          label="Poster image URL (optional)"
          value={form.closing_video.poster}
          onChange={(v) => set("closing_video", { poster: v })}
          placeholder="https://example.com/poster.jpg"
        />
        <Upload
          label="…or upload a poster image"
          accept="image/*"
          maxMb={8}
          onUploaded={(url) => set("closing_video", { poster: url })}
        />
        {form.closing_video.url ? (
          <div className="space-y-3">
            <div className="overflow-hidden border border-border/60 bg-navy">
              <video
                key={form.closing_video.url}
                src={form.closing_video.url}
                poster={form.closing_video.poster || undefined}
                muted
                loop
                autoPlay
                playsInline
                controls
                className="aspect-video w-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => set("closing_video", { url: "", poster: "" })}
              className="text-[0.6rem] tracking-luxury uppercase text-navy/55 underline"
            >
              Remove video
            </button>
          </div>
        ) : (
          <p className="text-xs text-navy/50">No video set — the section shows as before.</p>
        )}
      </Section>

      <button
        type="button"
        onClick={() => save.mutate(form)}
        disabled={save.isPending}
        className="mt-10 inline-flex items-center gap-3 bg-navy px-8 py-4 text-[0.7rem] tracking-luxury uppercase text-alabaster disabled:opacity-60"
      >
        {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save settings
      </button>
    </div>
  );
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/(^-|-$)+/g, "");
}

function Upload({
  label,
  accept,
  maxMb,
  onUploaded,
}: {
  label: string;
  accept: string;
  maxMb: number;
  onUploaded: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const handle = async (file: File) => {
    const kind = accept.split("/")[0];
    if (!file.type.startsWith(kind + "/")) {
      toast.error(`Please choose a ${kind} file`);
      return;
    }
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`File is too large (max ${maxMb}MB)`);
      return;
    }
    setBusy(true);
    try {
      const path = `home/${Date.now()}-${slugify(file.name) || "asset"}`;
      const { error } = await supabase.storage
        .from("peuu-assets")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data, error: signErr } = await supabase.storage
        .from("peuu-assets")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signErr) throw signErr;
      onUploaded(data.signedUrl);
      toast.success("Uploaded — remember to save settings");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <label className="block">
      <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">{label}</span>
      <div className="mt-1 flex items-center gap-3">
        <input
          type="file"
          accept={accept}
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void handle(f);
          }}
          className="flex-1 text-xs text-navy/70 file:mr-3 file:border file:border-border/60 file:bg-alabaster file:px-3 file:py-2 file:text-[0.6rem] file:uppercase file:tracking-luxury"
        />
        {busy && <Loader2 className="h-4 w-4 animate-spin text-navy/60" />}
      </div>
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 space-y-5 border border-border/60 bg-cashmere/20 p-6">
      <h2 className="text-[0.65rem] tracking-luxury uppercase text-navy/60">{title}</h2>
      {children}
    </section>
  );
}

const inputCls =
  "mt-1 w-full border border-border/60 bg-alabaster px-3 py-2 text-sm text-navy focus:border-navy focus:outline-none";

function Text({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </label>
  );
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">{label}</span>
      <input
        type="number"
        min={0}
        step="1"
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className={inputCls}
      />
    </label>
  );
}

function Color({
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
      <div className="mt-1 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 border border-border/60 bg-alabaster"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-border/60 bg-alabaster px-3 py-2 text-sm text-navy focus:border-navy focus:outline-none"
        />
      </div>
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-sm text-navy/75">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-navy"
      />
      {label}
    </label>
  );
}
