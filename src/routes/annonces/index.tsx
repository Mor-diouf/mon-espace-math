import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Megaphone } from "lucide-react";
import { AnnonceCard } from "@/components/AnnonceCard";
import { Chip, ChipRow, DemoNote, EmptyState, Pending } from "@/components/kit";
import { TopBar } from "@/components/TopBar";
import { ANNONCE_CATS, useAnnonces, useAnnoncesStatus } from "@/lib/annonces";
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
  const today = useHydrated() ? todayISO() : "";
  const [cat, setCat] = useState<string>("");
  const news = cat ? all.filter((a) => a.cat === cat) : all;

  return (
    <>
      <TopBar title="Annonces" />
      <main className="px-4 pb-nav">
        <ChipRow label="Catégorie">
          {["", ...ANNONCE_CATS].map((c) => (
            <Chip key={c || "all"} on={cat === c} onClick={() => setCat(c)}>
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
              {news.map((a) => (
                <AnnonceCard key={a.id} a={a} today={today} detailed />
              ))}
            </ul>
            {status === "demo" && <DemoNote>Annonces d'exemple pour la démonstration.</DemoNote>}
          </>
        )}
      </main>
    </>
  );
}
