import { useState } from "react";
import { AppMark } from "@/components/TopBar";
import { levelStore, onboardedStore, useHydrated } from "@/lib/store";
import { LEVEL_NAMES, LEVELS } from "@/lib/subjects";

/**
 * Écran de bienvenue, affiché une seule fois au premier lancement :
 * l'étudiant choisit son niveau, qui règle ensuite l'accueil. Modifiable dans « Plus ».
 * Il est présent dans la page dès le départ et rendu visible par la classe `first-run` que le
 * script de __root.tsx pose sur <html> avant le premier affichage (voir first-run-only dans styles.css).
 */
export function Onboarding() {
  const done = onboardedStore.use();
  // Le logo et le slogan s'affichent tout de suite ; le choix du niveau n'apparaît que lorsque
  // les boutons répondent vraiment (connexion lente : on ne montre rien d'inerte à toucher).
  const ready = useHydrated();
  const [level, setLevel] = useState("");
  if (done) return null;

  const start = () => {
    if (!level) return;
    levelStore.set(level);
    onboardedStore.set(true);
    document.documentElement.classList.remove("first-run");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="first-run-only fixed inset-0 z-[60] overflow-y-auto bg-brand text-brand-foreground animate-in fade-in duration-200"
    >
      <div className="math-grid mx-auto flex min-h-dvh max-w-md flex-col px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(3.5rem+env(safe-area-inset-top))]">
        <div className="flex-1">
          <AppMark className="h-28 w-28" />
          <p className="mt-6 text-sm font-bold text-lime">Mon Espace Math · UASZ</p>
          <h1
            id="onboarding-title"
            className="mt-2 text-[2rem] font-extrabold leading-[1.15] tracking-tight"
          >
            Les mathématiques à portée de main.
          </h1>
          <p className="mt-4 text-base text-brand-muted">
            Annales, TD, corrigés et fiches de cours de l'Espace Math, de la Licence 1 au Master 2.
          </p>
        </div>

        <div
          className={`pt-10 transition-opacity duration-300 ${ready ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <p id="onboarding-level" className="text-base font-bold">
            Vous êtes en…
          </p>
          <div
            role="radiogroup"
            aria-labelledby="onboarding-level"
            className="mt-3 grid grid-cols-5 gap-2"
          >
            {LEVELS.map((l) => (
              <button
                key={l}
                role="radio"
                aria-checked={level === l}
                aria-label={LEVEL_NAMES[l]}
                onClick={() => setLevel(l)}
                className={`press h-14 rounded-2xl text-base font-extrabold ${level === l ? "bg-lime text-lime-foreground" : "bg-brand-foreground/12"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <button
            disabled={!level}
            onClick={start}
            className="press mt-6 flex h-13 w-full items-center justify-center rounded-full bg-background text-base font-bold text-foreground disabled:opacity-40"
          >
            Commencer
          </button>
          <p className="mt-3 text-center text-xs text-brand-muted">
            Vous pourrez changer de niveau à tout moment.
          </p>
        </div>
      </div>
    </div>
  );
}
