-- Coupon lookup helpers are now called only by trusted server code (service_role).
REVOKE EXECUTE ON FUNCTION public.lookup_coupon(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.coupon_is_claimable(uuid) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_coupon(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.coupon_is_claimable(uuid) TO service_role;

-- Claims are written server-side only; drop the client insert path.
DROP POLICY IF EXISTS "Redemptions insert self only" ON public.coupon_redemptions;

CREATE POLICY "Redemptions no client insert"
  ON public.coupon_redemptions FOR INSERT TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "Redemptions no client update"
  ON public.coupon_redemptions FOR UPDATE TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "Redemptions no client delete"
  ON public.coupon_redemptions FOR DELETE TO anon, authenticated
  USING (false);

REVOKE INSERT, UPDATE, DELETE ON public.coupon_redemptions FROM anon, authenticated;
GRANT ALL ON public.coupon_redemptions TO service_role;