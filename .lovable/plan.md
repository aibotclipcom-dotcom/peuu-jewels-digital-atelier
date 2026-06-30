Replace the current text-only PEUU JEWELS wordmark with the uploaded floral logo mark across the site.

1. **Asset upload**
   - Upload the attached `logo.png` to Lovable Assets as `src/assets/peuu-logo.png` (overwriting the existing outdated asset pointer), so it is served from the CDN and versioned correctly.

2. **Logo component update**
   - Rewrite `src/components/brand/Logo.tsx` to render the new image as the home-link logo, sized responsively for the navigation bar and footer.
   - Keep the existing `tagline` prop API for compatibility, but because the uploaded image already includes the tagline, the prop will primarily control logo size / layout rather than rendering separate text.

3. **Replace hardcoded text marks**
   - Update `src/routes/auth.tsx` left panel: replace the hardcoded `PEUU JEWELS` text with the new `Logo` component.
   - Confirm `SiteNav`, `SiteFooter`, and `AdminLayout` automatically render the new image since they already use the `Logo` component.

4. **Favicon / head**
   - Add a `link rel="icon"` entry to the root route head (`src/routes/__root.tsx`) pointing to the same logo asset, so the browser tab matches the brand mark.

5. **Verification**
   - Run the build and open the preview to confirm the logo displays clearly in the header, footer, auth panel, and admin console on both desktop and mobile.