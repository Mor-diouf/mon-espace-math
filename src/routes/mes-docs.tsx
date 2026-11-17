import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CloudDownload, Star } from "lucide-react";
import { DocList } from "@/components/DocRow";
import { btnPrimary, EmptyState, Pending, Segmented } from "@/components/kit";
import { TopBar } from "@/components/TopBar";
import { useDocs, useDocsStatus, useFavorites, useOffline } from "@/lib/docs";
import { isPending } from "@/lib/remote";

export const Route = createFileRoute("/mes-docs")({
  head: () => ({
    meta: [
      { title: "Mes documents — Mon Espace Math" },
      { name: "description", content: "Vos documents favoris et enregistrés hors ligne." },
      { property: "og:title", content: "Mes documents — Mon Espace Math" },
      { property: "og:description", content: "Vos documents favoris et enregistrés hors ligne." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MesDocs,
});

type Tab = "off" | "fav";

function MesDocs() {
  const [tab, setTab] = useState<Tab>("off");
  const [favs] = useFavorites();
  const [off] = useOffline();
  const ids = tab === "fav" ? favs : off;
  const allDocs = useDocs();
  const status = useDocsStatus();
  const docs = allDocs.filter((d) => ids.includes(d.id));
  // Des documents sont enregistrés mais le catalogue n'est pas encore arrivé : on patiente.
  const waiting = ids.length > 0 && allDocs.length === 0 && isPending(status);

  return (
    <>
      <TopBar title="Mes documents" />
      <main className="px-4 pb-nav pt-4">
        <Segmented
          label="Mes documents"
          value={tab}
          onChange={setTab}
          options={[
            ["off", `Hors ligne (${off.length})`],
            ["fav", `Favoris (${favs.length})`],
          ]}
        />
        {waiting ? (
          <Pending status={status} />
        ) : docs.length === 0 ? (
          tab === "off" ? (
            <EmptyState
              icon={CloudDownload}
              title="Aucun document hors ligne"
              hint="Touchez le nuage à droite d'un document pour le garder ici."
            >
              <Link to="/catalogue" className={btnPrimary}>
                Parcourir le catalogue
              </Link>
            </EmptyState>
          ) : (
            <EmptyState
              icon={Star}
              title="Aucun favori pour l'instant"
              hint="Ouvrez un document et touchez l'étoile en haut pour le retrouver ici."
            >
              <Link to="/catalogue" className={btnPrimary}>
                Parcourir le catalogue
              </Link>
            </EmptyState>
          )
        ) : (
          <div className="mt-4">
            <DocList docs={docs} />
          </div>
        )}
      </main>
    </>
  );
}
