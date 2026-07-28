# PEUU Jewels — Production Upgrade Plan

This request is very large (roughly 15–20 features, each with its own schema, admin UI, and storefront UI). Building it all in a single pass would take dozens of migrations and hundreds of files, and would almost certainly break things. I want to agree on scope and sequencing before touching code.

## What I recommend removing/simplifying first (quick wins, low risk)

These are small, isolated, and safe to ship in one batch:

1. **Remove COD** — audit shows only Razorpay is wired; I'll confirm no COD code paths remain and remove any lingering references.
2. **Remove order cancellation** — delete the `/cancel-order` edge function, the "Cancel order" UI in `/account`, and the self-cancel RLS policy. Keep `cancelled_at`/`refund_*` columns (harmless).
3. **add ₹300 minimum order** — search checkout for a min-total guard is **₹**300.
4. **First-order 10% off popup** — add `coupons` + `coupon_redemptions` tables, a 10s-delay modal with email capture, one-use enforcement server-side, and admin toggle.

## Core dynamic catalog (the foundation for everything else)

Everything in the prompt (mega menu, filters, badges, product types, reference pricing, product pages) depends on a redesigned schema. I'd do this as **one migration** + admin CRUD:

- `categories` (name, slug, icon_url, banner_url, sort_order, is_visible, parent_id) — powers mega menu + Shop filters.
- `product_types` (name, slug, sort_order) — free-form, admin managed.
- `filter_definitions` (name, key, type: select/range/bool, options jsonb, sort_order, enabled) + `product_attributes` (product_id, filter_key, value) — arbitrary admin-defined filters.
- `badges` (label, text_color, bg_color, border_color, priority, starts_at, ends_at) + `product_badges` join.
- Extend `products`: `compare_at_price`, `sale_starts_at`, `sale_ends_at`, `category_id`, `product_type_id`, `video_urls[]`, `spec` jsonb, `care`, `shipping_info`, `seo_title`, `seo_description`, `og_image`.
- New tables: `product_faqs`, `global_faqs`, `product_reviews` (with images/videos, verified flag, approval state, helpful_count), `review_helpful_votes`, `wishlist_guest` (localStorage), `recently_viewed` (localStorage).

## Storefront rebuild

- New premium `SiteNav` with sticky-on-scroll, hover mega-menu (desktop) / accordion (mobile), all items driven by DB.
- New `/shop` (was `/Collection`) with dynamic filter sidebar from `filter_definitions`.
- New `/collections/[slug]`, `/new-arrivals`, `/best-sellers`, `/about`, `/contact`.
- Rebuilt product detail page: gallery with zoom, video, badges, reference pricing with countdown, specs/care/shipping tabs, FAQ, reviews with photos, related + frequently-bought, breadcrumbs, Product JSON-LD, delivery estimate.
- Instant search with autocomplete + popular searches.
- Compare page (up to 4 products).
- Recently viewed rail.

## Admin panel

A new `/admin` section per resource: Categories, Product Types, Filters, Badges, FAQs, Reviews moderation, Coupons/First-Order Offer, Homepage/Banners, SEO defaults, Inventory alerts, Analytics tiles. All with list/create/edit/delete/reorder + image upload to `peuu-assets`.

## Out of scope for this plan (call out explicitly)

- **Voice search, 360° images, AI recommendations** — I can stub UI but real implementations need external services (Algolia/Meilisearch, Web Speech API, a recommender). Confirm before I add them.
- **Dark mode** — the brand palette is alabaster/navy; a real dark theme is a full re-tokening pass. Skip unless you insist.
- **Lighthouse 95+ guarantee** — I'll optimize, but a hard number depends on hosting/CDN and can't be promised in code alone.
- **Restock email notifications** — needs an email provider (Resend). Confirm.

## Suggested delivery order (I'd ship one phase per turn, verify, then next)

1. **Phase 1 — Cleanup**: remove COD/cancel/min-order + first-order coupon modal. ~1 turn.
2. **Phase 2 — Schema + Admin**: categories, product types, filters, badges, reference pricing, FAQs, reviews. Migration + admin CRUD screens. ~2–3 turns.
3. **Phase 3 — Storefront**: new nav + mega menu, rebuilt product page, shop filters, reviews UI, badges. ~2–3 turns.
4. **Phase 4 — Bonus**: search, wishlist-guest, recently viewed, compare, homepage banners CMS. ~2 turns.
5. **Phase 5 — SEO/perf polish**: sitemap regen from DB, per-page meta from admin, image optimization pass.

## Questions before I start

1. **Green-light Phase 1 (cleanup) now?** It's low-risk and unblocks the coupon + checkout work.
2. **Categories vs Collections** — the prompt uses both. I'll treat **Categories** = product taxonomy (Rings, Earrings…) and **Collections** = admin-curated groupings (Bridal Edit, Diwali'26). Confirm.
3. **Existing products** — the current `products.category` is a free text string. Migrating to `category_id` FK will require you to remap the 5 seeded rows. OK to auto-map by name?
4. **Which "out of scope" items do you actually want?** (voice search, dark mode, restock emails, real AI recs)

Reply with answers + "go Phase 1" and I'll ship the cleanup batch immediately.