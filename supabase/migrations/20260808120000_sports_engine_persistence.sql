-- Étape K — Persistance sportive (faits).
-- Ne modifie PAS le Sports Engine : mémoire seulement.
-- Compat : conserve user_plans.plans_json + _engineHistory pendant la transition.

-- ═══════════════════════════════════════════════════════════════
-- 1. sport_profiles (1 ligne / user — étendre plutôt que doubler)
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.sport_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  level text,
  objective text,
  frequency integer,
  session_duration integer,
  equipment jsonb not null default '[]'::jsonb,
  pool_length integer,
  preferred_stroke text,
  race_target jsonb,
  injury_status text,
  injury_note text,
  pace100 numeric,
  extra jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.sport_profiles enable row level security;

drop policy if exists "Users read own sport profile" on public.sport_profiles;
create policy "Users read own sport profile"
  on public.sport_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users upsert own sport profile" on public.sport_profiles;
create policy "Users upsert own sport profile"
  on public.sport_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own sport profile" on public.sport_profiles;
create policy "Users update own sport profile"
  on public.sport_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own sport profile" on public.sport_profiles;
create policy "Users delete own sport profile"
  on public.sport_profiles for delete
  using (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- 2. planned_sessions (séances générées + statut)
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.planned_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id text not null,
  week_index integer not null,
  session_index integer not null,
  scheduled_date date,
  session_type text,
  objective text,
  family text,
  intent text,
  phase text,
  volume integer,
  training_distance integer not null default 0,
  status text not null default 'planned'
    check (status in ('planned', 'completed', 'missed', 'skipped')),
  session_payload jsonb,
  completed_at timestamptz,
  actual_distance integer,
  actual_duration integer,
  actual_time_sec integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_id, week_index, session_index)
);

create index if not exists planned_sessions_user_plan_idx
  on public.planned_sessions (user_id, plan_id);
create index if not exists planned_sessions_status_idx
  on public.planned_sessions (user_id, status);
create index if not exists planned_sessions_phase_idx
  on public.planned_sessions (user_id, phase);

alter table public.planned_sessions enable row level security;

drop policy if exists "Users manage own planned sessions" on public.planned_sessions;
create policy "Users manage own planned sessions"
  on public.planned_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- 3. session_feedback — étendre (faits bruts 4 niveaux + pain)
--    Conserve easy/ok/hard pour rétrocompat ; ajoute too_* / good / pain
-- ═══════════════════════════════════════════════════════════════
alter table public.session_feedback
  add column if not exists difficulty text,
  add column if not exists pain boolean not null default false,
  add column if not exists completed boolean,
  add column if not exists planned_session_id uuid references public.planned_sessions (id) on delete set null,
  add column if not exists notes text;

-- Assouplir le check rating pour accepter trop facile / trop dur / good
alter table public.session_feedback drop constraint if exists session_feedback_rating_check;
alter table public.session_feedback
  add constraint session_feedback_rating_check
  check (rating in ('easy', 'ok', 'hard', 'too_easy', 'good', 'too_hard'));

create index if not exists session_feedback_planned_session_idx
  on public.session_feedback (planned_session_id);

-- ═══════════════════════════════════════════════════════════════
-- 4. weekly_adaptations (décisions historiques — PAS un 2e volumeMul runtime)
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.weekly_adaptations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id text not null,
  week_index integer not null,
  action text,
  primary_lever text,
  magnitude text,
  volume_mul numeric,
  rationale text,
  confidence text,
  safety text,
  dev_explain text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists weekly_adaptations_user_plan_idx
  on public.weekly_adaptations (user_id, plan_id, week_index);

alter table public.weekly_adaptations enable row level security;

drop policy if exists "Users manage own weekly adaptations" on public.weekly_adaptations;
create policy "Users manage own weekly adaptations"
  on public.weekly_adaptations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- 5. capacity_snapshots
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.capacity_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_session_id uuid references public.planned_sessions (id) on delete set null,
  plan_id text,
  volume_tolerance numeric,
  intensity_tolerance numeric,
  recovery_tolerance numeric,
  continuous_capacity numeric,
  technical_confidence numeric,
  confidence numeric,
  reason text,
  dimensions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists capacity_snapshots_user_idx
  on public.capacity_snapshots (user_id, created_at desc);

alter table public.capacity_snapshots enable row level security;

drop policy if exists "Users manage own capacity snapshots" on public.capacity_snapshots;
create policy "Users manage own capacity snapshots"
  on public.capacity_snapshots for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- 6. race_targets
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.race_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  distance integer not null,
  stroke text,
  target_time_sec integer,
  competition_date date,
  source text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists race_targets_user_active_idx
  on public.race_targets (user_id, active);

alter table public.race_targets enable row level security;

drop policy if exists "Users manage own race targets" on public.race_targets;
create policy "Users manage own race targets"
  on public.race_targets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- 7. race_results (ne jamais écraser un résultat)
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.race_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  race_target_id uuid references public.race_targets (id) on delete set null,
  distance integer not null,
  stroke text,
  result_time_sec integer not null,
  competition_date date,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists race_results_user_idx
  on public.race_results (user_id, created_at desc);

alter table public.race_results enable row level security;

drop policy if exists "Users manage own race results" on public.race_results;
create policy "Users manage own race results"
  on public.race_results for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- 8. post_race_recovery
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.post_race_recovery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  race_result_id uuid references public.race_results (id) on delete set null,
  status text not null default 'active',
  start_date date,
  end_date date,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists post_race_recovery_user_idx
  on public.post_race_recovery (user_id, status);

alter table public.post_race_recovery enable row level security;

drop policy if exists "Users manage own post race recovery" on public.post_race_recovery;
create policy "Users manage own post race recovery"
  on public.post_race_recovery for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- 9. Colonne de lien sur user_plans (compat, non destructive)
-- ═══════════════════════════════════════════════════════════════
alter table public.user_plans
  add column if not exists sports_facts_version integer default 1;

notify pgrst, 'reload schema';
