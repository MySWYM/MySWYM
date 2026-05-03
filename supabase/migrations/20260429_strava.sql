-- ── Strava OAuth tokens ───────────────────────────────────────────────────
create table if not exists public.strava_tokens (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  athlete_id     bigint not null,
  access_token   text not null,
  refresh_token  text not null,
  expires_at     bigint not null,  -- unix timestamp (seconds)
  scope          text,
  athlete_data   jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.strava_tokens enable row level security;

create policy "Users manage their own Strava token"
  on public.strava_tokens
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Strava activities ─────────────────────────────────────────────────────
create table if not exists public.strava_activities (
  id                  bigserial primary key,
  user_id             uuid not null references auth.users(id) on delete cascade,
  strava_activity_id  bigint not null,
  activity_type       text,
  title               text,
  distance            numeric,   -- metres
  duration            int,       -- seconds (moving_time)
  pace                int,       -- seconds per 100 m (swim only)
  calories            int,
  heart_rate          numeric,   -- average HR bpm
  activity_date       date,
  raw_data            jsonb,
  created_at          timestamptz not null default now(),
  unique (user_id, strava_activity_id)
);

alter table public.strava_activities enable row level security;

-- Users can read their own activities from the frontend
create policy "Users read their own Strava activities"
  on public.strava_activities
  for select
  using (auth.uid() = user_id);

-- Service role (Edge Functions) handles writes
create policy "Service role manages Strava activities"
  on public.strava_activities
  for all
  using (true)
  with check (true);

-- Fast per-user queries sorted by date
create index if not exists idx_strava_activities_user_date
  on public.strava_activities (user_id, activity_date desc);
