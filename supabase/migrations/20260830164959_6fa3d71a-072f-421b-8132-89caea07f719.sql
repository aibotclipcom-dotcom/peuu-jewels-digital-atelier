CREATE OR REPLACE FUNCTION public.duplicate_product(_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  src public.products%ROWTYPE;
  new_id uuid;
  new_sku text;
  new_slug text;
  new_name text;
  base_sku text;
  base_slug text;
  base_name text;
  n int := 1;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can duplicate pieces' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT * INTO src FROM public.products WHERE id = _id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Piece not found';
  END IF;

  base_sku := regexp_replace(src.sku, '-COPY-[0-9]+$', '');
  base_slug := regexp_replace(src.slug, '-copy(-[0-9]+)?$', '');
  base_name := regexp_replace(src.name, ' \(Copy( [0-9]+)?\)$', '');

  LOOP
    new_sku := base_sku || '-COPY-' || n;
    new_slug := base_slug || CASE WHEN n = 1 THEN '-copy' ELSE '-copy-' || n END;
    new_name := base_name || CASE WHEN n = 1 THEN ' (Copy)' ELSE ' (Copy ' || n || ')' END;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.products p WHERE p.sku = new_sku OR p.slug = new_slug
    );
    n := n + 1;
    IF n > 500 THEN
      RAISE EXCEPTION 'Could not generate a unique SKU';
    END IF;
  END LOOP;

  INSERT INTO public.products (
    name, slug, sku, description, price, stock, image_urls, category, materials,
    status, compare_at_price, sale_starts_at, sale_ends_at, category_id,
    product_type_id, video_urls, spec, care, shipping_info, seo_title,
    seo_description, og_image, is_best_seller, best_seller_sort
  )
  VALUES (
    new_name, new_slug, new_sku, src.description, src.price, src.stock, src.image_urls,
    src.category, src.materials, 'draft'::product_status, src.compare_at_price,
    src.sale_starts_at, src.sale_ends_at, src.category_id, src.product_type_id,
    src.video_urls, src.spec, src.care, src.shipping_info, src.seo_title,
    src.seo_description, src.og_image, src.is_best_seller, src.best_seller_sort
  )
  RETURNING id INTO new_id;

  INSERT INTO public.product_badges (product_id, badge_id)
  SELECT new_id, badge_id FROM public.product_badges WHERE product_id = _id;

  INSERT INTO public.product_attributes (product_id, filter_key, value)
  SELECT new_id, filter_key, value FROM public.product_attributes WHERE product_id = _id;

  INSERT INTO public.product_faqs (product_id, question, answer, sort_order)
  SELECT new_id, question, answer, sort_order FROM public.product_faqs WHERE product_id = _id;

  INSERT INTO public.product_benefits (product_id, title, icon, description, sort_order, is_active)
  SELECT new_id, title, icon, description, sort_order, is_active
  FROM public.product_benefits WHERE product_id = _id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.duplicate_product(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.duplicate_product(uuid) TO authenticated;