-- Séance gold : volume 150m pull→mix→free + drill 3 points palmes (inspirée concurrente),
-- réécrite format Arthur. Total 3000m.

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'gold-volume-150-pull-mix-free',
  'Volume 150m pull → nage',
  'ENDURANCE',
  'Z1-Z2 — fond aérobie, DPS puis volume 150',
  $json$[
    "2×(2×100m crawl D2'00\" · 2×50m dos D1'10\") — Z1, alterne crawl/dos",
    "2×(2×50m éducatif 3 points + palmes D1'20\" · 100m crawl DPS D2'00\") — Z1 — pauses nettes (extension · catch · hanche) ; sur le 100, allonge, moins de cycles",
    "4×150m pull D3'00\" · 4×150m : 2 nage / 2 pull D3'00\" · 4×150m crawl D3'00\" — Z2 — même allure sur les 12×150, transition progressive pull → nage complète",
    "200m : 100m dos · 100m crawl — Z1 souple"
  ]$json$::jsonb,
  $json${
    "depart": "2×(2×100m crawl D2'00\" · 2×50m dos D1'10\") — Z1, alterne crawl/dos",
    "technique": [
      "2×(2×50m éducatif 3 points + palmes D1'20\" · 100m crawl DPS D2'00\") — Z1 — pauses nettes (extension · catch · hanche) ; sur le 100, allonge, moins de cycles"
    ],
    "corps": [
      "4×150m pull D3'00\" · 4×150m : 2 nage / 2 pull D3'00\" · 4×150m crawl D3'00\" — Z2 — même allure sur les 12×150, transition progressive pull → nage complète"
    ],
    "rac": "200m : 100m dos · 100m crawl — Z1 souple"
  }$json$::jsonb,
  3000,
  50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['endurance', 'mixte', 'eau_libre']::text[],
  array['base', 'development']::text[],
  array['volume_150', 'pull', 'dps', 'palmes', 'endurance']::text[],
  'endurance',
  null,
  null,
  'coach_approved',
  'gold',
  true,
  240,
  'Réécriture Arthur. WU crawl/dos → 3-point drill palmes + DPS → 12×150 pull/mix/free → CD 200. Total 3000m. Crawl/dos/pull = ok eau_libre.'
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
