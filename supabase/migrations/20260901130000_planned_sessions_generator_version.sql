-- Version du générateur ayant produit la séance (cockpit admin).
-- Ne régénère aucune séance existante. Valeur renseignée à la prochaine persistance.

alter table if exists public.planned_sessions
  add column if not exists generator_version text;

comment on column public.planned_sessions.generator_version is
  'Version cockpit du générateur (ex. 1.9). Indépendant de user_plans.version.';

create index if not exists planned_sessions_generator_version_idx
  on public.planned_sessions (generator_version);
