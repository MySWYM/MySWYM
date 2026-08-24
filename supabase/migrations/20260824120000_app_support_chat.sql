-- Support in-app (bulle) ↔ Telegram opérateur.
-- Écritures : Vercel /api (service_role). Client authentifié : lecture seule.

-- ═══════════════════════════════════════════════════════════════
-- 1. support_conversations
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.support_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  short_code text not null,
  status text not null default 'open'
    check (status in ('open', 'closed')),
  closed_at timestamptz,
  closed_by text check (closed_by is null or closed_by in ('user', 'agent', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_conversations_short_code_len check (
    short_code ~ '^[a-f0-9]{8}$'
  )
);

comment on table public.support_conversations is
  'Fils support in-app. Une conversation ouverte max par nageur.';

create unique index if not exists support_conversations_short_code_uidx
  on public.support_conversations (short_code);

create unique index if not exists support_conversations_one_open_per_user
  on public.support_conversations (user_id)
  where status = 'open';

create index if not exists support_conversations_user_updated_idx
  on public.support_conversations (user_id, updated_at desc);

alter table public.support_conversations enable row level security;

drop policy if exists "Users read own support conversations" on public.support_conversations;
create policy "Users read own support conversations"
  on public.support_conversations
  for select
  to authenticated
  using (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- 2. support_messages
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.support_conversations (id) on delete cascade,
  role text not null
    check (role in ('user', 'agent', 'bot', 'system')),
  body text not null,
  source text not null default 'app'
    check (source in ('app', 'faq', 'telegram', 'system')),
  telegram_update_id bigint,
  created_at timestamptz not null default now()
);

comment on table public.support_messages is
  'Messages du fil support. user = nageur, agent = Arthur (Telegram), bot = FAQ, system = clôture / accusé.';

create index if not exists support_messages_conversation_created_idx
  on public.support_messages (conversation_id, created_at);

create unique index if not exists support_messages_telegram_update_uidx
  on public.support_messages (telegram_update_id)
  where telegram_update_id is not null;

alter table public.support_messages enable row level security;

drop policy if exists "Users read own support messages" on public.support_messages;
create policy "Users read own support messages"
  on public.support_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.support_conversations c
      where c.id = support_messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- 3. Mapping Telegram (reply-to → conversation)
-- ═══════════════════════════════════════════════════════════════
create table if not exists public.support_telegram_outbound (
  telegram_chat_id bigint not null,
  telegram_message_id bigint not null,
  conversation_id uuid not null
    references public.support_conversations (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (telegram_chat_id, telegram_message_id)
);

create index if not exists support_telegram_outbound_conversation_idx
  on public.support_telegram_outbound (conversation_id, created_at desc);

alter table public.support_telegram_outbound enable row level security;

notify pgrst, 'reload schema';
