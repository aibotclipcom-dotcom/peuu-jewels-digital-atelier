import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Logo, FloralMark } from "@/components/brand/Logo";
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
  const [googleBusy, setGoogleBusy] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleGoogle() {
    setGoogleBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/account` },
      });
      if (error) throw error;
    } catch (err) {
      toast.error((err as Error).message);
      setGoogleBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/account`,
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Welcome to the Maison.");
          navigate({ to: "/account" });
        } else {
          // Email confirmation required
          setAwaitingConfirm(email);
          toast.success("Check your inbox to confirm your email.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.toLowerCase().includes("invalid")) {
            throw new Error(
              "Invalid email or password — or your email isn't confirmed yet.",
            );
          }
          throw error;
        }
        toast.success("Welcome back.");
        navigate({ to: "/account" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    if (!awaitingConfirm) return;
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: awaitingConfirm,
        options: { emailRedirectTo: `${window.location.origin}/account` },
      });
      if (error) throw error;
      toast.success("Confirmation email re-sent.");
    } catch (err) {
      toast.error((err as Error).message);
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
          <Logo className="max-w-[180px]" />
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
          {awaitingConfirm ? (
            <div>
              <div className="text-[0.7rem] tracking-luxury uppercase text-rose">
                Almost there
              </div>
              <h1 className="mt-3 font-serif text-4xl leading-tight text-navy">
                Check your inbox.
              </h1>
              <p className="mt-6 text-sm leading-relaxed text-navy/65">
                We sent a confirmation link to{" "}
                <span className="text-navy">{awaitingConfirm}</span>. Click it to activate your
                account, then return to sign in.
              </p>
              <button
                type="button"
                onClick={resendConfirmation}
                className="mt-8 w-full border border-navy/20 py-4 text-[0.7rem] tracking-luxury uppercase text-navy transition-all hover:bg-navy/5"
              >
                Resend confirmation
              </button>
              <button
                type="button"
                onClick={() => {
                  setAwaitingConfirm(null);
                  setMode("signin");
                }}
                className="mt-6 text-[0.65rem] tracking-luxury uppercase text-navy/60 hover:text-navy"
              >
                ← Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div className="text-[0.7rem] tracking-luxury uppercase text-rose">
                {mode === "signin" ? "VIP Access" : "Join the Maison"}
              </div>
              <h1 className="mt-3 font-serif text-4xl leading-tight text-navy">
                {mode === "signin" ? "Welcome back." : "Begin your atelier."}
              </h1>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleBusy}
                className="mt-10 flex w-full items-center justify-center gap-3 border border-navy/20 py-4 text-[0.7rem] tracking-luxury uppercase text-navy transition-all hover:bg-navy/5 disabled:opacity-60"
              >
                <GoogleIcon />
                {googleBusy ? "Redirecting…" : "Continue with Google"}
              </button>

              <div className="my-8 flex items-center gap-4">
                <span className="h-px flex-1 bg-border/60" />
                <span className="text-[0.6rem] tracking-luxury uppercase text-navy/45">
                  or with email
                </span>
                <span className="h-px flex-1 bg-border/60" />
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
                <div>
                  <Field
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                  />
                  {mode === "signup" && (
                    <p className="mt-2 text-[0.65rem] tracking-wide text-navy/45">
                      Minimum 6 characters.
                    </p>
                  )}
                </div>

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
                {mode === "signin"
                  ? "New to the Maison? Create an account →"
                  : "Already a client? Sign in →"}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.8 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 16.3 4.5 9.7 8.6 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.7 13-4.7l-6-5.1c-2 1.4-4.4 2.3-7 2.3-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.4 16.2 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.4 4.3-4.3 5.7l6 5.1c-.4.4 6.5-4.8 6.5-14.8 0-1.2-.1-2.3-.4-3.5z" />
    </svg>
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
