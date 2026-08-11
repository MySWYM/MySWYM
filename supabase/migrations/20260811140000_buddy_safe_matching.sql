-- Buddy matching sécurisé : annuaire sans téléphone, mise en relation mutuelle,
-- consentement séparément pour partage du numéro, signalement / blocage.

-- 1) Assouplir la contrainte : profil visible SANS publier le numéro
alter table public.buddy_profiles
  drop constraint if exists buddy_discoverable_requires_whatsapp;

alter table public.buddy_profiles
  add column if not exists phone_verified boolean not null default false;

alter table public.buddy_profiles
  add column if not exists phone_share_ready boolean not null default false;
-- phone_share_ready = l'utilisateur accepte en principe de partager son n°
-- après acceptation mutuelle d'une mise en relation (pas une publication publique).

comment on column public.buddy_profiles.whatsapp_e164 is
  'Numéro privé — jamais exposé dans l''annuaire ; révélé uniquement via RPC après match mutuel + consentement.';
comment on column public.buddy_profiles.phone_share_ready is
  'Consentement de principe à partager le n° après acceptation mutuelle (art. 6.1.a).';

-- 2) RLS : lecture complète du profil buddy = propriétaire uniquement
drop policy if exists "Users read buddy profiles" on public.buddy_profiles;
create policy "Users read own buddy profile full"
  on public.buddy_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

-- 3) Connexions (demandes de mise en relation)
create table if not exists public.buddy_connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled', 'blocked')),
  requester_share_phone boolean not null default false,
  recipient_share_phone boolean not null default false,
  requester_safety_ack_at timestamptz,
  recipient_safety_ack_at timestamptz,
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint buddy_connections_distinct check (requester_id <> recipient_id),
  constraint buddy_connections_pair unique (requester_id, recipient_id)
);

create index if not exists buddy_connections_requester_idx on public.buddy_connections (requester_id, status);
create index if not exists buddy_connections_recipient_idx on public.buddy_connections (recipient_id, status);

alter table public.buddy_connections enable row level security;

drop policy if exists "Users read own buddy connections" on public.buddy_connections;
create policy "Users read own buddy connections"
  on public.buddy_connections for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = recipient_id);

drop policy if exists "Users insert buddy connections as requester" on public.buddy_connections;
create policy "Users insert buddy connections as requester"
  on public.buddy_connections for insert to authenticated
  with check (auth.uid() = requester_id);

drop policy if exists "Users update own buddy connections" on public.buddy_connections;
create policy "Users update own buddy connections"
  on public.buddy_connections for update to authenticated
  using (auth.uid() = requester_id or auth.uid() = recipient_id)
  with check (auth.uid() = requester_id or auth.uid() = recipient_id);

-- 4) Blocs
create table if not exists public.buddy_blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint buddy_blocks_distinct check (blocker_id <> blocked_id)
);

alter table public.buddy_blocks enable row level security;

drop policy if exists "Users manage own blocks" on public.buddy_blocks;
create policy "Users manage own blocks"
  on public.buddy_blocks for all to authenticated
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

drop policy if exists "Users see blocks involving them" on public.buddy_blocks;
create policy "Users see blocks involving them"
  on public.buddy_blocks for select to authenticated
  using (auth.uid() = blocker_id or auth.uid() = blocked_id);

-- 5) Signalements + modération
create table if not exists public.buddy_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reported_id uuid not null references auth.users (id) on delete cascade,
  connection_id uuid references public.buddy_connections (id) on delete set null,
  reason text not null check (char_length(trim(reason)) >= 3),
  details text,
  created_at timestamptz not null default now(),
  constraint buddy_reports_distinct check (reporter_id <> reported_id)
);

create unique index if not exists buddy_reports_one_per_pair_idx
  on public.buddy_reports (reporter_id, reported_id);

alter table public.buddy_reports enable row level security;

drop policy if exists "Users insert own reports" on public.buddy_reports;
create policy "Users insert own reports"
  on public.buddy_reports for insert to authenticated
  with check (auth.uid() = reporter_id);

drop policy if exists "Users read own reports" on public.buddy_reports;
create policy "Users read own reports"
  on public.buddy_reports for select to authenticated
  using (auth.uid() = reporter_id);

