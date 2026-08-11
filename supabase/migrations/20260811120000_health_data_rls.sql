-- Santé art. 9 RGPD : colonnes structurées (listes fermées) + renforcement RLS
-- Pas de champ texte libre pour diagnostic / traitement.

alter table public.sport_profiles
  add column if not exists injury_zone text,
  add column if not exists injury_severity text,
  add column if not exists health_consent boolean not null default false,
  add column if not exists health_consent_at timestamptz;

comment on column public.sport_profiles.injury_zone is
  'Zone corporelle (liste fermée) — donnée de santé art. 9';
comment on column public.sport_profiles.injury_severity is
  'Gravité (liste fermée) — donnée de santé art. 9';
comment on column public.sport_profiles.health_consent is
  'Consentement explicite art. 9.2.a pour FC + blessures';

-- Contraintes souples (valeurs connues + null)
alter table public.sport_profiles drop constraint if exists sport_profiles_injury_zone_check;
alter table public.sport_profiles
  add constraint sport_profiles_injury_zone_check
  check (
    injury_zone is null
    or injury_zone in ('shoulder','elbow','wrist','neck','back','hip','knee','ankle','other')
  );

alter table public.sport_profiles drop constraint if exists sport_profiles_injury_severity_check;
alter table public.sport_profiles
  add constraint sport_profiles_injury_severity_check
  check (
    injury_severity is null
    or injury_severity in ('mild','moderate','significant')
  );

-- Nettoyage progressif des anciennes notes libres (ne pas réutiliser en free-text)
-- Les valeurs existantes restent jusqu'à purge utilisateur / inactivité.

-- ═══════════════════════════════════════════════════════════════
-- RLS : garantir isolement user sur tables contenant FC / blessures
-- ═══════════════════════════════════════════════════════════════

alter table public.sport_profiles enable row level security;
alter table public.session_feedback enable row level security;
alter table public.strava_activities enable row level security;
alter table public.strava_tokens enable row level security;

drop policy if exists "Users read own sport profile" on public.sport_profiles;
create policy "Users read own sport profile"
  on public.sport_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users upsert own sport profile" on public.sport_profiles;
create policy "Users upsert own sport profile"
  on public.sport_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own sport profile" on public.sport_profiles;
create policy "Users update own sport profile"
  on public.sport_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own sport profile" on public.sport_profiles;
create policy "Users delete own sport profile"
  on public.sport_profiles for delete
  using (auth.uid() = user_id);

drop policy if exists "Users insert own session feedback" on public.session_feedback;
create policy "Users insert own session feedback"
  on public.session_feedback for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users read own session feedback" on public.session_feedback;
create policy "Users read own session feedback"
  on public.session_feedback for select
  using (auth.uid() = user_id);

drop policy if exists "Users update own session feedback" on public.session_feedback;
create policy "Users update own session feedback"
  on public.session_feedback for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own session feedback" on public.session_feedback;
create policy "Users delete own session feedback"
  on public.session_feedback for delete
  using (auth.uid() = user_id);

-- Strava activities : lecture seule côté user ; écritures via service_role (edge)
drop policy if exists "Users read their own Strava activities" on public.strava_activities;
create policy "Users read their own Strava activities"
  on public.strava_activities for select
  using (auth.uid() = user_id);

-- Empêcher toute écriture client directe sur strava_activities (FC incluse)
drop policy if exists "Users insert own Strava activities" on public.strava_activities;
drop policy if exists "Users update own Strava activities" on public.strava_activities;
drop policy if exists "Users delete own Strava activities" on public.strava_activities;
drop policy if exists "Service role manages Strava activities" on public.strava_activities;

drop policy if exists "Users manage their own Strava token" on public.strava_tokens;
create policy "Users manage their own Strava token"
  on public.strava_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
