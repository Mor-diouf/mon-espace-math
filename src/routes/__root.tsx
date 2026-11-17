import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/BottomNav";
import { Onboarding } from "@/components/Onboarding";
import { registerServiceWorker } from "@/lib/offline";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="press inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Cette page n'a pas pu s'afficher
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Un problème est survenu. Réessayez, ou revenez à l'accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="press inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="press inline-flex h-12 items-center justify-center rounded-full border border-input bg-card px-6 text-sm font-bold text-foreground"
          >
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Replace these placeholders with the app's name and description when first building the app.
    // Each content route, / included, must still set its own head(). Never add og:image or
    // twitter:image here: every page without its own would inherit the root's preview image.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Mon Espace Math — UASZ" },
      {
        name: "description",
        content:
          "Ressources mathématiques de la Licence 1 au Master 2 — Espace Math, Université Assane Seck de Ziguinchor.",
      },
      { name: "author", content: "Espace Math — UASZ" },
      { property: "og:title", content: "Mon Espace Math — UASZ" },
      {
        property: "og:description",
        content:
          "Ressources mathématiques de la Licence 1 au Master 2 — Espace Math, Université Assane Seck de Ziguinchor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      // Couleur de la barre d'état du téléphone = bandeau de l'app (vert forêt de l'UASZ).
      { name: "theme-color", content: "#18453c", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#0a2922", media: "(prefers-color-scheme: dark)" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Espace Math" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "icon", href: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// Exécuté avant le premier affichage : marque <html> si l'étudiant n'a pas encore choisi son niveau.
// L'écran de bienvenue (classe first-run-only) est alors visible d'emblée, sans attendre React,
// et n'apparaît jamais, même une fraction de seconde, chez ceux qui l'ont déjà passé.
const FIRST_RUN_SCRIPT =
  "try{if(localStorage.getItem('mem:onboarded')!=='true')document.documentElement.classList.add('first-run')}catch(e){}";

function RootShell({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning : la classe first-run est ajoutée par le script ci-dessus, hors de React.
    <html lang="fr" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: FIRST_RUN_SCRIPT }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  // Mode hors ligne : l'app et les PDF gardés restent disponibles sans réseau.
  useEffect(registerServiceWorker, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Colonne de la largeur d'un téléphone : sur grand écran, l'app reste centrée. */}
      <div className="relative mx-auto min-h-dvh max-w-md bg-background text-foreground">
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </div>
      <BottomNav />
      <Onboarding />
      {/* Messages en bas, au-dessus de la barre d'onglets ou d'action. */}
      <Toaster
        position="bottom-center"
        offset={{ bottom: "calc(5.75rem + env(safe-area-inset-bottom))" }}
        mobileOffset={{
          bottom: "calc(5.75rem + env(safe-area-inset-bottom))",
          left: 16,
          right: 16,
        }}
      />
    </QueryClientProvider>
  );
}
