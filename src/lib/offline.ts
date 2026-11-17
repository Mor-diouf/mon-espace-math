import type { Doc } from "./docs";

/**
 * Documents gardés hors ligne : le PDF et la fiche du document sont rangés dans le
 * cache du navigateur. Le service worker (public/sw.js) les sert ensuite sans réseau.
 */
const PDF_CACHE = "mem-pdfs"; // même nom que dans public/sw.js

const hasCaches = () => typeof window !== "undefined" && "caches" in window;

/** Active le service worker (jamais en développement : il gênerait le rechargement à chaud). */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || typeof navigator === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {
    /* navigateur trop ancien ou navigation privée : l'app marche quand même en ligne */
  });
}

/** Nom de fichier propre : « Annales Analyse 1 — session 1.pdf ». */
export const pdfName = (d: Doc) =>
  `${d.title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "document"}.pdf`;

const assetUrls = (text: string) => text.match(/\/assets\/[\w.\-/]+/g) ?? [];

/**
 * Range une page et tous les fichiers dont elle a besoin (code, styles, polices) :
 * elle s'ouvre ensuite sans réseau, même après une mise à jour de l'app.
 */
async function storePage(cache: Cache, path: string) {
  const res = await fetch(path);
  if (!res.ok) return;
  const files = new Set(assetUrls(await res.clone().text()));
  await cache.put(path, res);
  for (const css of [...files].filter((f) => f.endsWith(".css"))) {
    const r = await fetch(css).catch(() => null);
    if (r?.ok) assetUrls(await r.text()).forEach((f) => files.add(f));
  }
  await Promise.allSettled([...files].map((f) => cache.add(f)));
}

/**
 * Range le PDF et la fiche du document sur le téléphone.
 * Lève une erreur si le PDF n'a pas pu être téléchargé.
 */
export async function storeDoc(d: Doc): Promise<void> {
  if (!d.fileUrl || !hasCaches()) return;
  const cache = await caches.open(PDF_CACHE);
  await cache.add(d.fileUrl);
  // La fiche et le lecteur aussi, pour les ouvrir sans réseau même s'ils n'ont jamais été visités.
  await storePage(cache, `/documents/${d.id}`).catch(() => {});
  await storePage(cache, `/documents/${d.id}/lire`).catch(() => {});
  await import("./pdf").then((m) => m.preloadPdfJs()).catch(() => {});
  // Demande au téléphone de ne pas effacer ces fichiers quand la mémoire se remplit.
  await navigator.storage?.persist?.().catch(() => false);
}

export async function forgetDoc(d: Doc): Promise<void> {
  if (!hasCaches()) return;
  const cache = await caches.open(PDF_CACHE);
  if (d.fileUrl) await cache.delete(d.fileUrl);
  await cache.delete(`/documents/${d.id}`);
}

/**
 * Le contenu du PDF : la copie du téléphone si le document est gardé hors ligne,
 * sinon le réseau. Lève une erreur sans réseau et sans copie.
 */
export async function pdfBytes(d: Doc): Promise<ArrayBuffer> {
  if (!d.fileUrl) throw new Error("Pas de PDF");
  if (hasCaches()) {
    const saved = await (await caches.open(PDF_CACHE)).match(d.fileUrl);
    if (saved) return saved.arrayBuffer();
  }
  const res = await fetch(d.fileUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.arrayBuffer();
}

/** Efface tous les PDF gardés (bouton de la page « Plus »). */
export async function forgetAll(): Promise<void> {
  if (hasCaches()) await caches.delete(PDF_CACHE);
}

/**
 * Ouvre (ou télécharge) le PDF gardé sur le téléphone, sans réseau.
 * Renvoie faux s'il n'est pas dans le cache.
 */
export async function openStored(d: Doc, download: boolean): Promise<boolean> {
  if (!d.fileUrl || !hasCaches()) return false;
  const res = await (await caches.open(PDF_CACHE)).match(d.fileUrl);
  if (!res) return false;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  if (download) a.download = pdfName(d);
  else {
    a.target = "_blank";
    a.rel = "noopener";
  }
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}
