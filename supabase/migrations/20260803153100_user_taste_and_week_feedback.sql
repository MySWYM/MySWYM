-- Profil de goûts client (apprentissage type Meta à partir des retours séance/semaine)
-- + schéma manquant week_feedback (déjà écrit côté app).

create table if not exists public.week_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id text,
  week_number integer,
  rating text not null check (rating in ('easy', 'ok', 'hard')),
  motivation text,
  pain text,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists week_feedback_user_id_idx on public.week_feedback (user_id);
create index if not exists week_feedback_created_at_idx on public.week_feedback (created_at desc);

alter table public.week_feedback enable row level security;

drop policy if exists "Users insert own week feedback" on public.week_feedback;
create policy "Users insert own week feedback"
  on public.week_feedback
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users read own week feedback" on public.week_feedback;
create policy "Users read own week feedback"
  on public.week_feedback
  for select
  using (auth.uid() = user_id);

-- Goûts / affinités agrégés par compte (cross-plans)
create table if not exists public.user_taste_profile (
  user_id uuid primary key references auth.users (id) on delete cascade,
  scores jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_taste_profile enable row level security;

drop policy if exists "Users read own taste" on public.user_taste_profile;
create policy "Users read own taste"
  on public.user_taste_profile
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users upsert own taste" on public.user_taste_profile;
create policy "Users upsert own taste"
  on public.user_taste_profile
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own taste" on public.user_taste_profile;
create policy "Users update own taste"
  on public.user_taste_profile
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
