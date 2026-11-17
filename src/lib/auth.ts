import { useSyncExternalStore } from "react";
import { errorMessage, supabase } from "./supabase";

/**
 * Connexion des membres du bureau (les étudiants, eux, n'ont pas de compte).
 * - "loading" : on ne sait pas encore si quelqu'un est connecté ;
 * - "out"     : personne n'est connecté ;
 * - "in"      : un compte est connecté ; `bureau` dit s'il a le droit de publier,
 *               `unverified` qu'on n'a pas pu le vérifier (pas de réseau).
 */
export type AuthState =
  | { status: "loading" }
  | { status: "out" }
  | { status: "in"; email: string; bureau: boolean; unverified: boolean };

const LOADING: AuthState = { status: "loading" };
const OUT: AuthState = { status: "out" };

let state: AuthState = LOADING;
let started = false;
/** Compte dont on a déjà vérifié les droits (`undefined` = pas encore regardé). */
let knownUser: string | null | undefined;
const listeners = new Set<() => void>();

const emit = (next: AuthState) => {
  state = next;
  listeners.forEach((l) => l());
};

/** Demande à Supabase si le compte connecté est inscrit dans la table « bureau ». */
async function check(email: string) {
  if (!supabase) return;
  const { data, error } = await supabase.rpc("est_bureau");
  emit({ status: "in", email, bureau: !error && data === true, unverified: Boolean(error) });
}

function start() {
  if (started || !supabase) return;
  started = true;
  // Supabase appelle cette fonction tout de suite avec la session gardée sur le téléphone,
  // puis à chaque connexion ou déconnexion.
  supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user.id ?? null;
    if (user === knownUser) return;
    knownUser = user;
    if (!session) emit(OUT);
    // Ne pas appeler Supabase directement dans ce rappel (risque de blocage) : on diffère.
    else setTimeout(() => void check(session.user.email ?? "compte du bureau"), 0);
  });
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  start();
  return () => {
    listeners.delete(cb);
  };
};

export const useAuth = (): AuthState =>
  useSyncExternalStore(
    subscribe,
    () => state,
    () => LOADING,
  );

/** Revérifie les droits du compte connecté (après un échec réseau). */
export function recheckAuth() {
  if (state.status === "in") void check(state.email);
}

/** Lève une erreur avec un message en français si la connexion échoue. */
export async function signIn(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error("La connexion n'est pas disponible.");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(errorMessage(error));
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}
