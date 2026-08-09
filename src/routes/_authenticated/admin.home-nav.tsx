import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { siteSettingsQuery, DEFAULT_SETTINGS } from "@/lib/settings";
import { homeNavItemsQuery } from "@/components/home/HomeNavBar";

export const Route = createFileRoute("/_authenticated/admin/home-nav")({
  head: () => ({ meta: [{ title: "Home Navigation — Atelier Console" }] }),
  component: AdminHomeNav,
});

type Row = {
  id: string;
  name: string;
  link: string;
  image_url: string | null;
  badge_label: string | null;
  is_active: boolean;
  sort_order: number;
};

const inputCls =
  "mt-1 w-full border border-border/60 bg-alabaster px-3 py-2 text-sm text-navy focus:border-navy focus:outline-none";

async function uploadImage(file: File): Promise<string> {
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `home-nav/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safe || "asset"}`;
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

function AdminHomeNav() {
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-home-nav-items"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("home_nav_items" as never)
        .select("*")
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-home-nav-items"] });
    void qc.invalidateQueries({ queryKey: homeNavItemsQuery.queryKey });
  };

  async function add() {
    const { error } = await supabase.from("home_nav_items" as never).insert({
      name: "New item",
      link: "/Collection",
      sort_order: (rows.at(-1)?.sort_order ?? 0) + 1,
      is_active: false,
    } as never);
    if (error) return toast.error(error.message);
    toast.success("Item added.");
    refresh();
  }

  async function update(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase
      .from("home_nav_items" as never)
      .update(patch as never)
      .eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this navigation item?")) return;
    const { error } = await supabase.from("home_nav_items" as never).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Item deleted.");
    refresh();
  }

  async function move(i: number, dir: -1 | 1) {
    const a = rows[i];
    const b = rows[i + dir];
    if (!a || !b) return;
    await supabase.from("home_nav_items" as never).update({ sort_order: b.sort_order } as never).eq("id", a.id);
    await supabase.from("home_nav_items" as never).update({ sort_order: a.sort_order } as never).eq("id", b.id);
    refresh();
  }

  return (
    <div className="max-w-4xl">
      <span className="text-[0.65rem] tracking-luxury uppercase text-rose">Storefront</span>
      <h1 className="mt-3 font-serif text-4xl text-navy">Home Navigation</h1>
      <p className="mt-3 text-sm text-navy/60">
        Horizontal category strip shown on the home page only, directly below the hero slider.
      </p>

      <DelaySetting />

      <button
        type="button"
        onClick={add}
        className="mt-8 inline-flex items-center gap-2 bg-navy px-6 py-3 text-[0.7rem] tracking-luxury uppercase text-alabaster"
      >
        <Plus className="h-3.5 w-3.5" /> Add item
      </button>

      {isLoading && <p className="mt-6 text-sm text-navy/60">Loading…</p>}

      <div className="mt-8 space-y-6">
        {rows.map((row, i) => (
          <Card
            key={row.id}
            row={row}
            onSave={(patch) => update(row.id, patch)}
            onDelete={() => remove(row.id)}
            onMoveUp={i > 0 ? () => void move(i, -1) : undefined}
            onMoveDown={i < rows.length - 1 ? () => void move(i, 1) : undefined}
          />
        ))}
        {!isLoading && rows.length === 0 && (
          <p className="text-sm text-navy/55">
            No items yet. The home page stays unchanged until you add one.
          </p>
        )}
      </div>
    </div>
  );
}

