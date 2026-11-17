import { useSyncExternalStore } from "react";

/**
 * Petit magasin persistant dans le navigateur (localStorage), partagé entre écrans.
 * `fallback` doit être une constante de module : React exige une valeur stable côté serveur.
 */
export function createStore<T>(key: string, fallback: T) {
  let cache: T = fallback;
  let loaded = false;
  const listeners = new Set<() => void>();

  const get = (): T => {
    if (typeof window === "undefined") return fallback;
    if (!loaded) {
      loaded = true;
      try {
        const raw = localStorage.getItem(key);
        cache = raw ? (JSON.parse(raw) as T) : fallback;
      } catch {
        cache = fallback;
      }
    }
    return cache;
  };

  const set = (next: T | ((cur: T) => T)) => {
    cache = typeof next === "function" ? (next as (cur: T) => T)(get()) : next;
    loaded = true;
    try {
      localStorage.setItem(key, JSON.stringify(cache));
    } catch {
      /* stockage plein ou bloqué : la valeur reste en mémoire */
    }
    listeners.forEach((l) => l());
  };

  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  };

  const use = () => useSyncExternalStore(subscribe, get, () => fallback);

  return { get, set, use };
}

const EMPTY_IDS: string[] = [];

/** Liste d'identifiants (favoris, hors ligne) avec une fonction pour basculer un élément. */
function idListStore(key: string) {
  const store = createStore<string[]>(key, EMPTY_IDS);
  const toggle = (id: string) =>
    store.set((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const useList = () => [store.use(), toggle] as const;
  return { ...store, useList };
}

export const favoritesStore = idListStore("mem:favorites");
export const offlineStore = idListStore("mem:offline");
export const useFavorites = favoritesStore.useList;
export const useOffline = offlineStore.useList;

/** Niveau choisi dans « Plus » : sert de niveau par défaut à l'accueil. */
export const levelStore = createStore<string>("mem:level", "L1");
export const useLevel = levelStore.use;

/** Passe à vrai quand l'étudiant a choisi son niveau au premier lancement. */
export const onboardedStore = createStore<boolean>("mem:onboarded", false);

const subscribeNever = () => () => {};
/**
 * Faux pendant le rendu serveur et la toute première passe du navigateur, vrai ensuite.
 * Sert à n'afficher qu'après coup ce qui dépend du téléphone (premier lancement, date du jour).
 */
export const useHydrated = () =>
  useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
