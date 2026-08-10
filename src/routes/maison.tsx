import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FloralMark } from "@/components/brand/Logo";

export const Route = createFileRoute("/maison")({
  head: () => ({
    meta: [
      { title: "OUR STORY — PEUU Jewels" },
      { name: "description", content: "Inside the PEUU Jewels atelier — our heritage, craftsmanship, and the hands that shape every piece." },
      { property: "og:title", content: "OUR STORY — PEUU Jewels" },
      { property: "og:description", content: "The story, the heritage, and the craftsmanship behind PEUU Jewels." },
      { property: "og:image", content: "https://peuujewels.lovable.app/ring.jpeg" },
      { property: "og:url", content: "https://peuujewels.lovable.app/maison" },
      { property: "twitter:image", content: "https://peuujewels.lovable.app/ring.jpeg" },
    ],
    links: [{ rel: "canonical", href: "https://peuujewels.lovable.app/maison" }],
  }),
  component: MaisonPage,
});


const CHAPTERS = [
  {
    eyebrow: "",
    title: "A small atelier with an unwavering belief.",
    body: (
      <div className="space-y-4">
        <div>
          &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Every journey begins with a subtle dream and a deep-rooted belief. For me, the story of PEUU Jewels was no different—it was born out of pure dedication and heartfelt emotion. That "unwavering belief" is far more than just words; it is the very Founder upon which we stand.&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;
        </div>
        <div>
          &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;We took our first step with a single conviction: that a piece of jewelry should never be a more accessory, but a quiet companion to a life. From day one, our vision has extended beyond crafting fine ornaments—we strive to become a meaningful part of the story you live every day.
        </div>
      </div>
    ),
  },
  {
    eyebrow: "",
    title: "A Legacy of Love: The Heartbeat of PEUU.",
    body: "              Behind every piece we craft at PEUU Jewels is a personal story, and the deepest one is our own. This brand was founded in profound dedication to our beloved late sister. Her spirit, her love for beauty and meaningful things, inspired us. PEUU Jewels is not just a creation of metal and stone; it is a living tribute. Her name, and her memory, are the heartbeat of our atelier, guiding every quiet companion we create.",
  },
  {
    eyebrow: "",
    title: "A Shared Dream, An Unshakable Legacy",
    body: (
      <div className="space-y-6">
        <div>
          &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Miss. Priyanka Bhujbal — Our Eternal Muse & Soul
        </div>
        <div className="space-y-4">
          <div>
            &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; PEUU Jewels was created in her loving memory. She is the heart of this brand, and her spirit continues to inspire the warmth, elegance, and meaning behind every creation we release.
          </div>
          <div>
            &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Miss. Tanvi Parteti & Mr. Pritesh Bhujbal — Guardians of the Vision
          </div>
          <div className="pl-0">
            The driving forces who steer and manage PEUU Jewels every single day. Together, they channel their passion, creativity, and hard work to turn a personal legacy into a living reality.
          </div>
          <div>
            &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Mrs. Archana Bhujbal & Mr. Ganesh Bhujbal — Our Founder & Pillars of Strength&nbsp;The backbone of this entire journey. Without their selfless support, constant sacrifices, and unwavering belief, PEUU Jewels would never have taken root, nor reached the heights it stands at today.
          </div>
        </div>
      </div>
    ),
  },
  {
    eyebrow: "",
    title: "Our Mission ",
    body: (
      <div className="space-y-4">
        <div>
          &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;At PEUU JEWELS, our mission is to make everyday luxury, elegance, and durability accessible to everyone at unbeatable prices. Our vision is to ensure you can wear stunning, high-quality jewelry every single day without worrying about color fading or skin irritation.
        </div>
        <div>
          &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;We craft 18k gold-plated, anti-tarnish, waterproof, and sweatproof accessories designed to effortlessly suit your active lifestyle. From elegant enamel rings to unique bracelets and statement neckpieces, every single piece is 100% hypoallergenic and crafted with care. Premium quality, unique designs, and lasting shine—now within your budget.
        </div>
      </div>
    ),
  },
];

function MaisonPage() {
  return (
    <main className="bg-alabaster pt-24 sm:pt-32">
      <section className="relative mx-auto max-w-5xl px-6 pb-24 pt-16 text-center sm:px-10">
        <FloralMark className="pointer-events-none absolute left-4 top-0 h-40 w-40 text-coral/10" />
        <span className="text-[0.7rem] tracking-luxury uppercase text-rose">Our Story</span>
        <h1 className="mt-6 font-serif text-5xl leading-tight text-navy sm:text-7xl">
          PEUU&nbsp; JEWELS — A Legacy of Love, Crafted to Last
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-navy/70">
          PEUU JEWELS was born from a family legacy of love and careful craft. We make everyday
          luxury accessible: 18k gold-plated, anti-tarnish, waterproof and sweatproof pieces that
          are 100% hypoallergenic — designed to keep their shine through the life you actually
          live, at prices that feel fair.
        </p>

      </section>

      <section className="mx-auto max-w-6xl px-6 sm:px-10">
        <div className="aspect-[16/8] w-full overflow-hidden bg-cashmere">
          <img src="/necklace.jpeg" alt="Inside the PEUU atelier" className="h-full w-full object-cover" />
        </div>
      </section>

      <section className="relative mx-auto max-w-4xl space-y-32 px-6 py-32 sm:px-10">
        {CHAPTERS.map((c, i) => (
          <motion.article
            key={i}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-10 md:grid-cols-[180px_1fr]"
          >
            <div className="text-[0.7rem] tracking-luxury uppercase text-rose md:pt-3">
              {c.eyebrow}
            </div>
            <div>
              <h2 className="font-serif text-3xl leading-snug text-navy sm:text-4xl">{c.title}</h2>
              <div className="mt-5 text-base leading-relaxed text-navy/75">{c.body}</div>
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
          <p className="mt-6 text-[0.7rem] tracking-luxury uppercase text-gold-soft">| PEUU JEWELS |&nbsp;&nbsp;</p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
