Migrate all image assets off the Lovable `.asset.json` / `/__l5e/assets-v1/` system to plain files served from `/public`, so the code is portable when self-hosted.

## Files to move into `/public`

Download the 5 current CDN assets and commit them to `public/` at the project root:

- `public/peuu-logo.png`
- `public/necklace.jpeg`
- `public/ring.jpeg`
- `public/bracelet.jpeg`
- `public/earrings.jpeg`

Then delete the pointers:
`src/assets/peuu-logo.png.asset.json`, `necklace.jpeg.asset.json`, `ring.jpeg.asset.json`, `bracelet.jpeg.asset.json`, `earrings.jpeg.asset.json`.

## Code changes (replace imports with string paths)

- `src/components/brand/Logo.tsx` — remove `logoAsset` import; set `src="/peuu-logo.png"`.
- `src/routes/maison.tsx` — remove `necklaceAsset` / `ringAsset` imports; use `/necklace.jpeg` and `/ring.jpeg` (including in the `og:image` meta).
- `src/routes/index.tsx` — remove all `*.asset.json` imports; replace every reference (hero, section images, og:image) with `/necklace.jpeg`, `/ring.jpeg`, `/bracelet.jpeg`, `/earrings.jpeg`.
- `src/routes/__root.tsx` — remove the logo asset import; set favicon `href="/peuu-logo.png"`.

## Guardrail

Going forward, no new `.asset.json` files will be generated and no `@/assets/*.asset.json` imports will be added. Product images uploaded through the admin editor continue to use Supabase Storage signed URLs (unaffected).

## Verification

Run `bun run build` and confirm the home, maison, auth pages and favicon still render the correct images from `/public`.
