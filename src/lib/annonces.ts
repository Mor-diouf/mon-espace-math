import { useMemo } from "react";
import { createRemoteList, type RemoteStatus } from "./remote";
import { createStore } from "./store";
import { errorMessage, supabase } from "./supabase";

export type Annonce = {
  id: string;
  cat: string;
  /** Date de l'événement, format ISO « AAAA-MM-JJ » */
  date: string;
  time?: string;
  place: string;
  title: string;
  desc: string;
  body: string;
  local?: boolean;
};

export const ANNONCE_CATS = ["Conférence", "Atelier", "Tutorat", "Examens", "Info"] as const;

// Annonces d'exemple pour la démonstration.
export const ANNONCES: Annonce[] = [
  {
    id: "conf-eq-diff",
    cat: "Conférence",
    date: "2026-11-19",
    time: "15 h 00",
    place: "Amphithéâtre principal",
    title: "Conférence sur les équations différentielles",
    desc: "Ouverte à tous les étudiants.",
    body: "L'Espace Math organise une conférence sur les équations différentielles et leurs applications en biologie et en physique. Elle s'adresse à tous les niveaux : les étudiants de Licence y trouveront une introduction, ceux de Master des pistes de mémoire. Un temps de questions est prévu à la fin.",
  },
  {
    id: "atelier-latex",
    cat: "Atelier",
    date: "2026-11-21",
    time: "10 h 00",
    place: "Salle informatique",
    title: "Atelier LaTeX : rédiger son mémoire",
    desc: "Inscription libre pour les étudiants de L3 à M2.",
    body: "Prise en main de LaTeX pour rédiger un mémoire : structure du document, équations, théorèmes, bibliographie avec BibTeX et insertion de figures. Venez avec votre ordinateur si possible. Les modèles utilisés seront partagés dans l'application.",
  },
  {
    id: "tutorat-analyse-l1",
    cat: "Tutorat",
    date: "2026-11-25",
    time: "17 h 00",
    place: "Espace Math",
    title: "Tutorat en Analyse L1",
    desc: "Chaque mardi et jeudi, encadré par des étudiants de Master.",
    body: "Des étudiants de Master accompagnent les L1 en Analyse : reprise des notions du cours, exercices de TD et préparation des examens. Le tutorat est gratuit et sans inscription. Apportez vos questions et vos brouillons !",
  },
  {
    id: "calendrier-examens",
    cat: "Examens",
    date: "2026-12-08",
    place: "Département de Mathématiques",
    title: "Calendrier des examens du premier semestre",
    desc: "Les dates par niveau seront affichées au département.",
    body: "Le calendrier des examens du premier semestre sera publié ici dès qu'il est validé. Pensez à consulter les annales et corrigés disponibles dans le catalogue pour vous préparer.",
  },
];

const EMPTY: Annonce[] = [];
/** Annonces ajoutées sur ce téléphone en mode démonstration. */
const addedAnnonces = createStore<Annonce[]>("mem:added-annonces", EMPTY);

const byDate = (a: Annonce, b: Annonce) => a.date.localeCompare(b.date);

/** Une ligne de la table « annonces » de Supabase. */
type Row = {
  id: string;
  cat: string;
  event_date: string;
  event_time: string | null;
  place: string;
  title: string;
  summary: string;
  body: string;
};

const COLUMNS = "id,cat,event_date,event_time,place,title,summary,body";

const toAnnonce = (r: Row): Annonce => ({
  id: r.id,
  cat: r.cat,
  date: r.event_date,
  ...(r.event_time ? { time: r.event_time } : {}),
  place: r.place,
  title: r.title,
  desc: r.summary,
  body: r.body,
});

const remoteAnnonces = createRemoteList<Annonce>({
  cacheKey: "mem:annonces-cache",
  demo: ANNONCES,
  load: async () => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("annonces")
      .select(COLUMNS)
      .order("event_date", { ascending: true });
    if (error) throw error;
    return (data as Row[]).map(toAnnonce);
  },
});

const inDemo = () => !supabase || remoteAnnonces.get().status === "demo";

/** Toutes les annonces, de la plus proche à la plus lointaine. */
export function useAnnonces(): Annonce[] {
  const added = addedAnnonces.use();
  const remote = remoteAnnonces.use();
  return useMemo(
    () => (remote.status === "demo" ? [...added, ...remote.items].sort(byDate) : remote.items),
    [added, remote],
  );
}

/** D'où viennent les annonces affichées : exemples, chargement, Supabase, ou hors connexion. */
export const useAnnoncesStatus = (): RemoteStatus => remoteAnnonces.use().status;

/** La prochaine annonce à venir (ou la dernière passée s'il n'y en a plus). `today` vide = pas encore connu. */
export function pickNext(list: Annonce[], today: string): Annonce | undefined {
  return list.find((a) => a.date >= today) ?? list.at(-1);
}

export function useAnnonce(id: string) {
  return useAnnonces().find((a) => a.id === id);
}

/**
 * Publie une annonce. En ligne : l'enregistre dans Supabase (réservé au bureau) ;
 * en démonstration : la garde sur ce téléphone.
 * Lève une erreur avec un message en français si l'envoi échoue.
 */
export async function addAnnonce(input: Omit<Annonce, "id" | "local">): Promise<Annonce> {
  if (!supabase || inDemo()) {
    const a: Annonce = { ...input, id: `local-${Date.now().toString(36)}`, local: true };
    addedAnnonces.set((cur) => [a, ...cur]);
    return a;
  }
  const { data, error } = await supabase
    .from("annonces")
    .insert({
      cat: input.cat,
      event_date: input.date,
      event_time: input.time ?? null,
      place: input.place,
      title: input.title,
      summary: input.desc,
      body: input.body,
    })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(errorMessage(error));
  const a = toAnnonce(data as Row);
  remoteAnnonces.update((items) => [...items, a].sort(byDate));
  return a;
}

/** Retire une annonce. Lève une erreur avec un message en français en cas d'échec. */
export async function removeAnnonce(id: string): Promise<void> {
  if (!supabase || inDemo()) {
    addedAnnonces.set((cur) => cur.filter((a) => a.id !== id));
    return;
  }
  const { data, error } = await supabase.from("annonces").delete().eq("id", id).select("id");
  if (error) throw new Error(errorMessage(error));
  if (!data || data.length === 0) throw new Error("Ce compte n'a pas le droit de retirer cette annonce.");
  remoteAnnonces.update((items) => items.filter((a) => a.id !== id));
}
