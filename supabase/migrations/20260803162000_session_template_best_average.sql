-- Séance gold : best average 50s + 200 soutenu ×3 (inspirée concurrente),
-- réécrite format Arthur. Total 2200m.

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'gold-best-average-50-200',
  'Best average 50 & 200 soutenu',
  'SEUIL',
  'Z1-Z3 — qualité 50s réguliers + 200 aérobie soutenu',
  $json$[
    "200m : 100m crawl · 100m dos D4'00\" · 2×50m pull : 25m rapide · 25m facile D1'10\" — Z1/Z3 — contraste net sur les 25",
    "200m : 100m crawl · 100m dos D4'00\" · 2×50m jambes : 25m rapide · 25m facile D1'20\" — Z1/Z3 — même logique contraste",
    "3×(4×50m crawl best average D1'10\" · 200m crawl soutenu ~80% D4'00\") — Z2/Z3 — vise le même chrono sur les 4×50 (pas un sprint puis un mort) ; récupère sur le 200 sans décrocher",
    "4×100m crawl palmes + plaquettes D2'00\" — Z1 souple, nage longue, relâche les épaules"
  ]$json$::jsonb,
  $json${
    "depart": "200m : 100m crawl · 100m dos D4'00\" · 2×50m pull : 25m rapide · 25m facile D1'10\" — Z1/Z3 — contraste net sur les 25",
    "technique": [
      "200m : 100m crawl · 100m dos D4'00\" · 2×50m jambes : 25m rapide · 25m facile D1'20\" — Z1/Z3 — même logique contraste"
    ],
    "corps": [
      "3×(4×50m crawl best average D1'10\" · 200m crawl soutenu ~80% D4'00\") — Z2/Z3 — vise le même chrono sur les 4×50 (pas un sprint puis un mort) ; récupère sur le 200 sans décrocher"
    ],
    "rac": "4×100m crawl palmes + plaquettes D2'00\" — Z1 souple, nage longue, relâche les épaules"
  }$json$::jsonb,
  2200,
  50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['endurance', 'mixte', 'eau_libre']::text[],
  array['development', 'peak']::text[],
  array['best_average', 'seuil', 'palmes', 'plaquettes', 'contraste']::text[],
  'seuil',
  null,
  null,
  'coach_approved',
  'gold',
  true,
  270,
  'Réécriture Arthur. WU/pre contraste pull puis jambes → 3×(4×50 best average + 200 80%) → CD palmes+plaquettes. Total 2200m. Crawl dominant = ok eau_libre.'
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
