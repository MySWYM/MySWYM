-- Envois « une seule fois par compte » (bienvenue, déclenchement automation).
-- La clé primaire sert de verrou : deux appels simultanés, un seul gagne.
create table if not exists public.email_once (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, kind)
);

alter table public.email_once enable row level security;
-- Aucune policy : lecture / écriture réservées au service role (Edge Functions).
