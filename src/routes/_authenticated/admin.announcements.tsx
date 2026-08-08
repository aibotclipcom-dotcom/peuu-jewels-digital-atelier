import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { siteSettingsQuery, DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings";
import { announcementsQuery } from "@/components/layout/AnnouncementBar";

export const Route = createFileRoute("/_authenticated/admin/announcements")({
  head: () => ({ meta: [{ title: "Announcement Bar — Atelier Console" }] }),
  component: AdminAnnouncements,
});

type Row = {
  id: string;
  text: string;
  link: string | null;
  link_text: string | null;
  bg_color: string;
  text_color: string;
  is_active: boolean;
  sort_order: number;
};

const inputCls =
  "mt-1 w-full border border-border/60 bg-alabaster px-3 py-2 text-sm text-navy focus:border-navy focus:outline-none";

function AdminAnnouncements() {
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("announcements" as never)
        .select("*")
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    void qc.invalidateQueries({ queryKey: announcementsQuery.queryKey });
  };

  async function add() {
    const { error } = await supabase.from("announcements" as never).insert({
      text: "New announcement",
      sort_order: (rows.at(-1)?.sort_order ?? 0) + 1,
      is_active: false,
    } as never);
    if (error) return toast.error(error.message);
    toast.success("Announcement added.");
    refresh();
  }

  async function update(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase.from("announcements" as never).update(patch as never).eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this announcement?")) return;
    const { error } = await supabase.from("announcements" as never).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Announcement deleted.");
    refresh();
  }

  async function move(i: number, dir: -1 | 1) {
    const a = rows[i];
    const b = rows[i + dir];
    if (!a || !b) return;
    await supabase.from("announcements" as never).update({ sort_order: b.sort_order } as never).eq("id", a.id);
    await supabase.from("announcements" as never).update({ sort_order: a.sort_order } as never).eq("id", b.id);
    refresh();
  }

  return (
    <div className="max-w-4xl">
      <span className="text-[0.65rem] tracking-luxury uppercase text-rose">Storefront</span>
      <h1 className="mt-3 font-serif text-4xl text-navy">Announcement Bar</h1>
      <p className="mt-3 text-sm text-navy/60">
        Slim bar shown at the very top of every page. Multiple active announcements rotate
        automatically.
      </p>

      <DelaySetting />

      <button
        type="button"
        onClick={add}
        className="mt-8 inline-flex items-center gap-2 bg-navy px-6 py-3 text-[0.7rem] tracking-luxury uppercase text-alabaster"
      >
        <Plus className="h-3.5 w-3.5" /> Add announcement
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
          <p className="text-sm text-navy/55">No announcements yet.</p>
        )}
      </div>
    </div>
  );
}

function DelaySetting() {
  const qc = useQueryClient();
  const { data } = useQuery(siteSettingsQuery);
  const [seconds, setSeconds] = useState(DEFAULT_SETTINGS.announcement.auto_swipe_delay_seconds);

  useEffect(() => {
    if (data) setSeconds(data.announcement.auto_swipe_delay_seconds);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const current: SiteSettings["announcement"] = data?.announcement ?? DEFAULT_SETTINGS.announcement;
      const { error } = await supabase.from("site_settings").upsert(
        [{ key: "announcement", value: { ...current, auto_swipe_delay_seconds: seconds } }] as never,
        { onConflict: "key" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: siteSettingsQuery.queryKey });
      toast.success("Announcement settings saved");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <section className="mt-8 border border-border/60 bg-cashmere/20 p-6">
      <h2 className="text-[0.65rem] tracking-luxury uppercase text-navy/60">Rotation</h2>
      <div className="mt-4 flex flex-wrap items-end gap-4">
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
            className={`${inputCls} w-40`}
          />
        </label>
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="inline-flex items-center gap-2 bg-navy px-6 py-2.5 text-[0.7rem] tracking-luxury uppercase text-alabaster disabled:opacity-60"
        >
          {save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
        </button>
      </div>
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
        <label className="block sm:col-span-2">
          <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">Text</span>
          <input
            type="text"
            value={form.text}
            onChange={(e) => set({ text: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">Link (optional)</span>
          <input
            type="text"
            value={form.link ?? ""}
            onChange={(e) => set({ link: e.target.value })}
            placeholder="/best-sellers"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">Link text (optional)</span>
          <input
            type="text"
            value={form.link_text ?? ""}
            onChange={(e) => set({ link_text: e.target.value })}
            placeholder="Shop now"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">Background colour</span>
          <input
            type="color"
            value={form.bg_color}
            onChange={(e) => set({ bg_color: e.target.value })}
            className={`${inputCls} h-11 w-24 p-1`}
          />
        </label>
        <label className="block">
          <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">Text colour</span>
          <input
            type="color"
            value={form.text_color}
            onChange={(e) => set({ text_color: e.target.value })}
            className={`${inputCls} h-11 w-24 p-1`}
          />
        </label>
      </div>

      <div
        className="mt-4 px-4 py-2 text-center text-[0.65rem] tracking-luxury uppercase"
        style={{ backgroundColor: form.bg_color, color: form.text_color }}
      >
        {form.text || "Preview"}
      </div>

      <button
        type="button"
        onClick={() =>
          onSave({
            text: form.text,
            link: form.link || null,
            link_text: form.link_text || null,
            bg_color: form.bg_color,
            text_color: form.text_color,
          })
        }
        className="mt-5 bg-navy px-6 py-2.5 text-[0.7rem] tracking-luxury uppercase text-alabaster"
      >
        Save
      </button>
    </div>
  );
}
