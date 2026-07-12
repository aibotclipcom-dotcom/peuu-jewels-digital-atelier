## Order cancellation feature

### Note on architecture
The user is explicitly asking for a **Supabase Edge Function (Deno)** for this logic. This project's other server logic uses TanStack server functions (`createServerFn`), which is the stack's default pattern. I'll honor the explicit request and create an Edge Function as asked. All Razorpay/Supabase secrets stay on the server via `Deno.env.get(...)`.

### 1. Database migration
Add cancellation metadata to `orders` and allow the user to update their own order to `cancelled`:
- Add columns: `cancelled_at timestamptz`, `cancellation_reason text`, `refund_id text`, `refund_status text`.
- Extend the existing user-update RLS policy on `orders` so a user can transition their own order to `cancelled` only when `status NOT IN ('cancelled','shipped','delivered')` and `created_at > now() - interval '24 hours'`. (Backend still re-checks; RLS is defense in depth.)

### 2. Edge Function `supabase/functions/cancel-order/index.ts` (Deno)
- Reads `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` via `Deno.env.get(...)`. No secrets in frontend.
- CORS preflight handling.
- Authenticates the caller: extract `Authorization: Bearer <token>` from the request, call `supabase.auth.getUser(token)` using an anon client to resolve `user.id`. Reject 401 if missing/invalid.
- Uses a service-role admin client to:
  1. Fetch the order by `orderId`.
  2. Verify `order.user_id === user.id` (403 otherwise).
  3. Verify `status` is not `cancelled`, `shipped`, or `delivered` (409 otherwise).
  4. Verify `Date.now() - new Date(order.created_at).getTime() < 24 * 60 * 60 * 1000` (409 otherwise) — server-side truth, not frontend.
  5. If `payment_method === 'razorpay'` and `razorpay_payment_id` present, POST to `https://api.razorpay.com/v1/payments/{id}/refund` with Basic auth (`RAZORPAY_KEY_ID:RAZORPAY_KEY_SECRET`). Capture `refund.id` and `refund.status`.
  6. Update order: `status='cancelled'`, `cancelled_at=now()`, `cancellation_reason`, `refund_id`, `refund_status`.
- Returns `{ ok: true, refund: {...} | null }` or a typed error with proper status code.
- Config entry in `supabase/config.toml` with `verify_jwt = true`.

### 3. Frontend — `src/routes/_authenticated/account.tsx`
Inside the order-history list item:
- Helper `canCancel(order)`: `Date.now() - new Date(order.created_at).getTime() < 24*3600*1000` AND `!['cancelled','shipped','delivered'].includes(order.status)`.
- Render **Cancel order** button only when `canCancel(order)` is true.
- On click: confirm dialog → optional reason prompt → `supabase.functions.invoke('cancel-order', { body: { orderId: o.id, reason } })` → toast success/error → `qc.invalidateQueries({ queryKey: ['account-orders', user.id] })`.
- Local `cancellingId` state to disable the button while in-flight.
- Show "Refund initiated" hint when the response includes a refund id.

### 4. Files touched
- New: `supabase/functions/cancel-order/index.ts`
- Edit: `supabase/config.toml` (register function)
- New: migration for orders columns + RLS
- Edit: `src/routes/_authenticated/account.tsx` (cancel button + handler)

### Out of scope
No changes to Razorpay create/verify flow, no admin-side cancel UI, no partial refunds.
