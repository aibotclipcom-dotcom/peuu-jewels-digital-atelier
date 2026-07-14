import { createMiddleware } from "@tanstack/react-start";

// Content-Security-Policy scoped to what the app actually loads:
//   - Supabase REST/Realtime/Storage
//   - Razorpay checkout iframe/scripts
//   - Google Fonts CSS + font files
// 'unsafe-inline' on style-src is required by Tailwind's runtime styles and
// Razorpay's injected styles. Scripts stay same-origin + Razorpay.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com",
  "frame-src https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com",
  "object-src 'none'",
].join("; ");

export const securityHeaders = createMiddleware().server(async ({ next }) => {
  const result = await next();
  const res = result as unknown as { response?: Response };
  const response = res.response;
  if (response && response.headers && !response.headers.has("x-content-type-options")) {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(self)",
    );
    // Report-only so a missed CDN can be fixed forward without breaking the site.
    response.headers.set("Content-Security-Policy-Report-Only", CSP);
  }
  return result;
});
