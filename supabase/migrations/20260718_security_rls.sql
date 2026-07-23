-- Sécurité RLS : retire la policy ouverte sur strava_activities.
-- Le service_role (Edge Functions) contourne déjà le RLS ; inutile et dangereux d'avoir using(true).

drop policy if exists "Service role manages Strava activities" on public.strava_activities;

-- Les utilisateurs ne lisent que leurs activités (déjà en place).
-- Écritures uniquement via service_role dans strava-sync / strava-disconnect / delete-account.

-- Durcit user_plans si la table existe (créée hors repo ou via dashboard).
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_plans'
  ) then
    alter table public.user_plans enable row level security;

    drop policy if exists "Users manage their own plans" on public.user_plans;
    create policy "Users manage their own plans"
      on public.user_plans
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
