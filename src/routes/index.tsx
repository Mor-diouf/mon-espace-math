import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ChevronDown, GraduationCap } from "lucide-react";
import { AnnonceCard } from "@/components/AnnonceCard";
import { DocList } from "@/components/DocRow";
import { DemoNote, SearchField, sectionLink, SectionTitle } from "@/components/kit";
import { OptionSheet } from "@/components/OptionSheet";
import { AppMark } from "@/components/TopBar";
import { pickNext, useAnnonces } from "@/lib/annonces";
import { useDocs, useDocsStatus } from "@/lib/docs";
import { isPending } from "@/lib/remote";
import { levelStore, useHydrated, useLevel } from "@/lib/store";
import { LEVEL_NAMES, LEVELS, SUBJECTS, todayISO } from "@/lib/subjects";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mon Espace Math — Ressources de L1 à M2 | UASZ" },
      {
        name: "description",
        content:
          "Examens, TD, corrigés et fiches de cours de mathématiques de la Licence 1 au Master 2, réunis par l'Espace Math de l'UASZ.",
      },
      { property: "og:title", content: "Mon Espace Math — UASZ" },
      {
        property: "og:description",
        content: "Les mathématiques à portée de main, accessibles même avec une connexion faible.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const level = useLevel();
  const hydrated = useHydrated();
  const today = hydrated ? todayISO() : "";
  const allDocs = useDocs();
  const status = useDocsStatus();
  const docs = allDocs.filter((d) => d.level === level).slice(0, 4);
  const next = pickNext(useAnnonces(), today);
  const [q, setQ] = useState("");
  const [levelSheet, setLevelSheet] = useState(false);

  return (
    <>
      {/* Bandeau UASZ : la marque, le niveau de l'étudiant et la recherche. */}
      <header className="rounded-b-3xl bg-brand pt-safe text-brand-foreground">
        <div className="math-grid rounded-b-3xl px-4 pb-5">
          <div className="flex h-16 items-center gap-3">
            <AppMark />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold leading-tight">Mon Espace Math</p>
              <p className="truncate text-xs text-brand-muted">Espace Math · UASZ</p>
            </div>
            <button
              onClick={() => setLevelSheet(true)}
              aria-label={`Mon niveau : ${LEVEL_NAMES[level] ?? level}. Changer`}
              className="press hit flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-brand-foreground/12 pl-3 pr-2 text-sm font-bold"
            >
              <GraduationCap aria-hidden className="h-4 w-4 text-lime" />
              {level}
              <ChevronDown aria-hidden className="h-4 w-4" />
            </button>
          </div>

          <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight">
            Que révisez-vous <span className="text-lime">aujourd'hui</span> ?
          </h1>
          <div className="mt-4">
            <SearchField
              value={q}
              onChange={setQ}
              onSubmit={() =>
                navigate({ to: "/catalogue", search: q.trim() ? { q: q.trim() } : {} })
              }
            />
          </div>
        </div>
      </header>

      <main className="px-4 pb-nav pt-3">
        <section>
          <SectionTitle title="Matières">
            <Link to="/catalogue" className={sectionLink}>
              Catalogue <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {SUBJECTS.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.name}
                  to="/catalogue"
                  search={{ matiere: s.name }}
                  className={`press flex h-20 flex-col items-center justify-center gap-1.5 rounded-2xl ${s.tile}`}
                >
                  {Icon ? (
                    <Icon aria-hidden className="h-7 w-7" />
                  ) : (
                    <span aria-hidden className="font-serif text-[1.75rem] italic leading-none">
                      {s.glyph}
                    </span>
                  )}
                  <span className="text-[0.8125rem] font-bold leading-none">{s.short}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {next && (
          <section className="mt-4">
            <SectionTitle title="Prochaine annonce">
              <Link to="/annonces" aria-label="Toutes les annonces" className={sectionLink}>
                Tout voir <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </SectionTitle>
            <ul>
              <AnnonceCard a={next} today={today} />
            </ul>
          </section>
        )}

        <section className="mt-4">
          <SectionTitle title={`Récents en ${level}`}>
            <Link
              to="/catalogue"
              search={{ niveau: level }}
              aria-label={`Tous les documents de ${level}`}
              className={sectionLink}
            >
              Tout voir <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </SectionTitle>
          {docs.length === 0 ? (
            <p
              role="status"
              className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-card"
            >
              {allDocs.length > 0 || !isPending(status)
                ? "Aucun document pour ce niveau pour l'instant."
                : status === "offline"
                  ? "Pas de connexion : les documents s'afficheront dès que le téléphone retrouvera Internet."
                  : "Chargement des documents…"}
            </p>
          ) : (
            <DocList docs={docs} />
          )}
          {status === "demo" && (
            <DemoNote>
              Documents fictifs de démonstration — pas de véritables annales de l'UASZ.
            </DemoNote>
          )}
        </section>
      </main>

      <OptionSheet
        open={levelSheet}
        onOpenChange={setLevelSheet}
        title="Mon niveau"
        hint="L'accueil affiche d'abord les documents de ce niveau."
        options={LEVELS.map((l) => ({ v: l, l: LEVEL_NAMES[l] ?? l, sub: l }))}
        value={level}
        onSelect={(v) => {
          levelStore.set(v);
          setLevelSheet(false);
        }}
      />
    </>
  );
}
