-- Arthur AI Phase F2 — Conversion Engine (relances mesurables).
-- Envois Instagram réels : désactivés par défaut (ARTHUR_FOLLOWUPS_SEND).

-- ── ai_followups ──────────────────────────────────────────────
create table if not exists public.ai_followups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.ai_leads (id) on delete set null,
  conversation_id uuid references public.ai_conversations (id) on delete set null,
  external_user_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  channel text not null default 'instagram'
    check (channel in ('instagram', 'web', 'future')),
  template_key text not null,
  decision_reason text not null,
  suppress_reason text,
  score_at_decision integer,
  score_band_at_decision text
    check (score_band_at_decision is null or score_band_at_decision in ('cold', 'warm', 'hot')),
  intent_at_decision text,
  funnel_stage text
    check (funnel_stage is null or funnel_stage in ('new', 'qualified', 'signup', 'premium', 'inactive')),
  message_preview text not null default '',
  status text not null default 'planned'
    check (status in (
      'planned',
      'approved',
      'suppressed',
      'queued',
      'sent',
      'failed',
      'cancelled'
    )),
  outcome text
    check (outcome is null or outcome in (
      'pending',
      'replied',
      'signup',
      'premium',
      'ignored',
      'opted_out'
    )),
  scheduled_for timestamptz,
  approved_at timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  replied_at timestamptz,
  converted_at timestamptz,
  send_mode text
    check (send_mode is null or send_mode in ('dry_run', 'mock', 'live')),
  provider_message_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ai_followups is
  'Relances Arthur Conversion Engine F2. Planification + tracking ; envoi live gated.';

comment on column public.ai_followups.send_mode is
  'dry_run = jamais envoyé ; mock = Meta mock ; live = Graph API (ARTHUR_FOLLOWUPS_SEND=1).';

create index if not exists ai_followups_lead_id_idx
  on public.ai_followups (lead_id)
  where lead_id is not null;

create index if not exists ai_followups_external_user_id_idx
  on public.ai_followups (external_user_id);

create index if not exists ai_followups_status_idx
  on public.ai_followups (status);

create index if not exists ai_followups_scheduled_for_idx
  on public.ai_followups (scheduled_for)
  where scheduled_for is not null and status in ('planned', 'approved', 'queued');

create index if not exists ai_followups_outcome_idx
  on public.ai_followups (outcome)
  where outcome is not null;

create index if not exists ai_followups_created_at_idx
  on public.ai_followups (created_at desc);

alter table public.ai_followups enable row level security;
-- Pas de policy client : service_role uniquement (admin / moteur).

-- ── Events followup ───────────────────────────────────────────
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
    'followup_converted'
  ));

notify pgrst, 'reload schema';
