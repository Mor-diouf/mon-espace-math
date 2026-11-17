import { useMemo } from "react";
import { createRemoteList, type RemoteStatus } from "./remote";
import { createStore } from "./store";
import { normalize } from "./subjects";
import { errorMessage, PDF_BUCKET, supabase } from "./supabase";

export { useFavorites, useOffline } from "./store";

/**
 * Forme d'un document. Les écrans passent tous par useDocs() / useDoc() :
 * les données viennent de Supabase (table « documents »), ou des exemples ci-dessous
 * tant que le backend n'est pas prêt.
 */
export type Doc = {
  id: string;
  title: string;
  level: string;
  subject: string;
  type: string;
  /** Année universitaire ou session de l'examen */
  year: number;
  notions: string[];
  /** Date de publication, format ISO « AAAA-MM-JJ » */
  date: string;
  size: string;
  pages: number;
  description: string;
  /** Lien public vers le PDF (absent en démonstration) */
  fileUrl?: string;
  /** Emplacement du PDF dans le stockage Supabase, pour pouvoir le supprimer */
  filePath?: string;
  /** Ajouté depuis l'espace bureau sur cet appareil (mode démo) */
  local?: boolean;
};

/** Ce que le bureau saisit ; le reste (identifiant, date, taille, lien) est calculé. */
export type NewDoc = Pick<
  Doc,
  "title" | "level" | "subject" | "type" | "year" | "notions" | "pages" | "description"
>;

/** Taille maximale d'un PDF (la même que dans supabase/schema.sql). */
export const MAX_PDF_BYTES = 20 * 1024 * 1024;

export const formatSize = (bytes: number) =>
  `${(bytes / 1_000_000).toFixed(1).replace(".", ",")} Mo`;

