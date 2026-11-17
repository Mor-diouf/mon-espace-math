import { GraduationCap, type LucideIcon } from "lucide-react";

export const LEVELS = ["L1", "L2", "L3", "M1", "M2"] as const;
export type Level = (typeof LEVELS)[number];
export const LEVEL_NAMES: Record<string, string> = {
  L1: "Licence 1",
  L2: "Licence 2",
  L3: "Licence 3",
  M1: "Master 1",
  M2: "Master 2",
};
export const DOC_TYPES = ["Examen", "TD", "Corrigé", "Fiche de cours"] as const;

/**
 * Une discipline donne sa couleur et son symbole à toutes ses UE (Analyse 1 à 4 sont bleues).
 * Les couleurs sont choisies pour rester distinctes entre UE d'un même niveau.
 * Les classes sont écrites en entier pour que Tailwind les trouve.
 */
type Discipline = { tile: string; glyph?: string; icon?: LucideIcon };

const D = {
  analyse: { glyph: "∫", tile: "bg-s-analyse/13 text-s-analyse dark:bg-s-analyse/20" },
  algebre: { glyph: "α", tile: "bg-s-algebre/13 text-s-algebre dark:bg-s-algebre/20" },
  edp: { glyph: "Δ", tile: "bg-s-eq/13 text-s-eq dark:bg-s-eq/20" },
  topo: { glyph: "⊂", tile: "bg-s-topo/13 text-s-topo dark:bg-s-topo/20" },
  mesure: { glyph: "μ", tile: "bg-s-mesure/13 text-s-mesure dark:bg-s-mesure/20" },
  calcul: { glyph: "∂", tile: "bg-s-calc/13 text-s-calc dark:bg-s-calc/20" },
  proba: { glyph: "ℙ", tile: "bg-s-proba/13 text-s-proba dark:bg-s-proba/20" },
  complexe: { glyph: "ℂ", tile: "bg-s-analyse/13 text-s-analyse dark:bg-s-analyse/20" },
  geometrie: { glyph: "△", tile: "bg-s-geo/13 text-s-geo dark:bg-s-geo/20" },
  fourier: { glyph: "ℱ", tile: "bg-s-fourier/13 text-s-fourier dark:bg-s-fourier/20" },
  stats: { glyph: "σ", tile: "bg-s-stats/13 text-s-stats dark:bg-s-stats/20" },
  master: { icon: GraduationCap, tile: "bg-secondary text-secondary-foreground" },
} satisfies Record<string, Discipline>;

/** Une UE (unité d'enseignement) telle qu'elle figure dans la maquette du département. */
export type UE = Discipline & {
  /** Nom enregistré dans le champ « matière » des documents. */
  name: string;
  /** Nom court pour les tuiles et les listes. */
  short: string;
  level: Level;
  /** Semestre dans l'année (1 ou 2), absent tant que l'UE n'est pas précisée. */
  semester?: 1 | 2;
  /** UE à choisir entre deux parcours. */
  option?: string;
};

const ue = (
  name: string,
  short: string,
  level: Level,
  semester: 1 | 2 | undefined,
  d: Discipline,
  option?: string,
): UE => ({
  name,
  short,
  level,
  ...(semester ? { semester } : {}),
  ...d,
  ...(option ? { option } : {}),
});

/** Maquette de la Licence de mathématiques de l'UASZ. Le Master sera détaillé plus tard. */
export const UES: UE[] = [
  ue("Analyse 1", "Analyse 1", "L1", 1, D.analyse),
  ue("Algèbre 1", "Algèbre 1", "L1", 1, D.algebre),
  ue("Analyse 2", "Analyse 2", "L1", 2, D.analyse),
  ue("Algèbre 2", "Algèbre 2", "L1", 2, D.algebre),

  ue("Analyse 3", "Analyse 3", "L2", 1, D.analyse),
  ue("Algèbre 3", "Algèbre 3", "L2", 1, D.algebre),
  ue("Analyse 4", "Analyse 4", "L2", 2, D.analyse),
  ue("Équations aux dérivées partielles", "EDP", "L2", 2, D.edp),

  ue("Topologie", "Topologie", "L3", 1, D.topo),
  ue("Algèbre", "Algèbre", "L3", 1, D.algebre),
  ue("Mesure et intégration", "Mesure & intég.", "L3", 1, D.mesure),
  ue("Calcul différentiel", "Calcul diff.", "L3", 2, D.calcul),
  ue("Probabilités", "Probabilités", "L3", 2, D.proba),
  ue("Analyse complexe", "Analyse complexe", "L3", 2, D.complexe),
  ue("Géométrie", "Géométrie", "L3", 2, D.geometrie, "au choix · maths pures"),
  ue("Analyse de Fourier", "Fourier", "L3", 2, D.fourier, "au choix · maths appliquées"),

  ue("Cours de Master 1", "Master 1", "M1", undefined, D.master),
  ue("Cours de Master 2", "Master 2", "M2", undefined, D.master),
];

/**
 * Anciennes matières (avant les UE) : les documents déjà publiés gardent leur couleur
 * et leur symbole. Le bureau peut corriger leur fiche pour choisir la bonne UE.
 */
const LEGACY: Record<string, Discipline & { short: string }> = {
  Analyse: { short: "Analyse", ...D.analyse },
  Algèbre: { short: "Algèbre", ...D.algebre },
  Topologie: { short: "Topologie", ...D.topo },
  Probabilités: { short: "Probabilités", ...D.proba },
  Statistiques: { short: "Statistiques", ...D.stats },
  "Équations différentielles": { short: "Équ. diff.", ...D.edp },
};

export const findUE = (name: string) => UES.find((u) => u.name === name);
export const uesOf = (level: string) => UES.filter((u) => u.level === level);

/** Couleur, symbole et nom court d'une matière, qu'elle soit une UE ou une ancienne matière. */
export function subjectInfo(name: string): Discipline & { short: string } {
  return findUE(name) ?? LEGACY[name] ?? { short: name, tile: FALLBACK_TILE };
}

const FALLBACK_TILE = "bg-secondary text-secondary-foreground";
export const subjectTile = (name: string) => subjectInfo(name).tile;
export const subjectShort = (name: string) => subjectInfo(name).short;

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
