import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Deletes the signed-in user's account. Scrubs order PII first so historical
 * orders (which may be needed for accounting) do not retain personal data,
 * then removes the auth user — cascading FKs clean up profiles, roles,
 * wishlist, and contact_messages.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Scrub PII on the caller's orders (RLS scopes this to the caller).
    await supabase
      .from("orders")
      .update({ shipping_address: null, notes: null })
      .eq("user_id", userId);

    // Delete rows the caller can delete under RLS.
    await supabase.from("wishlist").delete().eq("user_id", userId);

    // Auth admin deletion cascades to profiles / user_roles / etc.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
