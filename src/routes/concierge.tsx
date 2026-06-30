import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/concierge")({
  head: () => ({
    meta: [
      { title: "Concierge — PEUU Jewels" },
      { name: "description", content: "Speak with a PEUU Jewels concierge — bespoke commissions, private appointments, and quiet advice." },
      { property: "og:title", content: "Concierge — PEUU Jewels" },
      { property: "og:description", content: "Reach out to the PEUU Jewels concierge — bespoke and personal." },
    ],
  }),
  component: ConciergePage,
});

function ConciergePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert({ name, email, message });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Your note has been received.", {
      description: "A concierge will respond within one business day.",
    });
    setName("");
    setEmail("");
    setMessage("");
  }

  return (
    <main className="min-h-screen bg-alabaster pt-24 sm:pt-32">
      <section className="mx-auto grid max-w-6xl gap-20 px-6 py-20 sm:px-10 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
        >
          <span className="text-[0.7rem] tracking-luxury uppercase text-rose">Concierge</span>
          <h1 className="mt-6 font-serif text-5xl leading-tight text-navy sm:text-6xl">
            A private <em className="italic text-coral/90">conversation</em>.
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-navy/70">
            Whether you have a question, a request, or the seed of a bespoke commission, we would
            love to hear from you. Our concierge will respond personally within one business day.
          </p>

          <div className="mt-12 space-y-6 border-t border-border/60 pt-8 text-sm">
            <div>
              <div className="text-[0.6rem] tracking-luxury uppercase text-navy/50">Atelier</div>
              <div className="mt-1 text-navy">Maison PEUU · By appointment only</div>
            </div>
            <div>
              <div className="text-[0.6rem] tracking-luxury uppercase text-navy/50">Concierge</div>
              <div className="mt-1 text-navy">concierge@peuujewels.com</div>
            </div>
            <div>
              <div className="text-[0.6rem] tracking-luxury uppercase text-navy/50">Hours</div>
              <div className="mt-1 text-navy">Tuesday – Saturday · 10h – 18h</div>
            </div>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-10"
        >
          <FloatingField label="Your name" value={name} onChange={setName} />
          <FloatingField label="Email address" type="email" value={email} onChange={setEmail} />
          <FloatingField label="Your message" value={message} onChange={setMessage} textarea />

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 self-start bg-navy px-10 py-4 text-[0.7rem] tracking-luxury uppercase text-alabaster transition-all hover:bg-navy-soft disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send to Concierge"}
          </button>
        </motion.form>
      </section>
      <SiteFooter />
    </main>
  );
}

function FloatingField({
  label,
  value,
  onChange,
  type = "text",
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  textarea?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;
  const sharedProps = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    className:
      "w-full bg-transparent border-0 border-b border-border/70 pb-3 pt-6 text-navy outline-none transition-colors focus:border-navy",
  };
  return (
    <label className="relative block">
      <span
        className={`pointer-events-none absolute left-0 text-[0.7rem] tracking-luxury uppercase transition-all ${
          lifted ? "top-0 text-navy/55" : "top-7 text-navy/45"
        }`}
      >
        {label}
      </span>
      {textarea ? (
        <textarea rows={4} {...sharedProps} />
      ) : (
        <input type={type} {...sharedProps} />
      )}
    </label>
  );
}
