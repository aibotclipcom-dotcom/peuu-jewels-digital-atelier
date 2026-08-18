REVOKE ALL ON public.coupons FROM anon;
REVOKE ALL ON public.coupons FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;