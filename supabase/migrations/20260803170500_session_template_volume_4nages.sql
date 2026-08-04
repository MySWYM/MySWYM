-- Séance gold : volume 4 nages / couples de nages (inspirée concurrente),
-- réécrite format Arthur. Total 3400m. Mixte/piscine.

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'gold-volume-4nages-couples',
  'Volume 4 nages & couples',
  'ENDURANCE',
  'Z1-Z2 — fond multi-nages, transitions et couples',
  $json$[
    "300m crawl D6'00\" · 3×100m jambes D2'30\" · 6×50m pull D1'00\" — Z1",
    "2×100m 4 nages D2'00\" · 4×50m 4 nages D1'00\" — Z1/Z2 — transitions propres",
    "4×100m : 50m papillon · 50m dos D2'00\" · 200m crawl D4'00\" · 2×200m : 100m dos · 100m brasse D5'00\" · 200m crawl D4'00\" · 4×100m : 50m brasse · 50m crawl D2'00\" · 200m crawl D4'00\" — Z2 — qualité sur chaque couple de nages",
    "300m : 100m pull · 100m jambes · 100m crawl D7'30\" — Z1 souple"
  ]$json$::jsonb,
  $json${
    "depart": "300m crawl D6'00\" · 3×100m jambes D2'30\" · 6×50m pull D1'00\" — Z1",
    "technique": [
      "2×100m 4 nages D2'00\" · 4×50m 4 nages D1'00\" — Z1/Z2 — transitions propres"
    ],
    "corps": [
      "4×100m : 50m papillon · 50m dos D2'00\" · 200m crawl D4'00\" · 2×200m : 100m dos · 100m brasse D5'00\" · 200m crawl D4'00\" · 4×100m : 50m brasse · 50m crawl D2'00\" · 200m crawl D4'00\" — Z2 — qualité sur chaque couple de nages"
    ],
    "rac": "300m : 100m pull · 100m jambes · 100m crawl D7'30\" — Z1 souple"
  }$json$::jsonb,
  3400,
  50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['mixte']::text[],
  array['base', 'development']::text[],
  array['4_nages', 'volume', 'papillon', 'brasse', 'couples_nages']::text[],
  'endurance',
  null,
  null,
  'coach_approved',
  'gold',
  true,
  360,
  'Réécriture Arthur. Gros volume multi-nages 3400m. Mixte/piscine only — pas eau_libre.'
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
