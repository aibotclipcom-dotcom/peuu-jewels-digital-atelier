
-- =========================================================
-- Phase 2: Dynamic catalog foundation
-- =========================================================

-- ---------- CATEGORIES ----------
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon_url text,
  banner_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (is_visible = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Categories admin manage" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- PRODUCT TYPES ----------
CREATE TABLE public.product_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_types TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_types TO authenticated;
GRANT ALL ON public.product_types TO service_role;
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ProductTypes public read" ON public.product_types FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ProductTypes admin manage" ON public.product_types FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_product_types_updated BEFORE UPDATE ON public.product_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- FILTER DEFINITIONS ----------
CREATE TABLE public.filter_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('select','multiselect','range','bool')),
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.filter_definitions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.filter_definitions TO authenticated;
GRANT ALL ON public.filter_definitions TO service_role;
ALTER TABLE public.filter_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Filters public read" ON public.filter_definitions FOR SELECT TO anon, authenticated USING (enabled = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Filters admin manage" ON public.filter_definitions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_filter_definitions_updated BEFORE UPDATE ON public.filter_definitions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- PRODUCT ATTRIBUTES ----------
CREATE TABLE public.product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  filter_key text NOT NULL,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_attributes_product ON public.product_attributes(product_id);
CREATE INDEX idx_product_attributes_key ON public.product_attributes(filter_key);
GRANT SELECT ON public.product_attributes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_attributes TO authenticated;
GRANT ALL ON public.product_attributes TO service_role;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ProductAttributes public read" ON public.product_attributes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ProductAttributes admin manage" ON public.product_attributes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- BADGES ----------
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  text_color text NOT NULL DEFAULT '#ffffff',
  bg_color text NOT NULL DEFAULT '#1a2340',
  border_color text NOT NULL DEFAULT '#1a2340',
  priority integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.badges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.badges TO authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges public read" ON public.badges FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Badges admin manage" ON public.badges FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_badges_updated BEFORE UPDATE ON public.badges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- PRODUCT_BADGES ----------
CREATE TABLE public.product_badges (
  product_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, badge_id)
);
GRANT SELECT ON public.product_badges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_badges TO authenticated;
GRANT ALL ON public.product_badges TO service_role;
ALTER TABLE public.product_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ProductBadges public read" ON public.product_badges FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ProductBadges admin manage" ON public.product_badges FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ---------- PRODUCT FAQs ----------
CREATE TABLE public.product_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_faqs_product ON public.product_faqs(product_id);
GRANT SELECT ON public.product_faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_faqs TO authenticated;
GRANT ALL ON public.product_faqs TO service_role;
ALTER TABLE public.product_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ProductFAQs public read" ON public.product_faqs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ProductFAQs admin manage" ON public.product_faqs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_product_faqs_updated BEFORE UPDATE ON public.product_faqs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- GLOBAL FAQs ----------
CREATE TABLE public.global_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.global_faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.global_faqs TO authenticated;
GRANT ALL ON public.global_faqs TO service_role;
ALTER TABLE public.global_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "GlobalFAQs public read" ON public.global_faqs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "GlobalFAQs admin manage" ON public.global_faqs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_global_faqs_updated BEFORE UPDATE ON public.global_faqs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- PRODUCT REVIEWS ----------
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text,
  image_urls text[] NOT NULL DEFAULT '{}',
  verified boolean NOT NULL DEFAULT false,
  approved boolean NOT NULL DEFAULT false,
  helpful_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_product ON public.product_reviews(product_id);
CREATE INDEX idx_reviews_user ON public.product_reviews(user_id);
GRANT SELECT ON public.product_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_reviews TO authenticated;
GRANT ALL ON public.product_reviews TO service_role;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews public read approved" ON public.product_reviews FOR SELECT TO anon, authenticated USING (approved = true OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Reviews owner insert" ON public.product_reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Reviews owner update" ON public.product_reviews FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Reviews admin delete" ON public.product_reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_product_reviews_updated BEFORE UPDATE ON public.product_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- REVIEW HELPFUL VOTES ----------
CREATE TABLE public.review_helpful_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.review_helpful_votes TO authenticated;
GRANT ALL ON public.review_helpful_votes TO service_role;
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "HelpfulVotes self" ON public.review_helpful_votes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------- EXTEND PRODUCTS ----------
ALTER TABLE public.products
  ADD COLUMN compare_at_price numeric,
  ADD COLUMN sale_starts_at timestamptz,
  ADD COLUMN sale_ends_at timestamptz,
  ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN product_type_id uuid REFERENCES public.product_types(id) ON DELETE SET NULL,
  ADD COLUMN video_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN spec jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN care text,
  ADD COLUMN shipping_info text,
  ADD COLUMN seo_title text,
  ADD COLUMN seo_description text,
  ADD COLUMN og_image text;

-- ---------- AUTO-MAP existing category strings to categories rows ----------
INSERT INTO public.categories (name, slug, sort_order)
SELECT DISTINCT
  p.category,
  lower(regexp_replace(regexp_replace(p.category, '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g')),
  0
FROM public.products p
WHERE p.category IS NOT NULL AND btrim(p.category) <> ''
ON CONFLICT (slug) DO NOTHING;

UPDATE public.products p
SET category_id = c.id
FROM public.categories c
WHERE c.name = p.category AND p.category_id IS NULL;
