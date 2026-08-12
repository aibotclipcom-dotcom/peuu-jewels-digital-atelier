import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/lib/settings";

export interface ForEveryYouCard {
  id: string;
  title: string;
  image_url: string | null;
  link: string;
}

export const forEveryYouCardsQuery = {
  queryKey: ["for-every-you-cards"] as const,
  staleTime: 5 * 60 * 1000,
  queryFn: async (): Promise<ForEveryYouCard[]> => {
    const { data, error } = await supabase
      .from("for_every_you_cards" as never)
      .select("id, title, image_url, link, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order")
      .order("created_at");
    if (error) throw error;
    return (data ?? []) as unknown as ForEveryYouCard[];
  },
};

/**
 * Center-focused editorial carousel ("FOR EVERY YOU"). Pure CSS transforms —
 * no extra animation library. Autoplay pauses on hover; supports swipe/drag.
 */
export function ForEveryYouSection() {
  const { data: cards = [] } = useQuery(forEveryYouCardsQuery);
  const { for_every_you } = useSiteSettings();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragX = useRef<number | null>(null);

  const count = cards.length;

  useEffect(() => {
    if (paused || count < 2) return;
    const ms = Math.max(2, for_every_you.autoplay_delay_seconds) * 1000;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), ms);
    return () => clearInterval(t);
  }, [paused, count, for_every_you.autoplay_delay_seconds]);

  if (count === 0) return null;

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count);

  function offsetOf(i: number) {
    let d = i - index;
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    return d;
  }

  return (
    <section className="overflow-hidden bg-alabaster px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="text-center">
          <span className="text-[0.7rem] tracking-luxury uppercase text-rose">For Every You</span>
          <h2 className="mt-3 font-serif text-4xl leading-tight text-navy sm:text-5xl">
            A piece for every mood
          </h2>
        </div>

        <div
          className="relative mt-14 h-[420px] select-none sm:h-[520px] lg:h-[600px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={(e) => {
            setPaused(true);
            dragX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = dragX.current;
            const end = e.changedTouches[0]?.clientX ?? null;
            dragX.current = null;
            setPaused(false);
            if (start === null || end === null) return;
            if (Math.abs(end - start) > 40) go(end < start ? 1 : -1);
          }}
          onPointerDown={(e) => {
            if (e.pointerType === "touch") return;
            dragX.current = e.clientX;
          }}
          onPointerUp={(e) => {
            const start = dragX.current;
            dragX.current = null;
            if (start === null) return;
            if (Math.abs(e.clientX - start) > 60) go(e.clientX < start ? 1 : -1);
          }}
        >
          {cards.map((card, i) => {
            const d = offsetOf(i);
            const abs = Math.abs(d);
            const hidden = abs > 2;
            const style: React.CSSProperties = {
              transform: `translate(-50%, -50%) translateX(${d * 46}%) scale(${
                d === 0 ? 1 : abs === 1 ? 0.82 : 0.68
              }) rotateY(${d * -6}deg)`,
              opacity: hidden ? 0 : d === 0 ? 1 : abs === 1 ? 0.85 : 0.4,
              zIndex: 20 - abs,
              pointerEvents: hidden ? "none" : undefined,
            };
            return (
              <a
                key={card.id}
                href={card.link || "/Collection"}
                onClick={(e) => {
                  if (d !== 0) {
                    e.preventDefault();
                    setIndex(i);
                  }
                }}
                aria-hidden={hidden}
                tabIndex={d === 0 ? undefined : -1}
                style={style}
                className="absolute left-1/2 top-1/2 block h-full w-[78%] max-w-[520px] overflow-hidden bg-cashmere shadow-2xl shadow-navy/15 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[46%]"
              >
                {card.image_url ? (
                  <img
                    src={card.image_url}
                    alt={card.title}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center gradient-cashmere font-serif text-2xl text-navy/40">
                    {card.title}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/70 to-transparent px-6 pb-8 pt-20 text-center">
                  <div className="inline-block border-b border-alabaster/60 pb-2 text-[0.72rem] tracking-luxury uppercase text-alabaster">
                    {card.title}
                  </div>
                </div>
              </a>
            );
          })}

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous card"
                className="absolute left-1 top-1/2 z-30 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border/60 bg-alabaster/90 text-navy sm:left-6"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next card"
                className="absolute right-1 top-1/2 z-30 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-border/60 bg-alabaster/90 text-navy sm:right-6"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
