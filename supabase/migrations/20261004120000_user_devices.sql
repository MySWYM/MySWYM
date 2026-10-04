-- Appareils connectés (web / iOS) pour Mes données → sécurité.
create table if not exists public.user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  device_key text not null,
  platform text not null default 'web'
    check (platform in ('ios', 'web', 'android')),
  label text not null default 'Appareil',
  user_agent text,
  country_code text,
  last_ip text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint user_devices_user_key unique (user_id, device_key)
);

comment on table public.user_devices is
  'Sessions / appareils MySWYM (iPhone, web). Heartbeat client + révocation Mes données.';

create index if not exists user_devices_user_seen_idx
  on public.user_devices (user_id, last_seen_at desc);

create index if not exists user_devices_user_active_idx
  on public.user_devices (user_id)
  where revoked_at is null;

alter table public.user_devices enable row level security;

drop policy if exists "Users read own devices" on public.user_devices;
create policy "Users read own devices"
  on public.user_devices for select to authenticated
  using (auth.uid() = user_id);

-- Écritures via Edge Function (service role). Lecture directe OK pour l’UI.

notify pgrst, 'reload schema';
