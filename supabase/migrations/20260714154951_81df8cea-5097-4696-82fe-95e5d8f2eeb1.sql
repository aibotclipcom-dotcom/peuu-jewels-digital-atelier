
CREATE OR REPLACE FUNCTION public.orders_restrict_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id             IS DISTINCT FROM OLD.user_id             OR
     NEW.total               IS DISTINCT FROM OLD.total               OR
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
$$;

DROP TRIGGER IF EXISTS orders_restrict_self_update_trg ON public.orders;
CREATE TRIGGER orders_restrict_self_update_trg
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.orders_restrict_self_update();
