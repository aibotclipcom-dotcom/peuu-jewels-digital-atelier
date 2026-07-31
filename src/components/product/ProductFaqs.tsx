import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Faq = { id: string; question: string; answer: string };

export function ProductFaqs({ productId }: { productId: string }) {
  const { data: productFaqs = [] } = useQuery({
    queryKey: ["product-faqs", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_faqs")
        .select("id, question, answer")
        .eq("product_id", productId)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Faq[];
    },
  });

  const { data: globalFaqs = [] } = useQuery({
    queryKey: ["global-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_faqs")
        .select("id, question, answer")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Faq[];
    },
  });

  const faqs = [...productFaqs, ...globalFaqs];
  if (faqs.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1400px] border-t border-border/60 px-6 py-16 sm:px-10">
      <div className="text-[0.65rem] tracking-luxury uppercase text-rose">Questions</div>
      <h2 className="mt-3 font-serif text-3xl text-navy sm:text-4xl">Good to know</h2>
      <div className="mt-8 max-w-3xl divide-y divide-border/60 border-y border-border/60">
        {faqs.map((f) => (
          <FaqItem key={f.id} faq={f} />
        ))}
      </div>
    </section>
  );
}

function FaqItem({ faq }: { faq: Faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-6 py-5 text-left"
      >
        <span className="font-serif text-lg text-navy">{faq.question}</span>
        {open ? (
          <Minus className="h-4 w-4 shrink-0 text-navy/60" strokeWidth={1.4} />
        ) : (
          <Plus className="h-4 w-4 shrink-0 text-navy/60" strokeWidth={1.4} />
        )}
      </button>
      {open && (
        <p className="-mt-1 max-w-2xl pb-6 text-sm leading-relaxed text-navy/70">{faq.answer}</p>
      )}
    </div>
  );
}
