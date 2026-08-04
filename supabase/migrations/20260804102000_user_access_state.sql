create table if not exists public.user_access_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  access_status text not null check (access_status in ('trial', 'active', 'canceled', 'expired')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  trial_used boolean not null default false,
  subscription_started_at timestamptz,
  subscription_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  stripe_customer_id text,
  updated_at timestamptz not null default now()
);

create index if not exists user_access_state_status_idx on public.user_access_state (access_status);
create index if not exists user_access_state_trial_ends_idx on public.user_access_state (trial_ends_at desc);
create index if not exists user_access_state_subscription_ends_idx on public.user_access_state (subscription_ends_at desc);

alter table public.user_access_state enable row level security;

drop policy if exists "Users read own access state" on public.user_access_state;
create policy "Users read own access state"
  on public.user_access_state
  for select
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
