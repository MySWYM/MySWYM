-- Séance gold : qualité 4 nages / IM build (inspirée concurrente),
-- réécrite format Arthur. Total 2400m. Mixte/piscine uniquement.

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'gold-im-build-qualite',
  '4 nages build & meilleur effort',
  'VITESSE',
  'Z1-Z4 — qualité IM, touches vitesse, volume contrôlé',
  $json$[
    "2×(6×50m crawl D1'00\" · 100m 4 nages D2'00\") — Z1 — 4 nages fluide, transitions propres",
    "2×(2×50m jambes : 25m rapide · 25m facile D1'10\" · 100m pull D1'40\") — Z1/Z3 — contraste net sur les 25 ; pull régulier",
    "2×(100m 4 nages meilleur effort D2'00\" · 100m crawl D2'00\" · 4×50m 4 nages progressif D1'00\") — Z2→Z4 — récupère sur le crawl entre les efforts IM",
    "8×50m crawl D1'00\" — Z1 souple"
  ]$json$::jsonb,
  $json${
    "depart": "2×(6×50m crawl D1'00\" · 100m 4 nages D2'00\") — Z1 — 4 nages fluide, transitions propres",
    "technique": [
      "2×(2×50m jambes : 25m rapide · 25m facile D1'10\" · 100m pull D1'40\") — Z1/Z3 — contraste net sur les 25 ; pull régulier"
    ],
    "corps": [
      "2×(100m 4 nages meilleur effort D2'00\" · 100m crawl D2'00\" · 4×50m 4 nages progressif D1'00\") — Z2→Z4 — récupère sur le crawl entre les efforts IM"
    ],
    "rac": "8×50m crawl D1'00\" — Z1 souple"
  }$json$::jsonb,
  2400,
  50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['mixte']::text[],
  array['development', 'peak']::text[],
  array['4_nages', 'im', 'build', 'vitesse', 'qualite']::text[],
  'vitesse',
  null,
  null,
  'coach_approved',
  'gold',
  true,
  250,
  'Réécriture Arthur. WU 50s+IM → kick contraste + pull → IM max / free / IM build ×2 → 8×50. Total 2400m. Mixte/piscine — pas eau_libre pur.'
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
