import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { AnnonceCard } from "@/components/AnnonceCard";
import { CatIcon } from "@/components/CatBadge";
import { Chip, ChipRow, DemoNote, EmptyState, Pending } from "@/components/kit";
import { TopBar } from "@/components/TopBar";
import {
  ANNONCE_CATS,
  latestCreated,
  seenStore,
  useAnnonces,
  useAnnoncesStatus,
  withPinned,
} from "@/lib/annonces";
import { isPending } from "@/lib/remote";
import { useHydrated } from "@/lib/store";
import { todayISO } from "@/lib/subjects";

export const Route = createFileRoute("/annonces/")({
  head: () => ({
    meta: [
      { title: "Annonces — Mon Espace Math" },
      {
        name: "description",
        content: "Ateliers, conférences et tutorat de l'Espace Math de l'UASZ.",
      },
      { property: "og:title", content: "Annonces — Mon Espace Math" },
      {
        property: "og:description",
        content: "Ateliers, conférences et tutorat de l'Espace Math de l'UASZ.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Annonces,
});

function Annonces() {
  const all = useAnnonces();
  const status = useAnnoncesStatus();
  const hydrated = useHydrated();
  const today = hydrated ? todayISO() : "";
  const now = hydrated ? Date.now() : 0;
  const [cat, setCat] = useState<string>("");
  const news = withPinned(cat ? all.filter((a) => a.cat === cat) : all, today);

  // L'onglet est ouvert : les annonces publiées jusqu'ici sont vues (le point de l'onglet s'éteint).
  const latest = latestCreated(all);
  useEffect(() => {
    if (latest && latest > seenStore.get()) seenStore.set(latest);
  }, [latest]);

  return (
    <>
      <TopBar title="Annonces" />
      <main className="px-4 pb-nav">
        <ChipRow label="Catégorie">
          {["", ...ANNONCE_CATS].map((c) => (
            <Chip key={c || "all"} on={cat === c} onClick={() => setCat(c)}>
              {c && <CatIcon cat={c} />}
              {c || "Toutes"}
            </Chip>
          ))}
        </ChipRow>

        {all.length === 0 && isPending(status) ? (
          <Pending status={status} />
        ) : news.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title={cat ? "Aucune annonce dans cette catégorie" : "Aucune annonce pour l'instant"}
            hint="Les prochaines annonces du bureau apparaîtront ici."
          />
        ) : (
          <>
            <ul className="mt-1 space-y-2">
              {news.map((a, i) => (
                <AnnonceCard key={a.id} a={a} today={today} now={now} index={i} detailed />
              ))}
            </ul>
            {status === "demo" && <DemoNote>Annonces d'exemple pour la démonstration.</DemoNote>}
          </>
        )}
      </main>
    </>
  );
}
