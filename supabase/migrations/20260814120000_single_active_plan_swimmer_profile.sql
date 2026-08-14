-- MySWYM : 1 utilisateur = 1 profil nageur (sport_profiles) = 1 plan actif max.
-- Conserve l'historique des anciens plans dans plan_history.
-- N'altère pas le Sports Engine.

-- ═══════════════════════════════════════════════════════════════
-- 1. Historique des plans (remplacés / non actifs)
-- ═══════════════════════════════════════════════════════════════
alter table if exists public.user_plans
  add column if not exists plan_history jsonb not null default '[]'::jsonb;

-- ═══════════════════════════════════════════════════════════════
-- 2. Enrichir sport_profiles (champs stables déjà partiellement dans extra)
-- ═══════════════════════════════════════════════════════════════
alter table if exists public.sport_profiles
  add column if not exists swim_style text;

alter table if exists public.sport_profiles
  add column if not exists age integer;

comment on column public.sport_profiles.swim_style is
  'Style d''entraînement préféré : crawl | 4_nages (profil nageur).';
comment on column public.sport_profiles.age is
  'Âge déclaré (optionnel) — aussi miroité dans extra pour compat.';

-- Backfill swim_style / age depuis extra ou preferred_stroke legacy
update public.sport_profiles
set
  swim_style = coalesce(
    swim_style,
    nullif(extra->>'swimStyle', ''),
    case
      when preferred_stroke in ('crawl', '4_nages') then preferred_stroke
      else null
    end
  ),
  age = coalesce(
    age,
    case
      when (extra->>'age') ~ '^[0-9]+$' then (extra->>'age')::integer
      else null
    end
  )
where swim_style is null or age is null;

-- ═══════════════════════════════════════════════════════════════
-- 3. Migrer multi-plans → 1 actif + historique
-- ═══════════════════════════════════════════════════════════════
do $$
declare
  r record;
  plans jsonb;
  active_id text;
  active_plan jsonb;
  archived jsonb;
  entry jsonb;
  i int;
  pid text;
begin
  if to_regclass('public.user_plans') is null then
    return;
  end if;

  for r in
    select user_id, plans_json, active_plan_id, coalesce(plan_history, '[]'::jsonb) as plan_history
    from public.user_plans
    where plans_json is not null
      and jsonb_typeof(plans_json) = 'array'
      and jsonb_array_length(plans_json) > 1
  loop
    plans := r.plans_json;
    active_id := r.active_plan_id;
    active_plan := null;
    archived := coalesce(r.plan_history, '[]'::jsonb);
    if jsonb_typeof(archived) <> 'array' then
      archived := '[]'::jsonb;
    end if;

    -- Trouver le plan actif
    for i in 0 .. jsonb_array_length(plans) - 1 loop
      entry := plans -> i;
      pid := entry ->> 'id';
      if active_id is not null and pid = active_id then
        active_plan := entry;
        exit;
      end if;
    end loop;
    if active_plan is null then
      active_plan := plans -> 0;
      active_id := active_plan ->> 'id';
    end if;

    -- Archiver les autres
    for i in 0 .. jsonb_array_length(plans) - 1 loop
      entry := plans -> i;
      pid := entry ->> 'id';
      if pid is distinct from active_id then
        -- éviter doublon id dans history
        if not exists (
          select 1
          from jsonb_array_elements(archived) h
          where h ->> 'id' = pid
        ) then
          archived := archived || jsonb_build_array(
            entry || jsonb_build_object(
              'archivedAt', now()::text,
              'archiveReason', 'migration_single_active'
            )
          );
        end if;
      end if;
    end loop;

    update public.user_plans
    set
      plans_json = jsonb_build_array(active_plan),
      active_plan_id = active_id,
      plan_history = archived,
      profile = coalesce(active_plan -> 'profile', profile),
      plan = coalesce(active_plan -> 'plan', plan),
      updated_at = now()
    where user_id = r.user_id;
  end loop;
end $$;

-- ═══════════════════════════════════════════════════════════════
-- 4. Contrainte DB : au plus 1 plan dans plans_json
-- ═══════════════════════════════════════════════════════════════
alter table if exists public.user_plans
  drop constraint if exists user_plans_single_active_check;

alter table if exists public.user_plans
  add constraint user_plans_single_active_check
  check (
    plans_json is null
    or jsonb_typeof(plans_json) <> 'array'
    or jsonb_array_length(plans_json) <= 1
  );

-- Trigger de sécurité : si un upsert tente >1 plan, archiver + garder l'actif
create or replace function public.user_plans_enforce_single_active()
returns trigger
language plpgsql
as $$
declare
  plans jsonb;
  active_id text;
  active_plan jsonb;
  archived jsonb;
  entry jsonb;
  i int;
  pid text;
begin
  if new.plans_json is null or jsonb_typeof(new.plans_json) <> 'array' then
    return new;
  end if;
  if jsonb_array_length(new.plans_json) <= 1 then
    return new;
  end if;

  plans := new.plans_json;
  active_id := new.active_plan_id;
  active_plan := null;
  archived := coalesce(new.plan_history, '[]'::jsonb);
  if jsonb_typeof(archived) <> 'array' then
    archived := '[]'::jsonb;
  end if;

  for i in 0 .. jsonb_array_length(plans) - 1 loop
    entry := plans -> i;
    pid := entry ->> 'id';
    if active_id is not null and pid = active_id then
      active_plan := entry;
      exit;
    end if;
  end loop;
  if active_plan is null then
    active_plan := plans -> 0;
    active_id := active_plan ->> 'id';
  end if;

  for i in 0 .. jsonb_array_length(plans) - 1 loop
    entry := plans -> i;
    pid := entry ->> 'id';
    if pid is distinct from active_id then
      if not exists (
        select 1 from jsonb_array_elements(archived) h where h ->> 'id' = pid
      ) then
        archived := archived || jsonb_build_array(
          entry || jsonb_build_object(
            'archivedAt', now()::text,
            'archiveReason', 'trigger_single_active'
          )
        );
      end if;
    end if;
  end loop;

  new.plans_json := jsonb_build_array(active_plan);
  new.active_plan_id := active_id;
  new.plan_history := archived;
  new.profile := coalesce(active_plan -> 'profile', new.profile);
  new.plan := coalesce(active_plan -> 'plan', new.plan);
  return new;
end;
$$;

drop trigger if exists trg_user_plans_single_active on public.user_plans;
create trigger trg_user_plans_single_active
  before insert or update of plans_json, active_plan_id, plan_history
  on public.user_plans
  for each row
  execute function public.user_plans_enforce_single_active();
