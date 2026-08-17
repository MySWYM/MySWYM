-- Avis landing : dépôt public en pending, lecture publique des published uniquement.
-- Modération : Table Editor Supabase (status = published | rejected).

create table if not exists public.landing_reviews (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  body text not null,
  contact_email text,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists landing_reviews_published_idx
  on public.landing_reviews (created_at desc)
  where status = 'published';

alter table public.landing_reviews enable row level security;

drop policy if exists "landing_reviews_public_read_published" on public.landing_reviews;
create policy "landing_reviews_public_read_published"
  on public.landing_reviews
  for select
  to anon, authenticated
  using (status = 'published');

-- Inserts via API service_role (contourne RLS). Pas d’insert anon.
