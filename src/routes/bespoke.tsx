import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FloralMark } from "@/components/brand/Logo";

const STEPS = [
  {
    step: "Step 01",
    title: "The consultation",
    body: "Every bespoke commission begins with a conversation — in the atelier or over a private call. We listen for the occasion, the person, the way you live in your jewelry. Budget, timeline and stone preferences are discussed openly at this stage, so nothing is a surprise later.",
    detail: "Typically 45–60 minutes · By appointment",
  },
  {
    step: "Step 02",
    title: "Sketch and design",
    body: "Our designers translate the conversation into hand sketches, then into a precise 3D model. You review the proportions, the setting height, the curve of the shank. We revise until the drawing feels inevitable rather than decided.",
    detail: "2–3 design revisions included",
  },
  {
    step: "Step 03",
    title: "Choosing the metal and the stone",
    body: "We work in recycled 18k and 14k gold, platinum and sterling silver, and in ethically sourced diamonds and coloured gemstones. For each stone you are shown the cut, clarity, carat and origin, and you may compare options side by side before committing.",
    detail: "Recycled metals · Traceable stones",
  },
  {
    step: "Step 04",
    title: "Casting and setting by hand",
    body: "The approved model is cast, then filed, soldered and set by our bench jewelers. Prongs are raised and burnished by hand, so the stone sits at exactly the angle drawn in the design. Nothing at this stage is automated.",
    detail: "3–5 weeks of bench work",
  },
  {
    step: "Step 05",
    title: "Hand finishing and delivery",
    body: "The piece is polished through successive grades, inspected under magnification and, if you wish, engraved. It arrives in the PEUU presentation box with its material record — and a lifetime promise of polishing, refinishing and resizing.",
    detail: "Lifetime aftercare included",
  },
];

const FAQS = [
  {
    question: "How long does a bespoke jewelry commission take?",
    answer:
      "Most custom pieces take six to ten weeks from the first consultation to delivery. Simpler bands can be quicker; complex settings with sourced coloured stones can take longer. We confirm the timeline in writing after the design is approved.",
  },
  {
    question: "How much does custom jewelry cost at PEUU Jewels?",
    answer:
      "Cost depends on the metal, the stones and the complexity of the setting. We give you a full quotation after the consultation and before any work begins, and the price does not change unless you change the design.",
  },
  {
    question: "Can I use my own stones or redesign an heirloom?",
    answer:
      "Yes. We regularly reset inherited stones into new designs. The stone is inspected first — older cuts occasionally have chips or inclusions that affect how they can be set — and we tell you honestly what is possible.",
  },
  {
    question: "Are your gold and gemstones ethically sourced?",
    answer:
      "We work in recycled 18k and 14k gold and platinum, and we choose gemstone suppliers who can name the mine, the cutter and the polisher.",
  },
  {
    question: "How many design revisions do I get?",
    answer:
      "Three rounds of revisions are included in every commission. Additional rounds are possible and are quoted before we proceed.",
  },
  {
    question: "Can bespoke pieces be exchanged or returned?",
    answer:
      "Customized, engraved and personalized pieces are final sale and cannot be exchanged, which is why we take the design approval stage slowly and carefully.",
  },
];

export const Route = createFileRoute("/bespoke")({
  head: () => ({
    meta: [
      { title: "Bespoke Jewelry — The Custom Design Process | PEUU Jewels" },
      {
        name: "description",
        content:
          "How a custom jewelry commission is made at PEUU Jewels: consultation, design, recycled gold and ethically sourced stones, hand setting and finishing.",
      },
      { property: "og:title", content: "Bespoke Jewelry — The Custom Design Process" },
      {
        property: "og:description",
        content:
          "Step by step through a bespoke commission at PEUU Jewels — consultation, sketch, stone selection and hand finishing.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://peuujewels.in/bespoke" },
      { property: "og:image", content: "https://peuujewels.in/ring.jpeg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://peuujewels.in/ring.jpeg" },
    ],
    links: [{ rel: "canonical", href: "https://peuujewels.in/bespoke" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "The PEUU Jewels bespoke jewelry design process",
          description:
            "The five stages of a custom jewelry commission at PEUU Jewels, from consultation to hand-finished delivery.",
          url: "https://peuujewels.in/bespoke",
          step: STEPS.map((s, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: s.title,
            text: s.body,
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://peuujewels.in/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Bespoke",
              item: "https://peuujewels.in/bespoke",
            },
          ],
        }),
      },
    ],
  }),
  component: BespokePage,
});

