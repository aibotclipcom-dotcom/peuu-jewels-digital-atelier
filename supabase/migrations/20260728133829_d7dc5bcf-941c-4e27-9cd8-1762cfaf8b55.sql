
-- 1. Remove self-cancel policy (feature removed)
DROP POLICY IF EXISTS "Users can cancel own recent orders" ON public.orders;

-- 2. Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  percent_off int NOT NULL CHECK (percent_off > 0 AND percent_off <= 100),
  first_order_only boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coupons public read active" ON public.coupons FOR SELECT
  TO anon, authenticated USING (active = true);
CREATE POLICY "Coupons admin manage" ON public.coupons FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Coupon redemptions
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  email text NOT NULL,
  user_id uuid,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  UNIQUE (coupon_id, email)
);
GRANT SELECT, INSERT ON public.coupon_redemptions TO anon, authenticated;
GRANT ALL ON public.coupon_redemptions TO service_role;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
-- Anyone can claim (insert) with their email; reads restricted to self or admin.
CREATE POLICY "Redemptions insert public" ON public.coupon_redemptions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Redemptions self read" ON public.coupon_redemptions FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Seed default coupon
INSERT INTO public.coupons (code, percent_off, first_order_only, active)
VALUES ('WELCOME10', 10, true, true)
ON CONFLICT (code) DO NOTHING;
