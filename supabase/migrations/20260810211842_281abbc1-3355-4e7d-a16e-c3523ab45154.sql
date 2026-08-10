DROP POLICY "Anyone can view active hero slides" ON public.hero_slides;
CREATE POLICY "Anyone can view active hero slides" ON public.hero_slides FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all hero slides" ON public.hero_slides FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));