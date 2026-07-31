import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, ThumbsUp, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Review = {
  id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  image_urls: string[];
  verified: boolean;
  approved: boolean;
  helpful_count: number;
  created_at: string;
};

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          strokeWidth={1.4}
          className={n <= Math.round(value) ? "fill-gold text-gold" : "text-navy/25"}
        />
      ))}
    </span>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [writing, setWriting] = useState(false);

  const { data: reviews = [] } = useQuery({
    queryKey: ["product-reviews", productId, user?.id ?? "anon"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .order("helpful_count", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });

  const visible = reviews.filter((r) => r.approved || r.user_id === user?.id);
  const approved = reviews.filter((r) => r.approved);
  const avg =
    approved.length > 0
      ? approved.reduce((s, r) => s + r.rating, 0) / approved.length
      : 0;

  const distribution = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: approved.filter((r) => r.rating === n).length,
  }));

  const vote = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user) throw new Error("Please sign in to vote.");
      const { error } = await supabase
        .from("review_helpful_votes")
        .insert({ review_id: reviewId, user_id: user.id });
      if (error) {
        if ((error as { code?: string }).code === "23505") throw new Error("You already voted.");
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Thanks for the feedback.");
      qc.invalidateQueries({ queryKey: ["product-reviews", productId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section
      id="reviews"
      className="mx-auto max-w-[1400px] border-t border-border/60 px-6 py-16 sm:px-10"
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="text-[0.65rem] tracking-luxury uppercase text-rose">Client voices</div>
          <h2 className="mt-3 font-serif text-3xl text-navy sm:text-4xl">Reviews</h2>
        </div>
        {user && (
          <button
            type="button"
            onClick={() => setWriting((v) => !v)}
            className="border border-navy px-6 py-3 text-[0.65rem] tracking-luxury uppercase text-navy transition-colors hover:bg-navy hover:text-alabaster"
          >
            {writing ? "Close" : "Write a review"}
          </button>
        )}
      </div>

      {approved.length > 0 && (
        <div className="mt-8 grid gap-8 border-y border-border/60 py-8 sm:grid-cols-[auto_1fr] sm:gap-16">
          <div>
            <div className="font-serif text-5xl text-navy">{avg.toFixed(1)}</div>
            <Stars value={avg} size={16} />
            <div className="mt-2 text-[0.7rem] text-navy/55">
              {approved.length} review{approved.length === 1 ? "" : "s"}
            </div>
          </div>
          <div className="max-w-sm space-y-1.5 self-center">
            {distribution.map((d) => (
              <div key={d.n} className="flex items-center gap-3 text-[0.7rem] text-navy/60">
                <span className="w-3 tabular-nums">{d.n}</span>
                <div className="h-1 flex-1 bg-cashmere">
                  <div
                    className="h-full bg-gold"
                    style={{ width: `${approved.length ? (d.count / approved.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-6 text-right tabular-nums">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {writing && user && (
        <ReviewForm
          productId={productId}
          userId={user.id}
          onDone={() => {
            setWriting(false);
            qc.invalidateQueries({ queryKey: ["product-reviews", productId] });
          }}
        />
      )}

      {!user && (
        <p className="mt-6 text-sm text-navy/60">
          Sign in to share your experience with this piece.
        </p>
      )}

      <div className="mt-10 space-y-8">
        {visible.length === 0 && (
          <p className="text-sm text-navy/55">No reviews yet — be the first to write one.</p>
        )}
        {visible.map((r) => (
          <article key={r.id} className="border-t border-border/50 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <Stars value={r.rating} />
              {r.verified && (
                <span className="inline-flex items-center gap-1 text-[0.6rem] tracking-luxury uppercase text-navy/55">
                  <BadgeCheck className="h-3.5 w-3.5" strokeWidth={1.5} /> Verified purchase
                </span>
              )}
              {!r.approved && (
                <span className="border border-border px-2 py-0.5 text-[0.55rem] tracking-luxury uppercase text-navy/50">
                  Pending approval
                </span>
              )}
              <span className="ml-auto text-[0.65rem] text-navy/45">
                {new Date(r.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            {r.title && <h3 className="mt-3 font-serif text-lg text-navy">{r.title}</h3>}
            {r.body && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy/70">{r.body}</p>
            )}
            {r.image_urls?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {r.image_urls.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    loading="lazy"
                    className="h-20 w-20 object-cover"
                  />
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => vote.mutate(r.id)}
              className="mt-4 inline-flex items-center gap-2 text-[0.65rem] tracking-luxury uppercase text-navy/55 hover:text-navy"
            >
              <ThumbsUp className="h-3.5 w-3.5" strokeWidth={1.5} />
              Helpful {r.helpful_count > 0 && `· ${r.helpful_count}`}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReviewForm({
  productId,
  userId,
  onDone,
}: {
  productId: string;
  userId: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        user_id: userId,
        rating,
        title: title.trim() || null,
        body: body.trim() || null,
      });
      if (error) throw error;
      toast.success("Thank you — your review is awaiting approval.");
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 max-w-xl border border-border/60 bg-cashmere/25 p-6">
      <div className="text-[0.6rem] tracking-luxury uppercase text-navy/55">Your rating</div>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
            <Star
              className={`h-6 w-6 ${n <= rating ? "fill-gold text-gold" : "text-navy/25"}`}
              strokeWidth={1.3}
            />
          </button>
        ))}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Headline"
        className="mt-5 w-full border-0 border-b border-border/70 bg-transparent pb-2 text-navy outline-none focus:border-navy"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="Tell us about the piece…"
        className="mt-4 w-full border border-border/70 bg-card p-3 text-sm text-navy outline-none focus:border-navy"
      />
      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="mt-4 bg-navy px-8 py-3 text-[0.65rem] tracking-luxury uppercase text-alabaster disabled:opacity-60"
      >
        {saving ? "Submitting…" : "Submit review"}
      </button>
    </div>
  );
}
