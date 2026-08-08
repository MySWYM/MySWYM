-- Retours par séance (analytics + amélioration moteur).
-- Miroir de session.feedback stocké dans plans_json.

create table if not exists public.session_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id text,
  week_number integer,
  session_index integer,
  session_type text,
  session_title text,
  rating text not null check (rating in ('easy', 'ok', 'hard')),
  tags text[] not null default '{}',
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists session_feedback_user_id_idx on public.session_feedback (user_id);
create index if not exists session_feedback_rating_idx on public.session_feedback (rating);
create index if not exists session_feedback_created_at_idx on public.session_feedback (created_at desc);

alter table public.session_feedback enable row level security;

drop policy if exists "Users insert own session feedback" on public.session_feedback;
create policy "Users insert own session feedback"
  on public.session_feedback
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users read own session feedback" on public.session_feedback;
create policy "Users read own session feedback"
  on public.session_feedback
  for select
  using (auth.uid() = user_id);
