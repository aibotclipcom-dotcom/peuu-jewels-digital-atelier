import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/hooks/use-cart";
import { SiteNav } from "@/components/layout/SiteNav";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { Toaster } from "@/components/ui/sonner";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-alabaster px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-8xl text-navy">404</h1>
        <h2 className="mt-4 font-serif text-2xl text-navy">Page not found</h2>
        <p className="mt-3 text-sm text-navy/60">
          The page you are looking for has moved or no longer exists.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="line-draw text-[0.7rem] tracking-luxury uppercase text-navy"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-alabaster px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl text-navy">An interruption occurred.</h1>
        <p className="mt-3 text-sm text-navy/60">
          Please try again or return to the home page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-6">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="line-draw text-[0.7rem] tracking-luxury uppercase text-navy"
          >
            Try again
          </button>
          <a href="/" className="line-draw text-[0.7rem] tracking-luxury uppercase text-navy">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PEUU Jewels — Fine Jewelry Atelier" },
      {
        name: "description",
        content:
          "PEUU Jewels is an independent atelier of fine jewelry — sculpted by hand, finished with care, made to be worn for a lifetime.",
      },
      { name: "author", content: "PEUU Jewels" },
      { property: "og:title", content: "PEUU Jewels — Fine Jewelry Atelier" },
      {
        property: "og:description",
        content: "Heirloom-quality necklaces, rings, bracelets and earrings, handcrafted by PEUU Jewels.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/peuu-logo.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-alabaster text-navy antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <SiteNav />
        <Outlet />
        <CartDrawer />
        <Toaster
          position="bottom-right"
          toastOptions={{
            className:
              "!bg-navy !text-alabaster !border-navy-soft !rounded-none !font-sans tracking-wide",
          }}
        />
      </CartProvider>
    </QueryClientProvider>
  );
}
