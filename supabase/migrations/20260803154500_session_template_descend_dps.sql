-- Séance gold : structure Warm/Pre/Main/Cool (inspirée concurrente),
-- réécrite format Arthur (départ → technique → corps → RAC).
-- Réf. volume : bassin 50m, départs D… (Premium).

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'gold-descend-dps-200-100',
  'Dégressif & DPS dos',
  'ENDURANCE',
  'Z1-Z2/Z3 — construction, allure tenue + touches qualité',
  $json$[
    "400m : 2×(200m crawl D3'40\" · 50m jambes progressives D1'20\") — Z1, monte progressivement sur les jambes",
    "2×(3×50m crawl dégressif D1'10\" · 100m dos DPS D2'00\") — Z1/Z2 — chaque 50 plus rapide que le précédent ; sur le dos, allonge le bras, moins de cycles",
    "2×(200m crawl soutenu ~80% D3'40\" · 3×100m crawl dégressif D2'00\") — Z2/Z3 — tiens l'allure sur le 200, puis descends les 100",
    "2×150m : 50m dos · 50m crawl · 50m dos D3'00\" — Z1 souple"
  ]$json$::jsonb,
  $json${
    "depart": "400m : 2×(200m crawl D3'40\" · 50m jambes progressives D1'20\") — Z1, monte progressivement sur les jambes",
    "technique": [
      "2×(3×50m crawl dégressif D1'10\" · 100m dos DPS D2'00\") — Z1/Z2 — chaque 50 plus rapide que le précédent ; sur le dos, allonge le bras, moins de cycles"
    ],
    "corps": [
      "2×(200m crawl soutenu ~80% D3'40\" · 3×100m crawl dégressif D2'00\") — Z2/Z3 — tiens l'allure sur le 200, puis descends les 100"
    ],
    "rac": "2×150m : 50m dos · 50m crawl · 50m dos D3'00\" — Z1 souple"
  }$json$::jsonb,
  2300,
  50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['endurance', 'mixte', 'eau_libre']::text[],
  array['base', 'development']::text[],
  array['degressif', 'dps', 'dos', 'construction']::text[],
  'endurance',
  null,
  null,
  'coach_approved',
  'gold',
  true,
  200,
  'Réécriture Arthur d''une structure concurrente (WU / pre-set / main / CD). Intervalles D… conservés comme repères Premium. Total 2300m.'
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
