
DROP POLICY IF EXISTS "Coupons public read active" ON public.coupons;

CREATE OR REPLACE FUNCTION public.coupon_is_claimable(_coupon_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.coupons c
    WHERE c.id = _coupon_id
      AND c.active = true
      AND (c.expires_at IS NULL OR c.expires_at > now())
  )
$$;

REVOKE ALL ON FUNCTION public.coupon_is_claimable(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.coupon_is_claimable(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.lookup_coupon(_code text)
RETURNS TABLE (
  id uuid,
  code text,
  percent_off integer,
  amount_off numeric,
  discount_type text,
  min_order_amount numeric,
  usage_limit integer,
  used_count integer,
  single_use boolean,
  first_order_only boolean,
  active boolean,
  expires_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.code, c.percent_off, c.amount_off, c.discount_type,
         c.min_order_amount, c.usage_limit, c.used_count, c.single_use,
         c.first_order_only, c.active, c.expires_at
  FROM public.coupons c
  WHERE c.code = upper(btrim(_code))
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.lookup_coupon(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_coupon(text) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Redemptions insert self only" ON public.coupon_redemptions;
CREATE POLICY "Redemptions insert self only"
ON public.coupon_redemptions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
  AND char_length(email) >= 3 AND char_length(email) <= 320
  AND used_at IS NULL
  AND order_id IS NULL
  AND (
    ((auth.uid() IS NULL) AND (user_id IS NULL))
    OR ((auth.uid() IS NOT NULL) AND ((user_id IS NULL) OR (user_id = auth.uid()))
        AND (lower(email) = lower(COALESCE((auth.jwt() ->> 'email'), ''))))
  )
  AND public.coupon_is_claimable(coupon_id)
);