function BespokePage() {
  return (
    <main className="bg-alabaster pt-24 sm:pt-32">
      <section className="relative mx-auto max-w-5xl px-6 pb-20 pt-16 text-center sm:px-10">
        <FloralMark className="pointer-events-none absolute right-4 top-0 h-40 w-40 text-coral/10" />
        <span className="text-[0.7rem] tracking-luxury uppercase text-rose">Bespoke</span>
        <h1 className="mt-6 font-serif text-5xl leading-tight text-navy sm:text-7xl">
          Custom jewelry, made <em className="italic text-coral/90">to your story</em>.
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-navy/70">
          A bespoke commission at PEUU Jewels takes six to ten weeks and moves through five stages —
          consultation, design, material selection, hand setting, and finishing. Here is exactly what
          happens at each one.
        </p>
        <Link
          to="/concierge"
          className="mt-10 inline-block bg-navy px-10 py-4 text-[0.7rem] tracking-luxury uppercase text-alabaster transition-all hover:bg-navy-soft"
        >
          Begin a commission
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="aspect-[16/8] w-full overflow-hidden bg-cashmere">
          <img
            src="/ring.jpeg"
            alt="A bespoke PEUU Jewels ring being hand set at the bench"
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-28 px-6 py-28 sm:px-10">
        {STEPS.map((s, i) => (
          <motion.article
            key={s.step}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className={`grid gap-10 md:grid-cols-[180px_1fr] ${i % 2 === 1 ? "md:ml-12" : ""}`}
          >
            <div className="text-[0.7rem] tracking-luxury uppercase text-rose md:pt-3">{s.step}</div>
            <div>
              <h2 className="font-serif text-3xl leading-snug text-navy sm:text-4xl">{s.title}</h2>
              <p className="mt-5 text-base leading-relaxed text-navy/75">{s.body}</p>
              <p className="mt-4 text-[0.65rem] tracking-luxury uppercase text-navy/45">{s.detail}</p>
            </div>
          </motion.article>
        ))}
      </section>

      <section className="border-t border-border/60 bg-cashmere/30 py-28">
        <div className="mx-auto max-w-3xl px-6 sm:px-10">
          <span className="text-[0.7rem] tracking-luxury uppercase text-rose">Questions</span>
          <h2 className="mt-5 font-serif text-4xl leading-tight text-navy sm:text-5xl">
            Before you commission
          </h2>
          <dl className="mt-12 divide-y divide-border/60 border-y border-border/60">
            {FAQS.map((f) => (
              <div key={f.question} className="py-7">
                <dt className="font-serif text-xl text-navy">{f.question}</dt>
                <dd className="mt-3 text-sm leading-relaxed text-navy/75">{f.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-navy py-28 text-center text-alabaster">
        <div className="mx-auto max-w-3xl px-6 sm:px-10">
          <h2 className="font-serif text-3xl leading-snug sm:text-5xl">
            Tell us what you have in mind.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-alabaster/70">
            Share the occasion, the person and any stones you already own. A concierge will respond
            personally within one business day.
          </p>
          <Link
            to="/concierge"
            className="mt-10 inline-block border border-alabaster/40 px-10 py-4 text-[0.7rem] tracking-luxury uppercase text-alabaster transition-all hover:bg-alabaster hover:text-navy"
          >
            Speak with the concierge
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
