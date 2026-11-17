import {
  CalendarClock,
  Info,
  Mic,
  PartyPopper,
  PencilRuler,
  TriangleAlert,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Identité visuelle des catégories d'annonces : une icône au trait régulier (même famille que
 * le reste de l'app) et une couleur. Les classes sont écrites en entier pour que Tailwind les trouve.
 * - `soft` : médaillon en dégradé léger avec liseré (listes, aperçu du bureau) ;
 * - `solid` : pastille pleine, icône claire (coin de la date, bandeau de l'annonce) ;
 * - `text` : la couleur seule (nom de la catégorie).
 */
type CatStyle = { icon: LucideIcon; soft: string; solid: string; text: string };

const STYLES: Record<string, CatStyle> = {
  Conférence: {
    icon: Mic,
    soft: "bg-linear-to-br from-s-analyse/22 to-s-analyse/6 ring-s-analyse/25 text-s-analyse",
    solid: "bg-s-analyse text-card",
    text: "text-s-analyse",
  },
  Atelier: {
    icon: PencilRuler,
    soft: "bg-linear-to-br from-s-algebre/22 to-s-algebre/6 ring-s-algebre/25 text-s-algebre",
    solid: "bg-s-algebre text-card",
    text: "text-s-algebre",
  },
  Tutorat: {
    icon: Users,
    soft: "bg-linear-to-br from-s-fourier/22 to-s-fourier/6 ring-s-fourier/25 text-s-fourier",
    solid: "bg-s-fourier text-card",
    text: "text-s-fourier",
  },
  Examens: {
    icon: CalendarClock,
    soft: "bg-linear-to-br from-s-topo/22 to-s-topo/6 ring-s-topo/25 text-s-topo",
    solid: "bg-s-topo text-card",
    text: "text-s-topo",
  },
  Résultats: {
    icon: Trophy,
    soft: "bg-linear-to-br from-s-geo/24 to-s-geo/6 ring-s-geo/25 text-s-geo",
    solid: "bg-s-geo text-card",
    text: "text-s-geo",
  },
  Événement: {
    icon: PartyPopper,
    soft: "bg-linear-to-br from-s-proba/22 to-s-proba/6 ring-s-proba/25 text-s-proba",
    solid: "bg-s-proba text-card",
    text: "text-s-proba",
  },
  Urgent: {
    icon: TriangleAlert,
    soft: "bg-linear-to-br from-destructive/22 to-destructive/6 ring-destructive/30 text-destructive",
    solid: "bg-destructive text-destructive-foreground",
    text: "text-destructive",
  },
  Info: {
    icon: Info,
    soft: "bg-linear-to-br from-primary/20 to-primary/5 ring-primary/25 text-primary",
    solid: "bg-primary text-primary-foreground",
    text: "text-primary",
  },
};

/** Style d'une catégorie ; une catégorie inconnue (ancienne annonce) prend celui d'« Info ». */
export const catStyle = (cat: string): CatStyle => STYLES[cat] ?? (STYLES["Info"] as CatStyle);

const SIZES = {
  sm: { box: "h-10 w-10 rounded-xl", icon: "h-5 w-5" },
  md: { box: "h-12 w-12 rounded-2xl", icon: "h-6 w-6" },
  lg: { box: "h-16 w-16 rounded-[1.25rem]", icon: "h-8 w-8" },
};

/** Médaillon de catégorie : carré arrondi, icône centrée, dégradé doux ou plein. */
export function CatMedallion({
  cat,
  size = "md",
  solid = false,
  className = "",
}: {
  cat: string;
  size?: keyof typeof SIZES;
  solid?: boolean;
  className?: string;
}) {
  const s = catStyle(cat);
  const z = SIZES[size];
  const Icon = s.icon;
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center ${z.box} ${solid ? `${s.solid} shadow-sm` : `${s.soft} ring-1 ring-inset`} ${className}`}
    >
      <Icon className={z.icon} strokeWidth={2.1} />
    </span>
  );
}

/** Petite icône de catégorie pour les pastilles de filtre. */
export function CatIcon({ cat, className = "h-4 w-4" }: { cat: string; className?: string }) {
  const Icon = catStyle(cat).icon;
  return <Icon aria-hidden className={className} strokeWidth={2.2} />;
}
