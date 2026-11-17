import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { Annonce } from "@/lib/annonces";
import { dateParts, relativeDay } from "@/lib/subjects";

/** Pastille de date façon agenda : le jour en grand, le mois dessous. */
export function DateTile({ iso }: { iso: string }) {
  const { day, month } = dateParts(iso);
  return (
    <div
      aria-hidden
      className="grid h-14 w-12 shrink-0 content-center justify-items-center rounded-xl bg-primary/12 text-primary"
    >
      <span className="text-xl font-extrabold leading-none">{day}</span>
      <span className="mt-1 text-xs font-bold leading-none">{month}</span>
    </div>
  );
}

/**
 * Ligne d'annonce. `today` (« AAAA-MM-JJ », vide tant qu'il n'est pas connu) sert à écrire
 * « Demain », « Dans 3 jours »… ; `detailed` ajoute la phrase de résumé (liste des annonces).
 */
export function AnnonceCard({
  a,
  today = "",
  detailed = false,
}: {
  a: Annonce;
  today?: string;
  detailed?: boolean;
}) {
  const rel = relativeDay(a.date, today);
  const { day, month } = dateParts(a.date);
  return (
    <li>
      <Link
        to="/annonces/$id"
        params={{ id: a.id }}
        className="press-row flex items-center gap-3 overflow-hidden rounded-2xl bg-card p-3 shadow-card"
      >
        <DateTile iso={a.date} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-primary">
            {a.cat}
            {rel && <span className="text-muted-foreground"> · {rel}</span>}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[0.9375rem] font-semibold leading-snug">
            {a.title}
          </p>
          {detailed && (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{a.desc}</p>
          )}
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            <span className="sr-only">
              Le {day} {month},{" "}
            </span>
            {a.time ? `${a.time} · ` : ""}
            {a.place}
          </p>
        </div>
        <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  );
}
