import { useSyncExternalStore } from "react";
import { isMissingTable, supabaseReady } from "./supabase";

/**
 * D'où viennent les données affichées :
 * - "demo"    : pas de backend (ou tables pas encore créées) → données d'exemple ;
 * - "loading" : premier chargement en cours ;
 * - "ready"   : données à jour, venues de Supabase ;
 * - "offline" : pas de réseau → dernières données connues sur ce téléphone.
 */
export type RemoteStatus = "demo" | "loading" | "ready" | "offline";

export type RemoteState<T> = { items: T[]; status: RemoteStatus };

/** Rien à montrer pour l'instant : afficher « Chargement… » ou « Pas de connexion » plutôt qu'une liste vide. */
export const isPending = (s: RemoteStatus) => s === "loading" || s === "offline";

/**
 * Liste venue de Supabase, partagée entre écrans.
 * La dernière version reçue est gardée sur le téléphone (`cacheKey`) : elle s'affiche
 * tout de suite au lancement suivant, et reste disponible sans réseau.
 */
export function createRemoteList<T>(opts: {
  cacheKey: string;
  demo: T[];
  load: () => Promise<T[]>;
}) {
  const DEMO: RemoteState<T> = { items: opts.demo, status: "demo" };
  const LOADING: RemoteState<T> = { items: [], status: "loading" };
  const first = supabaseReady ? LOADING : DEMO;

  let state = first;
  let started = false;
  const listeners = new Set<() => void>();

  const emit = (next: RemoteState<T>) => {
    state = next;
    listeners.forEach((l) => l());
  };

  const saveCache = (items: T[]) => {
    try {
      localStorage.setItem(opts.cacheKey, JSON.stringify(items));
    } catch {
      /* stockage plein ou bloqué : tant pis pour le cache */
    }
  };

  const refresh = async () => {
    if (!supabaseReady || typeof window === "undefined") return;
    try {
      const items = await opts.load();
      emit({ items, status: "ready" });
      saveCache(items);
    } catch (e) {
      if (isMissingTable(e)) emit(DEMO);
      else if (state.status !== "demo") emit({ items: state.items, status: "offline" });
    }
  };

  const start = () => {
    if (started || !supabaseReady || typeof window === "undefined") return;
    started = true;
    try {
      const raw = localStorage.getItem(opts.cacheKey);
      if (raw) emit({ items: JSON.parse(raw) as T[], status: "loading" });
    } catch {
      /* cache illisible : on attend le réseau */
    }
    void refresh();
    window.addEventListener("online", () => void refresh());
  };

  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    start();
    return () => {
      listeners.delete(cb);
    };
  };

  /** Modifie la liste affichée après un ajout ou une suppression réussis. */
  const update = (fn: (items: T[]) => T[]) => {
    const items = fn(state.items);
    emit({ ...state, items });
    saveCache(items);
  };

  return {
    get: () => state,
    use: () => useSyncExternalStore(subscribe, () => state, () => first),
    refresh,
    update,
  };
}
