import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/AuthContext";
import AssistantWidget from "@/components/AssistantWidget";

import appCss from "../styles.css?url";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Saadhyam AI — AI-powered business growth" },
      {
        name: "description",
        content: "AI that analyzes, creates content, and boosts sales — automatically.",
      },
      { name: "author", content: "Saadhyam AI" },
      { property: "og:title", content: "Saadhyam AI" },
      { property: "og:description", content: "Grow your business with AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@SaadhyamAI" },
      {
        httpEquiv: "Content-Security-Policy",
        content: "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: data: blob:; connect-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: localhost:* 127.0.0.1:* *.localhost:* ws: wss:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http: data: blob:; style-src 'self' 'unsafe-inline' https: http: data: blob:; img-src 'self' https: http: data: blob:; font-src 'self' https: http: data: blob:; frame-src 'self' https: http: localhost:* 127.0.0.1:*; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <AssistantWidget />
      </AuthProvider>
    </QueryClientProvider>
  );
}
