CREATE TABLE public.announcements (
  id uuid primary key default gen_random_uuid(),
  text text not null default '',
  link text,
  link_text text,
  bg_color text not null default '#0A192F',
  text_color text not null default '#FAF7F2',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT ON public.announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Announcements are publicly readable" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins manage announcements" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_announcements_updated BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.home_nav_items (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  link text not null default '/',
  image_url text,
  badge_label text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
GRANT SELECT ON public.home_nav_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_nav_items TO authenticated;
GRANT ALL ON public.home_nav_items TO service_role;
ALTER TABLE public.home_nav_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Home nav items are publicly readable" ON public.home_nav_items FOR SELECT USING (true);
CREATE POLICY "Admins manage home nav items" ON public.home_nav_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_home_nav_items_updated BEFORE UPDATE ON public.home_nav_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();