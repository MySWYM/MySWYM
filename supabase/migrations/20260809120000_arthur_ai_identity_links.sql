-- Arthur AI Phase E — mapping sécurisé identité externe → MySWYM.
-- Jamais d’équivalence automatique Instagram IGSID = auth.users.id.

create table if not exists public.ai_identity_links (
  id uuid primary key default gen_random_uuid(),
  provider text not null
    check (provider in ('instagram')),
  external_user_id text not null,
  user_id uuid references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'revoked')),
  verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_identity_links_verified_needs_user check (
    status <> 'verified' or user_id is not null
  )
);

comment on table public.ai_identity_links is
  'Lien validé entre un ID canal (ex. Instagram IGSID) et un user MySWYM. Seul status=verified autorise le rattachement Arthur.';

comment on column public.ai_identity_links.external_user_id is
  'IGSID / ID externe. Ne jamais utiliser comme auth.users.id.';

-- Un IGSID ne peut avoir qu’un lien non-révoqué
create unique index if not exists ai_identity_links_provider_external_uidx
  on public.ai_identity_links (provider, external_user_id)
  where status in ('pending', 'verified');

-- Un user MySWYM : au plus un lien Instagram verified
create unique index if not exists ai_identity_links_provider_user_verified_uidx
  on public.ai_identity_links (provider, user_id)
  where status = 'verified' and user_id is not null;

create index if not exists ai_identity_links_user_id_idx
  on public.ai_identity_links (user_id)
  where user_id is not null;

create index if not exists ai_identity_links_status_idx
  on public.ai_identity_links (status);

alter table public.ai_identity_links enable row level security;

-- Lecture : l’utilisateur voit uniquement SES liens verified/pending
drop policy if exists "Users read own identity links" on public.ai_identity_links;
create policy "Users read own identity links"
  on public.ai_identity_links
  for select
  to authenticated
  using (user_id = auth.uid());

-- Pas d’INSERT/UPDATE client : création/vérification via backend (service_role).

-- Events Instagram / attribution
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
    'identity_link_verified'
  ));

notify pgrst, 'reload schema';
