import { Link } from "@tanstack/react-router";
import { CircleCheck, CloudDownload } from "lucide-react";
import { toast } from "sonner";
import { type Doc, useOffline } from "@/lib/docs";
import { findSubject, subjectShort, subjectTile } from "@/lib/subjects";

/** Tuile carrée à la couleur de la matière, avec son glyphe. C'est elle qui permet de repérer un document d'un coup d'œil. */
export function SubjectTile({
  subject,
  className = "h-12 w-12 rounded-xl text-2xl",
}: {
  subject: string;
  className?: string;
}) {
  const s = findSubject(subject);
  const Icon = s?.icon;
  return (
    <div
      aria-hidden
      className={`grid shrink-0 place-items-center ${subjectTile(subject)} ${className}`}
    >
      {Icon ? (
        <Icon className="h-[50%] w-[50%]" />
      ) : (
        <span className="font-serif italic leading-none">{s?.glyph ?? "∑"}</span>
      )}
    </div>
  );
}

export function downloadSoon() {
  toast("Téléchargement bientôt disponible", {
    description: "Les vrais PDF seront ajoutés par le bureau de l'Espace Math.",
  });
}

/** Bascule « hors ligne » avec un message de confirmation. */
export function useOfflineToggle() {
  const [off, toggle] = useOffline();
  const toggleOffline = (d: Doc) => {
    const wasSaved = off.includes(d.id);
    toggle(d.id);
    if (wasSaved) toast("Retiré des documents hors ligne");
    else
      toast("Ajouté à vos documents hors ligne", {
        description:
          "Démo : le fichier sera réellement enregistré quand les vrais PDF seront en ligne.",
      });
  };
  return [off, toggleOffline] as const;
}

/**
 * Ligne de document de 72 px : la tuile de matière, le titre, une ligne d'infos,
 * et une seule action à droite (garder hors ligne). Le reste est sur la fiche du document.
 */
export function DocRow({ d }: { d: Doc }) {
  const [off, toggleOffline] = useOfflineToggle();
  const saved = off.includes(d.id);
  return (
    <li className="flex items-stretch overflow-hidden rounded-2xl bg-card shadow-card">
      <Link
        to="/documents/$id"
        params={{ id: d.id }}
        className="press-row flex min-w-0 flex-1 items-center gap-3 py-3 pl-3 pr-1"
      >
        <SubjectTile subject={d.subject} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[0.9375rem] font-semibold leading-snug">{d.title}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            <span className="font-bold text-foreground/85">{d.type}</span> ·{" "}
            {subjectShort(d.subject)} · {d.level} · {d.year}
          </p>
        </div>
      </Link>
      <button
        aria-label={
          saved
            ? `Retirer « ${d.title} » des documents hors ligne`
            : `Garder « ${d.title} » hors ligne`
        }
        aria-pressed={saved}
        onClick={() => toggleOffline(d)}
        className="press-row grid w-13 shrink-0 place-items-center"
      >
        {saved ? (
          <CircleCheck className="h-6 w-6 text-primary" />
        ) : (
          <CloudDownload className="h-6 w-6 text-muted-foreground" />
        )}
      </button>
    </li>
  );
}

export function DocList({ docs }: { docs: Doc[] }) {
  return (
    <ul className="space-y-2">
      {docs.map((d) => (
        <DocRow key={d.id} d={d} />
      ))}
    </ul>
  );
}
