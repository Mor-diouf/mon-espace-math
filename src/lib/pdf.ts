import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

/**
 * pdf.js (le lecteur PDF de Firefox), version « legacy » : elle tourne aussi sur les
 * téléphones Android anciens. Chargé seulement à l'ouverture du lecteur (~1 Mo).
 */
type PdfJs = typeof import("pdfjs-dist");
let lib: Promise<PdfJs> | null = null;

export function loadPdfJs(): Promise<PdfJs> {
  lib ??= import("pdfjs-dist/legacy/build/pdf.mjs").then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    return pdfjs as PdfJs;
  });
  return lib;
}

/**
 * Télécharge le lecteur à l'avance (quand un document est gardé hors ligne) :
 * le service worker le garde, et le document s'ouvrira ensuite sans réseau.
 */
export async function preloadPdfJs(): Promise<void> {
  await loadPdfJs();
  await fetch(workerUrl);
}