// Données de démonstration uniquement — pas de véritables annales de l'UASZ.
export const DOCS: Doc[] = [
  { id: "ana-l1-exam-2025", title: "Annales Analyse 1 — session 1", level: "L1", subject: "Analyse", type: "Examen", year: 2025, notions: ["suites", "limites", "continuité", "dérivées"], date: "2026-11-10", size: "2,5 Mo", pages: 4, description: "Sujet d'examen de première session : suites récurrentes, théorème des valeurs intermédiaires et étude de fonctions." },
  { id: "ana-l1-corr-2025", title: "Corrigé Analyse 1 — session 1", level: "L1", subject: "Analyse", type: "Corrigé", year: 2025, notions: ["suites", "limites", "continuité"], date: "2026-11-09", size: "3,1 Mo", pages: 9, description: "Corrigé détaillé du sujet de première session, avec les erreurs fréquentes signalées." },
  { id: "alg-l1-td2", title: "Algèbre 1 — TD 2 : polynômes", level: "L1", subject: "Algèbre", type: "TD", year: 2026, notions: ["polynômes", "division euclidienne", "racines"], date: "2026-11-04", size: "0,9 Mo", pages: 3, description: "Division euclidienne, racines multiples et factorisation dans R[X] et C[X]." },
  { id: "ana-l1-fiche-integrales", title: "Fiche : primitives et intégrales", level: "L1", subject: "Analyse", type: "Fiche de cours", year: 2026, notions: ["intégrales", "primitives", "intégration par parties"], date: "2026-10-30", size: "1,2 Mo", pages: 2, description: "Les primitives usuelles, l'intégration par parties et le changement de variable sur une page recto-verso." },
  { id: "alg-l2-td3", title: "Algèbre linéaire — TD 3", level: "L2", subject: "Algèbre", type: "TD", year: 2026, notions: ["matrices", "déterminants", "diagonalisation"], date: "2026-11-08", size: "1,1 Mo", pages: 4, description: "Calcul de déterminants, valeurs propres et diagonalisation de matrices 3×3." },
  { id: "ana-l2-exam-2024", title: "Annales Séries numériques", level: "L2", subject: "Analyse", type: "Examen", year: 2024, notions: ["séries", "convergence", "critère de d'Alembert"], date: "2026-10-22", size: "1,9 Mo", pages: 3, description: "Sujet d'examen sur la convergence des séries numériques et les séries alternées." },
  { id: "eq-l2-fiche", title: "Fiche : équations différentielles linéaires", level: "L2", subject: "Équations différentielles", type: "Fiche de cours", year: 2026, notions: ["équations différentielles", "ordre 1", "ordre 2", "variation de la constante"], date: "2026-10-18", size: "1,4 Mo", pages: 3, description: "Méthode de résolution des équations linéaires d'ordre 1 et 2 à coefficients constants." },
  { id: "proba-l2-td1", title: "Probabilités — TD 1 : dénombrement", level: "L2", subject: "Probabilités", type: "TD", year: 2026, notions: ["dénombrement", "probabilité conditionnelle", "Bayes"], date: "2026-10-12", size: "0,8 Mo", pages: 2, description: "Arrangements, combinaisons, probabilités conditionnelles et formule de Bayes." },
  { id: "topo-l3-fiche", title: "Espaces métriques", level: "L3", subject: "Topologie", type: "Fiche de cours", year: 2026, notions: ["espaces métriques", "compacité", "complétude"], date: "2026-11-05", size: "3,4 Mo", pages: 6, description: "Ouverts, fermés, suites de Cauchy, compacité et théorème du point fixe." },
  { id: "eq-l3-exam-2025", title: "Annales Équations différentielles", level: "L3", subject: "Équations différentielles", type: "Examen", year: 2025, notions: ["Cauchy-Lipschitz", "systèmes linéaires", "portraits de phase"], date: "2026-10-26", size: "2,2 Mo", pages: 4, description: "Existence et unicité, systèmes différentiels linéaires et étude qualitative." },
  { id: "stats-l3-td4", title: "Statistiques — TD 4 : estimation", level: "L3", subject: "Statistiques", type: "TD", year: 2026, notions: ["estimation", "maximum de vraisemblance", "intervalles de confiance"], date: "2026-10-15", size: "1,0 Mo", pages: 3, description: "Estimateurs sans biais, maximum de vraisemblance et intervalles de confiance." },
  { id: "proba-m1-corr", title: "Martingales discrètes", level: "M1", subject: "Probabilités", type: "Corrigé", year: 2025, notions: ["martingales", "temps d'arrêt", "espérance conditionnelle"], date: "2026-11-02", size: "1,8 Mo", pages: 7, description: "Corrigé du devoir sur les martingales, le théorème d'arrêt et les inégalités de Doob." },
  { id: "ana-m1-exam-2024", title: "Annales Intégration et mesure", level: "M1", subject: "Analyse", type: "Examen", year: 2024, notions: ["mesure", "intégrale de Lebesgue", "convergence dominée"], date: "2026-10-08", size: "2,1 Mo", pages: 3, description: "Tribus, mesures, théorèmes de convergence monotone et dominée." },
  { id: "af-m2-exam", title: "Analyse fonctionnelle", level: "M2", subject: "Analyse", type: "Examen", year: 2025, notions: ["espaces de Banach", "espaces de Hilbert", "opérateurs compacts"], date: "2026-10-28", size: "2,0 Mo", pages: 4, description: "Théorèmes de Hahn-Banach et de Banach-Steinhaus, opérateurs compacts sur un Hilbert." },
  { id: "eq-m2-fiche", title: "Fiche : stabilité de Lyapunov", level: "M2", subject: "Équations différentielles", type: "Fiche de cours", year: 2026, notions: ["stabilité", "fonction de Lyapunov", "portraits de phase"], date: "2026-10-20", size: "1,6 Mo", pages: 4, description: "Stabilité des points d'équilibre, linéarisation et fonctions de Lyapunov." },
  { id: "stats-m2-td", title: "Statistique inférentielle — TD", level: "M2", subject: "Statistiques", type: "TD", year: 2026, notions: ["tests d'hypothèses", "régression linéaire"], date: "2026-10-05", size: "1,3 Mo", pages: 5, description: "Tests paramétriques, test du khi-deux et modèle de régression linéaire." },
];

const EMPTY_DOCS: Doc[] = [];
/** Documents ajoutés sur ce téléphone en mode démonstration. */
const addedDocs = createStore<Doc[]>("mem:added-docs", EMPTY_DOCS);

const byDateDesc = (a: Doc, b: Doc) => b.date.localeCompare(a.date);

/** Une ligne de la table « documents » de Supabase. */
type Row = {
  id: string;
  title: string;
  level: string;
  subject: string;
  type: string;
  year: number;
  notions: string[] | null;
  description: string;
  pages: number;
  size_bytes: number | null;
  file_path: string | null;
  published_at: string;
};

const COLUMNS =
  "id,title,level,subject,type,year,notions,description,pages,size_bytes,file_path,published_at";

