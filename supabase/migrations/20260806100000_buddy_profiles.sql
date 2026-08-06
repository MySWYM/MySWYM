-- Profils buddy : mise en relation entre nageurs (eau libre / triathlon) via WhatsApp opt-in.

create table if not exists public.buddy_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  city text not null,
  level text,
  goal_category text not null default 'eau_libre'
    check (goal_category in ('eau_libre', 'triathlon', 'progression', 'mixte')),
  outing_type text not null default 'open_water'
    check (outing_type in ('open_water', 'training', 'safety', 'discovery')),
  availability text,
  bio text,
  whatsapp_e164 text,
  is_discoverable boolean not null default false,
  consent_whatsapp boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint buddy_discoverable_requires_whatsapp check (
    not is_discoverable
    or (
      whatsapp_e164 is not null
      and length(trim(whatsapp_e164)) >= 10
      and consent_whatsapp = true
    )
  )
);

create index if not exists buddy_profiles_discoverable_city_idx
  on public.buddy_profiles (city)
  where is_discoverable = true;

create index if not exists buddy_profiles_discoverable_goal_idx
  on public.buddy_profiles (goal_category)
  where is_discoverable = true;

alter table public.buddy_profiles enable row level security;

drop policy if exists "Users read buddy profiles" on public.buddy_profiles;
create policy "Users read buddy profiles"
  on public.buddy_profiles
  for select
  to authenticated
  using (is_discoverable = true or auth.uid() = user_id);

drop policy if exists "Users insert own buddy profile" on public.buddy_profiles;
create policy "Users insert own buddy profile"
  on public.buddy_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own buddy profile" on public.buddy_profiles;
create policy "Users update own buddy profile"
  on public.buddy_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own buddy profile" on public.buddy_profiles;
create policy "Users delete own buddy profile"
  on public.buddy_profiles
  for delete
  to authenticated
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
