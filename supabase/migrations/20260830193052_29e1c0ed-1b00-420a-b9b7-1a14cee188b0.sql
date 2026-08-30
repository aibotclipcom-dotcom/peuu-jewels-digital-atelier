-- 1. ORDERS: restrict shopper-created orders -------------------------------
CREATE OR REPLACE FUNCTION public.orders_restrict_self_insert()
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

  NEW.status              := 'pending'::order_status;
  NEW.razorpay_payment_id := NULL;
  NEW.payment_method      := NULL;
  NEW.refund_id           := NULL;
  NEW.refund_status       := NULL;
  NEW.cancelled_at        := NULL;
  NEW.total               := 0;
  NEW.subtotal            := 0;
  NEW.discount_total      := 0;
  NEW.shipping_total      := 0;
  NEW.tax_total           := 0;
  NEW.created_at          := now();

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS orders_restrict_self_insert_trg ON public.orders;
CREATE TRIGGER orders_restrict_self_insert_trg
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.orders_restrict_self_insert();

-- 2. ORDER ITEMS: force real product price/name ------------------------------
CREATE OR REPLACE FUNCTION public.order_items_validate_price()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  p RECORD;
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.quantity IS NULL OR NEW.quantity < 1 THEN
    RAISE EXCEPTION 'Invalid quantity' USING ERRCODE = 'check_violation';
  END IF;

  SELECT price, name INTO p FROM public.products WHERE id = NEW.product_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown product' USING ERRCODE = 'foreign_key_violation';
  END IF;

  NEW.unit_price   := p.price;
  NEW.product_name := p.name;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS order_items_validate_price_trg ON public.order_items;
CREATE TRIGGER order_items_validate_price_trg
  BEFORE INSERT OR UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.order_items_validate_price();

-- 3. REVIEWS: no self-approval / self-verification ---------------------------
CREATE OR REPLACE FUNCTION public.product_reviews_restrict_moderation()
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

  IF TG_OP = 'INSERT' THEN
    NEW.approved      := false;
    NEW.verified      := false;
    NEW.helpful_count := 0;
    RETURN NEW;
  END IF;

  -- UPDATE by a non-admin (review owner)
  NEW.verified      := OLD.verified;
  NEW.helpful_count := OLD.helpful_count;
  NEW.user_id       := OLD.user_id;
  NEW.product_id    := OLD.product_id;
  NEW.created_at    := OLD.created_at;

  IF NEW.rating IS DISTINCT FROM OLD.rating
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.body IS DISTINCT FROM OLD.body
     OR NEW.image_urls IS DISTINCT FROM OLD.image_urls THEN
    NEW.approved := false;
  ELSE
    NEW.approved := OLD.approved;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS product_reviews_restrict_moderation_trg ON public.product_reviews;
CREATE TRIGGER product_reviews_restrict_moderation_trg
  BEFORE INSERT OR UPDATE ON public.product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.product_reviews_restrict_moderation();

-- 4. STORAGE: scope public read to public asset prefixes ---------------------
DROP POLICY IF EXISTS "PeuuAssets public read" ON storage.objects;
CREATE POLICY "PeuuAssets public prefix read"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'peuu-assets'
    AND (storage.foldername(name))[1] IN (
      'products', 'hero', 'home', 'home-nav', 'categories', 'for-every-you'
    )
  );

CREATE POLICY "PeuuAssets admin read"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'peuu-assets' AND public.has_role(auth.uid(), 'admin'::app_role));
