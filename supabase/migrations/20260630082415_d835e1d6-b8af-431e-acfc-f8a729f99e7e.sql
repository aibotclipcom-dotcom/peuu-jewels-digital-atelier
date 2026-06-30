
CREATE TYPE public.app_role AS ENUM ('admin', 'client');
CREATE TYPE public.product_status AS ENUM ('draft', 'published');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Roles self read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Roles admin manage" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client');
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL,
  materials TEXT[] NOT NULL DEFAULT '{}',
  status public.product_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products public read" ON public.products FOR SELECT TO anon, authenticated USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Products admin insert" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Products admin update" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Products admin delete" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlist TO authenticated;
GRANT ALL ON public.wishlist TO service_role;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Wishlist owner all" ON public.wishlist FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'pending',
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_address JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders owner read" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Orders owner insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Orders admin update" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  product_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "OrderItems owner read" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "OrderItems owner insert" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);

CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contact anyone insert" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Contact admin read" ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies on peuu-assets bucket
CREATE POLICY "PeuuAssets public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'peuu-assets');
CREATE POLICY "PeuuAssets admin insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'peuu-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "PeuuAssets admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'peuu-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "PeuuAssets admin delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'peuu-assets' AND public.has_role(auth.uid(), 'admin'));

INSERT INTO public.products (name, slug, sku, description, price, stock, image_urls, category, materials, status) VALUES
('Aurora Layered Necklace', 'aurora-layered-necklace', 'PJ-N-001', 'A weightless cascade of four delicate chains in 18k gold, finished with hand-set medallions. Made to drape effortlessly along the collarbone.', 1850, 12, ARRAY['https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1200&q=80','https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=1200&q=80'], 'Necklaces', ARRAY['18k Gold','Hand-finished'], 'published'),
('Solene Pendant', 'solene-pendant', 'PJ-N-002', 'A single sun-engraved disc suspended on a whisper-thin chain. An everyday heirloom.', 920, 24, ARRAY['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&q=80','https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=1200&q=80'], 'Necklaces', ARRAY['14k Gold'], 'published'),
('Celeste Cluster Ring', 'celeste-cluster-ring', 'PJ-R-001', 'A blooming cluster of marquise and round diamonds set in rose-gold petals. The signature engagement silhouette of the Maison.', 6400, 4, ARRAY['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&q=80','https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=1200&q=80'], 'Rings', ARRAY['18k Rose Gold','Natural Diamonds'], 'published'),
('Helene Solitaire', 'helene-solitaire', 'PJ-R-002', 'A 1.2ct brilliant solitaire on a knife-edge band. Architectural, eternal.', 8900, 2, ARRAY['https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1200&q=80','https://images.unsplash.com/photo-1561591070-7ffaf4ff60b1?w=1200&q=80'], 'Rings', ARRAY['Platinum','Diamond'], 'published'),
('Maison Charm Bracelet', 'maison-charm-bracelet', 'PJ-B-001', 'Substantial paperclip links interrupted by hand-cast coin charms and a single gilded pouch. Adjustable to the wrist.', 1450, 18, ARRAY['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1200&q=80','https://images.unsplash.com/photo-1635767582909-345fb6bb1f4f?w=1200&q=80'], 'Bracelets', ARRAY['18k Gold Vermeil'], 'published'),
('Onde Cuff', 'onde-cuff', 'PJ-B-002', 'A sculpted open cuff inspired by the curl of a wave. Polished to a mirror finish.', 1190, 9, ARRAY['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&q=80','https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1200&q=80'], 'Bracelets', ARRAY['18k Gold'], 'published'),
('Petale Stud Trio', 'petale-stud-trio', 'PJ-E-001', 'A curated trio of pavé studs and a delicate flower — designed to be worn together along the lobe.', 780, 30, ARRAY['https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=1200&q=80','https://images.unsplash.com/photo-1630019852942-f89202989a59?w=1200&q=80'], 'Earrings', ARRAY['14k Gold','Diamond Pavé'], 'published'),
('Lune Hoop', 'lune-hoop', 'PJ-E-002', 'Slim pavé hoops that catch the light from every angle. The Maison''s most-worn earring.', 1120, 22, ARRAY['https://images.unsplash.com/photo-1630019852942-f89202989a59?w=1200&q=80','https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=1200&q=80'], 'Earrings', ARRAY['18k Gold','Diamond Pavé'], 'published');

ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
