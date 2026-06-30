
# PEUU JEWELS — Luxury Jewelry E-commerce

A cinematic, editorial-grade storefront for PEUU JEWELS with full Supabase-powered catalog, auth, wishlist/orders, and an admin console.

## Design System

- **Palette**: alabaster `#FAFAFA`, cashmere `#F5F2EB`, navy `#0A192F`, rose-gold gradient (`#E8C4B8 → #C9A875 → #B08D5B`), coral accent from logo.
- **Type**: Playfair Display (headings), Inter (body, wide tracking for labels). Loaded via `<link>` in `__root.tsx`.
- All tokens defined as oklch CSS variables in `src/styles.css`; semantic Tailwind classes only.
- Subtle floral/butterfly SVG motifs (extracted vibe from logo) used as section dividers and watermark accents.

## Pages & Routing (TanStack Start)

```
/                            Cinematic landing (snap sections, curtain reveal)
/boutique                    Editorial asymmetric masonry shop
/boutique/$productId         Product detail
/maison                      Brand story, scroll-fade narrative
/concierge                   Contact form, floating labels
/auth                        Public sign-in/up (panel-style)
/_authenticated/account      Client portal — orders + wishlist
/_authenticated/admin        Jeweler dashboard (gated by role)
  └─ products / orders / new / $id/edit
```

- Sticky glassmorphism nav with gold-dot active indicator.
- Slide-out cart drawer (Sheet) available globally.
- Slide-out auth panel triggered from nav (routes to `/auth` for direct links / SEO).

## Cinematic Landing

- 100vh snap sections with Framer Motion curtain-reveal (incoming section animates `clipPath` / `y` from bottom, overlaying previous).
- Each section: 50/50 split — left editorial photo with oversized semi-transparent serif word (`RINGS`, `NECKLACES`, `BRACELETS`, `EARRINGS`, `BESPOKE`) with parallax; right warm gradient panel with arch-shaped image (`border-radius: 50% 50% 0 0 / 20% 20% 0 0`), slow fade+drift in, serif blurb, line-draw "Shop Collection" button.
- Uploaded reference images wired in as Lovable Assets (necklace, ring, bracelet, earrings).

## Boutique (Shop)

- Asymmetric masonry (CSS columns + varied aspect ratios).
- Hover: cross-fade to second image (1.2s ease).
- Filters: category chips, price range (subtle).
- Slide-out cart drawer on right, persisted in localStorage.

## Maison & Concierge

- Maison: long-form story, scroll-triggered fade-up via Framer Motion `whileInView`.
- Concierge: floating-label form with thin bottom-border inputs turning navy on focus; submissions stored in `contact_messages`.

## Auth & Roles

- Email/password Supabase auth via a beautifully designed `/auth` panel (slide-in animation).
- Roles via separate `user_roles` table + `app_role` enum (`admin`, `client`), `has_role()` security definer function.
- `_authenticated` layout (Lovable-managed gate) protects account + admin.
- Admin route additionally checks `has_role(uid, 'admin')` in loader; non-admins redirected.

## Client Portal

- Order history (status, total, items).
- Wishlist (toggle from product card/detail).

## Admin Dashboard

- Stark-white minimal layout with left sidebar (Products, Orders, Settings).
- Product CRUD: title, SKU, price, materials, category, rich-text description (Tiptap), multi-image upload to Storage with progress + optimization, draft/published toggle, stock.
- Orders list with status updates.
- Real-time UI via TanStack Query invalidation + Supabase realtime on `products`.

## Supabase Backend

**Tables**
- `profiles` (id→auth.users, full_name, avatar_url)
- `user_roles` (user_id, role enum) — separate, secure
- `products` (name, slug, sku unique, description, price numeric, stock int, image_urls text[], category, materials text[], status enum draft/published)
- `wishlist` (user_id, product_id)
- `orders` (user_id, status, total, shipping_address jsonb)
- `order_items` (order_id, product_id, qty, unit_price)
- `contact_messages` (name, email, message)

**RLS**
- `products`: SELECT for everyone where status='published'; admins SELECT all; INSERT/UPDATE/DELETE admin-only via `has_role`.
- `wishlist`, `orders`, `order_items`, `profiles`: owner-scoped.
- `user_roles`: read own; admin writes.
- `contact_messages`: insert anon; admin read.

**Storage**: `peuu-assets` bucket (public read), admin-only write policy on `storage.objects`.

**Triggers**: auto-create profile on signup; updated_at triggers.

## Tech Notes

- Animations: Framer Motion (already common). Curtain reveal via animated `clipPath: inset()`.
- Toasts: Sonner, styled as sleek dark bar slide-in from bottom-right.
- Images: Lovable Assets pointers for uploaded references; product images via Supabase Storage public URLs.
- SEO: per-route `head()` with unique title/description/og.

## Build Order

1. Design tokens + fonts + nav shell + landing.
2. Supabase migration (tables, RLS, storage bucket, trigger).
3. Auth panel + role gating.
4. Boutique listing + detail + cart drawer + wishlist.
5. Client portal (orders, wishlist).
6. Admin dashboard (product CRUD with image upload, orders).
7. Maison + Concierge polish; toasts + final motion pass.

## Open Defaults (proceeding unless told otherwise)

- Email/password auth only (no Google) for v1.
- Checkout = "Request to Purchase" creating an order record (no Stripe yet) — concierge-style.
- Seed a handful of demo products via migration so the boutique isn't empty.

Reply "go" to build, or call out anything to change (checkout/payments, OAuth, seed data, etc.).
