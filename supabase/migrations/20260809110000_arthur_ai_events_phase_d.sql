-- Arthur AI Phase D — nouveaux event_type pour actions tools.

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
    'profile_updated'
  ));

notify pgrst, 'reload schema';
