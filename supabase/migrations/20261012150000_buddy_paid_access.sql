-- Binômes : lecture et demande réservées à un abonnement payant (pas l'essai, pas l'anonyme).
-- Répondre, bloquer, signaler restent ouverts.

create or replace function public.has_paid_access(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_access_state uas
    join auth.users au on au.id = uas.user_id
    where uas.user_id = p_uid
      and coalesce(au.is_anonymous, false) = false
      and (
        (
          uas.access_status = 'active'
          and (uas.subscription_ends_at is null or uas.subscription_ends_at > now())
        )
        or (
          uas.access_status = 'canceled'
          and uas.subscription_ends_at > now()
        )
      )
  );
$$;

revoke all on function public.has_paid_access(uuid) from public;

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

  if not public.has_paid_access(uid) then
    raise exception 'premium_required';
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

create or replace function public.request_buddy_connection(
  p_recipient_id uuid,
  p_message text default null,
  p_safety_ack boolean default false,
  p_share_phone_consent boolean default false
)
returns public.buddy_connections
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing public.buddy_connections%rowtype;
  inverse public.buddy_connections%rowtype;
  row public.buddy_connections;
begin
  if uid is null then raise exception 'Non authentifié'; end if;
  if not public.has_paid_access(uid) then
    raise exception 'premium_required';
  end if;

  if p_recipient_id is null or p_recipient_id = uid then
    raise exception 'Destinataire invalide';
  end if;
  if not coalesce(p_safety_ack, false) then
    raise exception 'Confirme l''avertissement de sécurité';
  end if;
  if not coalesce(p_share_phone_consent, false) then
    raise exception 'Consentement de partage du numéro requis';
  end if;

  if exists (
    select 1 from public.buddy_moderation bm
    where bm.user_id = uid and bm.buddy_suspended = true
  ) then
    raise exception 'Accès Buddy suspendu';
  end if;

  if public._buddy_is_blocked(uid, p_recipient_id) then
    raise exception 'Mise en relation impossible (blocage)';
  end if;

  if not exists (
    select 1 from public.buddy_profiles
    where user_id = uid and phone_share_ready = true and whatsapp_e164 is not null
  ) then
    raise exception 'Configure ton numéro avant d''envoyer une demande';
  end if;

  select * into existing
  from public.buddy_connections
  where requester_id = uid and recipient_id = p_recipient_id;

  if found then
    if existing.status = 'blocked' then
      raise exception 'Mise en relation impossible (blocage)';
    end if;
    if existing.status in ('pending', 'accepted') then
      raise exception 'Demande déjà en cours ou acceptée';
    end if;
    if existing.status = 'declined' then
      raise exception 'Demande refusée — contacte le support si besoin';
    end if;
  end if;

  select * into inverse
  from public.buddy_connections
  where requester_id = p_recipient_id and recipient_id = uid;

  if found and inverse.status in ('pending', 'accepted', 'blocked') then
    if inverse.status = 'pending' then
      raise exception 'Cette personne t''a déjà contacté — consulte tes demandes reçues';
    end if;
    raise exception 'Mise en relation déjà existante';
  end if;

  insert into public.buddy_connections (
    requester_id, recipient_id, status,
    requester_share_phone, recipient_share_phone,
    requester_safety_ack_at, message, updated_at
  ) values (
    uid, p_recipient_id, 'pending',
    true, false,
    now(), nullif(trim(left(coalesce(p_message, ''), 280)), ''), now()
  )
  on conflict (requester_id, recipient_id) do update
    set status = 'pending',
        requester_share_phone = true,
        recipient_share_phone = false,
        requester_safety_ack_at = now(),
        message = excluded.message,
        updated_at = now()
  where public.buddy_connections.status in ('cancelled')
  returning * into row;

  if row.id is null then
    select * into row
    from public.buddy_connections
    where requester_id = uid and recipient_id = p_recipient_id;
  end if;

  return row;
end;
$$;

create or replace function public.respond_buddy_connection(
  p_connection_id uuid,
  p_accept boolean,
  p_safety_ack boolean default false,
  p_share_phone_consent boolean default false
)
returns public.buddy_connections
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  c public.buddy_connections%rowtype;
  row public.buddy_connections;
