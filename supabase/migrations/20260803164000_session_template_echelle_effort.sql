-- Séance gold : échelle d'effort 200→50 ×2 (inspirée concurrente),
-- réécrite format Arthur. Total 2200m.

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'gold-echelle-effort-200-50',
  'Échelle d''effort 200→50',
  'VITESSE',
  'Z1-Z4 — montée d''intensité progressive, finition max',
  $json$[
    "2×(150m crawl D2'50\" · 50m jambes progressives D1'10\") — Z1",
    "4×100m crawl dégressif D2'00\" — Z1→Z2 — chaque 100 plus rapide que le précédent",
    "2×(200m crawl ~70% D3'40\" · 150m crawl ~80% D2'50\" · 100m crawl ~90% D2'00\" · 50m crawl meilleur effort D1'10\") — Z2→Z4 — monte l'intensité à chaque distance, garde de la marge pour le 50",
    "8×50m dos + palmes D1'00\" — Z1 souple, corps aligné"
  ]$json$::jsonb,
  $json${
    "depart": "2×(150m crawl D2'50\" · 50m jambes progressives D1'10\") — Z1",
    "technique": [
      "4×100m crawl dégressif D2'00\" — Z1→Z2 — chaque 100 plus rapide que le précédent"
    ],
    "corps": [
      "2×(200m crawl ~70% D3'40\" · 150m crawl ~80% D2'50\" · 100m crawl ~90% D2'00\" · 50m crawl meilleur effort D1'10\") — Z2→Z4 — monte l'intensité à chaque distance, garde de la marge pour le 50"
    ],
    "rac": "8×50m dos + palmes D1'00\" — Z1 souple, corps aligné"
  }$json$::jsonb,
  2200,
  50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['endurance', 'mixte', 'eau_libre']::text[],
  array['development', 'peak']::text[],
  array['echelle', 'vitesse', 'degressif', 'meilleur_effort', 'palmes']::text[],
  'vitesse',
  null,
  null,
  'coach_approved',
  'gold',
  true,
  310,
  'Réécriture Arthur. Échelle d''effort % 70→100 ×2. Crawl dominant = ok eau_libre. Total 2200m.'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  intensity = excluded.intensity,
  details = excluded.details,
  blocks = excluded.blocks,
  base_distance_m = excluded.base_distance_m,
  niveaux = excluded.niveaux,
  objectifs = excluded.objectifs,
  phases = excluded.phases,
  focus_tags = excluded.focus_tags,
  role = excluded.role,
  source = excluded.source,
  quality = excluded.quality,
  notes = excluded.notes,
  updated_at = now();
