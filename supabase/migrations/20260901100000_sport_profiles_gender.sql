-- Sexe déclaré (optionnel) sur le profil nageur.
-- Valeurs : homme | femme. Jamais envoyé à PostHog.

alter table if exists public.sport_profiles
  add column if not exists gender text;

update public.sport_profiles
set gender = null
where gender is not null
  and gender not in ('homme', 'femme');

update public.sport_profiles
set extra = jsonb_set(coalesce(extra, '{}'::jsonb), '{gender}', 'null'::jsonb, true)
where extra->>'gender' is not null
  and extra->>'gender' not in ('homme', 'femme');

alter table if exists public.sport_profiles
  drop constraint if exists sport_profiles_gender_check;

alter table if exists public.sport_profiles
  add constraint sport_profiles_gender_check
  check (
    gender is null
    or gender in ('homme', 'femme')
  );

comment on column public.sport_profiles.gender is
  'Sexe déclaré optionnel : homme | femme. Aussi miroité dans extra.gender.';

update public.sport_profiles
set gender = extra->>'gender'
where gender is null
  and extra->>'gender' in ('homme', 'femme');
