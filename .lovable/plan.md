## Plan

1. **Fix the route structure**
   - Convert the admin products list route into a proper parent layout that renders an `<Outlet />` for child routes.
   - Move the inventory table UI into an index child route so `/admin/products` still shows the product list.

2. **Make Add New Piece open reliably**
   - Replace the current `/admin/products/new` redirect workaround with a real editor route for creating products.
   - Update the “New Piece” button to navigate directly to the real create route.

3. **Make Edit open reliably**
   - Keep edit URLs as `/admin/products/$id` and ensure the product editor receives the correct product id.
   - Verify edit buttons use TanStack `<Link>` with `params`, not plain URLs.

4. **Preserve existing editor features**
   - Keep image upload, image replacement, image reordering, cover image behavior, draft/published toggle, and INR pricing.

5. **Validate the flow**
   - Check that `/admin/products` renders the list, `/admin/products/new` opens the blank editor, and `/admin/products/:id` opens the edit editor without blank pages.