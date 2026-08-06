-- Périmètre de déplacement toléré pour le matching buddy.

alter table public.buddy_profiles
  add column if not exists radius_km integer not null default 15;

update public.buddy_profiles
set radius_km = 15
where radius_km is null;

alter table public.buddy_profiles
  drop constraint if exists buddy_profiles_radius_km_valid;

alter table public.buddy_profiles
  add constraint buddy_profiles_radius_km_valid check (
    radius_km in (5, 10, 15, 25, 40, 60, 100)
  );

notify pgrst, 'reload schema';
