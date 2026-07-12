import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { FloralMark } from "@/components/brand/Logo";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PEUU Jewels — A Cinematic Fine Jewelry Atelier" },
      {
        name: "description",
        content:
          "Discover PEUU Jewels — heirloom-quality necklaces, rings, bracelets, and earrings, handcrafted in our independent atelier.",
      },
      { property: "og:title", content: "PEUU Jewels — Fine Jewelry Atelier" },
      {
        property: "og:description",
        content: "A cinematic boutique experience: layered necklaces, brilliant solitaires, sculpted cuffs and pavé hoops.",
      },
      { property: "og:image", content: "/necklace.jpeg" },
    ],
  }),
  component: Landing,
});

interface Section {
  word: string;
  eyebrow: string;
  title: string;
  copy: string;
  image: string;
  tone: "rose" | "champagne" | "cashmere" | "ivory";
  cta?: { label: string; to: string };
}

const SECTIONS: Section[] = [
  {
    word: "NECKLACES",
    eyebrow: "Chapter One",
    title: "Layered, weightless, eternal.",
    copy: "Hand-finished chains in 18k gold — engineered to drape, sculpted to last.",
    image: "/necklace.jpeg",
    tone: "rose",
    cta: { label: "Shop Necklaces", to: "/boutique" },
  },
  {
    word: "RINGS",
    eyebrow: "Chapter Two",
    title: "Architectural, brilliant, yours.",
    copy: "Cluster solitaires and knife-edge bands, set by hand in our Maison.",
    image: "/ring.jpeg",
    tone: "champagne",
    cta: { label: "Shop Rings", to: "/boutique" },
  },
  {
    word: "BRACELETS",
    eyebrow: "Chapter Three",
    title: "Substantial. Sculpted. Personal.",
    copy: "Charm bracelets and polished cuffs that mark a moment.",
    image: "/bracelet.jpeg",
    tone: "cashmere",
    cta: { label: "Shop Bracelets", to: "/boutique" },
  },
  {
    word: "EARRINGS",
    eyebrow: "Chapter Four",
    title: "A study in light.",
    copy: "Pavé hoops and stud trios designed to be worn together.",
    image: "/earrings.jpeg",
    tone: "ivory",
    cta: { label: "Shop Earrings", to: "/boutique" },
  },
];

function Landing() {
  return (
    <main className="bg-alabaster">
      <Hero />
      {SECTIONS.map((section, i) => (
        <EditorialSection key={section.word} section={section} index={i} />
      ))}
      <ClosingChapter />
      <SiteFooter />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-alabaster pt-20">
      <div className="absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-1/2 gradient-cashmere" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-alabaster" />
      </div>

      <FloralMark className="pointer-events-none absolute -left-10 top-32 h-72 w-72 text-coral/15 sm:left-10" />
      <FloralMark className="pointer-events-none absolute -right-10 bottom-20 h-80 w-80 rotate-180 text-coral/10 sm:right-10" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-[0.7rem] tracking-luxury uppercase text-rose"
        >
          Maison PEUU · Est. — Your happiness, our priority
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 font-serif text-[clamp(2.75rem,7vw,6.5rem)] leading-[0.95] tracking-tight text-navy"
        >
          The art of <em className="italic text-coral/90">adornment,</em>
          <br />
          quietly perfected.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 max-w-xl text-sm leading-relaxed text-navy/70 sm:text-base"
        >
          An independent atelier of fine jewelry — sculpted by hand, finished with care, made to be
          worn for a lifetime.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex flex-wrap items-center justify-center gap-8"
        >
          <Link
            to="/boutique"
            className="group inline-flex items-center gap-3 bg-navy px-9 py-4 text-[0.7rem] tracking-luxury uppercase text-alabaster transition-all hover:bg-navy-soft"
          >
            Enter the Boutique
            <span className="inline-block h-px w-6 bg-alabaster transition-all group-hover:w-10" />
          </Link>
          <Link
            to="/maison"
            className="line-draw text-[0.7rem] tracking-luxury uppercase text-navy"
          >
            Discover the Maison
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[0.55rem] tracking-luxury uppercase text-navy/40"
        >
          Scroll
        </motion.div>
      </div>
    </section>
  );
}

