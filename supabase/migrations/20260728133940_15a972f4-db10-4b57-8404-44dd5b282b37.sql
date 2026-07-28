
DROP POLICY IF EXISTS "Redemptions insert public" ON public.coupon_redemptions;

CREATE POLICY "Redemptions insert validated" ON public.coupon_redemptions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND char_length(email) BETWEEN 3 AND 320
    AND EXISTS (
      SELECT 1 FROM public.coupons c
      WHERE c.id = coupon_id
        AND c.active = true
        AND (c.expires_at IS NULL OR c.expires_at > now())
    )
  );
