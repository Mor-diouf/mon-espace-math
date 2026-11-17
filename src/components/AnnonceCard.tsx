import { Link } from "@tanstack/react-router";
import { ChevronRight, Pin } from "lucide-react";
import { CatMedallion, catStyle } from "@/components/CatBadge";
import { isNew, isPinned, type Annonce } from "@/lib/annonces";
import { dateParts, relativeDay } from "@/lib/subjects";

/**
 * Pastille de date façon agenda, teintée de la couleur de la catégorie,
 * avec le médaillon de la catégorie posé sur le coin.
 */
function DateTile({ iso, cat, urgent }: { iso: string; cat: string; urgent: boolean }) {
  const { day, month } = dateParts(iso);
  const s = catStyle(cat);
  return (
    <div aria-hidden className="relative shrink-0">
      <div
        className={`grid h-14 w-12 content-center justify-items-center rounded-xl ring-1 ring-inset ${s.soft}`}
      >
        <span className="text-xl font-extrabold leading-none">{day}</span>
        <span className="mt-1 text-xs font-bold leading-none">{month}</span>
      </div>
      <CatMedallion
        cat={cat}
        solid
        size="sm"
        className={`absolute -right-2 -top-2 h-6! w-6! rounded-full! ring-2 ring-card [&>svg]:h-3.5 [&>svg]:w-3.5 ${urgent ? "origin-top motion-safe:animate-[ring_0.9s_ease-in-out_2]" : ""}`}
      />
    </div>
  );
}

/**
 * Ligne d'annonce. `today` (« AAAA-MM-JJ », vide tant qu'il n'est pas connu) sert à écrire
 * « Demain », « Dans 3 jours »… ; `now` (horloge du téléphone, 0 avant affichage) au badge
 * « Nouveau » ; `detailed` ajoute la phrase de résumé ; `index` décale l'animation d'entrée.
 */
export function AnnonceCard({
  a,
  today = "",
  now = 0,
  detailed = false,
  index = 0,
}: {
  a: Annonce;
  today?: string;
  now?: number;
  detailed?: boolean;
  index?: number;
}) {
  const rel = relativeDay(a.date, today);
  const soon = rel === "Aujourd'hui" || rel === "Demain";
  const { day, month } = dateParts(a.date);
  const s = catStyle(a.cat);
  const pinned = isPinned(a, today);
  const fresh = isNew(a, now);
  return (
    <li
      className="motion-safe:animate-[rise_0.35s_ease-out_both]"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <Link
        to="/annonces/$id"
        params={{ id: a.id }}
        className={`press-row flex items-center gap-3 overflow-hidden rounded-2xl bg-card p-3 pt-3.5 shadow-card ${pinned ? "border-l-4 border-destructive" : ""}`}
      >
        <DateTile iso={a.date} cat={a.cat} urgent={pinned} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-bold">
            {pinned && <Pin aria-label="Épinglée" className="h-3.5 w-3.5 text-destructive" />}
            <span className={`truncate ${s.text}`}>{a.cat}</span>
            {rel && (
              <span
                className={`shrink-0 ${soon ? "text-foreground motion-safe:animate-pulse" : "text-muted-foreground"}`}
              >
                · {rel}
              </span>
            )}
            {fresh && (
              <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-lime/20 px-2 py-0.5 text-[0.6875rem] font-extrabold text-foreground">
                <span aria-hidden className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 rounded-full bg-lime motion-safe:animate-ping" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-lime" />
                </span>
                Nouveau
              </span>
            )}
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
