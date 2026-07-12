import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FloralMark } from "@/components/brand/Logo";

export const Route = createFileRoute("/maison")({
  head: () => ({
    meta: [
      { title: "Maison — The Story of PEUU Jewels" },
      { name: "description", content: "Inside the PEUU Jewels atelier — our heritage, craftsmanship, and the hands that shape every piece." },
      { property: "og:title", content: "Maison — PEUU Jewels" },
      { property: "og:description", content: "The story, the heritage, and the craftsmanship behind PEUU Jewels." },
      { property: "og:image", content: "https://chic-velvet-dreams.lovable.app/ring.jpeg" },
      { property: "og:url", content: "https://chic-velvet-dreams.lovable.app/maison" },
      { property: "twitter:image", content: "https://chic-velvet-dreams.lovable.app/ring.jpeg" },
    ],
    links: [{ rel: "canonical", href: "https://chic-velvet-dreams.lovable.app/maison" }],
  }),
  component: MaisonPage,
});


const CHAPTERS = [
  {
    eyebrow: "01 · Origin",
    title: "A small atelier with an unwavering belief.",
    body: "PEUU Jewels was founded on a single conviction: that a piece of jewelry is not an accessory, but a quiet companion to a life. Every commission we accept begins with a conversation — about who you are, and who you are becoming.",
  },
  {
    eyebrow: "02 · Hand",
    title: "Eight pairs of hands. One piece.",
    body: "Each design moves through our atelier slowly. It is sketched, modeled, cast, set, and finished by hand. We refuse the speed of mass production because patience is the only material we cannot buy.",
  },
  {
    eyebrow: "03 · Material",
    title: "Sourced with intention, set with care.",
    body: "We work in recycled 18k and 14k gold, platinum, and ethically sourced diamonds and gemstones. We choose suppliers who can name the mine, the cutter, and the hand that polished the stone.",
  },
  {
    eyebrow: "04 · Forever",
    title: "Made to be repaired, not replaced.",
    body: "Every PEUU piece carries a lifetime promise of polishing, refinishing, and resizing. A ring you receive today will outlast every screen, every season, every fleeting fashion.",
  },
];

function MaisonPage() {
  return (
    <main className="bg-alabaster pt-24 sm:pt-32">
      <section className="relative mx-auto max-w-5xl px-6 pb-24 pt-16 text-center sm:px-10">
        <FloralMark className="pointer-events-none absolute left-4 top-0 h-40 w-40 text-coral/10" />
        <span className="text-[0.7rem] tracking-luxury uppercase text-rose">Maison PEUU</span>
        <h1 className="mt-6 font-serif text-5xl leading-tight text-navy sm:text-7xl">
          A house built by <em className="italic text-coral/90">hand</em>,
          <br />
          one piece at a time.
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-navy/70">
          We are not a factory. We are not a brand. We are a small atelier of jewelers who believe
          that what you wear closest to your skin should be the thing you keep for the longest.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="aspect-[16/8] w-full overflow-hidden bg-cashmere">
          <img src="/necklace.jpeg" alt="Inside the PEUU atelier" className="h-full w-full object-cover" />
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-32 px-6 py-32 sm:px-10">
        {CHAPTERS.map((c, i) => (
          <motion.article
            key={c.eyebrow}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className={`grid gap-10 md:grid-cols-[180px_1fr] ${i % 2 === 1 ? "md:ml-12" : ""}`}
          >
            <div className="text-[0.7rem] tracking-luxury uppercase text-rose md:pt-3">
              {c.eyebrow}
            </div>
            <div>
              <h2 className="font-serif text-3xl leading-snug text-navy sm:text-4xl">{c.title}</h2>
              <p className="mt-5 text-base leading-relaxed text-navy/75">{c.body}</p>
            </div>
          </motion.article>
        ))}
      </section>

      <section className="bg-navy py-32 text-alabaster">
        <div className="mx-auto max-w-3xl px-6 text-center sm:px-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
            className="font-serif text-3xl leading-snug sm:text-5xl"
          >
            "What we make is small. What it means is not."
          </motion.h2>
          <p className="mt-6 text-[0.7rem] tracking-luxury uppercase text-gold-soft">— The Maison</p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