function toDoc(r: Row): Doc {
  const doc: Doc = {
    id: r.id,
    title: r.title,
    level: r.level,
    subject: r.subject,
    type: r.type,
    year: r.year,
    notions: r.notions ?? [],
    date: r.published_at,
    size: r.size_bytes ? formatSize(r.size_bytes) : "—",
    pages: r.pages,
    description: r.description,
  };
  if (r.file_path && supabase) {
    doc.filePath = r.file_path;
    doc.fileUrl = supabase.storage.from(PDF_BUCKET).getPublicUrl(r.file_path).data.publicUrl;
  }
  return doc;
}

const remoteDocs = createRemoteList<Doc>({
  cacheKey: "mem:docs-cache",
  demo: DOCS,
  load: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("documents")
      .select(COLUMNS)
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Row[]).map(toDoc);
  },
});

/** Vrai tant que l'app tourne sur les données d'exemple (pas de backend, ou tables pas encore créées). */
const inDemo = () => !supabase || remoteDocs.get().status === "demo";

/** Tous les documents, du plus récent au plus ancien. */
export function useDocs(): Doc[] {
  const added = addedDocs.use();
  const remote = remoteDocs.use();
  return useMemo(
    () => (remote.status === "demo" ? [...added, ...remote.items].sort(byDateDesc) : remote.items),
    [added, remote],
  );
}

/** D'où viennent les documents affichés : exemples, chargement, Supabase, ou hors connexion. */
export const useDocsStatus = (): RemoteStatus => remoteDocs.use().status;

export function useDoc(id: string): Doc | undefined {
  return useDocs().find((d) => d.id === id);
}

/**
 * Ajoute un document au catalogue.
 * En ligne : envoie le PDF dans le stockage puis enregistre la fiche (réservé au bureau).
 * En démonstration : garde la fiche sur ce téléphone.
 * Lève une erreur avec un message en français si l'envoi échoue.
 */
export async function addDoc(input: NewDoc, file?: File): Promise<Doc> {
  if (!supabase || inDemo()) {
    const doc: Doc = {
      ...input,
      size: file ? formatSize(file.size) : "—",
      id: `local-${Date.now().toString(36)}`,
      date: new Date().toISOString().slice(0, 10),
      local: true,
    };
    addedDocs.set((cur) => [doc, ...cur]);
    return doc;
  }

  const bucket = supabase.storage.from(PDF_BUCKET);
  let path: string | null = null;
  if (file) {
    path = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}.pdf`;
    // Le nom est unique et le fichier ne change jamais : les téléphones peuvent le garder un an.
    const up = await bucket.upload(path, file, {
      contentType: "application/pdf",
      cacheControl: "31536000",
    });
    if (up.error) throw new Error(errorMessage(up.error));
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({ ...input, size_bytes: file?.size ?? null, file_path: path })
    .select(COLUMNS)
    .single();
  if (error) {
    if (path) await bucket.remove([path]);
    throw new Error(errorMessage(error));
  }

  const doc = toDoc(data as Row);
  remoteDocs.update((items) => [doc, ...items]);
  return doc;
}

/** Retire un document (et son PDF). Lève une erreur avec un message en français en cas d'échec. */
export async function removeDoc(id: string): Promise<void> {
  if (!supabase || inDemo()) {
    addedDocs.set((cur) => cur.filter((d) => d.id !== id));
    return;
  }
  const doc = remoteDocs.get().items.find((d) => d.id === id);
  const { data, error } = await supabase.from("documents").delete().eq("id", id).select("id");
  if (error) throw new Error(errorMessage(error));
  if (!data || data.length === 0)
    throw new Error("Ce compte n'a pas le droit de retirer ce document.");
  if (doc?.filePath) await supabase.storage.from(PDF_BUCKET).remove([doc.filePath]);
  remoteDocs.update((items) => items.filter((d) => d.id !== id));
}

export type DocFilters = { q?: string; niveau?: string; matiere?: string; type?: string; annee?: number };

/** Recherche par mots : chaque mot doit apparaître dans le titre, la matière, le type ou les notions. */
export function filterDocs(docs: Doc[], f: DocFilters): Doc[] {
  const words = normalize(f.q ?? "").split(/\s+/).filter(Boolean);
  return docs.filter((d) => {
    if (f.niveau && d.level !== f.niveau) return false;
    if (f.matiere && d.subject !== f.matiere) return false;
    if (f.type && d.type !== f.type) return false;
    if (f.annee && d.year !== f.annee) return false;
    if (words.length === 0) return true;
    const hay = normalize([d.title, d.subject, d.type, d.level, String(d.year), ...d.notions].join(" "));
    return words.every((w) => hay.includes(w));
  });
}