function EditorialSection({ section, index }: { section: Section; index: number }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const wordY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["20%", "-20%"]);
  const imgY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-6%", "6%"]);

  const toneBg: Record<Section["tone"], string> = {
    rose: "gradient-rose-gold",
    champagne: "bg-gradient-to-b from-[#f7e8db] via-[#f0d9c4] to-[#e8c4b0]",
    cashmere: "gradient-cashmere",
    ivory: "bg-gradient-to-b from-[#fbf6ec] to-[#f2e7d3]",
  };

  const reverse = index % 2 === 1;

  return (
    <section
      ref={ref}
      className="relative grid min-h-[100svh] w-full overflow-hidden md:grid-cols-2"
    >
      {!reduce && (
        <motion.div
          aria-hidden
          initial={{ y: "0%" }}
          whileInView={{ y: "-100%" }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute inset-0 z-30 bg-alabaster"
        />
      )}

      {/* Editorial photo side */}
      <div className={`relative order-1 min-h-[60svh] overflow-hidden md:min-h-0 ${reverse ? "md:order-2" : ""}`}>
        <motion.img
          src={section.image}
          alt={section.word}
          loading={index === 0 ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={index === 0 ? "high" : "low"}
          style={{ y: imgY }}
          className="absolute inset-0 h-[112%] w-full object-cover"
        />
        <div className="absolute inset-0 bg-navy/15" />
        <motion.div
          style={{ y: wordY }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span className="font-serif text-[clamp(4rem,14vw,12rem)] font-medium leading-none tracking-tight text-alabaster/25 mix-blend-overlay">
            {section.word}
          </span>
        </motion.div>
      </div>

      {/* Arch showcase side */}
      <div
        className={`relative order-2 flex min-h-[60svh] items-center justify-center px-8 py-20 sm:px-12 md:min-h-0 md:py-0 ${
          reverse ? "md:order-1" : ""
        } ${toneBg[section.tone]}`}
      >
        <FloralMark className="pointer-events-none absolute right-6 top-6 h-32 w-32 text-navy/10" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-full max-w-md flex-col items-center text-center"
        >
          <div className="arch-frame h-[60vh] max-h-[480px] w-full max-w-[360px] shadow-2xl shadow-navy/20">
            <img
              src={section.image}
              alt={section.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="mt-8 text-[0.65rem] tracking-luxury uppercase text-navy/55">
            {section.eyebrow}
          </div>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-navy sm:text-4xl">
            {section.title}
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-navy/70">{section.copy}</p>
          {section.cta && (
            <Link
              to={section.cta.to}
              className="mt-8 line-draw text-[0.7rem] tracking-luxury uppercase text-navy"
            >
              {section.cta.label}
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function ClosingChapter() {
  return (
    <section className="relative flex min-h-[80svh] flex-col items-center justify-center overflow-hidden bg-navy px-6 py-32 text-alabaster">
      <motion.div
        aria-hidden
        initial={{ y: "0%" }}
        whileInView={{ y: "-100%" }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute inset-0 z-30 bg-alabaster"
      />
      <FloralMark className="pointer-events-none absolute -left-10 top-10 h-72 w-72 text-alabaster/5" />
      <FloralMark className="pointer-events-none absolute -right-10 bottom-10 h-80 w-80 rotate-180 text-alabaster/5" />

      <motion.span
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.5 }}
        transition={{ duration: 1.2 }}
        className="text-[0.7rem] tracking-luxury uppercase text-gold-soft"
      >
        Bespoke · Concierge · Private Atelier
      </motion.span>
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.5 }}
        transition={{ duration: 1.4, delay: 0.15 }}
        className="mt-6 max-w-3xl text-center font-serif text-4xl leading-tight sm:text-6xl"
      >
        Something <em className="italic text-gradient-gold">made for you</em>, alone.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, amount: 0.5 }}
        transition={{ duration: 1.4, delay: 0.4 }}
        className="mt-6 max-w-lg text-center text-sm leading-relaxed text-alabaster/70"
      >
        Commission a piece from the Maison. Our concierge will guide you through stones, settings,
        and engravings — privately, patiently, beautifully.
      </motion.p>
      <Link
        to="/concierge"
        className="mt-12 inline-flex items-center gap-3 border border-gold-soft/60 px-9 py-4 text-[0.7rem] tracking-luxury uppercase text-gold-soft transition-all hover:bg-gold-soft hover:text-navy"
      >
        Begin a Bespoke
        <span className="inline-block h-px w-6 bg-current" />
      </Link>
    </section>
  );
}
