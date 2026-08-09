-- Arthur AI Phase F1 — Growth Engine (scoring + attribution).
-- Pas de relances automatiques dans cette phase.

alter table public.ai_leads
  add column if not exists score integer,
  add column if not exists score_band text
    check (score_band is null or score_band in ('cold', 'warm', 'hot')),
  add column if not exists score_reasons jsonb not null default '[]'::jsonb,
  add column if not exists scored_at timestamptz,
  add column if not exists keyword text,
  add column if not exists first_touch_at timestamptz,
  add column if not exists signup_at timestamptz,
  add column if not exists premium_at timestamptz,
  add column if not exists last_event_at timestamptz;

comment on column public.ai_leads.score is
  'Score lead 0–100 (Arthur Growth Engine F1).';
comment on column public.ai_leads.score_band is
  'cold <40, warm 40–69, hot ≥70.';
comment on column public.ai_leads.score_reasons is
  'Liste de raisons structurées du score (pas de PII).';

create index if not exists ai_leads_score_idx
  on public.ai_leads (score desc nulls last);

create index if not exists ai_leads_score_band_idx
  on public.ai_leads (score_band)
  where score_band is not null;

create index if not exists ai_leads_keyword_idx
  on public.ai_leads (keyword)
  where keyword is not null;

-- Snapshot quotidien optionnel (agrégats pré-calculés pour dashboard)
create table if not exists public.ai_growth_daily (
  day date not null,
  reel_id text not null default '',
  campaign text not null default '',
  source text not null default '',
  dm_count integer not null default 0,
  lead_count integer not null default 0,
  qualified_count integer not null default 0,
  signup_count integer not null default 0,
  premium_count integer not null default 0,
  avg_score numeric,
  updated_at timestamptz not null default now(),
  primary key (day, reel_id, campaign, source)
);

comment on table public.ai_growth_daily is
  'Agrégats journaliers attribution Arthur (Reel → Premium). Recalculés à la demande admin.';

alter table public.ai_growth_daily enable row level security;
-- Aucune policy client : lecture/écriture service_role uniquement.

create index if not exists ai_growth_daily_day_idx
  on public.ai_growth_daily (day desc);

notify pgrst, 'reload schema';
