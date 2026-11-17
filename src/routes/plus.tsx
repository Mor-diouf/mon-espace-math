import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  CloudDownload,
  GraduationCap,
  Info,
  Lock,
  Mail,
  Star,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { AppMark, TopBar } from "@/components/TopBar";
import {
  favoritesStore,
  levelStore,
  offlineStore,
  useFavorites,
  useLevel,
  useOffline,
} from "@/lib/store";
import { LEVEL_NAMES, LEVELS } from "@/lib/subjects";

export const Route = createFileRoute("/plus")({
  head: () => ({
    meta: [
      { title: "Plus — Mon Espace Math" },
      {
        name: "description",
        content: "Profil, réglages et informations sur l'Espace Math de l'UASZ.",
      },
      { property: "og:title", content: "Plus — Mon Espace Math" },
      {
        property: "og:description",
        content: "Profil, réglages et informations sur l'Espace Math de l'UASZ.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Plus,
});

function Plus() {
  const level = useLevel();
  const [favs] = useFavorites();
  const [off] = useOffline();

  const clear = (what: "off" | "fav") => {
    if (what === "off") offlineStore.set([]);
    else favoritesStore.set([]);
    toast(what === "off" ? "Documents hors ligne retirés" : "Favoris effacés");
  };

  return (
    <>
      <TopBar title="Plus" />
      <main className="px-4 pb-nav pt-4">
        {/* Profil */}
        <section className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold">Étudiant·e en {LEVEL_NAMES[level] ?? level}</p>
            <p className="text-sm text-muted-foreground">Espace Math · UASZ</p>
          </div>
        </section>

        <Section title="Mon niveau" hint="L'accueil affiche d'abord les documents de ce niveau.">
          <div role="radiogroup" aria-label="Mon niveau" className="grid grid-cols-5 gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                role="radio"
                aria-checked={level === l}
                aria-label={LEVEL_NAMES[l]}
                onClick={() => levelStore.set(l)}
                className={`press h-13 rounded-2xl text-base font-extrabold ${level === l ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-card"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Sur ce téléphone">
          <ul className="divide-y divide-border rounded-2xl bg-card shadow-card">
            <Row
              icon={CloudDownload}
              label="Documents hors ligne"
              value={String(off.length)}
              action={
                off.length > 0 ? (
                  <ClearBtn label="Retirer les documents hors ligne" onClick={() => clear("off")} />
                ) : null
              }
            />
            <Row
              icon={Star}
              label="Favoris"
              value={String(favs.length)}
              action={
                favs.length > 0 ? (
                  <ClearBtn label="Effacer les favoris" onClick={() => clear("fav")} />
                ) : null
              }
            />
          </ul>
        </Section>

        <Section title="Bureau de l'Espace Math">
          <Link
            to="/admin"
            className="press-row flex min-h-16 items-center gap-3 overflow-hidden rounded-2xl bg-card p-3 shadow-card"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
              <Lock className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[0.9375rem] font-bold">Espace bureau</p>
              <p className="text-xs text-muted-foreground">
                Ajouter des documents et publier des annonces
              </p>
            </div>
            <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground" />
          </Link>
        </Section>

        <Section title="À propos">
          <div className="rounded-2xl bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <AppMark className="h-14 w-14" />
              <div>
                <p className="text-[0.9375rem] font-bold">Mon Espace Math</p>
                <p className="text-xs text-muted-foreground">Prototype V1 · novembre 2026</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Mon Espace Math réunit les ressources de l'Espace Math de l'Université Assane Seck de
              Ziguinchor : annales, TD, corrigés et fiches de cours, de la Licence 1 au Master 2,
              consultables même avec une connexion faible.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail aria-hidden className="h-4 w-4 shrink-0 text-primary" />
                Contact du bureau :{" "}
                <span className="italic text-muted-foreground">à compléter</span>
              </li>
              <li className="flex items-center gap-2">
                <Info aria-hidden className="h-4 w-4 shrink-0 text-primary" />
                Les documents et annonces actuels sont fictifs.
              </li>
            </ul>
          </div>
        </Section>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          La connexion avec un compte arrivera dans une prochaine version.
        </p>
      </main>
    </>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Row({
  icon: I,
  label,
  value,
  action,
}: {
  icon: typeof Star;
  label: string;
  value: string;
  action: ReactNode;
}) {
  return (
    <li className="flex min-h-14 items-center gap-3 pl-4 pr-1">
      <I aria-hidden className="h-5 w-5 shrink-0 text-primary" />
      <span className="flex-1 text-[0.9375rem]">{label}</span>
      <span className={`text-[0.9375rem] font-bold ${action ? "" : "pr-3"}`}>{value}</span>
      {action}
    </li>
  );
}

function ClearBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className="press grid h-12 w-12 shrink-0 place-items-center rounded-full text-muted-foreground"
    >
      <Trash2 className="h-5 w-5" />
    </button>
  );
}
