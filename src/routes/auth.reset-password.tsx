import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Logo, FloralMark } from "@/components/brand/Logo";

export const Route = createFileRoute("/auth/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create a New Password — PEUU Jewels" },
      {
        name: "description",
        content: "Set a new password for your PEUU Jewels account.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

type Status = "checking" | "ready" | "invalid" | "done";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let settled = false;
    const mark = (s: Status) => {
      if (!settled) {
        settled = true;
        setStatus(s);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        mark("ready");
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) mark("ready");
    });

    const t = setTimeout(() => mark("invalid"), 4000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const m = error.message.toLowerCase();
        if (m.includes("session") || m.includes("jwt") || m.includes("expired")) {
          setStatus("invalid");
          return;
        }
        throw error;
      }
      setStatus("done");
    } catch (err) {
      toast.error((err as Error).message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-alabaster">
      <div className="absolute inset-y-0 left-0 hidden w-1/2 overflow-hidden md:block">
        <div className="absolute inset-0 gradient-cashmere" />
        <FloralMark className="absolute -left-10 top-20 h-96 w-96 text-coral/15" />
        <FloralMark className="absolute bottom-10 right-0 h-80 w-80 rotate-180 text-coral/10" />
        <div className="relative z-10 flex h-full flex-col justify-between p-16">
          <Logo className="max-w-[180px]" />
          <div>
            <h2 className="font-serif text-5xl leading-tight text-navy">
              A new key to <em className="italic text-coral/90">your</em> atelier.
            </h2>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ x: 200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative ml-auto flex min-h-screen w-full flex-col items-center justify-center bg-alabaster px-8 py-24 sm:px-16 md:w-1/2"
      >
        <div className="w-full max-w-sm">
          {status === "checking" && (
            <div className="text-[0.7rem] tracking-luxury uppercase text-navy/55">
              Verifying your link…
            </div>
          )}

          {status === "invalid" && (
            <div>
              <div className="text-[0.7rem] tracking-luxury uppercase text-rose">
                Recovery
              </div>
              <h1 className="mt-3 font-serif text-4xl leading-tight text-navy">
                Reset link expired
              </h1>
              <p className="mt-6 text-sm leading-relaxed text-navy/65">
                This password reset link is no longer valid. Please request a new one.
              </p>
              <button
                type="button"
                onClick={() => navigate({ to: "/auth", search: { mode: "forgot" } })}
                className="mt-8 w-full bg-navy py-4 text-[0.7rem] tracking-luxury uppercase text-alabaster transition-all hover:bg-navy-soft"
              >
                Request New Reset Link
              </button>
            </div>
          )}

          {status === "done" && (
            <div>
              <div className="text-[0.7rem] tracking-luxury uppercase text-rose">Done</div>
              <h1 className="mt-3 font-serif text-4xl leading-tight text-navy">
                Password updated successfully
              </h1>
              <p className="mt-6 text-sm leading-relaxed text-navy/65">
                Your password has been changed successfully.
              </p>
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
                }}
                className="mt-8 w-full bg-navy py-4 text-[0.7rem] tracking-luxury uppercase text-alabaster transition-all hover:bg-navy-soft"
              >
                Sign In
              </button>
            </div>
          )}

          {status === "ready" && (
            <div>
              <div className="text-[0.7rem] tracking-luxury uppercase text-rose">
                Recovery
              </div>
              <h1 className="mt-3 font-serif text-4xl leading-tight text-navy">
                Create a new password
              </h1>

              <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-6">
                <PwdField
                  label="New Password"
                  value={password}
                  onChange={setPassword}
                  show={show}
                />
                <PwdField
                  label="Confirm New Password"
                  value={confirm}
                  onChange={setConfirm}
                  show={show}
                />
                <label className="flex items-center gap-3 text-[0.65rem] tracking-luxury uppercase text-navy/60">
                  <input
                    type="checkbox"
                    checked={show}
                    onChange={(e) => setShow(e.target.checked)}
                    className="h-3 w-3 accent-navy"
                  />
                  Show password
                </label>
                <p className="text-[0.65rem] tracking-wide text-navy/45">
                  Minimum 6 characters. Both fields must match.
                </p>
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-2 w-full bg-navy py-4 text-[0.7rem] tracking-luxury uppercase text-alabaster transition-all hover:bg-navy-soft disabled:opacity-60"
                >
                  {busy ? "Please wait…" : "Update Password"}
                </button>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </main>
  );
}

function PwdField({
  label,
  value,
  onChange,
  show,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
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
        type={show ? "text" : "password"}
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
