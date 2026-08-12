import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { siteSettingsQuery, DEFAULT_SETTINGS } from "@/lib/settings";
import { forEveryYouCardsQuery } from "@/components/home/ForEveryYouSection";

export const Route = createFileRoute("/_authenticated/admin/for-every-you")({
  head: () => ({ meta: [{ title: "For Every You — Atelier Console" }] }),
  component: AdminForEveryYou,
});

type Row = {
  id: string;
  title: string;
  link: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

const inputCls =
  "mt-1 w-full border border-border/60 bg-alabaster px-3 py-2 text-sm text-navy focus:border-navy focus:outline-none";

async function uploadImage(file: File): Promise<string> {
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `for-every-you/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safe || "asset"}`;
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

function AdminForEveryYou() {
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-for-every-you-cards"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("for_every_you_cards" as never)
        .select("*")
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-for-every-you-cards"] });
    void qc.invalidateQueries({ queryKey: forEveryYouCardsQuery.queryKey });
  };

  async function add() {
    const { error } = await supabase.from("for_every_you_cards" as never).insert({
      title: "DAILY WEAR",
      link: "/Collection",
      sort_order: (rows.at(-1)?.sort_order ?? 0) + 1,
      is_active: false,
    } as never);
    if (error) return toast.error(error.message);
    toast.success("Card added.");
    refresh();
  }

  async function update(id: string, patch: Record<string, unknown>) {
    const { error } = await supabase
      .from("for_every_you_cards" as never)
      .update(patch as never)
      .eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this card?")) return;
    const { error } = await supabase.from("for_every_you_cards" as never).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Card deleted.");
    refresh();
  }

  async function move(i: number, dir: -1 | 1) {
    const a = rows[i];
    const b = rows[i + dir];
    if (!a || !b) return;
    await supabase.from("for_every_you_cards" as never).update({ sort_order: b.sort_order } as never).eq("id", a.id);
    await supabase.from("for_every_you_cards" as never).update({ sort_order: a.sort_order } as never).eq("id", b.id);
    refresh();
  }

  return (
    <div className="max-w-4xl">
      <span className="text-[0.65rem] tracking-luxury uppercase text-rose">Storefront</span>
      <h1 className="mt-3 font-serif text-4xl text-navy">For Every You</h1>
      <p className="mt-3 text-sm text-navy/60">
        Center-focused category carousel shown on the home page, just before the closing chapter.
      </p>

      <AutoplaySetting />

      <button
        type="button"
        onClick={add}
        className="mt-8 inline-flex items-center gap-2 bg-navy px-6 py-3 text-[0.7rem] tracking-luxury uppercase text-alabaster"
      >
        <Plus className="h-3.5 w-3.5" /> Add card
      </button>

      {isLoading && <p className="mt-6 text-sm text-navy/60">Loading…</p>}

      <div className="mt-8 space-y-6">
        {rows.map((row, i) => (
          <CardEditor
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
            No cards yet. The home page stays unchanged until you add one.
          </p>
        )}
      </div>
    </div>
  );
}

function AutoplaySetting() {
  const qc = useQueryClient();
  const { data } = useQuery(siteSettingsQuery);
  const [seconds, setSeconds] = useState(DEFAULT_SETTINGS.for_every_you.autoplay_delay_seconds);

  useEffect(() => {
    if (data) setSeconds(data.for_every_you.autoplay_delay_seconds);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("site_settings").upsert(
        [{ key: "for_every_you", value: { autoplay_delay_seconds: seconds } }] as never,
        { onConflict: "key" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: siteSettingsQuery.queryKey });
      toast.success("Autoplay saved");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <section className="mt-8 border border-border/60 bg-cashmere/20 p-6">
      <h2 className="text-[0.65rem] tracking-luxury uppercase text-navy/60">Autoplay</h2>
      <label className="mt-4 block max-w-xs">
        <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">Delay (seconds)</span>
        <input
          type="number"
          min={2}
          max={60}
          step="1"
          value={seconds}
          onChange={(e) => setSeconds(Math.max(2, Math.min(60, Number(e.target.value) || 2)))}
          className={inputCls}
        />
      </label>
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

function CardEditor({
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
            <button type="button" onClick={onMoveUp} aria-label="Move up" className="border border-border/60 p-2">
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          )}
          {onMoveDown && (
            <button type="button" onClick={onMoveDown} aria-label="Move down" className="border border-border/60 p-2">
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          )}
          <button type="button" onClick={onDelete} aria-label="Delete" className="border border-border/60 p-2 text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">Title</span>
          <input value={form.title} onChange={(e) => set({ title: e.target.value })} className={inputCls} />
        </label>
        <label className="block">
          <span className="text-[0.6rem] tracking-luxury uppercase text-navy/55">Link</span>
          <input value={form.link} onChange={(e) => set({ link: e.target.value })} className={inputCls} />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        {form.image_url && (
          <img src={form.image_url} alt={form.title} className="h-24 w-20 object-cover" />
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 border border-border/60 px-4 py-2 text-[0.65rem] tracking-luxury uppercase text-navy/70">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
          Upload image
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
                toast.success("Image uploaded");
              } catch (err) {
                toast.error((err as Error).message);
              } finally {
                setBusy(false);
                e.target.value = "";
              }
            }}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => void onSave({ title: form.title, link: form.link })}
        className="mt-5 bg-navy px-6 py-2.5 text-[0.7rem] tracking-luxury uppercase text-alabaster"
      >
        Save card
      </button>
    </div>
  );
}
