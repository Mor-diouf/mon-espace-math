import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  ChevronDown,
  FilePlus2,
  FileText,
  LogIn,
  Megaphone,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { btnOutline, btnPrimary, Pending, Segmented } from "@/components/kit";
import { TopBar } from "@/components/TopBar";
import { addAnnonce, ANNONCE_CATS, removeAnnonce, useAnnonces } from "@/lib/annonces";
import { recheckAuth, signIn, signOut, useAuth } from "@/lib/auth";
import { addDoc, MAX_PDF_BYTES, removeDoc, useDocs, useDocsStatus } from "@/lib/docs";
import { DOC_TYPES, formatDate, LEVELS, SUBJECTS } from "@/lib/subjects";
import { supabaseReady } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Espace bureau — Mon Espace Math" },
      {
        name: "description",
        content: "Ajout de documents et publication d'annonces par le bureau de l'Espace Math.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Espace bureau — Mon Espace Math" },
      {
        property: "og:description",
        content: "Ajout de documents et publication d'annonces par le bureau de l'Espace Math.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

type Tab = "doc" | "annonce" | "publies";

function Admin() {
  const status = useDocsStatus();
  return (
    <>
      <TopBar title="Espace bureau" back="/plus" />
      <main className="px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        {status === "demo" ? (
          <Workspace demo />
        ) : status === "loading" ? (
          <Pending status={status} />
        ) : (
          <Gate />
        )}
      </main>
    </>
  );
}

