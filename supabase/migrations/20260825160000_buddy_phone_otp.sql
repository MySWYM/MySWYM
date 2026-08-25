-- OTP vérification numéro buddy (SMS Twilio ou e-mail fallback).
create table if not exists public.buddy_phone_otps (
  user_id uuid primary key references auth.users (id) on delete cascade,
  phone_e164 text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.buddy_phone_otps enable row level security;

-- Pas d’accès client direct : edge function service role uniquement.
revoke all on public.buddy_phone_otps from anon, authenticated;
