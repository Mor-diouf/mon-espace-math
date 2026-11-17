import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CircleCheck, CloudDownload, Download, FileQuestion, Star } from "lucide-react";
import { toast } from "sonner";
import { DocList, downloadSoon, SubjectTile, useOfflineToggle } from "@/components/DocRow";
import { ActionBar, btnOutline, btnPrimary, DemoNote, EmptyState, Pending } from "@/components/kit";
import { barButton, TopBar } from "@/components/TopBar";
import { DOCS, useDoc, useDocs, useDocsStatus, useFavorites, type Doc } from "@/lib/docs";
import { isPending } from "@/lib/remote";
import { formatDate, subjectTile } from "@/lib/subjects";

export const Route = createFileRoute("/documents/$id")({
  head: ({ params }) => {
    const d = DOCS.find((x) => x.id === params.id);
    const title = d ? `${d.title} — Mon Espace Math` : "Document — Mon Espace Math";
    const description = d?.description ?? "Document de l'Espace Math de l'UASZ.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: DocumentPage,
});

function DocumentPage() {
  const { id } = Route.useParams();
  const d = useDoc(id);
  const status = useDocsStatus();
  const [favs, toggleFav] = useFavorites();
  const fav = d ? favs.includes(d.id) : false;

  if (!d && isPending(status)) {
    return (
      <>
        <TopBar title="Document" back="/catalogue" />
        <Pending status={status} />
      </>
    );
  }
  if (!d) {
    return (
      <>
        <TopBar title="Document" back="/catalogue" />
        <EmptyState
          icon={FileQuestion}
          title="Document introuvable"
          hint="Il a peut-être été retiré par le bureau."
        >
          <Link to="/catalogue" className={btnPrimary}>
            Voir le catalogue
          </Link>
        </EmptyState>
      </>
    );
  }

  const onFav = () => {
    toggleFav(d.id);
    toast(fav ? "Retiré des favoris" : "Ajouté aux favoris");
  };

  return (
    <>
      <TopBar
        title={`${d.type} · ${d.level}`}
        back="/catalogue"
        right={
          <button
            aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
            aria-pressed={fav}
            onClick={onFav}
            className={barButton}
          >
            <Star className={`h-6 w-6 ${fav ? "fill-lime text-lime" : ""}`} />
          </button>
        }
      />
      <DocDetail d={d} demo={status === "demo"} />
    </>
  );
}

/** Nom de fichier propre pour le téléchargement : « Annales Analyse 1 — session 1.pdf ». */
const pdfName = (d: Doc) => `${d.title.replace(/[\\/:*?"<>|]+/g, " ").trim() || "document"}.pdf`;

function DocDetail({ d, demo }: { d: Doc; demo: boolean }) {
  const [off, toggleOffline] = useOfflineToggle();
  const saved = off.includes(d.id);
  const related = useDocs()
    .filter((x) => x.id !== d.id && x.subject === d.subject)
    .slice(0, 3);

  // Sans fichier (démonstration, ou fiche publiée sans PDF), les boutons expliquent pourquoi.
  const read = () =>
    demo
      ? toast("Lecteur PDF bientôt disponible", {
          description: "Il s'ouvrira ici dès que les vrais documents seront en ligne.",
        })
      : toast("Le PDF de ce document n'est pas encore en ligne");

  return (
    <>
      <main className="px-4 pb-action pt-4">
        <PdfPreview d={d} demo={demo} />

        <div className="mt-5">
          <span
            className={`inline-flex h-7 items-center gap-1.5 rounded-full pl-1 pr-3 text-xs font-bold ${subjectTile(d.subject)}`}
          >
            <SubjectTile
              subject={d.subject}
              className="h-5 w-5 rounded-full bg-transparent! text-sm"
            />
            {d.subject}
          </span>
          <h2 className="mt-2 text-[1.375rem] font-extrabold leading-snug tracking-tight">
            {d.title}
          </h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
            {d.description}
          </p>
        </div>

        <dl className="mt-5 grid grid-cols-4 divide-x divide-border rounded-2xl bg-card py-3 text-center shadow-card">
          {[
            ["Année", String(d.year)],
            ["Pages", String(d.pages)],
            ["Taille", d.size],
            ["Publié", formatDate(d.date).replace(/ \d{4}$/, "")],
          ].map(([k, v]) => (
            <div key={k} className="px-1">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 text-sm font-bold">{v}</dd>
            </div>
          ))}
        </dl>

        {d.fileUrl ? (
          <a
            href={`${d.fileUrl}?download=${encodeURIComponent(pdfName(d))}`}
            className={`${btnOutline} mt-3 w-full`}
          >
            <Download className="h-5 w-5" />
            Télécharger le PDF
          </a>
        ) : (
          <button onClick={demo ? downloadSoon : read} className={`${btnOutline} mt-3 w-full`}>
            <Download className="h-5 w-5" />
            Télécharger le PDF
          </button>
        )}

        <section className="mt-7">
          <h3 className="text-lg font-bold">Notions abordées</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Touchez une notion pour voir les autres documents qui en parlent.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-2 gap-y-3">
            {d.notions.map((n) => (
              <Link
                key={n}
                to="/catalogue"
                search={{ q: n }}
                className="press hit flex h-10 items-center rounded-full bg-secondary px-4 text-sm font-semibold text-secondary-foreground"
              >
                {n}
              </Link>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-7">
            <h3 className="mb-3 text-lg font-bold">Dans la même matière</h3>
            <DocList docs={related} />
          </section>
        )}

        {demo && !d.local && (
          <DemoNote>
            Document fictif de démonstration — pas une véritable annale de l'UASZ.
          </DemoNote>
        )}
      </main>

      <ActionBar>
        {d.fileUrl ? (
          <a
            href={d.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btnPrimary} flex-1`}
          >
            <BookOpen className="h-5 w-5" />
            Lire le document
          </a>
        ) : (
          <button onClick={read} className={`${btnPrimary} flex-1`}>
            <BookOpen className="h-5 w-5" />
            Lire le document
          </button>
        )}
        <button
          aria-label={saved ? "Retirer des documents hors ligne" : "Garder hors ligne"}
          aria-pressed={saved}
          onClick={() => toggleOffline(d)}
          className={`press grid h-13 w-13 shrink-0 place-items-center rounded-full ${saved ? "bg-primary/12 text-primary" : "bg-secondary text-secondary-foreground"}`}
        >
          {saved ? <CircleCheck className="h-6 w-6" /> : <CloudDownload className="h-6 w-6" />}
        </button>
      </ActionBar>
    </>
  );
}

/** Aperçu dessiné du haut de la première page, en attendant le vrai lecteur PDF. Purement décoratif. */
function PdfPreview({ d, demo }: { d: Doc; demo: boolean }) {
  return (
    <figure className="relative overflow-hidden rounded-2xl bg-secondary">
      <div
        aria-hidden
        className="mx-auto mt-5 h-36 w-44 rounded-t-md bg-white px-4 pt-4 text-neutral-800 shadow-lg"
      >
        <p className="text-center text-[0.4375rem] font-semibold uppercase tracking-widest opacity-60">
          UASZ · Département de Mathématiques
        </p>
        <p className="mt-2 line-clamp-2 text-center font-serif text-[0.6875rem] font-semibold leading-tight">
          {d.title}
        </p>
        <p className="mt-1 text-center text-[0.4375rem] opacity-60">
          {d.level} · {d.year}
        </p>
        <div className="mt-3 space-y-1.5">
          {[92, 100, 85, 96, 60].map((w, i) => (
            <div key={i} className="h-1 rounded bg-neutral-800/15" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
      <span
        aria-hidden
        className="absolute right-3 top-3 rounded bg-pdf px-1.5 py-0.5 text-xs font-bold text-white"
      >
        PDF
      </span>
      <figcaption className="bg-card/70 py-2 text-center text-xs text-muted-foreground">
        {demo ? "Aperçu de démonstration" : "PDF"} · {d.pages} page{d.pages > 1 ? "s" : ""}
      </figcaption>
    </figure>
  );
}