begin
  if uid is null then raise exception 'Non authentifié'; end if;

  select * into c from public.buddy_connections where id = p_connection_id;
  if not found then raise exception 'Demande introuvable'; end if;
  if c.recipient_id <> uid then raise exception 'Accès refusé'; end if;
  if c.status <> 'pending' then raise exception 'Demande déjà traitée'; end if;

  if p_accept then
    if not coalesce(p_safety_ack, false) then
      raise exception 'Confirme l''avertissement de sécurité';
    end if;
    if not coalesce(p_share_phone_consent, false) then
      raise exception 'Consentement de partage du numéro requis';
    end if;
    if not exists (
      select 1 from public.buddy_profiles
      where user_id = uid and phone_share_ready = true and whatsapp_e164 is not null
    ) then
      raise exception 'Configure ton numéro avant d''accepter';
    end if;

    update public.buddy_connections
      set status = 'accepted',
          recipient_share_phone = true,
          recipient_safety_ack_at = now(),
          updated_at = now()
      where id = p_connection_id and status = 'pending'
      returning * into row;
  else
    update public.buddy_connections
      set status = 'declined',
          recipient_share_phone = false,
          updated_at = now()
      where id = p_connection_id and status = 'pending'
      returning * into row;
  end if;

  if row.id is null then raise exception 'Demande introuvable ou déjà traitée'; end if;
  return row;
end;
$$;

create or replace function public.cancel_buddy_connection(p_connection_id uuid)
returns public.buddy_connections
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  row public.buddy_connections;
begin
  if uid is null then raise exception 'Non authentifié'; end if;

  update public.buddy_connections
    set status = 'cancelled',
        requester_share_phone = false,
        recipient_share_phone = false,
        updated_at = now()
    where id = p_connection_id
      and (requester_id = uid or recipient_id = uid)
      and status in ('pending', 'accepted')
    returning * into row;

  if row.id is null then raise exception 'Mise en relation introuvable'; end if;
  return row;
end;
$$;

create or replace function public.set_buddy_phone_share(
  p_connection_id uuid,
  p_share boolean
)
returns public.buddy_connections
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  c public.buddy_connections%rowtype;
  row public.buddy_connections;
begin
  if uid is null then raise exception 'Non authentifié'; end if;

  select * into c from public.buddy_connections where id = p_connection_id;
  if not found then raise exception 'Introuvable'; end if;
  if c.status <> 'accepted' then raise exception 'Mise en relation non acceptée'; end if;
  if c.requester_id <> uid and c.recipient_id <> uid then
    raise exception 'Accès refusé';
  end if;

  if p_share and not exists (
    select 1 from public.buddy_profiles
    where user_id = uid and phone_share_ready = true and whatsapp_e164 is not null
  ) then
    raise exception 'Configure ton numéro avant de partager';
  end if;

  update public.buddy_connections
    set requester_share_phone = case when c.requester_id = uid then p_share else requester_share_phone end,
        recipient_share_phone = case when c.recipient_id = uid then p_share else recipient_share_phone end,
        updated_at = now()
    where id = p_connection_id
    returning * into row;

  return row;
end;
$$;

create or replace function public.get_connection_phones(p_connection_id uuid)
returns table (
  connection_id uuid,
  my_phone text,
  their_user_id uuid,
  their_phone text,
  their_display_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  c public.buddy_connections%rowtype;
  other_id uuid;
begin
  if uid is null then
    raise exception 'Non authentifié';
  end if;

  if not public.has_paid_access(uid) then
    raise exception 'premium_required';
  end if;

  select * into c from public.buddy_connections where id = p_connection_id;
  if not found then
    raise exception 'Mise en relation introuvable';
  end if;
  if c.requester_id <> uid and c.recipient_id <> uid then
    raise exception 'Accès refusé';
  end if;
  if c.status <> 'accepted' then
    raise exception 'Mise en relation non acceptée';
  end if;
  if not (c.requester_share_phone and c.recipient_share_phone) then
    raise exception 'Consentement de partage du numéro incomplet';
  end if;

  other_id := case when c.requester_id = uid then c.recipient_id else c.requester_id end;

  return query
  select
    c.id,
    me.whatsapp_e164,
    other_id,
    them.whatsapp_e164,
    them.display_name
  from public.buddy_profiles me
  cross join public.buddy_profiles them
  where me.user_id = uid
    and them.user_id = other_id;
end;
$$;


revoke all on function public.get_buddy_directory(text, text, text, integer) from public;
grant execute on function public.get_buddy_directory(text, text, text, integer) to authenticated;

revoke all on function public.request_buddy_connection(uuid, text, boolean, boolean) from public;
grant execute on function public.request_buddy_connection(uuid, text, boolean, boolean) to authenticated;

revoke all on function public.get_connection_phones(uuid) from public;
grant execute on function public.get_connection_phones(uuid) to authenticated;

notify pgrst, 'reload schema';
