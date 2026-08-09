-- Arthur AI Phase F3 — Optimization Loop
-- Améliorer DM → Premium via analyse / qualité / knowledge / CTA.
-- Pas d’activation des envois automatiques.

-- ── Knowledge coaching ────────────────────────────────────────
create table if not exists public.ai_knowledge_snippets (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  title text not null,
  content text not null,
  tags text[] not null default '{}',
  intent_hints text[] not null default '{}',
  priority integer not null default 50,
  active boolean not null default true,
  source text not null default 'seed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ai_knowledge_snippets is
  'Bibliothèque coaching Arthur (F3). Snippets courts injectables / scorables — pas le moteur de plan.';

create index if not exists ai_knowledge_topic_idx
  on public.ai_knowledge_snippets (topic)
  where active = true;

create index if not exists ai_knowledge_priority_idx
  on public.ai_knowledge_snippets (priority desc)
  where active = true;

alter table public.ai_knowledge_snippets enable row level security;
-- service_role only

-- ── Qualité des réponses ──────────────────────────────────────
create table if not exists public.ai_response_scores (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.ai_conversations (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  channel text,
  intent text,
  suggested_action text,
  message_length integer not null default 0,
  quality_score integer not null
    check (quality_score >= 0 and quality_score <= 100),
  quality_band text not null
    check (quality_band in ('weak', 'ok', 'strong')),
  reasons jsonb not null default '[]'::jsonb,
  cta_detected boolean not null default false,
  cta_type text,
  knowledge_topic_hit text,
  created_at timestamptz not null default now()
);

comment on table public.ai_response_scores is
  'Scores qualité des réponses Arthur (règles déterministes F3).';

create index if not exists ai_response_scores_created_idx
  on public.ai_response_scores (created_at desc);

create index if not exists ai_response_scores_band_idx
  on public.ai_response_scores (quality_band);

create index if not exists ai_response_scores_conversation_idx
  on public.ai_response_scores (conversation_id)
  where conversation_id is not null;

alter table public.ai_response_scores enable row level security;

-- ── Insights conversationnels ─────────────────────────────────
create table if not exists public.ai_conversation_insights (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  external_user_id text,
  user_id uuid references auth.users (id) on delete set null,
  channel text,
  message_count integer not null default 0,
  user_message_count integer not null default 0,
  assistant_message_count integer not null default 0,
  drop_risk text not null default 'unknown'
    check (drop_risk in ('low', 'medium', 'high', 'unknown')),
  avg_quality numeric,
  cta_count integer not null default 0,
  intents jsonb not null default '[]'::jsonb,
  findings jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  analyzed_at timestamptz not null default now(),
  unique (conversation_id)
);

comment on table public.ai_conversation_insights is
  'Analyse conversationnelle agrégée (drop-risk, CTA, reco optimisation).';

create index if not exists ai_conversation_insights_drop_idx
  on public.ai_conversation_insights (drop_risk);

create index if not exists ai_conversation_insights_analyzed_idx
  on public.ai_conversation_insights (analyzed_at desc);

alter table public.ai_conversation_insights enable row level security;

-- ── CTA Instagram / acquisition ───────────────────────────────
create table if not exists public.ai_cta_events (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.ai_conversations (id) on delete set null,
  lead_id uuid references public.ai_leads (id) on delete set null,
  external_user_id text,
  user_id uuid references auth.users (id) on delete set null,
  channel text not null default 'instagram',
  event_kind text not null
    check (event_kind in ('sent', 'clicked', 'attributed_signup', 'attributed_premium')),
  cta_type text not null,
  destination_path text,
  reel_id text,
  campaign text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.ai_cta_events is
  'Tracking CTA Arthur (surtout Instagram). clicked = optionnel via ?ref=arthur.';

create index if not exists ai_cta_events_kind_idx
  on public.ai_cta_events (event_kind, created_at desc);

create index if not exists ai_cta_events_type_idx
  on public.ai_cta_events (cta_type);

create index if not exists ai_cta_events_external_idx
  on public.ai_cta_events (external_user_id)
  where external_user_id is not null;

alter table public.ai_cta_events enable row level security;

-- ── Events optimisation ───────────────────────────────────────
alter table public.ai_events
  drop constraint if exists ai_events_event_type_check;

alter table public.ai_events
  add constraint ai_events_event_type_check
  check (event_type in (
    'dm_received',
    'ai_response',
    'lead_qualified',
    'myswym_link_sent',
    'signup',
    'plan_created',
    'checkout_started',
    'subscription_started',
    'plan_requested',
    'plan_creation_blocked',
    'profile_updated',
    'instagram_webhook_received',
    'instagram_message_sent',
    'instagram_message_failed',
    'identity_link_verified',
    'followup_planned',
    'followup_suppressed',
    'followup_approved',
    'followup_sent',
    'followup_failed',
    'followup_replied',
    'followup_converted',
    'response_scored',
    'conversation_analyzed',
    'cta_sent',
    'cta_clicked',
    'knowledge_served'
  ));

-- Seeds knowledge (idempotent via topic+title)
insert into public.ai_knowledge_snippets (topic, title, content, tags, intent_hints, priority, source)
select * from (values
  (
    'technique_crawl',
    'Respiration bilatérale',
    'En crawl, commence par respirer 1 côté toutes les 3-5 coulées. Garde une oreille dans l’eau et évite de lever la tête : ça casse l’alignement.',
    array['crawl','respiration','technique'],
    array['technique','swimming_question'],
    80,
    'seed'
  ),
  (
    'technique_crawl',
    'Position de tête',
    'Regard vers le fond (légèrement devant), nuque relâchée. Si tu regardes trop devant, les hanches coulent et tu fatigues plus vite.',
    array['crawl','alignement'],
    array['technique','swimming_question'],
    75,
    'seed'
  ),
  (
    'endurance',
    'Progression volume',
    'Augmente le volume d’environ 10% par semaine max. Garde 1 séance plus facile après une séance dure. La régularité bat les grosses semaines isolées.',
    array['endurance','volume'],
    array['training','goal'],
    80,
    'seed'
  ),
  (
    'triathlon',
    'Natation triathlon début',
    'Pour un premier triathlon, vise d’abord nager la distance confortablement (pas le chrono). Travaille sortie d’eau + transition mentale ; le drafting en eau libre vient après.',
    array['triathlon','open_water'],
    array['goal','plan_request','training'],
    85,
    'seed'
  ),
  (
    'open_water',
    'Repérage eau libre',
    'En eau libre : lève la tête 1-2 fois toutes les 8-12 coulées pour viser une balise. Entraîne-toi en bassin en gardant un cap sur un objet au bout du couloir.',
    array['open_water','orientation'],
    array['goal','technique','training'],
    80,
    'seed'
  ),
  (
    'frequence',
    'Fréquence débutant',
    'Débutant : 2 séances/semaine suffisent pour progresser. Mieux vaut 30-40 min régulières que 1h30 une fois. Ajoute une 3e séance quand tu sors moins fatigué.',
    array['frequence','debutant'],
    array['training','goal','myswym_question'],
    70,
    'seed'
  ),
  (
    'myswym_value',
    'Quand proposer MySWYM',
    'Propose MySWYM quand il y a un objectif daté, un besoin de plan suivi, ou une progression bloquée — après avoir donné un conseil utile. Lien type : /inscription?ref=arthur_ig',
    array['conversion','cta'],
    array['plan_request','subscription','myswym_question'],
    90,
    'seed'
  ),
  (
    'recuperation',
    'Signaux de fatigue',
    'Si les sensations baissent 2 séances de suite, réduis le volume de 20-30% une semaine. Douleur vive / inhabituelle : pause et avis pro de santé — on ne diagnostique pas ici.',
    array['recuperation','sante'],
    array['training','support','swimming_question'],
    75,
    'seed'
  )
) as v(topic, title, content, tags, intent_hints, priority, source)
where not exists (
  select 1 from public.ai_knowledge_snippets k
  where k.topic = v.topic and k.title = v.title
);

notify pgrst, 'reload schema';
