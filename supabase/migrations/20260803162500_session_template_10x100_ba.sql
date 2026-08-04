-- Séance gold : WU long pull/kick neg-split + 10×100 best average (inspirée concurrente),
-- réécrite format Arthur. Total 3000m.

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'gold-10x100-best-average',
  '10×100 best average',
  'SEUIL',
  'Z1-Z3 — négatif split puis série qualité 100m réguliers',
  $json$[
    "8×50m crawl D1'10\" · 3×100m pull négatif split D2'00\" · 8×50m crawl D1'10\" · 3×100m jambes négatif split D2'00\" — Z1/Z2 — 2e moitié de chaque 100 plus rapide que la 1ère",
    "4×50m crawl dégressif D1'10\" · 100m crawl DPS D2'00\" — Z1→Z2 — allonge sur le 100, moins de cycles",
    "10×100m crawl best average D2'00\" — Z2/Z3 — même chrono du 1er au 10e (pas de démarrage trop vite)",
    "2×(50m jambes progressives D1'30\" · 100m crawl DPS D2'00\") — Z1 souple"
  ]$json$::jsonb,
  $json${
    "depart": "8×50m crawl D1'10\" · 3×100m pull négatif split D2'00\" · 8×50m crawl D1'10\" · 3×100m jambes négatif split D2'00\" — Z1/Z2 — 2e moitié de chaque 100 plus rapide que la 1ère",
    "technique": [
      "4×50m crawl dégressif D1'10\" · 100m crawl DPS D2'00\" — Z1→Z2 — allonge sur le 100, moins de cycles"
    ],
    "corps": [
      "10×100m crawl best average D2'00\" — Z2/Z3 — même chrono du 1er au 10e (pas de démarrage trop vite)"
    ],
    "rac": "2×(50m jambes progressives D1'30\" · 100m crawl DPS D2'00\") — Z1 souple"
  }$json$::jsonb,
  3000,
  50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['endurance', 'mixte', 'eau_libre']::text[],
  array['development', 'peak']::text[],
  array['best_average', 'negatif_split', 'seuil', 'dps', 'endurance_100']::text[],
  'seuil',
  null,
  null,
  'coach_approved',
  'gold',
  true,
  280,
  'Réécriture Arthur. WU long (50s + pull/kick neg-split) → descend+DPS → 10×100 best average → CD. Total 3000m. Crawl = ok eau_libre.'
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
