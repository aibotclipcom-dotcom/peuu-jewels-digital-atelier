import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({ meta: [{ title: "Signing you in… — PEUU Jewels" }] }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;

    async function finish(dest: string) {
      if (done) return;
      done = true;
      try {
        sessionStorage.removeItem("peuu_post_auth_redirect");
      } catch {}
      await navigate({ to: dest, replace: true });
    }

    function getDest() {
      try {
        const saved = sessionStorage.getItem("peuu_post_auth_redirect");
        if (saved && saved.startsWith("/")) return saved;
      } catch {}
      return "/account";
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) finish(getDest());
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        toast.error("Google Sign-In failed. Please try again.");
        finish("/auth");
        return;
      }
      if (data.session) finish(getDest());
    });

    const t = setTimeout(() => {
      if (!done) {
        toast.error("Sign-in is taking longer than expected.");
        finish("/auth");
      }
    }, 8000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, [navigate]);

  return (
    <main className="grid min-h-screen place-items-center bg-alabaster">
      <div className="text-center">
        <div className="text-[0.7rem] tracking-luxury uppercase text-rose">One moment</div>
        <div className="mt-3 font-serif text-3xl text-navy">Signing you in…</div>
      </div>
    </main>
  );
}
