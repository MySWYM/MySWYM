-- Rate-limit pings contact landing + bulle support (Telegram / Resend).
-- Écritures : Vercel service_role uniquement.

create table if not exists public.notify_rate_buckets (
  bucket_key text not null,
  window_start timestamptz not null,
  hit_count integer not null default 0,
  primary key (bucket_key, window_start)
);

comment on table public.notify_rate_buckets is
  'Compteurs anti-spam contact landing + messages support in-app.';

create index if not exists notify_rate_buckets_window_idx
  on public.notify_rate_buckets (window_start desc);

alter table public.notify_rate_buckets enable row level security;

create or replace function public.consume_notify_rate(
  p_bucket text,
  p_window_start timestamptz,
  p_limit integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if p_bucket is null or length(p_bucket) < 3 or p_limit is null or p_limit < 1 then
    return false;
  end if;
  insert into public.notify_rate_buckets (bucket_key, window_start, hit_count)
  values (p_bucket, p_window_start, 1)
  on conflict (bucket_key, window_start)
  do update set hit_count = public.notify_rate_buckets.hit_count + 1
  returning hit_count into n;
  return n <= p_limit;
end;
$$;

revoke all on function public.consume_notify_rate(text, timestamptz, integer) from public;
revoke all on function public.consume_notify_rate(text, timestamptz, integer) from anon, authenticated;
grant execute on function public.consume_notify_rate(text, timestamptz, integer) to service_role;

notify pgrst, 'reload schema';
