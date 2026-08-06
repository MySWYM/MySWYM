-- Disponibilités structurées : jours + créneaux larges (multi-sélection).

alter table public.buddy_profiles
  add column if not exists availability_days text[] not null default '{}'::text[];

alter table public.buddy_profiles
  add column if not exists availability_slots text[] not null default '{}'::text[];

alter table public.buddy_profiles
  drop constraint if exists buddy_profiles_availability_days_valid;

alter table public.buddy_profiles
  add constraint buddy_profiles_availability_days_valid check (
    availability_days <@ array['mon','tue','wed','thu','fri','sat','sun']::text[]
  );

alter table public.buddy_profiles
  drop constraint if exists buddy_profiles_availability_slots_valid;

alter table public.buddy_profiles
  add constraint buddy_profiles_availability_slots_valid check (
    availability_slots <@ array['morning','midday','afternoon','evening']::text[]
  );

notify pgrst, 'reload schema';
