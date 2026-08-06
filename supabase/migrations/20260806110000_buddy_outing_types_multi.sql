-- Multi-sélection des types de sortie (eau libre, piscine, etc.)

alter table public.buddy_profiles
  add column if not exists outing_types text[];

update public.buddy_profiles
set outing_types = array[coalesce(outing_type, 'open_water')]::text[]
where outing_types is null;

alter table public.buddy_profiles
  alter column outing_types set default array['open_water']::text[];

alter table public.buddy_profiles
  alter column outing_types set not null;

alter table public.buddy_profiles
  drop constraint if exists buddy_profiles_outing_type_check;

alter table public.buddy_profiles
  drop column if exists outing_type;

alter table public.buddy_profiles
  drop constraint if exists buddy_profiles_outing_types_valid;

alter table public.buddy_profiles
  add constraint buddy_profiles_outing_types_valid check (
    cardinality(outing_types) >= 1
    and outing_types <@ array['open_water', 'training', 'safety', 'discovery']::text[]
  );

create index if not exists buddy_profiles_outing_types_gin_idx
  on public.buddy_profiles using gin (outing_types)
  where is_discoverable = true;

notify pgrst, 'reload schema';
