
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS refund_id text,
  ADD COLUMN IF NOT EXISTS refund_status text;

-- Refresh user-side update policy to permit self-cancellation only under strict conditions.
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can cancel own recent orders" ON public.orders;

CREATE POLICY "Users can cancel own recent orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND status NOT IN ('cancelled','shipped','delivered')
  AND created_at > (now() - interval '24 hours')
)
WITH CHECK (
  auth.uid() = user_id
  AND status = 'cancelled'
);
