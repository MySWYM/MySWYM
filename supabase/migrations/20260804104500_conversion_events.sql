create table if not exists public.conversion_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  event_name text not null,
  path text,
  referrer text,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists conversion_events_user_id_idx on public.conversion_events (user_id);
create index if not exists conversion_events_event_name_idx on public.conversion_events (event_name);
create index if not exists conversion_events_created_at_idx on public.conversion_events (created_at desc);

alter table public.conversion_events enable row level security;

drop policy if exists "Users insert own conversion events" on public.conversion_events;
create policy "Users insert own conversion events"
  on public.conversion_events
  for insert
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Users read own conversion events" on public.conversion_events;
create policy "Users read own conversion events"
  on public.conversion_events
  for select
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
