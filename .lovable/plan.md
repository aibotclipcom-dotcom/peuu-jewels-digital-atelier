
## Task 1 — Fix Google Sign-In (Supabase + Lovable broker)

**Diagnosis:** `src/routes/auth.tsx` calls `supabase.auth.signInWithOAuth({ provider: "google" })` directly. In the Lovable preview iframe this often silently fails or bounces without a session. The stack requires the Lovable OAuth broker.

**Fix:**
- Replace direct Supabase call with `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth/callback" })`.
- Create public route `src/routes/auth.callback.tsx` (SSR-safe) that waits for `supabase.auth.getSession()` / `onAuthStateChange`, then navigates to a saved `sessionStorage("post_auth_redirect")` path (default `/account`). Never point OAuth at a protected route.
- Robust error handling: try/catch around the broker call, `toast.error("Google Sign-In failed. Please try again.")` with the specific error appended when useful; reset `googleBusy` in `finally`.
- Session persistence: verify by relying on the existing browser client (already persists to localStorage); the root `onAuthStateChange` subscriber in `__root.tsx` invalidates the router on `SIGNED_IN`/`SIGNED_OUT`. No changes to `_authenticated/route.tsx` (integration-managed).
- Note: this project uses Supabase Auth, not Auth0 (per user confirmation).

## Task 2 — Mandatory shipping details before order

**Schema (single migration):**
- Extend `public.profiles` with nullable columns: `phone text`, `street_address text`, `city text`, `state text`, `postal_code text`, `country text default 'IN'`. Users read/write own row (policies already exist).
- `public.orders` already has `shipping_address jsonb` and `notes text` — reuse.

**New dedicated `/checkout` page** (`src/routes/_authenticated/checkout.tsx`):
- Protected by existing `_authenticated` gate. If cart is empty → redirect to `/boutique`.
- Loads profile via TanStack Query and prefills the form.
- Fields (all required unless noted), validated with `zod` + `react-hook-form`:
  - Full Name (min 2)
  - Phone (regex: `^\+?[0-9\s\-]{7,15}$`, normalized)
  - Street Address (min 5)
  - City, State (min 2 each)
  - Postal/ZIP Code (regex: `^[A-Za-z0-9\s\-]{3,10}$`; India-friendly)
  - Notes (optional textarea)
- UI/UX: shadcn `Input`/`Textarea`/`Label`, red border + inline error text on invalid fields, submit button shows spinner (`Loader2`) and is disabled while submitting; a "Save these details to my profile for next time" checkbox (default on).
- Order summary sidebar with line items + total, matching the atelier design (navy/alabaster/serif).
- On submit:
  1. Upsert profile columns (if checkbox on).
  2. Set local `pendingCheckout = { shipping, notes }` in cart context and open Razorpay via existing `createRazorpayOrder`.
  3. Extend `verifyRazorpayPayment` server fn to accept `shipping` + `notes` and persist them onto the created `orders` row (`shipping_address` jsonb, `notes` text).
  4. Concierge path: same — insert with `shipping_address` + `notes`.
- Cart drawer's current "Pay with Razorpay" / "Concierge" buttons become "Continue to Checkout" → navigates to `/checkout` (guarded: prompts sign-in if not authed, same as today).

**Account editor:** add an "Address & Contact" card on `/account` with the same form (reused component `<ShippingDetailsForm />`), saving to `profiles`.

## Task 3 — Legal pages

- `src/routes/privacy-policy.tsx` and `src/routes/terms-of-service.tsx`: public routes, each with route-specific `head()` (title, description, og:title/description).
- Shared `<LegalLayout>` component: `max-w-3xl mx-auto px-6 py-24`, serif h1, semantic h2/h3, `prose`-like spacing with tailwind utilities (leading-relaxed, spacing between sections), bulleted lists, `<strong>` for emphasis, responsive.
- Inject the exact provided copy verbatim (Effective Date July 2026, all 11/13 sections, contact block).
- Add "Privacy Policy" and "Terms of Service" links to a new "Legal" column in `SiteFooter.tsx`.

## Files touched

**Create**
- `src/routes/auth.callback.tsx`
- `src/routes/_authenticated/checkout.tsx`
- `src/routes/privacy-policy.tsx`
- `src/routes/terms-of-service.tsx`
- `src/components/checkout/ShippingDetailsForm.tsx`
- `src/components/legal/LegalLayout.tsx`
- Migration adding profile address columns.

**Edit**
- `src/routes/auth.tsx` — use `lovable.auth.signInWithOAuth`, better toast.
- `src/components/layout/CartDrawer.tsx` — swap pay/concierge buttons for "Continue to Checkout".
- `src/lib/payments.functions.ts` — accept and persist `shipping` + `notes` on both server fns.
- `src/routes/_authenticated/account.tsx` — add address editor card.
- `src/components/layout/SiteFooter.tsx` — add Legal links.

**No changes** to `_authenticated/route.tsx`, `start.ts`, or auth-attacher (integration-managed).

## Verification

- Playwright: sign in with restored Supabase session, load `/checkout` with cart items, submit invalid form → assert red errors, submit valid → verify Razorpay modal opens and order row includes `shipping_address` + `notes`.
- Visit `/privacy-policy` and `/terms-of-service` from footer links.
