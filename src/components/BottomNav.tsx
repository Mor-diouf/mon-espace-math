import { Link, useRouterState } from "@tanstack/react-router";
import { Folder, Home, LayoutGrid, Megaphone, Menu } from "lucide-react";
import { hasUnseen, seenStore, useAnnonces } from "@/lib/annonces";
import { useHydrated } from "@/lib/store";

const ITEMS = [
  { l: "Accueil", i: Home, to: "/" },
  { l: "Catalogue", i: LayoutGrid, to: "/catalogue" },
  { l: "Mes docs", i: Folder, to: "/mes-docs" },
  { l: "Annonces", i: Megaphone, to: "/annonces" },
  { l: "Plus", i: Menu, to: "/plus" },
] as const;

const TAB_PATHS: ReadonlySet<string> = new Set(ITEMS.map((i) => i.to));

/**
 * Barre d'onglets, posée une seule fois dans `__root.tsx`.
 * Elle fait 64 px (plus la zone des gestes) et n'apparaît que sur les cinq écrans principaux :
 * les écrans de détail (document, annonce, espace bureau) ont leur flèche retour et leur propre
 * barre d'action. Les écrans à onglets réservent sa place avec la classe `pb-nav`.
 */
export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const path = pathname.replace(/\/+$/, "") || "/";
  const annonces = useAnnonces();
  const seen = seenStore.use();
  const hydrated = useHydrated();
  if (!TAB_PATHS.has(path)) return null;
  // Point rouge sur l'onglet Annonces tant que des publications récentes n'ont pas été vues.
  const unseen = hydrated && path !== "/annonces" && hasUnseen(annonces, seen, Date.now());

  return (
    <nav
      aria-label="Navigation principale"
      className="vt-bottom-nav fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md bg-card pb-safe shadow-bar"
    >
      <ul className="grid h-16 grid-cols-5">
        {ITEMS.map(({ l, i: I, to }) => {
          const active = path === to;
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className="press flex h-full flex-col items-center justify-center gap-0.5"
              >
                <span
                  className={`relative grid h-8 w-14 place-items-center rounded-full transition-colors ${active ? "bg-primary/12 text-primary" : "text-muted-foreground"}`}
                >
                  <I className="h-6 w-6" strokeWidth={active ? 2.4 : 2} />
                  {to === "/annonces" && unseen && (
                    <>
                      <span className="absolute right-3 top-0.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-card" />
                      <span className="sr-only">(nouvelles annonces)</span>
                    </>
                  )}
                </span>
                <span
                  className={`text-xs ${active ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}
                >
                  {l}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
