-- Index admin nageurs : email + prénom, sans scanner Auth à chaque recherche.
-- Service role uniquement (RLS sans policy user).

create table if not exists public.admin_user_directory (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  firstname text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_user_directory_email_lower_idx
  on public.admin_user_directory (lower(email));
create index if not exists admin_user_directory_firstname_lower_idx
  on public.admin_user_directory (lower(firstname));

alter table public.admin_user_directory enable row level security;

create or replace function public.sync_admin_user_directory()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fname text;
begin
  fname := nullif(
    trim(both from coalesce(new.raw_user_meta_data->>'firstname', new.raw_user_meta_data->>'first_name', '')),
    ''
  );
  insert into public.admin_user_directory (user_id, email, firstname, created_at, updated_at)
  values (new.id, new.email, fname, coalesce(new.created_at, now()), now())
  on conflict (user_id) do update set
    email = excluded.email,
    firstname = excluded.firstname,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_admin_directory on auth.users;
create trigger on_auth_user_admin_directory
after insert or update on auth.users
for each row execute procedure public.sync_admin_user_directory();

insert into public.admin_user_directory (user_id, email, firstname, created_at, updated_at)
select
  u.id,
  u.email,
  nullif(trim(both from coalesce(u.raw_user_meta_data->>'firstname', u.raw_user_meta_data->>'first_name', '')), ''),
  u.created_at,
  now()
from auth.users u
on conflict (user_id) do update set
  email = excluded.email,
  firstname = excluded.firstname,
  updated_at = now();
