import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Clock, MapPin, MegaphoneOff, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ActionBar, btnPrimary, DemoNote, EmptyState, Pending } from "@/components/kit";
import { TopBar } from "@/components/TopBar";
import { ANNONCES, useAnnonce, useAnnoncesStatus, type Annonce } from "@/lib/annonces";
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
      <main className="px-4 pb-action pt-5">
        <article>
          {rel && <p className="text-sm font-bold text-primary">{rel}</p>}
          <h2 className="mt-1 text-[1.375rem] font-extrabold leading-snug tracking-tight">
            {a.title}
          </h2>

          <ul className="mt-5 divide-y divide-border rounded-2xl bg-card shadow-card">
            <Info icon={CalendarDays} label="Date" value={formatDate(a.date)} />
            {a.time && <Info icon={Clock} label="Heure" value={a.time} />}
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
