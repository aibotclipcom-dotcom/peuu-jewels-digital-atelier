import { createServerFn } from "@tanstack/react-start";

const WELCOME_CODE = "WELCOME10";
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Claims the public first-order welcome coupon for an email address.
 * Runs entirely server-side so the coupon tables and their lookup functions
 * are never reachable from the browser.
 */
export const claimWelcomeCoupon = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string }) => {
    const email = String(data?.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 320) {
      throw new Error("Please enter a valid email address.");
    }
    return { email };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rows } = await supabaseAdmin.rpc("lookup_coupon", { _code: WELCOME_CODE });
    const coupon = Array.isArray(rows) ? rows[0] : rows;
    if (!coupon || !coupon.active) throw new Error("Offer unavailable.");
    if (coupon.expires_at && new Date(coupon.expires_at as string) < new Date()) {
      throw new Error("Offer unavailable.");
    }

    const { data: existing } = await supabaseAdmin
      .from("coupon_redemptions")
      .select("used_at")
      .eq("coupon_id", coupon.id)
      .eq("email", data.email)
      .maybeSingle();

    if (existing?.used_at) {
      return { code: WELCOME_CODE, alreadyUsed: true as const };
    }

    await supabaseAdmin
      .from("coupon_redemptions")
      .upsert({ coupon_id: coupon.id, email: data.email }, { onConflict: "coupon_id,email" });

    return { code: WELCOME_CODE, alreadyUsed: false as const };
  });
