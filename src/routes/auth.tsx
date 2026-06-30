import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { FloralMark } from "@/components/brand/Logo";
import { z } from "zod";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "VIP Access — PEUU Jewels" },
      { name: "description", content: "Sign in or join the PEUU Jewels VIP atelier." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initialMode } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/account`,
          },
        });
        if (error) throw error;
        toast.success("Welcome to the Maison.", { description: "Check your inbox to confirm." });
        navigate({ to: "/account" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        navigate({ to: "/account" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-alabaster">
      {/* Editorial half */}
      <div className="absolute inset-y-0 left-0 hidden w-1/2 overflow-hidden md:block">
        <div className="absolute inset-0 gradient-cashmere" />
        <FloralMark className="absolute -left-10 top-20 h-96 w-96 text-coral/15" />
        <FloralMark className="absolute bottom-10 right-0 h-80 w-80 rotate-180 text-coral/10" />
        <div className="relative z-10 flex h-full flex-col justify-between p-16">
          <div className="font-serif text-2xl tracking-[0.2em] text-navy">PEUU JEWELS</div>
          <div>
            <h2 className="font-serif text-5xl leading-tight text-navy">
              The Maison <em className="italic text-coral/90">remembers</em> you.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-navy/65">
              Your account holds your wishlist, your order history, and a direct line to your
              concierge.
            </p>
          </div>
        </div>
      </div>

      {/* Auth panel */}
      <motion.div
        initial={{ x: 200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative ml-auto flex min-h-screen w-full flex-col items-center justify-center bg-alabaster px-8 py-24 sm:px-16 md:w-1/2"
      >
        <div className="w-full max-w-sm">
          <div className="text-[0.7rem] tracking-luxury uppercase text-rose">
            {mode === "signin" ? "VIP Access" : "Join the Maison"}
          </div>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-navy">
            {mode === "signin" ? "Welcome back." : "Begin your atelier."}
          </h1>

          <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
            <AnimatePresence initial={false}>
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Field label="Full name" value={name} onChange={setName} />
                </motion.div>
              )}
            </AnimatePresence>
            <Field label="Email" type="email" value={email} onChange={setEmail} />
            <Field label="Password" type="password" value={password} onChange={setPassword} />

            <button
              type="submit"
              disabled={busy}
              className="mt-4 w-full bg-navy py-4 text-[0.7rem] tracking-luxury uppercase text-alabaster transition-all hover:bg-navy-soft disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-8 text-[0.65rem] tracking-luxury uppercase text-navy/60 hover:text-navy"
          >
            {mode === "signin" ? "New to the Maison? Create an account →" : "Already a client? Sign in →"}
          </button>
        </div>
      </motion.div>
    </main>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;
  return (
    <label className="relative block">
      <span
        className={`pointer-events-none absolute left-0 text-[0.7rem] tracking-luxury uppercase transition-all ${
          lifted ? "top-0 text-navy/55" : "top-7 text-navy/45"
        }`}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required
        className="w-full bg-transparent border-0 border-b border-border/70 pb-3 pt-6 text-navy outline-none transition-colors focus:border-navy"
      />
    </label>
  );
}
