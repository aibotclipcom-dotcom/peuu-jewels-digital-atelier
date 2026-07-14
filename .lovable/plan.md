
## Findings

### 1. HIGH — Cancel-window UPDATE policy lets a user rewrite non-status columns on their own orders

The RLS policy `Users can cancel own recent orders` on `public.orders` is:

```
UPDATE ... USING  (auth.uid()=user_id AND status NOT IN (cancelled,shipped,delivered) AND created_at > now()-24h)
          CHECK  (auth.uid()=user_id AND status='cancelled')
```

Postgres RLS validates the resulting row against `CHECK`, but does **not** restrict which columns are written. So within the 24h window an authenticated owner can PATCH `/rest/v1/orders?id=eq.<own-id>` with `{status:"cancelled", total:1, razorpay_payment_id:"pay_xxx", shipping_address:{…}, notes:"…"}` and every one of those writes succeeds. What an attacker gets:

- Corrupt their own historical order data (total/shipping/notes) after checkout.
- Overwrite `razorpay_payment_id` — either to a garbage string (breaks refund lookup on cancel-order edge fn) or to another value they know, poisoning the unique-payment idempotency index.
- Because this is bypassable client-side (they don't have to use the edge function), the server-side cancel flow's audit fields (`cancelled_at`, `cancellation_reason`, `refund_id`, `refund_status`) can be forged too.

**Fix:** add a `BEFORE UPDATE` trigger on `public.orders` that, when the caller is not an admin, rejects the update unless only these columns change: `status`, `updated_at`, `cancelled_at`, `cancellation_reason`. Everything else stays server-only (edge function uses service role and bypasses the trigger via a `SECURITY DEFINER` bypass — or the trigger just skips when `current_setting('role')='service_role'`).

### 2. MEDIUM — `wishlist.product_id` has no foreign key

`wishlist` stores `product_id uuid NOT NULL` but no FK to `products(id)`. A signed-in user can insert arbitrary UUIDs (or IDs of unpublished/deleted products) into their own wishlist. Impact is limited (only the owner reads it and joins would just drop unmatched rows), but it's a data-integrity gap and lets a user retain references to unpublished draft products.

**Fix:** `ALTER TABLE public.wishlist ADD CONSTRAINT wishlist_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;` (after deleting any existing orphan rows).

### 3. LOW — Product image `signed URL` valid for ~10 years

`AdminProductEditor.uploadOne` mints a signed URL with TTL `60*60*24*365*10` and stores it in `products.image_urls`. Product imagery is effectively public content, but if any single URL leaks (scraper, referrer header, log), it's exploitable for a decade with no rotation path. The signed-URL approach also means "unpublish" doesn't actually hide the pixels.

**Fix (minimal, no bucket change):** cap TTL at 1 year and re-sign at read time in admin views. **Better:** make `peuu-assets/products/*` publicly readable and store the public URL — signing is cargo-cult for content meant to be seen. Deferring this to keep scope tight; flagging only.

## Accepted / no-fix

- **Contact-form spam & signup abuse.** `contact_messages` allows anon INSERT with Zod-strength length/regex validation but no throttling; `supabase.auth.signUp` has no captcha. Per project constraints there is no standard rate-limiting primitive, so I won't add an ad-hoc one without you confirming the tradeoff. Flag: add hCaptcha via Supabase Auth settings for signup, and either hCaptcha or Cloudflare Turnstile on the concierge form when you're ready.
- **CSP is Report-Only.** Intentional so a missed CDN doesn't break the site; leave as-is until you've watched the report stream for a while.
- **Admin role compromise → full takeover.** Standard for any admin panel; not a bug.
- **10-year token / role manipulation.** JWTs are signed with the project HS256 key held by Supabase Auth; `requireSupabaseAuth` verifies via `getClaims` (JWKS), so forged/expired tokens are rejected. No JWT-side role claim to strip; roles come from `user_roles` via RLS-checked `has_role`.
- **Direct URL guessing to `/admin/*`.** Parent `_authenticated/admin` route calls `getUser()` + `user_roles` check client-side, and every underlying write is gated by `has_role(auth.uid(),'admin')` in RLS — you cannot mutate products/orders as a non-admin by hand-crafting requests.
- **`.env`, `.git`, health endpoints.** No `/api/health` or admin panel exposed; `.env` is only server-injected values, and the published Cloudflare Worker doesn't serve dotfiles from `public/`.

## Implementation

1. Migration:
   - Delete orphan `wishlist` rows where `product_id` has no matching product.
   - Add `wishlist_product_id_fkey`.
   - Create `public.orders_restrict_self_update()` trigger function and `orders_restrict_self_update_trg BEFORE UPDATE` trigger that raises when the caller is not `service_role` AND columns other than `{status, updated_at, cancelled_at, cancellation_reason}` differ between `OLD` and `NEW`.
2. No app code changes required — the cancel-order edge function already runs with `SERVICE_ROLE` and only writes the allowed columns, so it's unaffected.
3. Manually verify by attempting `supabase.from('orders').update({total: 1}).eq('id', myOrder)` from the browser console; expect `permission denied` / trigger raise.

## Files touched

- New migration under `supabase/migrations/` (via migration tool).
- No source files changed.
