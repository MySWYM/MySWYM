-- Empreinte carte d'un essai Stripe déjà consommé.
-- Service role seulement : pas de policy (RLS on, aucune lecture client).

create table if not exists public.trial_card_fingerprints (
  fingerprint text primary key,
  user_id uuid not null,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

alter table public.trial_card_fingerprints enable row level security;

comment on table public.trial_card_fingerprints is
  'Une empreinte carte = un essai ForSwim. Lecture et écriture via service role uniquement.';
