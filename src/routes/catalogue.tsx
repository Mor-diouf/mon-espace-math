import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, FolderOpen, SearchX } from "lucide-react";
import { DocList } from "@/components/DocRow";
import { ChipRow, DemoNote, EmptyState, Pending, SearchField } from "@/components/kit";
import { OptionSheet, type Option } from "@/components/OptionSheet";
import { TopBar } from "@/components/TopBar";
import { filterDocs, useDocs, useDocsStatus, type DocFilters } from "@/lib/docs";
import { isPending } from "@/lib/remote";
import { DOC_TYPES, findUE, LEVEL_NAMES, LEVELS, subjectShort, UES, uesOf } from "@/lib/subjects";

/** Retire les filtres vides pour garder une adresse propre (/catalogue?matiere=Analyse). */
function clean(f: DocFilters): DocFilters {
  const out: DocFilters = {};
  if (f.q) out.q = f.q;
  if (f.niveau) out.niveau = f.niveau;
  if (f.matiere) out.matiere = f.matiere;
  if (f.type) out.type = f.type;
  if (f.annee) out.annee = f.annee;
  return out;
}

export const Route = createFileRoute("/catalogue")({
  validateSearch: (s: Record<string, unknown>): DocFilters => {
    const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
    const annee = Number(s["annee"]);
    return clean({
      ...(str(s["q"]) ? { q: str(s["q"]) as string } : {}),
      ...(str(s["niveau"]) ? { niveau: str(s["niveau"]) as string } : {}),
      ...(str(s["matiere"]) ? { matiere: str(s["matiere"]) as string } : {}),
      ...(str(s["type"]) ? { type: str(s["type"]) as string } : {}),
      ...(Number.isInteger(annee) && annee > 0 ? { annee } : {}),
    });
  },
  head: () => ({
    meta: [
      { title: "Catalogue — Mon Espace Math" },
      {
        name: "description",
        content: "Examens, TD, corrigés et fiches de cours classés par niveau, matière et année.",
      },
      { property: "og:title", content: "Catalogue — Mon Espace Math" },
      {
        property: "og:description",
        content: "Examens, TD, corrigés et fiches de cours classés par niveau, matière et année.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Catalogue,
});

type FilterKey = "niveau" | "matiere" | "type" | "annee";

function Catalogue() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const allDocs = useDocs();
  const status = useDocsStatus();
  const [q, setQ] = useState(search.q ?? "");
  const pushed = useRef(search.q ?? "");
  const [sheet, setSheet] = useState<FilterKey | null>(null);

  // Les filtres changent l'adresse sans fondu d'écran : on reste sur place.
  const update = (patch: Partial<DocFilters>) =>
    navigate({
      search: (prev) => clean({ ...prev, ...patch }),
      replace: true,
      viewTransition: false,
    });

  // Le champ est la source pendant la frappe ; l'adresse suit après 300 ms.
  useEffect(() => {
    const t = setTimeout(() => {
      if (q !== pushed.current) {
        pushed.current = q;
        update({ q });
      }
    }, 300);
    return () => clearTimeout(t);
    // `update` lit l'adresse au moment du clic (fonction `prev`), il n'a pas besoin d'être suivi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Si l'adresse change d'ailleurs (onglet Catalogue, lien depuis l'accueil), on suit.
  useEffect(() => {
    const urlQ = search.q ?? "";
    if (urlQ !== pushed.current) {
      pushed.current = urlQ;
      setQ(urlQ);
    }
  }, [search.q]);

  const years = useMemo(
    () => [...new Set(allDocs.map((d) => d.year))].sort((a, b) => b - a),
    [allDocs],
  );
  const docs = useMemo(() => filterDocs(allDocs, { ...search, q }), [allDocs, search, q]);

  // Matières proposées : les UE du niveau choisi (ou toutes), puis les anciennes matières
  // encore présentes dans le catalogue.
  const subjectOptions = useMemo<Option[]>(() => {
    const ues = search.niveau ? uesOf(search.niveau) : UES;
    const legacy = [...new Set(allDocs.map((d) => d.subject))]
      .filter((s) => !findUE(s))
      .sort((a, b) => a.localeCompare(b, "fr"));
    return [
      ...ues.map((u) => ({
        v: u.name,
        l: u.name,
        sub: [u.level, u.semester && `S${u.semester}`, u.option].filter(Boolean).join(" · "),
      })),
      ...legacy.map((s) => ({ v: s, l: s, sub: "Ancienne matière" })),
    ];
  }, [search.niveau, allDocs]);
  const active = Object.keys(clean({ ...search, q })).length > 0;

  // Un filtre = une pastille. Elle affiche la valeur choisie et ouvre la liste des choix.
  const filters: Record<
    FilterKey,
    {
      title: string;
      all: string;
      value: string | undefined;
      shown: string | undefined;
      options: Option[];
    }
  > = {
    niveau: {
      title: "Niveau",
      all: "Tous les niveaux",
      value: search.niveau,
      shown: search.niveau,
      options: LEVELS.map((l) => ({ v: l, l: LEVEL_NAMES[l] ?? l, sub: l })),
    },
    matiere: {
      title: "Matière",
      all: "Toutes les matières",
      value: search.matiere,
      shown: search.matiere && subjectShort(search.matiere),
      options: subjectOptions,
    },
    type: {
      title: "Type",
      all: "Tous les types",
      value: search.type,
      shown: search.type,
      options: DOC_TYPES.map((t) => ({ v: t, l: t })),
    },
    annee: {
      title: "Année",
      all: "Toutes les années",
      value: search.annee ? String(search.annee) : undefined,
      shown: search.annee ? String(search.annee) : undefined,
      options: years.map((y) => ({ v: String(y), l: String(y) })),
    },
  };
  const current = sheet ? filters[sheet] : null;

  const clearAll = () => {
    pushed.current = "";
    setQ("");
    navigate({ search: {}, replace: true, viewTransition: false });
  };

  return (
    <>
      <TopBar title="Catalogue">
        <SearchField value={q} onChange={setQ} />
      </TopBar>

      <main className="px-4 pb-nav">
        <ChipRow label="Filtres">
          {(Object.keys(filters) as FilterKey[]).map((k) => {
            const f = filters[k];
            return (
              <button
                key={k}
                aria-haspopup="dialog"
                aria-label={
                  f.shown
                    ? `${f.title} : ${f.shown}. Modifier`
                    : `Filtrer par ${f.title.toLowerCase()}`
                }
                onClick={() => setSheet(k)}
                className={`press hit flex h-10 shrink-0 items-center gap-1 rounded-full pl-4 pr-2.5 text-sm font-semibold ${f.shown ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-card"}`}
              >
                {f.shown ?? f.title}
                <ChevronDown aria-hidden className="h-4 w-4 opacity-80" />
              </button>
            );
          })}
        </ChipRow>

        <div className="flex h-12 items-center justify-between">
          <p className="text-sm font-bold" aria-live="polite">
            {docs.length} document{docs.length > 1 ? "s" : ""}
          </p>
          {active && (
            <button
              onClick={clearAll}
              className="press -mr-2 flex h-12 items-center rounded-full px-2 text-sm font-bold text-primary"
            >
              Tout effacer
            </button>
          )}
        </div>

        {allDocs.length === 0 && isPending(status) ? (
          <Pending status={status} />
        ) : allDocs.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Le catalogue est encore vide"
            hint="Le bureau de l'Espace Math y ajoutera bientôt les premiers documents."
          />
        ) : docs.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Aucun document trouvé"
            hint="Essayez un autre mot ou retirez un filtre."
          >
            <button
              onClick={clearAll}
              className="press flex h-12 items-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground"
            >
              Tout effacer
            </button>
          </EmptyState>
        ) : (
          <>
            <DocList docs={docs} />
            {status === "demo" && (
              <DemoNote>
                Documents fictifs de démonstration — pas de véritables annales de l'UASZ.
              </DemoNote>
            )}
          </>
        )}
      </main>

      <OptionSheet
        open={sheet !== null}
        onOpenChange={(o) => !o && setSheet(null)}
        title={current?.title ?? ""}
        options={current?.options ?? []}
        value={current?.value}
        {...(current ? { allLabel: current.all } : {})}
        onSelect={(v) => {
          if (sheet === "annee") update({ annee: v ? Number(v) : 0 });
          else if (sheet === "niveau") {
            // Une UE d'un autre niveau ne donnerait aucun résultat : on la retire.
            const ue = search.matiere ? findUE(search.matiere) : undefined;
            update(ue && v && ue.level !== v ? { niveau: v, matiere: "" } : { niveau: v });
          } else if (sheet) update({ [sheet]: v });
          setSheet(null);
        }}
      />
    </>
  );
}
