## Scoped pre-deploy security hardening

The five prompts overlap heavily and cover a lot that's already done in this codebase (RLS everywhere, roles in `user_roles` + `has_role`, server-side price re-calc, Razorpay signature verify, unique `razorpay_payment_id` for replay, 24h cancel re-checked server-side, no service role in client code, passwords via Supabase Auth = bcrypt-family). I'll do a real pass on what's still missing rather than repeat the ceremony.

### What I'll change

1. **Secrets hygiene**
  - Add `.env` (and `.env.local`, `.dev.vars`) to `.gitignore`.
  - Create `.env.example` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` (public/anon safe) plus commented server-only names (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) marked "set as supabase **Edge Functions Secrets**, never commit".
  - Add a README "Security & secrets" section noting: anon key is public-safe because RLS is enforced; if any secret was ever committed rotate it.
2. **Security response headers** (via a new `securityHeaders` requestMiddleware in `src/start.ts`)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Content-Security-Policy` scoped to self + Supabase + Razorpay checkout + Google fonts (report-only header to avoid breaking the site if a CDN moves).
3. **CORS on the one public surface**
  - Tighten `supabase/functions/cancel-order` `Access-Control-Allow-Origin: *` to the published + preview origins from an allow-list (echo back the caller's `Origin` only if it matches). The function is already JWT-verified, but this closes CSRF-from-browser noise.
4. **Log/error redaction**
  - `src/lib/payments.functions.ts` currently logs the raw Razorpay error body. Trim to status + generic message so payment IDs / metadata don't hit logs.
  - Confirm no other `console.*` leaks PII (already clean — only `__root.tsx` logs the error object, which is fine).
5. **Input validation on `concierge` / contact form**
  - Wire Zod (already in deps): `name ≤100`, `email` valid + ≤255, `message` 10–2000, trimmed, before insert. RLS insert policy already enforces shape; this gives a clean client-side error too.
6. **Account deletion (GDPR-style)**
  - New protected server fn `deleteMyAccount` (uses `requireSupabaseAuth`, then loads `supabaseAdmin` inside the handler) that:
    - deletes rows in `wishlist`, `contact_messages`, `order_items` (only for the user's orders), anonymises `orders` (keep for accounting, null-out `shipping_address`/`notes`, set `user_id = null` after adding a nullable FK migration — or simpler: keep `user_id` but scrub PII columns), deletes `profiles`, `user_roles`, then `auth.admin.deleteUser(userId)`.
  - Migration: allow `orders.user_id` to be nullable OR add `orders.deleted_user` flag + scrub columns. I'll go with **scrub-in-place**: null out `shipping_address`, `notes`, keep `user_id` (RLS still fine, row becomes inaccessible to any real user).
  - UI: "Delete my account" section in `/account` with a typed-confirmation modal.
7. **Auth callback safety**
  - Verify `auth.callback.tsx` only redirects to same-origin relative paths from the saved `next` param (reject absolute URLs / protocol-relative). Small guard if missing.

### Explicitly NOT doing (with reasoning)

- **Rate limiting** on login/signup/OTP — Supabase Auth already rate-limits these at the provider level, and the platform has no standard rate-limit primitive for app code (per project rules). I'll note this in the README.
- **httpOnly cookies for the session** — Supabase JS uses `localStorage` by design; changing it would require rewriting auth to SSR cookie flow. Out of scope for a hardening pass.
- **CSP `strict-dynamic` / nonce** — Razorpay checkout injects inline scripts; a nonce flow needs an SSR nonce plumbed through. Shipping a permissive-but-scoped CSP instead.
- Repeating fixes already applied in earlier turns (price manipulation, payment replay, RLS split, `has_role` SECURITY INVOKER, sitemap/robots, etc.).

### Deliverable

A single change set + one migration (only if the account-deletion scrub needs a column tweak — likely not), a short chat summary listing: (a) every secret found and where it lives, (b) data-flow map (collection → storage → third-party), (c) pre-deploy checklist with pass/fix per item.