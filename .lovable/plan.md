## Issues observed

From auth logs and network requests:
1. **Sign-in failing** — users get `invalid_credentials` because new signups require email confirmation (Supabase sent a confirmation email; the account isn't usable until confirmed). The UI immediately navigates to `/account` after signup, which then bounces them away because no session exists.
2. **No Google OAuth** — currently only email/password.
3. **Minor UX** — no password length hint (caused `weak_password` failure), no "check your email" state, no resend, no error surfacing besides toast.

## Plan

### 1. Fix email/password sign-in flow (`src/routes/auth.tsx`)
- On **signup**: detect when Supabase returns a user but no session (email confirmation required). Show an inline "Check your inbox to confirm your email" confirmation screen instead of navigating to `/account`.
- On **signup**: enforce min 6-character password client-side with helper text under the field, so users don't hit `weak_password`.
- On **signin**: surface clearer error copy ("Invalid email or password — or your email isn't confirmed yet").
- Only navigate to `/account` when a real `session` exists in the response.

### 2. Add Google sign-in (`src/routes/auth.tsx`)
- Add a "Continue with Google" button above the email field with a subtle divider ("or continue with email").
- Use `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: \`${window.location.origin}/account\` } })`.
- Style to match the luxury aesthetic (thin navy outline button, small Google "G" mark, same `tracking-luxury uppercase` typography).

### 3. Google provider configuration (user action required)
Google OAuth must be enabled in the Supabase dashboard — this cannot be done from code. After implementing, I'll point the user to:
- **Authentication → Providers → Google** in the Supabase dashboard to paste their Google OAuth Client ID / Secret.
- Add the Supabase callback URL (`https://kwzvinkxvctdldxkuxds.supabase.co/auth/v1/callback`) to Google Cloud Console → OAuth credentials → Authorized redirect URIs.
- Add the site URL + preview URL under **Authentication → URL Configuration**.

### Files touched
- `src/routes/auth.tsx` — only file changed.

No database, RLS, or server-function changes needed.