create table if not exists public.buddy_moderation (
  user_id uuid primary key references auth.users (id) on delete cascade,
  report_count integer not null default 0,
  buddy_suspended boolean not null default false,
  suspended_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.buddy_moderation enable row level security;

drop policy if exists "Users read own moderation" on public.buddy_moderation;
create policy "Users read own moderation"
  on public.buddy_moderation for select to authenticated
  using (auth.uid() = user_id);

-- Seuil de suspension automatique
create or replace function public.buddy_on_report_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cnt integer;
  threshold integer := 3;
begin
  insert into public.buddy_moderation (user_id, report_count, updated_at)
  values (new.reported_id, 1, now())
  on conflict (user_id) do update
    set report_count = public.buddy_moderation.report_count + 1,
        updated_at = now()
  returning report_count into cnt;

  if cnt >= threshold then
    update public.buddy_moderation
      set buddy_suspended = true,
          suspended_at = coalesce(suspended_at, now()),
          updated_at = now()
      where user_id = new.reported_id;

    update public.buddy_profiles
      set is_discoverable = false,
          updated_at = now()
      where user_id = new.reported_id;

    update public.buddy_connections
      set status = 'blocked',
          updated_at = now()
      where status in ('pending', 'accepted')
        and (requester_id = new.reported_id or recipient_id = new.reported_id);
  end if;

  return new;
end;
$$;

drop trigger if exists buddy_reports_after_insert on public.buddy_reports;
create trigger buddy_reports_after_insert
  after insert on public.buddy_reports
  for each row execute function public.buddy_on_report_insert();

-- 6) Annuaire public (sans téléphone) — security definer
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

-- 7) Révélation des numéros après acceptation mutuelle + double consentement
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

revoke all on function public.get_connection_phones(uuid) from public;
grant execute on function public.get_connection_phones(uuid) to authenticated;

-- 8) Connexions enrichies (sans téléphone) pour l'UI
create or replace function public.get_my_buddy_connections()
returns table (
  id uuid,
  status text,
  requester_id uuid,
  recipient_id uuid,
  requester_share_phone boolean,
  recipient_share_phone boolean,
  requester_safety_ack_at timestamptz,
  recipient_safety_ack_at timestamptz,
  message text,
  created_at timestamptz,
  updated_at timestamptz,
  peer_user_id uuid,
  peer_display_name text,
  peer_city text,
  peer_avatar_url text,
  peer_level text,
  peer_goal_category text
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
    c.id,
    c.status,
    c.requester_id,
    c.recipient_id,
    c.requester_share_phone,
    c.recipient_share_phone,
    c.requester_safety_ack_at,
    c.recipient_safety_ack_at,
    c.message,
    c.created_at,
    c.updated_at,
    case when c.requester_id = uid then c.recipient_id else c.requester_id end as peer_user_id,
    coalesce(p.display_name, 'Nageur') as peer_display_name,
    p.city as peer_city,
    p.avatar_url as peer_avatar_url,
    p.level as peer_level,
    p.goal_category as peer_goal_category
  from public.buddy_connections c
  left join public.buddy_profiles p
    on p.user_id = case when c.requester_id = uid then c.recipient_id else c.requester_id end
  where c.requester_id = uid or c.recipient_id = uid
  order by c.updated_at desc
  limit 40;
end;
$$;

revoke all on function public.get_my_buddy_connections() from public;
grant execute on function public.get_my_buddy_connections() to authenticated;

-- 9) Marquer un numéro comme déclaré propriétaire (préparation vérif SMS)
create or replace function public.confirm_buddy_phone_ownership(p_phone text)
returns public.buddy_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  digits text;
  row public.buddy_profiles;
begin
  if uid is null then
    raise exception 'Non authentifié';
  end if;

  digits := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  if digits ~ '^0[67][0-9]{8}$' then
    digits := '33' || substr(digits, 2);
  elsif digits ~ '^[67][0-9]{8}$' then
    digits := '33' || digits;
  end if;
  if length(digits) < 10 or length(digits) > 15 then
    raise exception 'Numéro invalide';
  end if;

  update public.buddy_profiles
    set whatsapp_e164 = digits,
        phone_share_ready = true,
        updated_at = now()
    where user_id = uid
  returning * into row;

  if not found then
    raise exception 'Profil buddy introuvable';
  end if;

  return row;
end;
$$;

revoke all on function public.confirm_buddy_phone_ownership(text) from public;
grant execute on function public.confirm_buddy_phone_ownership(text) to authenticated;

notify pgrst, 'reload schema';
