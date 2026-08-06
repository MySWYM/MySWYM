-- Remplace le dernier palier distance par "aucune limite".

update public.buddy_profiles
set radius_km = 999
where radius_km = 100;

alter table public.buddy_profiles
  drop constraint if exists buddy_profiles_radius_km_valid;

alter table public.buddy_profiles
  add constraint buddy_profiles_radius_km_valid check (
    radius_km in (5, 10, 15, 25, 40, 60, 999)
  );

notify pgrst, 'reload schema';
