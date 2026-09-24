-- Genre déclaré : homme | femme | autre.
-- extra.gender reste le miroir ; la colonne peut encore rater sur une
-- base pas encore migrée (retry sans colonne dans sports-persistence).

alter table if exists public.sport_profiles
  drop constraint if exists sport_profiles_gender_check;

alter table if exists public.sport_profiles
  add constraint sport_profiles_gender_check
  check (
    gender is null
    or gender in ('homme', 'femme', 'autre')
  );

comment on column public.sport_profiles.gender is
  'Sexe déclaré optionnel : homme | femme | autre. Aussi miroité dans extra.gender.';

update public.sport_profiles
set gender = extra->>'gender'
where (gender is null or gender = '')
  and extra->>'gender' in ('homme', 'femme', 'autre');
