CREATE TABLE public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type text NOT NULL DEFAULT 'image',
  media_url text NOT NULL DEFAULT '',
  mobile_media_url text,
  heading text NOT NULL DEFAULT '',
  subheading text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  cta_text text NOT NULL DEFAULT '',
  cta_link text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.hero_slides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hero_slides TO authenticated;
GRANT ALL ON public.hero_slides TO service_role;

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active hero slides"
  ON public.hero_slides FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage hero slides"
  ON public.hero_slides FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_hero_slides_updated
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.site_settings (key, value)
VALUES ('hero', '{"auto_slide_delay_seconds": 5}'::jsonb)
ON CONFLICT (key) DO NOTHING;