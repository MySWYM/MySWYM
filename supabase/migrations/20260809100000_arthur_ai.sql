-- Arthur AI V1 — conversations, messages, leads, events, mémoire, prompts.
-- Écritures métier : Vercel /api (service_role) uniquement.
-- Clients authentifiés : lecture stricte de leurs propres lignes liées à user_id.
-- external_user_id (Instagram, etc.) n'est JAMAIS équivalent à auth.users.id.

-- ═══════════════════════════════════════════════════════════════
-- 1. ai_conversations
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  external_user_id text,
  channel text not null
    check (channel in ('web', 'instagram', 'future')),
  status text not null default 'active'
    check (status in ('active', 'archived', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_conversations_has_identity check (
    user_id is not null or external_user_id is not null
  )
);

comment on table public.ai_conversations is
  'Conversations Arthur AI. user_id = compte MySWYM ; external_user_id = canal externe (ex. Instagram). Ne jamais confondre les deux.';

comment on column public.ai_conversations.external_user_id is
  'Identifiant canal externe (ex. IGPSID). Jamais un substitute de auth.users.id.';

create index if not exists ai_conversations_user_id_idx
  on public.ai_conversations (user_id)
  where user_id is not null;

create index if not exists ai_conversations_external_user_id_idx
  on public.ai_conversations (external_user_id)
  where external_user_id is not null;

create index if not exists ai_conversations_channel_updated_idx
  on public.ai_conversations (channel, updated_at desc);

create index if not exists ai_conversations_status_idx
  on public.ai_conversations (status);

alter table public.ai_conversations enable row level security;

drop policy if exists "Users read own ai conversations" on public.ai_conversations;
create policy "Users read own ai conversations"
  on public.ai_conversations
  for select
  to authenticated
  using (user_id = auth.uid());

-- Pas de INSERT/UPDATE/DELETE client : écritures via service_role (Vercel API).

-- ═══════════════════════════════════════════════════════════════
-- 2. ai_messages
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.ai_conversations (id) on delete cascade,
  role text not null
    check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null default '',
  metadata jsonb,
  created_at timestamptz not null default now()
);

comment on table public.ai_messages is
  'Messages Arthur AI (user / assistant / system / tool). Écriture serveur uniquement.';

create index if not exists ai_messages_conversation_created_idx
  on public.ai_messages (conversation_id, created_at);

create index if not exists ai_messages_role_idx
  on public.ai_messages (role);

alter table public.ai_messages enable row level security;

drop policy if exists "Users read own ai messages" on public.ai_messages;
create policy "Users read own ai messages"
  on public.ai_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.ai_conversations c
      where c.id = ai_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 3. ai_leads
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.ai_leads (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid
    references public.ai_conversations (id) on delete set null,
  external_user_id text not null,
  source text,
  campaign text,
  reel_id text,
  intent text,
  goal text,
  level text,
  frequency integer,
  target_date date,
  email text,
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'new'
    check (status in ('new', 'qualified', 'signup', 'premium', 'inactive')),
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ai_leads is
  'Prospects Arthur AI (Instagram, etc.). external_user_id requis ; user_id seulement après mapping MySWYM validé.';

comment on column public.ai_leads.external_user_id is
  'ID canal externe. Ne remplace jamais user_id MySWYM.';

create index if not exists ai_leads_conversation_id_idx
  on public.ai_leads (conversation_id)
  where conversation_id is not null;

create index if not exists ai_leads_external_user_id_idx
  on public.ai_leads (external_user_id);

create index if not exists ai_leads_user_id_idx
  on public.ai_leads (user_id)
  where user_id is not null;

create index if not exists ai_leads_status_idx
  on public.ai_leads (status);

create index if not exists ai_leads_reel_id_idx
  on public.ai_leads (reel_id)
  where reel_id is not null;

create index if not exists ai_leads_source_campaign_idx
  on public.ai_leads (source, campaign);

create index if not exists ai_leads_created_at_idx
  on public.ai_leads (created_at desc);

alter table public.ai_leads enable row level security;

drop policy if exists "Users read own ai leads" on public.ai_leads;
create policy "Users read own ai leads"
  on public.ai_leads
  for select
  to authenticated
  using (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- 4. ai_events
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.ai_events (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid
    references public.ai_conversations (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  event_type text not null
    check (event_type in (
      'dm_received',
      'ai_response',
      'lead_qualified',
      'myswym_link_sent',
      'signup',
      'plan_created',
      'checkout_started',
      'subscription_started'
    )),
  metadata jsonb not null default '{}'::jsonb,
  tokens_input integer,
  tokens_output integer,
  model text,
  cost_estimate numeric,
  created_at timestamptz not null default now()
);

comment on table public.ai_events is
  'Tracking acquisition / usage Arthur AI (distinct de conversion_events produit).';

create index if not exists ai_events_conversation_id_idx
  on public.ai_events (conversation_id)
  where conversation_id is not null;

create index if not exists ai_events_user_id_idx
  on public.ai_events (user_id)
  where user_id is not null;

create index if not exists ai_events_event_type_idx
  on public.ai_events (event_type);

create index if not exists ai_events_created_at_idx
  on public.ai_events (created_at desc);

create index if not exists ai_events_type_created_idx
  on public.ai_events (event_type, created_at desc);

alter table public.ai_events enable row level security;

drop policy if exists "Users read own ai events" on public.ai_events;
create policy "Users read own ai events"
  on public.ai_events
  for select
  to authenticated
  using (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- 5. ai_user_context (mémoire long terme)
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.ai_user_context (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  external_user_id text,
  summary text,
  facts jsonb not null default '{}'::jsonb,
  last_intent text,
  updated_at timestamptz not null default now(),
  constraint ai_user_context_has_identity check (
    user_id is not null or external_user_id is not null
  )
);

comment on table public.ai_user_context is
  'Mémoire condensée Arthur AI. Une identité MySWYM (user_id) OU externe (external_user_id), jamais confondues.';

comment on column public.ai_user_context.facts is
  'Faits structurés (goal, level, frequency, pain_points, …) pour limiter le contexte OpenAI.';

-- Une mémoire max par compte MySWYM
create unique index if not exists ai_user_context_user_id_uidx
  on public.ai_user_context (user_id)
  where user_id is not null;

-- Une mémoire max par identifiant externe (canal Instagram, etc.)
create unique index if not exists ai_user_context_external_user_id_uidx
  on public.ai_user_context (external_user_id)
  where external_user_id is not null;

create index if not exists ai_user_context_updated_at_idx
  on public.ai_user_context (updated_at desc);

alter table public.ai_user_context enable row level security;

drop policy if exists "Users read own ai context" on public.ai_user_context;
create policy "Users read own ai context"
  on public.ai_user_context
  for select
  to authenticated
  using (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- 6. ai_prompt_versions
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.ai_prompt_versions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  content text not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.ai_prompt_versions is
  'Versions du system prompt Arthur AI. Lecture/écriture via service_role uniquement (Phase C).';

-- Au plus un prompt actif à la fois
create unique index if not exists ai_prompt_versions_one_active_uidx
  on public.ai_prompt_versions ((active))
  where active = true;

create index if not exists ai_prompt_versions_created_at_idx
  on public.ai_prompt_versions (created_at desc);

alter table public.ai_prompt_versions enable row level security;

-- Aucune policy authenticated/anon : inaccessible depuis le client.
-- service_role contourne le RLS pour le backend Vercel.

notify pgrst, 'reload schema';
