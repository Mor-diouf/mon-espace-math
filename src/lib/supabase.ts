import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;

/**
 * Vrai quand le fichier .env contient l'adresse et la clé publique du projet Supabase.
 * Faux pendant les tests : l'app reste alors en mode démonstration, sans réseau.
 */
export const supabaseReady = Boolean(url && key) && import.meta.env.MODE !== "test";

/**
 * Client Supabase, créé seulement dans le navigateur : le rendu serveur n'a jamais
 * besoin des données, il affiche l'état « chargement ».
 */
export const supabase: SupabaseClient | null =
  supabaseReady && typeof window !== "undefined"
    ? createClient(url as string, key as string, { auth: { detectSessionInUrl: false } })
    : null;

/** Nom du dossier de stockage (bucket) des PDF. */
export const PDF_BUCKET = "documents";

/** Vrai si l'erreur dit que la table n'existe pas encore (script SQL pas encore lancé). */
export function isMissingTable(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === "PGRST205" || code === "42P01";
}

/** Message en français pour une erreur Supabase, à montrer tel quel à l'utilisateur. */
export function errorMessage(error: unknown): string {
  const e = error as { message?: string; code?: string; status?: number } | null;
  const msg = e?.message ?? "";
  if (/failed to fetch|networkerror|load failed/i.test(msg))
    return "Pas de connexion Internet. Réessayez dans un instant.";
  if (/invalid login credentials/i.test(msg)) return "E-mail ou mot de passe incorrect.";
  if (/email not confirmed/i.test(msg)) return "Cette adresse e-mail n'est pas encore confirmée.";
  if (e?.code === "42501" || /row-level security|not authorized|unauthorized/i.test(msg))
    return "Ce compte n'a pas le droit de publier.";
  if (/exceeded the maximum allowed size|payload too large/i.test(msg))
    return "Le fichier est trop lourd.";
  return msg || "Une erreur est survenue. Réessayez.";
}
