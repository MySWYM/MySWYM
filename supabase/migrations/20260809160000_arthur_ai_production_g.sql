-- Arthur AI Phase G — Production Readiness
-- Coûts, rate limits, takeover humain. Pas d’activation envois auto.

-- ── Conversations : statuts takeover / pause ───────────────────
alter table public.ai_conversations
  drop constraint if exists ai_conversations_status_check;

alter table public.ai_conversations
  add constraint ai_conversations_status_check
  check (status in ('active', 'archived', 'closed', 'human_takeover', 'paused'));

-- ── Rate limit buckets (fenêtres horaires) ─────────────────────
create table if not exists public.ai_rate_buckets (
  bucket_key text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  cost_usd numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (bucket_key, window_start)
);

comment on table public.ai_rate_buckets is
  'Compteurs rate-limit / usage Arthur (clé = channel:identity).';

create index if not exists ai_rate_buckets_window_idx
  on public.ai_rate_buckets (window_start desc);

alter table public.ai_rate_buckets enable row level security;

-- ── Coûts journaliers agrégés ──────────────────────────────────
create table if not exists public.ai_cost_daily (
  day date primary key,
  requests integer not null default 0,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  cost_usd numeric not null default 0,
  offline_count integer not null default 0,
  rate_limited_count integer not null default 0,
  takeover_count integer not null default 0,
  updated_at timestamptz not null default now()
);

comment on table public.ai_cost_daily is
  'Snapshot coûts / volume Arthur par jour (monitoring Phase G).';

alter table public.ai_cost_daily enable row level security;

-- ── Human takeover audit ──────────────────────────────────────
create table if not exists public.ai_human_takeovers (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.ai_conversations (id) on delete set null,
  external_user_id text,
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'active'
    check (status in ('active', 'released')),
  reason text not null,
  requested_by text not null default 'system'
    check (requested_by in ('user_keyword', 'admin', 'suggested_action', 'flag', 'system')),
  notes text,
  created_at timestamptz not null default now(),
  released_at timestamptz
);

comment on table public.ai_human_takeovers is
  'Prise en charge humaine Arthur (conversation status=human_takeover).';

create index if not exists ai_human_takeovers_status_idx
  on public.ai_human_takeovers (status)
  where status = 'active';

create index if not exists ai_human_takeovers_conversation_idx
  on public.ai_human_takeovers (conversation_id)
  where conversation_id is not null;

alter table public.ai_human_takeovers enable row level security;

-- ── Events production ─────────────────────────────────────────
alter table public.ai_events
  drop constraint if exists ai_events_event_type_check;

alter table public.ai_events
  add constraint ai_events_event_type_check
  check (event_type in (
    'dm_received',
    'ai_response',
    'lead_qualified',
    'myswym_link_sent',
    'signup',
    'plan_created',
    'checkout_started',
    'subscription_started',
    'plan_requested',
    'plan_creation_blocked',
    'profile_updated',
    'instagram_webhook_received',
    'instagram_message_sent',
    'instagram_message_failed',
    'identity_link_verified',
    'followup_planned',
    'followup_suppressed',
    'followup_approved',
    'followup_sent',
    'followup_failed',
    'followup_replied',
    'followup_converted',
    'response_scored',
    'conversation_analyzed',
    'cta_sent',
    'cta_clicked',
    'knowledge_served',
    'rate_limited',
    'cost_budget_soft',
    'cost_budget_hard',
    'offline_fallback',
    'human_takeover_started',
    'human_takeover_released',
    'feature_flag_blocked'
  ));

notify pgrst, 'reload schema';
