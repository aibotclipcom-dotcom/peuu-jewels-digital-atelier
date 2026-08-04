-- 1. SITE SETTINGS -----------------------------------------------------------
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings are publicly readable"
  ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage site settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_site_settings_updated
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (key, value) VALUES
  ('announcement', jsonb_build_object(
      'enabled', true,
      'text', '🚚 Free Shipping Above ₹599',
      'bg_color', '#0A192F',
      'text_color', '#FAF7F2',
      'link', ''
  )),
  ('shipping', jsonb_build_object(
      'free_shipping_enabled', true,
      'free_shipping_threshold', 599,
      'shipping_charge', 70
  )),
  ('cart', jsonb_build_object(
      'min_order_value', 300,
      'tax_percent', 0,
      'tax_label', 'GST'
  ));

-- 2. CATEGORY CARD IMAGES + SEED ---------------------------------------------
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url text;

UPDATE public.categories SET image_url = '/ring.jpeg',     sort_order = 1 WHERE slug = 'rings';
UPDATE public.categories SET image_url = '/earrings.jpeg', sort_order = 2 WHERE slug = 'earrings';
UPDATE public.categories SET image_url = '/necklace.jpeg', sort_order = 3 WHERE slug = 'necklaces';
UPDATE public.categories SET image_url = '/bracelet.jpeg', sort_order = 5 WHERE slug = 'bracelets';

INSERT INTO public.categories (name, slug, sort_order, is_visible, image_url) VALUES
  ('Pendants',        'pendants',        4,  true, '/necklace.jpeg'),
  ('Bangles',         'bangles',         6,  true, '/bracelet.jpeg'),
  ('Chains',          'chains',          7,  true, '/necklace.jpeg'),
  ('Anklets',         'anklets',         8,  true, '/bracelet.jpeg'),
  ('Nose Pins',       'nose-pins',       9,  true, '/earrings.jpeg'),
  ('Jewellery Sets',  'jewellery-sets',  10, true, '/ring.jpeg')
ON CONFLICT (slug) DO NOTHING;

-- 3. BEST SELLERS -------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_best_seller boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS best_seller_sort integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_best_seller
  ON public.products (is_best_seller, best_seller_sort)
  WHERE is_best_seller;

-- 4. COUPON RULES -------------------------------------------------------------
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS amount_off numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_order_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_limit integer,
  ADD COLUMN IF NOT EXISTS used_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS single_use boolean NOT NULL DEFAULT false;

ALTER TABLE public.coupons
  DROP CONSTRAINT IF EXISTS coupons_discount_type_check;
ALTER TABLE public.coupons
  ADD CONSTRAINT coupons_discount_type_check CHECK (discount_type IN ('percent', 'fixed'));

-- 5. ORDER TOTALS BREAKDOWN ---------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subtotal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_total numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_total numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_total numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS billing_address jsonb;

-- 6. EXTEND THE CUSTOMER SELF-UPDATE GUARD -----------------------------------
CREATE OR REPLACE FUNCTION public.orders_restrict_self_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id             IS DISTINCT FROM OLD.user_id             OR
     NEW.total               IS DISTINCT FROM OLD.total               OR
     NEW.subtotal            IS DISTINCT FROM OLD.subtotal            OR
     NEW.discount_total      IS DISTINCT FROM OLD.discount_total      OR
     NEW.shipping_total      IS DISTINCT FROM OLD.shipping_total      OR
     NEW.tax_total           IS DISTINCT FROM OLD.tax_total           OR
     NEW.coupon_code         IS DISTINCT FROM OLD.coupon_code         OR
     NEW.billing_address     IS DISTINCT FROM OLD.billing_address     OR
     NEW.shipping_address    IS DISTINCT FROM OLD.shipping_address    OR
     NEW.notes               IS DISTINCT FROM OLD.notes               OR
     NEW.payment_method      IS DISTINCT FROM OLD.payment_method      OR
     NEW.razorpay_order_id   IS DISTINCT FROM OLD.razorpay_order_id   OR
     NEW.razorpay_payment_id IS DISTINCT FROM OLD.razorpay_payment_id OR
     NEW.refund_id           IS DISTINCT FROM OLD.refund_id           OR
     NEW.refund_status       IS DISTINCT FROM OLD.refund_status       OR
     NEW.created_at          IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'Only status and cancellation fields may be changed by the order owner'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$function$;