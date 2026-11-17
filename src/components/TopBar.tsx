import { Link, useCanGoBack, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

type Fallback = "/" | "/catalogue" | "/annonces" | "/plus";

/** Bouton rond de 48 px pour le bandeau vert. */
export const barButton =
  "press grid h-12 w-12 shrink-0 place-items-center rounded-full active:bg-brand-foreground/15";

/**
 * Bandeau du haut aux couleurs de l'UASZ. Il reste collé en haut de l'écran et tient compte
 * de la barre d'état du téléphone.
 * - `back` : affiche la flèche retour (écran précédent, sinon l'adresse donnée).
 * - `children` : contenu sous le titre, qui reste collé lui aussi (champ de recherche).
 */
export function TopBar({
  title,
  back,
  right,
  children,
}: {
  title: string;
  back?: Fallback;
  right?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 bg-brand pt-safe text-brand-foreground">
      <div className={`flex h-14 items-center gap-1 pr-1 ${back ? "pl-1" : "pl-4"}`}>
        {back && <BackButton fallback={back} />}
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h1>
        {right}
      </div>
      {children && <div className="px-4 pb-3">{children}</div>}
    </header>
  );
}

function BackButton({ fallback }: { fallback: Fallback }) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const icon = <ArrowLeft className="h-6 w-6" />;
  return canGoBack ? (
    <button aria-label="Retour" onClick={() => router.history.back()} className={barButton}>
      {icon}
    </button>
  ) : (
    <Link to={fallback} aria-label="Retour" className={barButton}>
      {icon}
    </Link>
  );
}

/**
 * Le logo officiel du club, en pastille ronde sur fond blanc : il reste lisible sur le bandeau
 * vert comme en thème sombre. Le fichier public/logo-club.webp est tiré de
 * src/assets/logo-club-officiel.jpg (l'original fourni par le bureau).
 */
export function AppMark({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <img
      src="/logo-club.webp"
      alt=""
      aria-hidden
      width={384}
      height={384}
      decoding="async"
      draggable={false}
      className={`shrink-0 rounded-full ring-1 ring-black/5 ${className}`}
    />
  );
}
