import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";

interface Props {
  eyebrow: string;
  title: string;
  effectiveDate: string;
  children: ReactNode;
}

export function LegalLayout({ eyebrow, title, effectiveDate, children }: Props) {
  return (
    <main className="min-h-screen bg-alabaster pt-24 sm:pt-32">
      <article className="mx-auto max-w-3xl px-6 pb-24 sm:px-8">
        <header className="border-b border-border/60 pb-10">
          <div className="text-[0.7rem] tracking-luxury uppercase text-rose">{eyebrow}</div>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-navy sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-sm text-navy/60">{effectiveDate}</p>
        </header>
        <div className="legal-prose mt-12 text-[0.95rem] leading-relaxed text-navy/85">
          {children}
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
