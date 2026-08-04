-- Never allow negative inventory
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_stock_non_negative;
ALTER TABLE public.products
  ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0);

-- Atomically consume stock for a paid order.
-- _items: [{"id": "<uuid>", "quantity": 2}, ...]
CREATE OR REPLACE FUNCTION public.consume_product_stock(_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  cur_stock integer;
  prod_name text;
BEGIN
  FOR rec IN
    SELECT (elem->>'id')::uuid AS id,
           GREATEST((elem->>'quantity')::int, 0) AS quantity
    FROM jsonb_array_elements(_items) AS elem
    ORDER BY (elem->>'id')::uuid
  LOOP
    SELECT stock, name INTO cur_stock, prod_name
    FROM public.products
    WHERE id = rec.id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not available';
    END IF;

    IF cur_stock < rec.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %', prod_name;
    END IF;

    UPDATE public.products
    SET stock = stock - rec.quantity
    WHERE id = rec.id;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_product_stock(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_product_stock(jsonb) TO service_role;