import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/lib/settings";

export interface HeroSlide {
  id: string;
  media_type: string;
  media_url: string;
  mobile_media_url: string | null;
  heading: string;
  subheading: string;
  description: string;
  cta_text: string;
  cta_link: string;
}

export const heroSlidesQuery = {
  queryKey: ["hero-slides"] as const,
  staleTime: 5 * 60 * 1000,
  queryFn: async (): Promise<HeroSlide[]> => {
    const { data, error } = await supabase
      .from("hero_slides")
      .select(
        "id, media_type, media_url, mobile_media_url, heading, subheading, description, cta_text, cta_link",
      )
      .eq("is_active", true)
      .order("sort_order")
      .order("created_at");
    if (error) throw error;
    return (data ?? []) as HeroSlide[];
  },
};

export function HeroSlideMedia({
  slide,
  active,
  eager,
}: {
  slide: HeroSlide;
  active: boolean;
  eager?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) void v.play().catch(() => undefined);
    else v.pause();
  }, [active]);

  const src = slide.media_url;
  if (!src) return <div className="h-full w-full bg-cashmere" />;

  if (slide.media_type === "video") {
    return (
      <video
        ref={videoRef}
        src={src}
        poster={slide.mobile_media_url ?? undefined}
        autoPlay={active}
        muted
        loop
        playsInline
        preload={eager ? "auto" : "none"}
        className="h-full max-w-full w-full object-cover object-center"
      />
    );
  }

  return (
    <picture>
      {slide.mobile_media_url ? (
        <source media="(max-width: 767px)" srcSet={slide.mobile_media_url} />
      ) : null}
      <img
        src={src}
        alt={slide.heading || "PEUU Jewels"}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : "low"}
        className="h-full max-w-full w-full object-cover object-center"
      />
    </picture>
  );
}

export function HeroCarousel() {
  const { data: slides = [] } = useQuery(heroSlidesQuery);
  const { hero } = useSiteSettings();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [navHeight, setNavHeight] = useState(0);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const measure = () => setNavHeight(header.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);


  const count = slides.length;
  const go = useCallback(
    (n: number) => setIndex((i) => (count ? (n + count) % count : 0)),
    [count],
  );

  useEffect(() => {
    if (count < 2 || paused) return;
    const ms = Math.max(2, hero.auto_slide_delay_seconds) * 1000;
    const t = setTimeout(() => go(index + 1), ms);
    return () => clearTimeout(t);
  }, [count, paused, index, go, hero.auto_slide_delay_seconds]);

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (count === 0) return null;

  return (
    <section
      className="relative w-full overflow-hidden bg-cashmere"
      style={{ marginTop: navHeight }}
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        const end = e.changedTouches[0]?.clientX;
        if (start == null || end == null) return;
        const dx = end - start;
        if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="relative h-[62svh] min-h-[360px] w-full sm:h-[74svh] lg:h-[86svh]">
        {slides.map((slide, i) => {
          const active = i === index;
          return (
            <div
              key={slide.id}
              aria-hidden={!active}
              className={`absolute inset-0 transition-opacity duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                active ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              {(active || i === 0 || Math.abs(i - index) === 1) && (
                <HeroSlideMedia slide={slide} active={active} eager={i === 0} />
              )}
              {hero.overlay_enabled && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: hero.overlay_color,
                    opacity: Math.min(100, Math.max(0, hero.overlay_opacity)) / 100,
                  }}
                />
              )}


              <div className="absolute inset-0 flex items-center">
                <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
                  <div
                    className={`max-w-xl text-alabaster [text-shadow:0_1px_18px_rgba(10,25,47,0.55)] transition-all duration-700 ${
                      active ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}
                  >
                    {slide.subheading && (
                      <span className="text-[0.65rem] tracking-luxury uppercase text-gold-soft">
                        {slide.subheading}
                      </span>
                    )}
                    {slide.heading && (
                      <h2 className="mt-4 font-serif text-[clamp(2rem,5.5vw,4.25rem)] leading-[1.02]">
                        {slide.heading}
                      </h2>
                    )}
                    {slide.description && (
                      <p className="mt-4 max-w-md text-sm leading-relaxed text-alabaster/80">
                        {slide.description}
                      </p>
                    )}
                    {slide.cta_text && slide.cta_link && (
                      <div className="mt-8">
                        <a
                          href={slide.cta_link}
                          className="inline-flex min-h-11 items-center gap-3 bg-alabaster px-8 py-3 text-[0.7rem] tracking-luxury uppercase text-navy transition-colors hover:bg-gold-soft"
                        >
                          {slide.cta_text}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(index - 1)}
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-alabaster/40 bg-navy/25 text-alabaster backdrop-blur transition-colors hover:bg-navy/60 sm:left-6"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.4} />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(index + 1)}
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-alabaster/40 bg-navy/25 text-alabaster backdrop-blur transition-colors hover:bg-navy/60 sm:right-6"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.4} />
          </button>

          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-8 bg-alabaster" : "w-3 bg-alabaster/45 hover:bg-alabaster/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
