import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, MegaphoneOff, Share2 } from "lucide-react";
import { toast } from "sonner";
import { CatMedallion, catStyle } from "@/components/CatBadge";
import { Confetti } from "@/components/Confetti";
import { ActionBar, btnPrimary, DemoNote, EmptyState, Pending } from "@/components/kit";
import { TopBar } from "@/components/TopBar";
import { ANNONCES, isPinned, useAnnonce, useAnnoncesStatus, type Annonce } from "@/lib/annonces";
import { isPending } from "@/lib/remote";
import { useHydrated } from "@/lib/store";
import { formatDate, relativeDay, todayISO } from "@/lib/subjects";

export const Route = createFileRoute("/annonces/$id")({
  head: ({ params }) => {
    const a = ANNONCES.find((x) => x.id === params.id);
    const title = a ? `${a.title} — Mon Espace Math` : "Annonce — Mon Espace Math";
    const description = a?.desc ?? "Annonce de l'Espace Math de l'UASZ.";
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
  component: AnnoncePage,
});

function AnnoncePage() {
  const { id } = Route.useParams();
  const a = useAnnonce(id);
  const status = useAnnoncesStatus();

  if (!a && isPending(status)) {
    return (
      <>
        <TopBar title="Annonce" back="/annonces" />
        <Pending status={status} />
      </>
    );
  }
  if (!a) {
    return (
      <>
        <TopBar title="Annonce" back="/annonces" />
        <EmptyState
          icon={MegaphoneOff}
          title="Annonce introuvable"
          hint="Elle a peut-être été retirée par le bureau."
        >
          <Link to="/annonces" className={btnPrimary}>
            Toutes les annonces
          </Link>
        </EmptyState>
      </>
    );
  }
  return (
    <>
      <TopBar title={a.cat} back="/annonces" />
      <Detail a={a} demo={status === "demo" && !a.local} />
    </>
  );
}

function Detail({ a, demo }: { a: Annonce; demo: boolean }) {
  const today = useHydrated() ? todayISO() : "";
  const rel = relativeDay(a.date, today);
  const s = catStyle(a.cat);
  const urgent = isPinned(a, today);

  const share = async () => {
    const data = {
      title: a.title,
      text: `${a.title} — ${formatDate(a.date)}, ${a.place}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(`${data.text}\n${data.url}`);
        toast("Lien copié", { description: "Collez-le dans WhatsApp ou par SMS." });
      }
    } catch {
      /* partage annulé */
    }
  };

  return (
    <>
      {(a.cat === "Résultats" || a.cat === "Événement") && <Confetti id={a.id} />}
      <main className="px-4 pb-action pt-4">
        <article>
          {/* Bandeau de la catégorie : médaillon plein sur quadrillage teinté. */}
          <div
            className={`tint-grid relative flex items-center gap-4 overflow-hidden rounded-3xl p-4 ring-1 ring-inset ${s.soft}`}
          >
            <CatMedallion
              cat={a.cat}
              size="lg"
              solid
              className={
                urgent ? "origin-top motion-safe:animate-[ring_0.9s_ease-in-out_2]" : "shadow-md"
              }
            />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">{a.cat}</p>
              <p className="mt-0.5 text-lg font-extrabold leading-tight text-foreground">
                {formatDate(a.date)}
                {a.time ? ` · ${a.time}` : ""}
              </p>
              {rel && (
                <p
                  className={`mt-1 text-sm font-bold ${rel === "Aujourd'hui" || rel === "Demain" ? "motion-safe:animate-pulse" : ""}`}
                >
                  {rel}
                </p>
              )}
            </div>
          </div>
          <h2 className="mt-5 text-[1.375rem] font-extrabold leading-snug tracking-tight">
            {a.title}
          </h2>

          <ul className="mt-5 divide-y divide-border rounded-2xl bg-card shadow-card">
            <Info icon={MapPin} label="Lieu" value={a.place} />
          </ul>

          <p className="mt-5 whitespace-pre-line text-base leading-relaxed">{a.body}</p>
          {demo && <DemoNote>Annonce d'exemple pour la démonstration.</DemoNote>}
        </article>
      </main>

      <ActionBar>
        <button onClick={share} className={`${btnPrimary} flex-1`}>
          <Share2 className="h-5 w-5" />
          Partager l'annonce
        </button>
      </ActionBar>
    </>
  );
}

function Info({ icon: I, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <li className="flex min-h-13 items-center gap-3 px-4 py-2">
      <I aria-hidden className="h-5 w-5 shrink-0 text-primary" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ml-auto text-right text-[0.9375rem] font-bold">{value}</span>
    </li>
  );
}
