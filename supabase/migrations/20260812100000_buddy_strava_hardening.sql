-- Binômes : RPCs sécurisées (blocage, inverse, statuts) + trigger numéro effacé
-- Strava : tokens OAuth non lisibles côté client + statut public

-- ═══════════════════════════════════════════════════════════════
-- BUDDY : révoquer partage numéro quand whatsapp effacé
-- ═══════════════════════════════════════════════════════════════

create or replace function public.buddy_revoke_shares_on_phone_clear()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
    and (new.whatsapp_e164 is null or new.phone_share_ready = false)
    and (old.whatsapp_e164 is not null or old.phone_share_ready = true)
  then
    update public.buddy_connections
      set requester_share_phone = case when requester_id = new.user_id then false else requester_share_phone end,
          recipient_share_phone = case when recipient_id = new.user_id then false else recipient_share_phone end,
          updated_at = now()
      where status = 'accepted'
        and (requester_id = new.user_id or recipient_id = new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists buddy_profiles_phone_clear on public.buddy_profiles;
create trigger buddy_profiles_phone_clear
  after update on public.buddy_profiles
  for each row execute function public.buddy_revoke_shares_on_phone_clear();

-- Helper interne : blocage bidirectionnel
create or replace function public._buddy_is_blocked(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.buddy_blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

-- Demande de mise en relation (remplace upsert client direct)
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

revoke all on function public.request_buddy_connection(uuid, text, boolean, boolean) from public;
grant execute on function public.request_buddy_connection(uuid, text, boolean, boolean) to authenticated;

revoke all on function public.respond_buddy_connection(uuid, boolean, boolean, boolean) from public;
grant execute on function public.respond_buddy_connection(uuid, boolean, boolean, boolean) to authenticated;

revoke all on function public.cancel_buddy_connection(uuid) from public;
grant execute on function public.cancel_buddy_connection(uuid) to authenticated;

revoke all on function public.set_buddy_phone_share(uuid, boolean) from public;
grant execute on function public.set_buddy_phone_share(uuid, boolean) to authenticated;

-- Retirer les écritures directes sur buddy_connections (RPC uniquement)
drop policy if exists "Users insert buddy connections as requester" on public.buddy_connections;
drop policy if exists "Users update own buddy connections" on public.buddy_connections;

-- ═══════════════════════════════════════════════════════════════
-- STRAVA : tokens OAuth invisibles côté client
-- ═══════════════════════════════════════════════════════════════

drop policy if exists "Users manage their own Strava token" on public.strava_tokens;

-- Bloquer INSERT/UPDATE/DELETE client sur les tokens (edge functions = service_role)
drop policy if exists "Users insert own Strava tokens" on public.strava_tokens;
drop policy if exists "Users update own Strava tokens" on public.strava_tokens;
drop policy if exists "Users delete own Strava tokens" on public.strava_tokens;
drop policy if exists "Users read own Strava connection status" on public.strava_tokens;

revoke select on public.strava_tokens from authenticated;

create or replace function public.get_strava_connection_status()
returns table (
  connected boolean,
  athlete_id bigint,
  athlete_data jsonb,
  expires_at bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Non authentifié'; end if;

  return query
  select
    true,
    t.athlete_id,
    t.athlete_data,
    t.expires_at
  from public.strava_tokens t
  where t.user_id = uid
  limit 1;

  if not found then
    return query select false, null::bigint, null::jsonb, null::bigint;
  end if;
end;
$$;

revoke all on function public.get_strava_connection_status() from public;
grant execute on function public.get_strava_connection_status() to authenticated;

-- Bloquer un utilisateur (RPC — plus de UPDATE direct sur buddy_connections)
create or replace function public.block_buddy_user(p_blocked_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Non authentifié'; end if;
  if p_blocked_id is null or p_blocked_id = uid then
    raise exception 'Utilisateur invalide';
  end if;

  insert into public.buddy_blocks (blocker_id, blocked_id)
  values (uid, p_blocked_id)
  on conflict (blocker_id, blocked_id) do nothing;

  update public.buddy_connections
    set status = 'blocked',
        requester_share_phone = false,
        recipient_share_phone = false,
        updated_at = now()
    where status in ('pending', 'accepted')
      and (
        (requester_id = uid and recipient_id = p_blocked_id)
        or (requester_id = p_blocked_id and recipient_id = uid)
      );
end;
$$;

revoke all on function public.block_buddy_user(uuid) from public;
grant execute on function public.block_buddy_user(uuid) to authenticated;

notify pgrst, 'reload schema';
