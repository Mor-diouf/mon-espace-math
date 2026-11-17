-- ============================================================================
-- Mon Espace Math — tables, règles d'accès et stockage des PDF
--
-- À lancer une fois dans Supabase : SQL Editor → New query → coller → Run.
-- Le script peut être relancé sans danger (il ne supprime aucune donnée).
--
-- Principe : tout le monde peut LIRE les documents et les annonces ;
-- seuls les comptes inscrits dans la table « bureau » peuvent publier ou retirer.
-- ============================================================================

-- 1. Membres du bureau -------------------------------------------------------

create table if not exists public.bureau (
  user_id uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);

-- Aucune règle de lecture : la table n'est jamais visible depuis l'app.
alter table public.bureau enable row level security;

-- « Le compte connecté fait-il partie du bureau ? »
create or replace function public.est_bureau()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.bureau where user_id = (select auth.uid())
  );
$$;

revoke all on function public.est_bureau() from public, anon;
grant execute on function public.est_bureau() to authenticated;

-- 2. Documents ---------------------------------------------------------------

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  level text not null check (level in ('L1', 'L2', 'L3', 'M1', 'M2')),
  subject text not null,
  type text not null,
  year integer not null,
  notions text[] not null default '{}',
  description text not null default '',
  pages integer not null default 1,
  size_bytes bigint,
  file_path text,
  published_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;

grant select on public.documents to anon, authenticated;
grant insert, update, delete on public.documents to authenticated;

drop policy if exists "documents_lecture_publique" on public.documents;
create policy "documents_lecture_publique" on public.documents
  for select to anon, authenticated using (true);

drop policy if exists "documents_ajout_bureau" on public.documents;
create policy "documents_ajout_bureau" on public.documents
  for insert to authenticated with check ((select public.est_bureau()));

drop policy if exists "documents_modif_bureau" on public.documents;
create policy "documents_modif_bureau" on public.documents
  for update to authenticated
  using ((select public.est_bureau())) with check ((select public.est_bureau()));

drop policy if exists "documents_suppression_bureau" on public.documents;
create policy "documents_suppression_bureau" on public.documents
  for delete to authenticated using ((select public.est_bureau()));

-- 3. Annonces ----------------------------------------------------------------

create table if not exists public.annonces (
  id uuid primary key default gen_random_uuid(),
  cat text not null,
  event_date date not null,
  event_time text,
  place text not null default 'Espace Math',
  title text not null,
  summary text not null default '',
  body text not null default '',
  created_at timestamptz not null default now()
);

alter table public.annonces enable row level security;

grant select on public.annonces to anon, authenticated;
grant insert, update, delete on public.annonces to authenticated;

drop policy if exists "annonces_lecture_publique" on public.annonces;
create policy "annonces_lecture_publique" on public.annonces
  for select to anon, authenticated using (true);

drop policy if exists "annonces_ajout_bureau" on public.annonces;
create policy "annonces_ajout_bureau" on public.annonces
  for insert to authenticated with check ((select public.est_bureau()));

drop policy if exists "annonces_modif_bureau" on public.annonces;
create policy "annonces_modif_bureau" on public.annonces
  for update to authenticated
  using ((select public.est_bureau())) with check ((select public.est_bureau()));

drop policy if exists "annonces_suppression_bureau" on public.annonces;
create policy "annonces_suppression_bureau" on public.annonces
  for delete to authenticated using ((select public.est_bureau()));

-- 4. Stockage des PDF --------------------------------------------------------
-- Dossier public en lecture (n'importe qui peut ouvrir un PDF par son lien),
-- limité aux PDF de 20 Mo au plus. Seul le bureau peut envoyer ou supprimer.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', true, 20971520, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "pdf_envoi_bureau" on storage.objects;
create policy "pdf_envoi_bureau" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and (select public.est_bureau()));

drop policy if exists "pdf_liste_bureau" on storage.objects;
create policy "pdf_liste_bureau" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and (select public.est_bureau()));

drop policy if exists "pdf_suppression_bureau" on storage.objects;
create policy "pdf_suppression_bureau" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and (select public.est_bureau()));

-- ============================================================================
-- 5. Donner les droits du bureau à un compte
--
-- a) Créer le compte : Authentication → Users → Add user → Create new user
--    (e-mail + mot de passe, cocher « Auto Confirm User »).
-- b) Remplacer l'adresse ci-dessous, retirer les deux tirets « -- » en début
--    de ligne, puis lancer uniquement ces lignes :
--
-- insert into public.bureau (user_id)
-- select id from auth.users where email = 'adresse-du-bureau@exemple.com'
-- on conflict do nothing;
-- ============================================================================
