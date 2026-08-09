-- Arthur AI Phase H1 — Shadow Mode Instagram
-- Analyse + proposition + classification — AUCUN envoi automatique.

create table if not exists public.ai_shadow_proposals (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.ai_conversations (id) on delete set null,
  lead_id uuid references public.ai_leads (id) on delete set null,
  external_user_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  channel text not null default 'instagram'
    check (channel in ('instagram', 'web')),
  inbound_message text not null default '',
  proposed_message text not null,
  intent text,
  lead_temperature text
    check (lead_temperature is null or lead_temperature in ('cold', 'warm', 'hot')),
  suggested_action text,
  recommended_action text not null default 'reply'
    check (recommended_action in (
      'reply',
      'qualify',
      'suggest_myswym',
      'handoff_human',
      'ignore',
      'followup_later'
    )),
  lead_status_guess text,
  lead_score_snapshot integer,
  lead_band_snapshot text
    check (lead_band_snapshot is null or lead_band_snapshot in ('cold', 'warm', 'hot')),
  classification jsonb not null default '{}'::jsonb,
  attribution jsonb not null default '{}'::jsonb,
  model text,
  status text not null default 'pending'
    check (status in (
      'pending',
      'approved',
      'rejected',
      'edited_approved',
      'expired',
      'cancelled'
    )),
  review_notes text,
  reviewed_by text,
  reviewed_at timestamptz,
  final_message text,
  -- H1 : sent_at reste null (pas d’auto-send). Réservé H2+ gated.
  sent_at timestamptz,
  send_blocked_reason text default 'shadow_mode_h1',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ai_shadow_proposals is
  'Shadow Mode H1 : réponses Arthur proposées, validation humaine, jamais d’envoi auto.';

comment on column public.ai_shadow_proposals.sent_at is
  'Toujours null en H1. Envoi live uniquement après phase ultérieure + double gate.';

create index if not exists ai_shadow_proposals_status_idx
  on public.ai_shadow_proposals (status, created_at desc);

create index if not exists ai_shadow_proposals_external_idx
  on public.ai_shadow_proposals (external_user_id);

create index if not exists ai_shadow_proposals_conversation_idx
  on public.ai_shadow_proposals (conversation_id)
  where conversation_id is not null;

create index if not exists ai_shadow_proposals_pending_idx
  on public.ai_shadow_proposals (created_at desc)
  where status = 'pending';

alter table public.ai_shadow_proposals enable row level security;
-- service_role / admin only

-- Events shadow
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
    'feature_flag_blocked',
    'shadow_proposal_created',
    'shadow_proposal_approved',
    'shadow_proposal_rejected',
    'shadow_send_blocked'
  ));

notify pgrst, 'reload schema';
