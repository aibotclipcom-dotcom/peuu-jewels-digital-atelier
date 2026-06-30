## Goals

1. Fix the admin **New Piece** / **Edit Piece** screens so they save reliably.
2. Allow editing existing images (replace, reorder, paste URL).
3. Display all prices in **Indian Rupees (₹, INR)** across the site and admin.

## Changes

### 1. `src/lib/format.ts` — INR formatting
Switch `formatPrice` from `USD` to `INR` with `en-IN` locale, e.g. `₹1,25,000`. This single change updates Boutique, product page, cart, account orders, admin list, admin dashboard revenue, etc.

### 2. `src/routes/_authenticated/admin.products.$id.tsx` — Editor fixes
Bugs found:
- The "Or paste image URL" Input is hard-wired to `value=""`; typing one character immediately appends it to `images` (each keystroke = new image). Replace with a proper local-state text field + "Add URL" button.
- Save uses `.select().single()` after insert; if RLS denies the read-back, the whole save fails even though the row was created. Switch to `.select().maybeSingle()` and handle null gracefully.
- Saving with no images is allowed but boutique cards then crash; require at least 1 image OR allow 0 cleanly (use placeholder). We'll just guard and toast.
- Price label changes from "Price (USD)" to "Price (INR ₹)".
- Add image management:
  - **Replace** button on each thumbnail (opens file picker, uploads, swaps URL in place).
  - **Reorder** with left/right arrow buttons (first image = primary/cover).
- Keep existing upload-multiple and delete behavior.

### 3. `src/routes/_authenticated/admin.products.tsx`
No code change needed beyond what `formatPrice` already gives (prices auto-render as ₹).

### 4. No DB / RLS changes
`products.price` stays `numeric`; we just treat the stored number as INR going forward. Existing seed values will display as ₹ amounts — user can edit them in admin.

## Files touched
- `src/lib/format.ts`
- `src/routes/_authenticated/admin.products.$id.tsx`

## Out of scope
- Currency conversion of existing seed prices (user will re-enter in INR via admin).
- Multi-currency support / locale switcher.
