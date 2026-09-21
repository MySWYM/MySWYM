-- Rang all-time : tous les comptes (essai, gratuit, premium), toutes les séances completed.
-- Formule alignée sur src/lib/weekly-rank.js : km × coef séances × bonus allure.
-- Coef : 1→1.0, 2→1.2, 3→1.5, 4→1.9, 5+→2.4. Allure : ×1 à ×1.25 si plus rapide que la médiane.

create index if not exists planned_sessions_completed_at_idx
  on public.planned_sessions (completed_at)
  where status = 'completed';

create index if not exists planned_sessions_completed_user_idx
  on public.planned_sessions (user_id)
  where status = 'completed';

create or replace function public.weekly_rank_canon_email(raw text)
returns text
language sql
immutable
as $$
  select case
    when raw is null or position('@' in raw) = 0 then lower(trim(both from coalesce(raw, '')))
    else lower(
      regexp_replace(split_part(trim(both from raw), '@', 1), '\+.*$', '')
      || '@'
      || split_part(trim(both from raw), '@', 2)
    )
  end
$$;

create or replace function public.weekly_rank_me()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  result jsonb;
begin
  if uid is null then
    raise exception 'Non authentifié';
  end if;

  with pool as (
    select distinct ids.user_id
    from (
      select user_id from public.sport_profiles
      union
      select user_id from public.user_plans
      union
      select uid as user_id
    ) ids
    where ids.user_id is not null
      and (
        ids.user_id = uid
        or not exists (
          select 1
          from public.admin_user_directory d
          where d.user_id = ids.user_id
            and public.weekly_rank_canon_email(d.email) in (
              'arthur.no@outlook.fr',
              'j.wiackowska@outlook.fr',
              'admin@myswym.app'
            )
        )
      )
  ),
  paces as (
    select
      (
        select percentile_cont(0.5) within group (order by sp.pace100)
        from public.sport_profiles sp
        join pool p on p.user_id = sp.user_id
        where sp.pace100 is not null and sp.pace100 > 0
      ) as median_pace,
      (
        select percentile_cont(0.1) within group (order by sp.pace100)
        from public.sport_profiles sp
        join pool p on p.user_id = sp.user_id
        where sp.pace100 is not null and sp.pace100 > 0
      ) as p10_pace
  ),
  table_stats as (
    select
      ps.user_id,
      count(*)::int as sessions,
      coalesce(sum(coalesce(ps.actual_distance, ps.volume, ps.training_distance, 0)), 0)::int as meters
    from public.planned_sessions ps
    where ps.status = 'completed'
    group by ps.user_id
  ),
  blob_plans as (
    select
      up.user_id,
      plan
    from public.user_plans up
    cross join lateral jsonb_array_elements(
      coalesce(up.plans_json, '[]'::jsonb) || coalesce(up.plan_history, '[]'::jsonb)
    ) as plan
    where jsonb_typeof(plan) = 'object'
  ),
  blob_sessions as (
    select bp.user_id, sess
    from blob_plans bp
    cross join lateral jsonb_array_elements(coalesce(bp.plan->'weeks', '[]'::jsonb)) as week
    cross join lateral jsonb_array_elements(coalesce(week->'sessions', '[]'::jsonb)) as sess
    union all
    select bp.user_id, sess
    from blob_plans bp
    cross join lateral jsonb_array_elements(coalesce(bp.plan->'history', '[]'::jsonb)) as sess
  ),
  blob_stats as (
    select
      user_id,
      count(*)::int as sessions,
      coalesce(sum(
        coalesce(
          nullif(regexp_replace(coalesce(sess->>'distance', ''), '[^0-9]', '', 'g'), '')::int,
          0
        )
      ), 0)::int as meters
    from blob_sessions
    where coalesce(sess->>'completed', 'false') in ('true', 't')
      and coalesce(sess->>'skipped', 'false') not in ('true', 't', 'missed')
    group by user_id
  ),
  lifetime_stats as (
    select
      coalesce(t.user_id, b.user_id) as user_id,
      greatest(coalesce(t.sessions, 0), coalesce(b.sessions, 0)) as sessions,
      greatest(coalesce(t.meters, 0), coalesce(b.meters, 0)) as meters
    from table_stats t
    full outer join blob_stats b on b.user_id = t.user_id
  ),
  scored as (
    select
      p.user_id,
      coalesce(w.sessions, 0) as sessions,
      coalesce(w.meters, 0) as meters,
      case
        when coalesce(w.sessions, 0) <= 0 then 0::numeric
        when w.sessions = 1 then 1.0
        when w.sessions = 2 then 1.2
        when w.sessions = 3 then 1.5
        when w.sessions = 4 then 1.9
        else 2.4
      end as session_coef,
      sp.pace100,
      case
        when sp.pace100 is null or sp.pace100 <= 0 or px.median_pace is null or px.median_pace <= 0 then 1.0
        when sp.pace100 >= px.median_pace then 1.0
        when px.p10_pace is null or px.p10_pace <= 0 or px.p10_pace >= px.median_pace then
          1.0 + 0.25 * least(1.0, greatest(0.0,
            (px.median_pace - sp.pace100) / nullif(px.median_pace * 0.25, 0)
          ))
        else
          1.0 + 0.25 * least(1.0, greatest(0.0,
            (px.median_pace - sp.pace100) / nullif(px.median_pace - px.p10_pace, 0)
          ))
      end as pace_bonus
    from pool p
    left join lifetime_stats w on w.user_id = p.user_id
    left join public.sport_profiles sp on sp.user_id = p.user_id
    cross join paces px
  ),
  scored2 as (
    select
      s.*,
      (s.meters::numeric / 1000.0) * s.session_coef * s.pace_bonus as score
    from scored s
  ),
  mine as (
    select * from scored2 where user_id = uid
  )
  select jsonb_build_object(
    'ok', true,
    'scope', 'all_time',
    'population', (select count(*) from scored2),
    'sessions', coalesce(m.sessions, 0),
    'meters', coalesce(m.meters, 0),
    'session_coef', round(coalesce(m.session_coef, 0), 2),
    'pace100', m.pace100,
    'pace_bonus', round(coalesce(m.pace_bonus, 1), 3),
    'score', round(coalesce(m.score, 0), 4),
    'top_percent', case
      when coalesce(m.score, 0) > 0 then
        least(100, greatest(1, ceil(
          (100.0 * ((select count(*) from scored2 s where s.score > m.score) + 1))
          / greatest((select count(*) from scored2), 1)
        )))
      else 100
    end
  )
  into result
  from mine m;

  if result is null then
    result := jsonb_build_object(
      'ok', true,
      'scope', 'all_time',
      'population', 0,
      'sessions', 0,
      'meters', 0,
      'session_coef', 0,
      'pace100', null,
      'pace_bonus', 1,
      'score', 0,
      'top_percent', 100
    );
  end if;

  return result;
end;
$$;

revoke all on function public.weekly_rank_me() from public;
revoke all on function public.weekly_rank_me() from anon;
grant execute on function public.weekly_rank_me() to authenticated;

revoke all on function public.weekly_rank_canon_email(text) from public;
revoke all on function public.weekly_rank_canon_email(text) from anon, authenticated;

comment on function public.weekly_rank_me() is
  'Percentile all-time du nageur connecté vs tous les comptes MySWYM. Constantes : src/lib/weekly-rank.js';

notify pgrst, 'reload schema';
