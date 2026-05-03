-- ── Bucket avatars (stockage photos profil) ──────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Toute personne authentifiée peut gérer son propre avatar
create policy "Users upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

create policy "Avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- ── Colonne plans_json dans user_plans (multi-plan cross-device) ──────────
alter table public.user_plans
  add column if not exists plans_json   jsonb,
  add column if not exists active_plan_id text;
