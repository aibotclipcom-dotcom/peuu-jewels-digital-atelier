CREATE OR REPLACE FUNCTION public.orders_restrict_self_insert()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user = 'service_role'
     OR auth.role() = 'service_role'
     OR current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  NEW.status := 'pending'::order_status;
  NEW.razorpay_payment_id := NULL; NEW.payment_method := NULL;
  NEW.refund_id := NULL; NEW.refund_status := NULL; NEW.cancelled_at := NULL;
  NEW.total := 0; NEW.subtotal := 0; NEW.discount_total := 0;
  NEW.shipping_total := 0; NEW.tax_total := 0; NEW.created_at := now();
  RETURN NEW;
END;
$function$;