/** En ligne, l'espace bureau n'est ouvert qu'aux comptes inscrits dans la table « bureau ». */
function Gate() {
  const auth = useAuth();
  if (auth.status === "loading") return <Pending status="loading" />;
  if (auth.status === "out") return <LoginForm />;
  if (!auth.bureau) {
    return (
      <div className="mt-10 text-center">
        <ShieldAlert aria-hidden className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-base font-bold">
          {auth.unverified ? "Vérification impossible" : "Accès réservé au bureau"}
        </p>
        <p className="mx-auto mt-1 max-w-[19rem] text-sm text-muted-foreground">
          {auth.unverified
            ? "Pas de connexion Internet : impossible de vérifier ce compte pour l'instant."
            : `Le compte ${auth.email} n'est pas inscrit comme membre du bureau.`}
        </p>
        <div className="mt-6 flex flex-col items-center gap-2">
          {auth.unverified && (
            <button onClick={recheckAuth} className={btnPrimary}>
              Réessayer
            </button>
          )}
          <button onClick={() => void signOut()} className={btnOutline}>
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }
  return <Workspace email={auth.email} />;
}

function LoginForm() {
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await signIn(str(f, "email"), String(f.get("password") ?? ""));
    } catch (err) {
      toast.error(message(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <p className="text-sm text-muted-foreground">
        Cet espace est réservé aux membres du bureau de l'Espace Math. Connectez-vous avec le compte
        qui vous a été remis.
      </p>
      <Field label="Adresse e-mail" required>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          inputMode="email"
          className={input}
        />
      </Field>
      <Field label="Mot de passe" required>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={input}
        />
      </Field>
      <button disabled={busy} className={`${btnPrimary} w-full`}>
        <LogIn className="h-5 w-5" />
        {busy ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}

/** Les formulaires du bureau. `demo` : rien ne quitte ce téléphone ; sinon tout part dans Supabase. */
function Workspace({ demo = false, email }: { demo?: boolean; email?: string }) {
  const [tab, setTab] = useState<Tab>("doc");
  const docs = useDocs();
  const annonces = useAnnonces();
  const mine = demo
    ? docs.filter((d) => d.local).length + annonces.filter((a) => a.local).length
    : docs.length + annonces.length;

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Stat icon={FileText} value={docs.length} label="documents" />
        <Stat icon={Megaphone} value={annonces.length} label="annonces" />
      </div>

      {demo ? (
        <div className="mt-3 flex gap-3 rounded-2xl bg-gold/16 p-3">
          <ShieldAlert aria-hidden className="h-5 w-5 shrink-0 text-foreground" />
          <p className="text-sm">
            <b>Mode démonstration.</b> Les ajouts restent sur ce téléphone.{" "}
            {supabaseReady
              ? "Supabase est connecté, mais ses tables n'existent pas encore : lancez le script supabase/schema.sql dans SQL Editor."
              : "La connexion réservée au bureau et l'envoi des PDF arriveront avec la mise en ligne."}
          </p>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-primary/10 py-1 pl-3 pr-1">
          <ShieldCheck aria-hidden className="h-5 w-5 shrink-0 text-primary" />
          <p className="min-w-0 flex-1 truncate text-sm">
            Connecté : <b>{email}</b>
          </p>
          <button
            onClick={() => void signOut()}
            className="press flex h-12 shrink-0 items-center rounded-full px-3 text-sm font-bold text-primary"
          >
            Se déconnecter
          </button>
        </div>
      )}

      <div className="mt-5">
        <Segmented
          label="Espace bureau"
          value={tab}
          onChange={setTab}
          options={[
            ["doc", "Document"],
            ["annonce", "Annonce"],
            ["publies", `${demo ? "Ajouts" : "Publiés"} (${mine})`],
          ]}
        />
      </div>

      {tab === "doc" && <DocForm demo={demo} />}
      {tab === "annonce" && <AnnonceForm />}
      {tab === "publies" && <Published demo={demo} />}
    </>
  );
}

const input =
  "min-h-12 w-full rounded-xl border border-input bg-card px-3 py-2.5 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      {children}
    </label>
  );
}

function Select({
  name,
  options,
  defaultValue,
}: {
  name: string;
  options: readonly string[];
  defaultValue?: string;
}) {
  return (
    <span className="relative block">
      <select
        name={name}
        defaultValue={defaultValue ?? options[0]}
        className={`${input} appearance-none pr-9`}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
      />
    </span>
  );
}

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const message = (err: unknown) =>
  err instanceof Error ? err.message : "Une erreur est survenue. Réessayez.";

function DocForm({ demo }: { demo: boolean }) {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const title = str(f, "title");
    if (!title) {
      toast.error("Le titre est obligatoire");
      return;
    }
    const picked = f.get("file");
    const file = picked instanceof File && picked.size > 0 ? picked : undefined;
    if (!demo && !file) {
      toast.error("Choisissez le fichier PDF du document");
      return;
    }
    if (file && file.type !== "application/pdf") {
      toast.error("Le fichier doit être un PDF");
      return;
    }
    if (file && file.size > MAX_PDF_BYTES) {
      toast.error("Le PDF dépasse 20 Mo", { description: "Compressez-le avant de l'envoyer." });
      return;
    }

    setBusy(true);
    try {
      const doc = await addDoc(
        {
          title,
          level: str(f, "level"),
          subject: str(f, "subject"),
          type: str(f, "type"),
          year: Number(str(f, "year")) || new Date().getFullYear(),
          notions: str(f, "notions")
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean),
          pages: Number(str(f, "pages")) || 1,
          description: str(f, "description") || "Document ajouté par le bureau de l'Espace Math.",
        },
        file,
      );
      form.reset();
      setFileName("");
      toast.success("Document ajouté au catalogue", {
        action: {
          label: "Voir",
          onClick: () => navigate({ to: "/documents/$id", params: { id: doc.id } }),
        },
      });
    } catch (err) {
      toast.error("Le document n'a pas été ajouté", { description: message(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <Field label="Titre" required>
        <input
          name="title"
          required
          placeholder="Ex. Annales Analyse 2 — session 1"
          className={input}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Niveau" required>
          <Select name="level" options={LEVELS} />
        </Field>
        <Field label="Type" required>
          <Select name="type" options={DOC_TYPES} />
        </Field>
      </div>
      <Field label="Matière" required>
        <Select name="subject" options={SUBJECTS.map((s) => s.name)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Année">
          <input
            name="year"
            type="number"
            inputMode="numeric"
            min={2000}
            max={2100}
            defaultValue={2026}
            className={input}
          />
        </Field>
        <Field label="Pages">
          <input
            name="pages"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="4"
            className={input}
          />
        </Field>
      </div>
      <Field label="Notions (séparées par des virgules)">
        <input name="notions" placeholder="suites, limites, continuité" className={input} />
      </Field>
      <Field label="Description">
        <textarea
          name="description"
          rows={3}
          placeholder="Ce que contient le document…"
          className={input}
        />
      </Field>

      <label className="press flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-input bg-card p-5 text-center">
        <Upload aria-hidden className="h-6 w-6 text-primary" />
        <span className="text-[0.9375rem] font-bold">{fileName || "Choisir le fichier PDF"}</span>
        <span className="text-xs text-muted-foreground">
          {demo ? "En démo, seuls le nom et la taille sont gardés." : "PDF uniquement, 20 Mo au plus."}
        </span>
        <input
          name="file"
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
        />
      </label>

      <button disabled={busy} className={`${btnPrimary} w-full`}>
        <FilePlus2 className="h-5 w-5" />
        {busy ? "Envoi en cours…" : "Ajouter au catalogue"}
      </button>
    </form>
  );
}

function AnnonceForm() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const title = str(f, "title");
    const date = str(f, "date");
    if (!title || !date) {
      toast.error("Le titre et la date sont obligatoires");
      return;
    }
    const time = str(f, "time");
    const desc = str(f, "desc");
    setBusy(true);
    try {
      const a = await addAnnonce({
        title,
        cat: str(f, "cat"),
        date,
        ...(time ? { time } : {}),
        place: str(f, "place") || "Espace Math",
        desc: desc || title,
        body: str(f, "body") || desc || title,
      });
      form.reset();
      toast.success("Annonce publiée", {
        action: {
          label: "Voir",
          onClick: () => navigate({ to: "/annonces/$id", params: { id: a.id } }),
        },
      });
    } catch (err) {
      toast.error("L'annonce n'a pas été publiée", { description: message(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <Field label="Titre" required>
        <input
          name="title"
          required
          placeholder="Ex. Séance de tutorat en Algèbre"
          className={input}
        />
      </Field>
      <Field label="Catégorie">
        <Select name="cat" options={ANNONCE_CATS} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" required>
          <input name="date" type="date" required className={input} />
        </Field>
        <Field label="Heure">
          <input name="time" placeholder="15 h 00" className={input} />
        </Field>
      </div>
      <Field label="Lieu">
        <input name="place" placeholder="Amphithéâtre, Espace Math…" className={input} />
      </Field>
      <Field label="Résumé (une ligne)">
        <input name="desc" placeholder="Ouvert à tous les étudiants de L1" className={input} />
      </Field>
      <Field label="Texte complet">
        <textarea name="body" rows={4} className={input} />
      </Field>
      <button disabled={busy} className={`${btnPrimary} w-full`}>
        <Megaphone className="h-5 w-5" />
        {busy ? "Envoi en cours…" : "Publier l'annonce"}
      </button>
    </form>
  );
}

/** En démo : ce qui a été ajouté sur ce téléphone. En ligne : tout ce qui est publié. */
function Published({ demo }: { demo: boolean }) {
  const allDocs = useDocs();
  const allAnnonces = useAnnonces();
  const docs = demo ? allDocs.filter((d) => d.local) : allDocs;
  const annonces = demo ? allAnnonces.filter((a) => a.local) : allAnnonces;

  // En ligne, la suppression retire le document pour tous les étudiants : on demande confirmation.
  const remove = async (title: string, run: () => Promise<void>, done: string) => {
    if (!demo && !window.confirm(`Retirer définitivement « ${title} » pour tout le monde ?`)) return;
    try {
      await run();
      toast(done);
    } catch (err) {
      toast.error("La suppression a échoué", { description: message(err) });
    }
  };

  if (docs.length + annonces.length === 0) {
    return (
      <p className="mt-12 text-center text-sm text-muted-foreground">
        {demo ? "Rien n'a encore été ajouté depuis ce téléphone." : "Rien n'est encore publié."}
      </p>
    );
  }
  return (
    <ul className="mt-5 space-y-2">
      {docs.map((d) => (
        <Item
          key={d.id}
          icon={FileText}
          title={d.title}
          sub={`${d.level} · ${d.subject} · ${d.type}`}
          onDelete={() => void remove(d.title, () => removeDoc(d.id), "Document retiré")}
        />
      ))}
      {annonces.map((a) => (
        <Item
          key={a.id}
          icon={Megaphone}
          title={a.title}
          sub={`${a.cat} · ${formatDate(a.date)}`}
          onDelete={() => void remove(a.title, () => removeAnnonce(a.id), "Annonce retirée")}
        />
      ))}
    </ul>
  );
}

function Item({
  icon: I,
  title,
  sub,
  onDelete,
}: {
  icon: typeof FileText;
  title: string;
  sub: string;
  onDelete: () => void;
}) {
  return (
    <li className="flex min-h-16 items-center gap-3 rounded-2xl bg-card py-2 pl-4 pr-1 shadow-card">
      <I aria-hidden className="h-5 w-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.9375rem] font-semibold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{sub}</p>
      </div>
      <button
        aria-label={`Supprimer « ${title} »`}
        onClick={onDelete}
        className="press grid h-12 w-12 shrink-0 place-items-center rounded-full text-muted-foreground"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </li>
  );
}

function Stat({ icon: I, value, label }: { icon: typeof FileText; value: number; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
      <I aria-hidden className="h-6 w-6 shrink-0 text-primary" />
      <p className="text-sm text-muted-foreground">
        <span className="block text-2xl font-extrabold leading-none text-foreground">{value}</span>
        {label}
      </p>
    </div>
  );
}
