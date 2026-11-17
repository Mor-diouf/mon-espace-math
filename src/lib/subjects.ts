import { BarChart3, Dices, Network, Waves, type LucideIcon } from "lucide-react";

export const LEVELS = ["L1", "L2", "L3", "M1", "M2"] as const;
export const LEVEL_NAMES: Record<string, string> = {
  L1: "Licence 1",
  L2: "Licence 2",
  L3: "Licence 3",
  M1: "Master 1",
  M2: "Master 2",
};
export const DOC_TYPES = ["Examen", "TD", "Corrigé", "Fiche de cours"] as const;

export type Subject = {
  name: string;
  short: string;
  /** Tuile teintée : fond pâle + glyphe dans la couleur de la matière (lisible en clair comme en sombre). */
  tile: string;
  glyph?: string;
  icon?: LucideIcon;
};

// Une couleur = une matière. Le type de document (Examen, TD…) s'écrit en toutes lettres, sans couleur.
// Les classes sont écrites en entier pour que Tailwind les trouve.
export const SUBJECTS: Subject[] = [
  {
    name: "Analyse",
    short: "Analyse",
    glyph: "∫",
    tile: "bg-s-analyse/13 text-s-analyse dark:bg-s-analyse/20",
  },
  {
    name: "Algèbre",
    short: "Algèbre",
    glyph: "α",
    tile: "bg-s-algebre/13 text-s-algebre dark:bg-s-algebre/20",
  },
  {
    name: "Probabilités",
    short: "Probabilités",
    icon: Dices,
    tile: "bg-s-proba/13 text-s-proba dark:bg-s-proba/20",
  },
  {
    name: "Statistiques",
    short: "Statistiques",
    icon: BarChart3,
    tile: "bg-s-stats/13 text-s-stats dark:bg-s-stats/20",
  },
  {
    name: "Topologie",
    short: "Topologie",
    icon: Network,
    tile: "bg-s-topo/13 text-s-topo dark:bg-s-topo/20",
  },
  {
    name: "Équations différentielles",
    short: "Équ. diff.",
    icon: Waves,
    tile: "bg-s-eq/13 text-s-eq dark:bg-s-eq/20",
  },
];

const FALLBACK_TILE = "bg-secondary text-secondary-foreground";
export const findSubject = (name: string) => SUBJECTS.find((s) => s.name === name);
export const subjectTile = (name: string) => findSubject(name)?.tile ?? FALLBACK_TILE;
export const subjectShort = (name: string) => findSubject(name)?.short ?? name;

/** « 2026-11-10 » → « 10 nov. 2026 » */
export function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** « 2026-11-10 » → { day: "10", month: "nov." } pour la pastille de date des annonces. */
export function dateParts(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return { day: "–", month: "" };
  return {
    day: String(d.getDate()),
    month: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(d),
  };
}

/** Date du jour du téléphone au format « AAAA-MM-JJ ». */
export function todayISO() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** « Aujourd'hui », « Demain », « Dans 3 jours »… ou rien si la date est passée ou lointaine. */
export function relativeDay(iso: string, today: string) {
  if (!today) return "";
  const days = Math.round(
    (Date.parse(`${iso}T12:00:00`) - Date.parse(`${today}T12:00:00`)) / 86_400_000,
  );
  if (Number.isNaN(days) || days < 0 || days > 14) return "";
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return `Dans ${days} jours`;
}

/** Minuscules sans accents, pour une recherche tolérante (« equation » trouve « Équation »). */
export function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
