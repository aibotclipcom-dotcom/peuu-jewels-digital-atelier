CREATE TABLE public.for_every_you_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'NEW CARD',
  image_url text,
  link text NOT NULL DEFAULT '/Collection',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.for_every_you_cards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.for_every_you_cards TO authenticated;
GRANT ALL ON public.for_every_you_cards TO service_role;

ALTER TABLE public.for_every_you_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active for-every-you cards"
ON public.for_every_you_cards FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all for-every-you cards"
ON public.for_every_you_cards FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage for-every-you cards"
ON public.for_every_you_cards FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_for_every_you_cards_updated_at
BEFORE UPDATE ON public.for_every_you_cards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();