function DelaySetting() {
  const qc = useQueryClient();
  const { data } = useQuery(siteSettingsQuery);
  const [seconds, setSeconds] = useState(DEFAULT_SETTINGS.home_nav.auto_swipe_delay_seconds);
  const [enabled, setEnabled] = useState(DEFAULT_SETTINGS.home_nav.auto_scroll_enabled);
  const [bgColor, setBgColor] = useState(DEFAULT_SETTINGS.home_nav.bg_color);
  const [textColor, setTextColor] = useState(DEFAULT_SETTINGS.home_nav.text_color);
  const [borderColor, setBorderColor] = useState(DEFAULT_SETTINGS.home_nav.border_color);

  useEffect(() => {
    if (!data) return;
    setSeconds(data.home_nav.auto_swipe_delay_seconds);
    setEnabled(data.home_nav.auto_scroll_enabled);
    setBgColor(data.home_nav.bg_color);
    setTextColor(data.home_nav.text_color);
    setBorderColor(data.home_nav.border_color);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("site_settings").upsert(
        [
          {
            key: "home_nav",
            value: {
              auto_swipe_delay_seconds: seconds,
              auto_scroll_enabled: enabled,
              bg_color: bgColor,
              text_color: textColor,
              border_color: borderColor,
            },
          },
        ] as never,
        { onConflict: "key" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: siteSettingsQuery.queryKey });
      toast.success("Navigation settings saved");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <section className="mt-8 border border-border/60 bg-cashmere/20 p-6">
      <h2 className="text-[0.65rem] tracking-luxury uppercase text-navy/60">Appearance & auto-scroll</h2>
      <div className="mt-4 grid flex-wrap gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">Background colour</span>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="mt-1 h-10 w-full border border-border/60 bg-alabaster cursor-pointer"
          />
        </label>
        <label className="block">
          <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">Text colour</span>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="mt-1 h-10 w-full border border-border/60 bg-alabaster cursor-pointer"
          />
        </label>
        <label className="block">
          <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">Border colour</span>
          <input
            type="color"
            value={borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
            className="mt-1 h-10 w-full border border-border/60 bg-alabaster cursor-pointer"
          />
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm text-navy/75">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 accent-navy"
          />
          Auto-scroll when items overflow
        </label>
        <label className="block">
          <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">
            Auto-swipe delay (seconds)
          </span>
          <input
            type="number"
            min={2}
            max={60}
            step="1"
            value={seconds}
            onChange={(e) => setSeconds(Math.max(2, Math.min(60, Number(e.target.value) || 2)))}
            className={`${inputCls} w-full sm:w-40`}
          />
        </label>
      </div>
      <button
        type="button"
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="mt-5 inline-flex items-center gap-2 bg-navy px-6 py-2.5 text-[0.7rem] tracking-luxury uppercase text-alabaster disabled:opacity-60"
      >
        {save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
      </button>
    </section>
  );
}

function Card({
  row,
  onSave,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  row: Row;
  onSave: (patch: Record<string, unknown>) => unknown;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const [form, setForm] = useState<Row>(row);
  const [busy, setBusy] = useState(false);
  useEffect(() => setForm(row), [row]);
  const set = (patch: Partial<Row>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="border border-border/60 bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <div className="flex items-center gap-2">
          {onMoveUp && (
            <button type="button" onClick={onMoveUp} aria-label="Move up" className="p-2 text-navy/60">
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
          {onMoveDown && (
            <button type="button" onClick={onMoveDown} aria-label="Move down" className="p-2 text-navy/60">
              <ArrowDown className="h-4 w-4" />
            </button>
          )}
          <button type="button" onClick={onDelete} aria-label="Delete" className="p-2 text-rose">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">Name</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">Link</span>
          <input
            type="text"
            value={form.link}
            onChange={(e) => set({ link: e.target.value })}
            placeholder="/Collection"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">
            Badge label (optional)
          </span>
          <input
            type="text"
            value={form.badge_label ?? ""}
            onChange={(e) => set({ badge_label: e.target.value })}
            placeholder="New"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">
            Icon / image URL (optional)
          </span>
          <input
            type="text"
            value={form.image_url ?? ""}
            onChange={(e) => set({ image_url: e.target.value })}
            className={inputCls}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="inline-flex cursor-pointer items-center gap-2 border border-border/60 px-4 py-2 text-[0.65rem] tracking-luxury uppercase text-navy/70">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
          Upload icon
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              try {
                const url = await uploadImage(file);
                set({ image_url: url });
                await onSave({ image_url: url });
                toast.success("Icon uploaded");
              } catch (err) {
                toast.error((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
        {form.image_url && (
          <img src={form.image_url} alt="" className="h-9 w-9 rounded-full object-cover" />
        )}
      </div>

      <button
        type="button"
        onClick={() =>
          onSave({
            name: form.name,
            link: form.link || "/",
            image_url: form.image_url || null,
            badge_label: form.badge_label || null,
          })
        }
        className="mt-5 bg-navy px-6 py-2.5 text-[0.7rem] tracking-luxury uppercase text-alabaster"
      >
        Save
      </button>
    </div>
  );
}
