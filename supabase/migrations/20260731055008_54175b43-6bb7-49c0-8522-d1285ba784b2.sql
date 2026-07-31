-- categories
DROP POLICY IF EXISTS "Categories public read" ON public.categories;
CREATE POLICY "Categories anon read visible" ON public.categories
  FOR SELECT TO anon USING (is_visible = true);
CREATE POLICY "Categories auth read" ON public.categories
  FOR SELECT TO authenticated
  USING (is_visible = true OR public.has_role(auth.uid(), 'admin'::app_role));

-- filter_definitions
DROP POLICY IF EXISTS "Filters public read" ON public.filter_definitions;
CREATE POLICY "Filters anon read enabled" ON public.filter_definitions
  FOR SELECT TO anon USING (enabled = true);
CREATE POLICY "Filters auth read" ON public.filter_definitions
  FOR SELECT TO authenticated
  USING (enabled = true OR public.has_role(auth.uid(), 'admin'::app_role));

-- product_reviews
DROP POLICY IF EXISTS "Reviews public read approved" ON public.product_reviews;
CREATE POLICY "Reviews anon read approved" ON public.product_reviews
  FOR SELECT TO anon USING (approved = true);
CREATE POLICY "Reviews auth read" ON public.product_reviews
  FOR SELECT TO authenticated
  USING (approved = true OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));