-- Séance gold : pyramide volume Free/Pull/Kick (inspirée concurrente),
-- réécrite format Arthur. Total 3300m, bassin 50m, D… Premium.

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'gold-pyramide-600-pull-kick',
  'Pyramide volume & pull',
  'ENDURANCE',
  'Z1-Z2 — fond aérobie, volume long, peu de vitesse',
  $json$[
    "400m : 2×(150m crawl D2'50\" · 50m jambes dos en flèche progressives D1'20\") — Z1 — corps gainé, talons à la surface sur les jambes",
    "3×100m crawl soutenu ~80% D2'00\" — Z2 — allure régulière, respiration 3 temps",
    "600m crawl D10'00\" · 400m pull D7'20\" · 200m jambes D5'00\" · 400m pull D7'20\" · 600m crawl D10'00\" — Z2 — tiens la même allure sur les deux 600 ; pull = pull-buoy, focus rotation et prise d'eau",
    "100m dos D2'00\" · 100m crawl D2'00\" · 100m brasse D2'30\" · 100m crawl D2'00\" — Z1 souple"
  ]$json$::jsonb,
  $json${
    "depart": "400m : 2×(150m crawl D2'50\" · 50m jambes dos en flèche progressives D1'20\") — Z1 — corps gainé, talons à la surface sur les jambes",
    "technique": [
      "3×100m crawl soutenu ~80% D2'00\" — Z2 — allure régulière, respiration 3 temps"
    ],
    "corps": [
      "600m crawl D10'00\" · 400m pull D7'20\" · 200m jambes D5'00\" · 400m pull D7'20\" · 600m crawl D10'00\" — Z2 — tiens la même allure sur les deux 600 ; pull = pull-buoy, focus rotation et prise d'eau"
    ],
    "rac": "100m dos D2'00\" · 100m crawl D2'00\" · 100m brasse D2'30\" · 100m crawl D2'00\" — Z1 souple"
  }$json$::jsonb,
  3300,
  50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['endurance', 'mixte']::text[],
  array['base', 'development']::text[],
  array['volume', 'pull', 'jambes', 'pyramide', 'endurance_longue']::text[],
  'endurance',
  null,
  null,
  'coach_approved',
  'gold',
  true,
  210,
  'Réécriture Arthur d''une structure concurrente (WU / pre / pyramide 600-400-200-400-600 / CD 4 nages léger). Total 3300m. Peu adapté Découverte (volume + brasse en RAC ok confirmé/sportif).'
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
