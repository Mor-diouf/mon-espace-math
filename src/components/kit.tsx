import { Search, WifiOff, X, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { RemoteStatus } from "@/lib/remote";

/*
 * Petites pièces partagées par tous les écrans. Règles communes :
 * - toute zone à toucher fait au moins 48 px de haut (ou 40 px + classe `hit`) ;
 * - aucun texte sous 12 px ;
 * - tout ce qui se touche réagit (`press` ou `press-row`).
 */

/** Bouton principal : un seul par écran. */
export const btnPrimary =
  "press flex h-13 items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-bold text-primary-foreground disabled:opacity-40";
/** Bouton secondaire, contour discret. */
export const btnOutline =
  "press flex h-12 items-center justify-center gap-2 rounded-full border border-input bg-card px-5 text-sm font-bold text-foreground";

/** Champ de recherche de 48 px, pensé pour être posé sur le bandeau vert. */
export function SearchField({
  value,
  onChange,
  onSubmit,
  placeholder = "Document, matière, notion…",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}) {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="flex h-12 items-center gap-2 rounded-full bg-background pl-4 pr-1 text-foreground focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-lime"
    >
      <Search aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground" />
      <input
        type="search"
        enterKeyHint="search"
        aria-label="Rechercher"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Effacer la recherche"
          onClick={() => onChange("")}
          className="press hit grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </form>
  );
}

/** Pastille à bascule (filtres, catégories). 40 px visibles, 48 px au toucher. */
export function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-pressed={on}
      onClick={onClick}
      className={`press hit flex h-10 shrink-0 items-center gap-1 rounded-full px-4 text-sm font-semibold ${on ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-card"}`}
    >
      {children}
    </button>
  );
}

/** Rangée de pastilles qui défile sur le côté, bord à bord. */
export function ChipRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-3"
    >
      {children}
    </div>
  );
}

/** Sélecteur à deux ou trois positions (Favoris / Hors ligne…). */
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly (readonly [T, string])[];
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="grid auto-cols-fr grid-flow-col rounded-full bg-secondary p-1"
    >
      {options.map(([k, l]) => (
        <button
          key={k}
          role="tab"
          aria-selected={value === k}
          onClick={() => onChange(k)}
          className={`press h-11 rounded-full px-2 text-sm font-bold ${value === k ? "bg-card text-foreground shadow-card" : "text-muted-foreground"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/** Style du lien « Tout voir » à droite d'un titre de section (zone tactile de 48 px). */
export const sectionLink =
  "press -mr-2 flex h-12 shrink-0 items-center gap-1 rounded-full px-2 text-sm font-bold text-primary";

/** Titre de section ; `children` reçoit le lien « Tout voir » facultatif (un <Link className={sectionLink}>). */
export function SectionTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex h-12 items-center justify-between gap-2">
      <h2 className="min-w-0 truncate text-lg font-bold">{title}</h2>
      {children}
    </div>
  );
}

/** Écran ou liste vide : une icône, une phrase, et si possible la prochaine action. */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="px-4 pt-14 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary text-primary">
        <Icon className="h-8 w-8" />
      </div>
      <p className="mt-4 text-base font-bold">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-[18rem] text-sm text-muted-foreground">{hint}</p>}
      {children && <div className="mt-6 flex justify-center">{children}</div>}
    </div>
  );
}

/**
 * À afficher à la place d'une liste tant qu'il n'y a rien à montrer :
 * premier chargement en cours, ou pas de réseau et rien en mémoire.
 */
export function Pending({ status }: { status: RemoteStatus }) {
  if (status === "offline") {
    return (
      <EmptyState
        icon={WifiOff}
        title="Pas de connexion"
        hint="Le contenu s'affichera dès que le téléphone retrouvera Internet."
      />
    );
  }
  return (
    <p role="status" className="px-4 pt-14 text-center text-sm text-muted-foreground">
      Chargement…
    </p>
  );
}

/** Rappel discret que le contenu est fictif. */
export function DemoNote({ children }: { children: ReactNode }) {
  return <p className="mt-5 text-center text-xs text-muted-foreground">{children}</p>;
}

/** Barre d'action collée en bas des écrans de détail, sous le pouce. Prévoir `pb-action` sur le contenu. */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md bg-card px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-bar">
      <div className="flex items-stretch gap-2">{children}</div>
    </div>
  );
}
