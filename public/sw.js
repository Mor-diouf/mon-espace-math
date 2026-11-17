/*
 * Service worker de Mon Espace Math : l'app s'ouvre sans connexion.
 *
 * - Pages : réseau d'abord (avec un délai court, la 2G/3G est fréquente), sinon la
 *   dernière version gardée, sinon /offline.html.
 * - Fichiers /assets/ (JS, CSS, polices) : leur nom change à chaque mise en ligne,
 *   on les garde donc tels quels.
 * - PDF du stockage Supabase : servis depuis le téléphone s'ils ont été « gardés hors ligne »
 *   (c'est la page qui les range dans le cache mem-pdfs, voir src/lib/offline.ts).
 * - Les données (API Supabase) ne passent pas par ici : l'app les garde déjà elle-même.
 *
 * Changer VERSION force le renouvellement des pages et fichiers gardés (jamais des PDF).
 */
const VERSION = "v1";
const PAGES = `mem-pages-${VERSION}`;
const ASSETS = `mem-assets-${VERSION}`;
const PDFS = "mem-pdfs"; // même nom que dans src/lib/offline.ts
const KEEP = [PAGES, ASSETS, PDFS];

/** Pages gardées dès l'installation : les onglets de l'app et la page « pas de connexion ». */
const SHELL = ["/", "/catalogue", "/mes-docs", "/annonces", "/plus"];
/** Pages de détail : on garde seulement leur code (n'importe quel identifiant charge le même). */
const DETAIL = ["/documents/_", "/documents/_/lire", "/annonces/_"];
const OFFLINE_PAGE = "/offline.html";
const NAV_TIMEOUT_MS = 3500;
const MAX_ASSETS = 250;

/** Les fichiers /assets/ cités dans un texte (page, feuille de style). */
const assetUrls = (text) => text.match(/\/assets\/[\w.\-/]+/g) || [];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const pages = await caches.open(PAGES);
      const assets = await caches.open(ASSETS);
      await pages.add(OFFLINE_PAGE).catch(() => {});
      const found = new Set();
      await Promise.allSettled(
        [...SHELL, ...DETAIL].map(async (url) => {
          const res = await fetch(url, { cache: "no-cache" });
          if (!res.ok) return;
          assetUrls(await res.clone().text()).forEach((a) => found.add(a));
          if (SHELL.includes(url)) await pages.put(url, res);
        }),
      );
      // Les polices ne sont citées que dans les feuilles de style.
      await Promise.allSettled(
        [...found]
          .filter((a) => a.endsWith(".css"))
          .map(async (css) => {
            const res = await fetch(css);
            if (res.ok) assetUrls(await res.text()).forEach((a) => found.add(a));
          }),
      );
      await Promise.allSettled([...found].map((a) => assets.add(a)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith("mem-") && !KEEP.includes(n)).map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

/** Garde au plus MAX_ASSETS fichiers : les plus anciens (anciennes mises en ligne) partent. */
async function trim(cache) {
  const keys = await cache.keys();
  await Promise.all(
    keys.slice(0, Math.max(0, keys.length - MAX_ASSETS)).map((k) => cache.delete(k)),
  );
}

async function fromCache(request) {
  return (
    (await caches.match(request)) ||
    (await caches.match(request, { ignoreSearch: true })) ||
    (await caches.match(OFFLINE_PAGE))
  );
}

async function navigate(event) {
  const { request } = event;
  const network = fetch(request).then(async (res) => {
    if (res.ok && res.type === "basic") {
      const cache = await caches.open(PAGES);
      await cache.put(request, res.clone());
    }
    return res;
  });
  // La mise à jour du cache continue même si on a déjà répondu avec l'ancienne page.
  event.waitUntil(network.catch(() => {}));

  const timeout = new Promise((resolve) => setTimeout(resolve, NAV_TIMEOUT_MS));
  const fast = await Promise.race([network.catch(() => null), timeout]);
  if (fast) return fast;
  // Réseau lent ou absent : la page gardée si on l'a, sinon on attend quand même le réseau.
  const cached =
    (await caches.match(request)) || (await caches.match(request, { ignoreSearch: true }));
  if (cached) return cached;
  return network.catch(() => fromCache(request));
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) {
    const cache = await caches.open(ASSETS);
    await cache.put(request, res.clone());
    void trim(cache);
  }
  return res;
}

async function staleWhileRevalidate(event) {
  const { request } = event;
  const cached = await caches.match(request);
  const network = fetch(request).then(async (res) => {
    if (res.ok) await (await caches.open(ASSETS)).put(request, res.clone());
    return res;
  });
  if (cached) {
    event.waitUntil(network.catch(() => {}));
    return cached;
  }
  return network;
}

async function savedPdf(request) {
  const cache = await caches.open(PDFS);
  // Le lien « Télécharger » ajoute ?download=… : c'est le même fichier.
  return (await cache.match(request, { ignoreSearch: true })) || fetch(request);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (request.mode === "navigate") return event.respondWith(navigate(event));
    if (url.pathname.startsWith("/assets/")) return event.respondWith(cacheFirst(request));
    if (/\.(png|jpe?g|webp|svg|ico|woff2?|webmanifest)$/.test(url.pathname))
      return event.respondWith(staleWhileRevalidate(event));
    return;
  }

  if (url.pathname.startsWith("/storage/v1/object/public/"))
    return event.respondWith(savedPdf(request));
});
