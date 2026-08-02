-- ── Blog : table articles ─────────────────────────────────────────────────
-- Contenu géré manuellement (dashboard Supabase ou SQL).
-- Lecture publique des articles publiés uniquement (RLS).

create table if not exists public.articles (
  id                uuid primary key default gen_random_uuid(),
  titre             text not null,
  slug              text not null unique,
  extrait           text not null default '',
  contenu           text not null default '',
  categorie         text not null,
  image_url         text,
  date_publication  timestamptz not null default now(),
  published         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint articles_categorie_check check (
    categorie in (
      'Conseils entraînement',
      'Technique & éducatifs',
      'Mental & préparation',
      'Physiologie & performance',
      'Eau libre',
      'Matériel',
      'Récits & Interviews'
    )
  )
);

create index if not exists idx_articles_published_date
  on public.articles (published, date_publication desc);

create index if not exists idx_articles_categorie
  on public.articles (categorie)
  where published = true;

alter table public.articles enable row level security;

drop policy if exists "Lecture publique des articles publiés" on public.articles;
create policy "Lecture publique des articles publiés"
  on public.articles
  for select
  using (published = true);

-- Écritures via service_role / dashboard (pas d'insert/update anon).

-- ── Placeholders de démo (Lorem ipsum — à remplacer manuellement) ─────────
insert into public.articles (titre, slug, extrait, contenu, categorie, image_url, date_publication, published)
values
(
  '[Démo] Lorem ipsum — conseils d''entraînement',
  'demo-conseils-entrainement',
  'PLACEHOLDER — Lorem ipsum dolor sit amet, consectetur adipiscing elit. Article de démo pour tester l''affichage du blog.',
  E'## Placeholder — contenu de démo\n\n**Ceci est un article de démonstration.** Le texte ci-dessous est du Lorem ipsum et doit être remplacé manuellement.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\n## Deuxième section (placeholder)\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\n**Fin du placeholder.** Remplace ce contenu par un vrai article.',
  'Conseils entraînement',
  'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80',
  '2026-07-01T10:00:00Z',
  true
),
(
  '[Démo] Lorem ipsum — technique & éducatifs',
  'demo-technique-educatifs',
  'PLACEHOLDER — Sed ut perspiciatis unde omnis iste natus error sit voluptatem. Article de démo pour tester le filtre et la carte.',
  E'## Placeholder — technique\n\n**Article de démonstration (Lorem ipsum).** À remplacer manuellement.\n\nSed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis.\n\n## Suite du placeholder\n\nNemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
  'Technique & éducatifs',
  'https://images.unsplash.com/photo-1519315901367-f34ff911840e?w=1200&q=80',
  '2026-07-08T10:00:00Z',
  true
),
(
  '[Démo] Lorem ipsum — mental & préparation',
  'demo-mental-preparation',
  'PLACEHOLDER — At vero eos et accusamus et iusto odio dignissimos. Article de démo pour tester la page article complète.',
  E'## Placeholder — mental\n\n**Ceci est un placeholder Lorem ipsum.** Aucun contenu éditorial réel.\n\nAt vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi.\n\n## Dernière section (à remplacer)\n\nTemporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.',
  'Mental & préparation',
  'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&q=80',
  '2026-07-15T10:00:00Z',
  true
)
on conflict (slug) do nothing;
