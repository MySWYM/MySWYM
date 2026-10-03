-- Snapshot publié du cahier natation.
-- Le Google Sheet reste l'atelier. L'app lit la version is_live.
-- Clé séance = family_id + n° (Arthur ajoute toujours en bas, il ne renumérote pas).
-- Lecture service_role seulement. Les séances déjà validées restent dans le plan.

create table if not exists public.sheet_catalogue_versions (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  is_live boolean not null default false,
  session_count integer not null default 0,
  educatif_count integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.sheet_catalogue_versions is
  'Publication du cahier Sheet. Une seule version is_live. Réimport = nouvelle version, pas un UPDATE des lignes déjà servies.';

create unique index if not exists sheet_catalogue_versions_one_live
  on public.sheet_catalogue_versions (is_live)
  where is_live;

create table if not exists public.sheet_sessions (
  version_id uuid not null references public.sheet_catalogue_versions (id) on delete cascade,
  family_id text not null,
  row_index integer not null,
  n integer not null,
  phase text,
  bande text not null default '',
  total_m integer not null check (total_m > 0),
  echauffement text not null default '',
  bloc text not null default '',
  rac text not null default '',
  primary key (version_id, family_id, n)
);

comment on table public.sheet_sessions is
  'Séances Soft 01-13. n = colonne n° du Sheet. row_index = ordre de tirage.';

create unique index if not exists sheet_sessions_row_idx
  on public.sheet_sessions (version_id, family_id, row_index);

create index if not exists sheet_sessions_family_idx
  on public.sheet_sessions (version_id, family_id, row_index);

create table if not exists public.sheet_educatifs (
  version_id uuid not null references public.sheet_catalogue_versions (id) on delete cascade,
  row_index integer not null,
  nom text not null,
  nage text not null default 'crawl',
  debutant boolean not null default false,
  intermediaire boolean not null default false,
  avance boolean not null default false,
  utilite text not null default '',
  comment text not null default '',
  materiel text[] not null default '{}',
  materiel_raw text not null default '',
  garder boolean not null default true,
  notes text not null default '',
  primary key (version_id, row_index)
);

comment on table public.sheet_educatifs is
  'Onglet Éducatifs. materiel_raw = texte Sheet. materiel = jetons déjà parsés.';

alter table public.sheet_catalogue_versions enable row level security;
alter table public.sheet_sessions enable row level security;
alter table public.sheet_educatifs enable row level security;

revoke all on table public.sheet_catalogue_versions from public, anon, authenticated;
revoke all on table public.sheet_sessions from public, anon, authenticated;
revoke all on table public.sheet_educatifs from public, anon, authenticated;

grant select, insert, update, delete on table public.sheet_catalogue_versions to service_role;
grant select, insert, update, delete on table public.sheet_sessions to service_role;
grant select, insert, update, delete on table public.sheet_educatifs to service_role;
