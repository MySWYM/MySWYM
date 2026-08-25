-- Annuaire Buddy : n’afficher que les profils prêts à matcher
-- (publié + ville + numéro enregistré + consentement de principe).
-- Le numéro reste hors des colonnes renvoyées (jamais public).

create or replace function public.get_buddy_directory(
  p_city text default null,
  p_level text default null,
  p_goal text default null,
  p_limit integer default 50
)
returns table (
  user_id uuid,
  display_name text,
  city text,
  radius_km integer,
  level text,
  goal_category text,
  outing_types text[],
  availability_days text[],
  availability_slots text[],
  availability text,
  bio text,
  is_discoverable boolean,
  avatar_url text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Non authentifié';
  end if;

  return query
  select
    bp.user_id,
    bp.display_name,
    bp.city,
    bp.radius_km,
    bp.level,
    bp.goal_category,
    bp.outing_types,
    bp.availability_days,
    bp.availability_slots,
    bp.availability,
    bp.bio,
    bp.is_discoverable,
    bp.avatar_url,
    bp.updated_at
  from public.buddy_profiles bp
  where bp.is_discoverable = true
    and bp.phone_share_ready = true
    and bp.whatsapp_e164 is not null
    and length(trim(bp.whatsapp_e164)) > 0
    and bp.city is not null
    and length(trim(bp.city)) > 0
    and bp.user_id <> uid
    and not exists (
      select 1 from public.buddy_moderation bm
      where bm.user_id = bp.user_id and bm.buddy_suspended = true
    )
    and not exists (
      select 1 from public.buddy_blocks bb
      where (bb.blocker_id = uid and bb.blocked_id = bp.user_id)
         or (bb.blocker_id = bp.user_id and bb.blocked_id = uid)
    )
    and (p_city is null or p_city = '' or bp.city ilike '%' || p_city || '%')
    and (p_level is null or p_level = '' or bp.level = p_level)
    and (p_goal is null or p_goal = '' or bp.goal_category = p_goal)
  order by bp.updated_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
end;
$$;

revoke all on function public.get_buddy_directory(text, text, text, integer) from public;
grant execute on function public.get_buddy_directory(text, text, text, integer) to authenticated;
