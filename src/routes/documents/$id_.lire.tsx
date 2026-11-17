import { createFileRoute, Link } from "@tanstack/react-router";
import { FileQuestion, Minus, Plus, RotateCw, WifiOff } from "lucide-react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";
import { btnPrimary, EmptyState, Pending } from "@/components/kit";
import { barButton, TopBar } from "@/components/TopBar";
import { DOCS, useDoc, useDocsStatus, type Doc } from "@/lib/docs";
import { pdfBytes } from "@/lib/offline";
import { loadPdfJs } from "@/lib/pdf";
import { isPending } from "@/lib/remote";

export const Route = createFileRoute("/documents/$id_/lire")({
  head: ({ params }) => {
    const d = DOCS.find((x) => x.id === params.id);
    const title = d ? `${d.title} — Lecture` : "Lecture — Mon Espace Math";
    return {
      meta: [
        { title },
        { name: "description", content: "Lire le document dans Mon Espace Math." },
        { property: "og:title", content: title },
        { property: "og:description", content: "Lire le document dans Mon Espace Math." },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: ReaderPage,
});

const ZOOMS = [1, 1.5, 2, 3];

function ReaderPage() {
  const { id } = Route.useParams();
  const d = useDoc(id);
  const status = useDocsStatus();
  const [zoom, setZoom] = useState(0);

  const zoomButtons = (
    <>
      <button
        aria-label="Dézoomer"
        disabled={zoom === 0}
        onClick={() => setZoom((z) => Math.max(0, z - 1))}
        className={`${barButton} disabled:opacity-40`}
      >
        <Minus className="h-6 w-6" />
      </button>
      <button
        aria-label="Zoomer"
        disabled={zoom === ZOOMS.length - 1}
        onClick={() => setZoom((z) => Math.min(ZOOMS.length - 1, z + 1))}
        className={`${barButton} disabled:opacity-40`}
      >
        <Plus className="h-6 w-6" />
      </button>
    </>
  );

  if (!d && isPending(status)) {
    return (
      <>
        <TopBar title="Lecture" back="/catalogue" />
        <Pending status={status} />
      </>
    );
  }
  if (!d?.fileUrl) {
    return (
      <>
        <TopBar title="Lecture" back="/catalogue" />
        <EmptyState
          icon={FileQuestion}
          title={d ? "Le PDF n'est pas encore en ligne" : "Document introuvable"}
          hint={
            d ? "Le bureau ne l'a pas encore ajouté." : "Il a peut-être été retiré par le bureau."
          }
        >
          <Link to="/catalogue" className={btnPrimary}>
            Voir le catalogue
          </Link>
        </EmptyState>
      </>
    );
  }

  return (
    <>
      <TopBar title={d.title} back="/catalogue" right={zoomButtons} />
      <PdfView key={d.id} d={d} scale={ZOOMS[zoom] ?? 1} />
    </>
  );
}

type Load =
  | { state: "loading" }
  | { state: "error" }
  | { state: "ready"; pdf: PDFDocumentProxy; ratio: number };

/** Toutes les pages du PDF, l'une sous l'autre, dessinées au fur et à mesure du défilement. */
function PdfView({ d, scale }: { d: Doc; scale: number }) {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    let pdf: PDFDocumentProxy | null = null;
    let cancelled = false;
    setLoad({ state: "loading" });
    (async () => {
      try {
        const [pdfjs, data] = await Promise.all([loadPdfJs(), pdfBytes(d)]);
        pdf = await pdfjs.getDocument({ data }).promise;
        const first = (await pdf.getPage(1)).getViewport({ scale: 1 });
        if (!cancelled) setLoad({ state: "ready", pdf, ratio: first.height / first.width });
      } catch {
        if (!cancelled) setLoad({ state: "error" });
      }
    })();
    return () => {
      cancelled = true;
      void pdf?.destroy();
    };
  }, [d, attempt]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) =>
      setWidth(Math.floor(entries[0]?.contentRect.width ?? 0)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <main ref={boxRef} className="min-h-[calc(100dvh-3.5rem)] bg-muted px-2 py-3">
      {load.state === "loading" && (
        <p role="status" className="pt-14 text-center text-sm text-muted-foreground">
          Ouverture du document…
        </p>
      )}
      {load.state === "error" && (
        <EmptyState
          icon={WifiOff}
          title="Le document n'a pas pu s'ouvrir"
          hint="Vérifiez votre connexion. Pour le lire sans réseau, gardez-le hors ligne depuis sa fiche."
        >
          <button onClick={() => setAttempt((n) => n + 1)} className={btnPrimary}>
            <RotateCw className="h-5 w-5" />
            Réessayer
          </button>
        </EmptyState>
      )}
      {load.state === "ready" && width > 0 && (
        <div className="overflow-x-auto">
          <div className="mx-auto space-y-3" style={{ width: (width - 16) * scale }}>
            {Array.from({ length: load.pdf.numPages }, (_, i) => (
              <PdfPage
                key={i}
                pdf={load.pdf}
                n={i + 1}
                total={load.pdf.numPages}
                width={(width - 16) * scale}
                ratio={load.ratio}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

/** Une page : dessinée quand elle approche de l'écran, à la netteté de l'écran du téléphone. */
function PdfPage({
  pdf,
  n,
  total,
  width,
  ratio,
}: {
  pdf: PDFDocumentProxy;
  n: number;
  total: number;
  width: number;
  ratio: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);
  const [height, setHeight] = useState(width * ratio);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && setNear(true), {
      rootMargin: "800px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    let task: RenderTask | null = null;
    let cancelled = false;
    (async () => {
      const page = await pdf.getPage(n);
      if (cancelled) return;
      const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      // Limite la taille du dessin : au-delà, les téléphones modestes manquent de mémoire.
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5, 4096 / viewport.width);
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      setHeight(viewport.height);
      task = page.render({ canvasContext: ctx, viewport, transform: [dpr, 0, 0, dpr, 0, 0] });
      await task.promise.catch(() => {});
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [near, pdf, n, width]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`Page ${n} sur ${total}`}
      className="block rounded-sm bg-white shadow-card"
      style={{ width, height }}
    />
  );
}
