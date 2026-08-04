-- Séance gold : symétrie kick/free/pull (inspirée concurrente),
-- réécrite format Arthur. Total 3000m.

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'gold-symetrie-kick-pull-100',
  'Symétrie jambes / pull / 100',
  'ENDURANCE',
  'Z1-Z2 — fond aérobie, structure en miroir',
  $json$[
    "6×50m crawl D1'10\" · 2×100m pull D2'00\" — Z1",
    "6×50m dos D1'10\" · 2×100m pull D2'00\" — Z1 — même rythme que l'échauffement, focus position dos",
    "100m jambes D2'30\" · 2×100m crawl D2'00\" · 300m pull D5'30\" · 4×100m crawl D2'00\" · 300m pull D5'30\" · 2×100m crawl D2'00\" · 100m jambes D2'30\" — Z2 — structure en miroir, allure régulière sur les 100",
    "50m dos D1'10\" · 150m crawl D3'00\" · 50m brasse D1'20\" · 150m crawl D3'00\" — Z1 souple"
  ]$json$::jsonb,
  $json${
    "depart": "6×50m crawl D1'10\" · 2×100m pull D2'00\" — Z1",
    "technique": [
      "6×50m dos D1'10\" · 2×100m pull D2'00\" — Z1 — même rythme que l'échauffement, focus position dos"
    ],
    "corps": [
      "100m jambes D2'30\" · 2×100m crawl D2'00\" · 300m pull D5'30\" · 4×100m crawl D2'00\" · 300m pull D5'30\" · 2×100m crawl D2'00\" · 100m jambes D2'30\" — Z2 — structure en miroir, allure régulière sur les 100"
    ],
    "rac": "50m dos D1'10\" · 150m crawl D3'00\" · 50m brasse D1'20\" · 150m crawl D3'00\" — Z1 souple"
  }$json$::jsonb,
  3000,
  50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['endurance', 'mixte', 'eau_libre']::text[],
  array['base', 'development']::text[],
  array['pull', 'jambes', 'symetrie', 'endurance_100', 'volume']::text[],
  'endurance',
  null,
  null,
  'coach_approved',
  'gold',
  true,
  260,
  'Réécriture Arthur. WU crawl+pull → pre dos+pull → main miroir kick/free/pull → CD mixte léger. Total 3000m. Brasse uniquement en RAC.'
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
