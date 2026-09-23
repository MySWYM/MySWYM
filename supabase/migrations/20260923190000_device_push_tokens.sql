-- Jetons push APNs (iPhone). Opt-in via permission iOS.
create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null,
  platform text not null default 'ios'
    check (platform in ('ios', 'android', 'web')),
  app_bundle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint device_push_tokens_user_token unique (user_id, token)
);

comment on table public.device_push_tokens is
  'Jetons APNs / FCM pour notifications distantes (buddy, support).';

create index if not exists device_push_tokens_user_idx
  on public.device_push_tokens (user_id);

alter table public.device_push_tokens enable row level security;

drop policy if exists "Users read own push tokens" on public.device_push_tokens;
create policy "Users read own push tokens"
  on public.device_push_tokens for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users upsert own push tokens" on public.device_push_tokens;
create policy "Users upsert own push tokens"
  on public.device_push_tokens for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own push tokens" on public.device_push_tokens;
create policy "Users update own push tokens"
  on public.device_push_tokens for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own push tokens" on public.device_push_tokens;
create policy "Users delete own push tokens"
  on public.device_push_tokens for delete to authenticated
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
