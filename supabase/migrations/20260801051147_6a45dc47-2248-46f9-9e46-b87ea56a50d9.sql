DROP POLICY IF EXISTS "Redemptions insert validated" ON public.coupon_redemptions;

CREATE POLICY "Redemptions insert self only"
ON public.coupon_redemptions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(email) BETWEEN 3 AND 320
  AND used_at IS NULL
  AND order_id IS NULL
  AND (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (
      auth.uid() IS NOT NULL
      AND (user_id IS NULL OR user_id = auth.uid())
      AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
  AND EXISTS (
    SELECT 1 FROM public.coupons c
    WHERE c.id = coupon_redemptions.coupon_id
      AND c.active = true
      AND (c.expires_at IS NULL OR c.expires_at > now())
  )
);