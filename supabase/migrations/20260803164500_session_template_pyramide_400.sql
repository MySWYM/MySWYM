-- Séance gold : grosse pyramide symétrique 400↔pull (inspirée concurrente),
-- réécrite format Arthur. Total 3600m.

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'gold-pyramide-400-symetrique',
  'Pyramide 400 symétrique',
  'ENDURANCE',
  'Z1-Z2 — gros volume fond, structure en miroir',
  $json$[
    "2×(300m crawl D6'00\" · 2×50m au choix progressif D1'00\") — Z1 — choice = crawl/dos/brasse selon sensation",
    "4×100m 4 nages dégressif D2'00\" — Z1→Z2 — chaque 100 plus rapide, transitions propres",
    "400m crawl D6'00\" · 300m pull D4'30\" · 200m crawl D3'00\" · 2×100m jambes D2'00\" · 200m crawl D3'00\" · 300m pull D4'30\" · 400m crawl D6'00\" — Z2 — miroir parfait, même allure sur les deux 400 et les deux 300",
    "2×200m : 100m crawl · 100m dos D4'00\" — Z1 souple"
  ]$json$::jsonb,
  $json${
    "depart": "2×(300m crawl D6'00\" · 2×50m au choix progressif D1'00\") — Z1 — choice = crawl/dos/brasse selon sensation",
    "technique": [
      "4×100m 4 nages dégressif D2'00\" — Z1→Z2 — chaque 100 plus rapide, transitions propres"
    ],
    "corps": [
      "400m crawl D6'00\" · 300m pull D4'30\" · 200m crawl D3'00\" · 2×100m jambes D2'00\" · 200m crawl D3'00\" · 300m pull D4'30\" · 400m crawl D6'00\" — Z2 — miroir parfait, même allure sur les deux 400 et les deux 300"
    ],
    "rac": "2×200m : 100m crawl · 100m dos D4'00\" — Z1 souple"
  }$json$::jsonb,
  3600,
  50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['endurance', 'mixte']::text[],
  array['base', 'development']::text[],
  array['pyramide', 'volume', 'pull', 'symetrie', '4_nages', 'endurance_longue']::text[],
  'endurance',
  null,
  null,
  'coach_approved',
  'gold',
  true,
  320,
  'Réécriture Arthur. Gros volume 3600m. IM en pre-set → objectifs endurance/mixte (pas eau_libre pur). Confirmé/sportif.'
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
