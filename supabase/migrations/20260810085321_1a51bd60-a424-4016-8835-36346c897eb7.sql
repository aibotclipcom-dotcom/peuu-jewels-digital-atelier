CREATE TABLE public.product_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  title text NOT NULL,
  icon text NOT NULL DEFAULT 'sparkles',
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX product_benefits_product_idx ON public.product_benefits(product_id, sort_order);

GRANT SELECT ON public.product_benefits TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_benefits TO authenticated;
GRANT ALL ON public.product_benefits TO service_role;

ALTER TABLE public.product_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view product benefits"
  ON public.product_benefits FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage product benefits"
  ON public.product_benefits FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_product_benefits_updated
  BEFORE UPDATE ON public.product_benefits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();