-- Séance gold : IM build court + 200/pull/kick ×2 + godilles (inspirée concurrente),
-- réécrite format Arthur. Total 2200m. Vocab : Catch Scull → godilles.

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'gold-200-pull-kick-godilles',
  '200 soutenu / pull / jambes',
  'ENDURANCE',
  'Z1-Z2 — fond + touches progressives, godilles en RAC',
  $json$[
    "2×(200m crawl D3'40\" · 100m dos D2'00\") — Z1",
    "4×50m 4 nages progressif D1'10\" — Z1→Z2 — monte sur la série, transitions propres",
    "2×(200m crawl soutenu ~80% D3'40\" · 2×100m pull ~80% D2'00\" · 2×50m jambes progressives D1'20\") — Z2 — allure tenue sur crawl et pull",
    "2×(50m godilles catch D2'00\" · 150m crawl D3'00\") — Z1 — godilles avant-bras, sensation de prise d'eau, puis nage souple"
  ]$json$::jsonb,
  $json${
    "depart": "2×(200m crawl D3'40\" · 100m dos D2'00\") — Z1",
    "technique": [
      "4×50m 4 nages progressif D1'10\" — Z1→Z2 — monte sur la série, transitions propres"
    ],
    "corps": [
      "2×(200m crawl soutenu ~80% D3'40\" · 2×100m pull ~80% D2'00\" · 2×50m jambes progressives D1'20\") — Z2 — allure tenue sur crawl et pull"
    ],
    "rac": "2×(50m godilles catch D2'00\" · 150m crawl D3'00\") — Z1 — godilles avant-bras, sensation de prise d'eau, puis nage souple"
  }$json$::jsonb,
  2200,
  50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['endurance', 'mixte']::text[],
  array['base', 'development']::text[],
  array['pull', 'jambes', 'godilles', '4_nages', 'endurance']::text[],
  'endurance',
  null,
  null,
  'coach_approved',
  'gold',
  true,
  300,
  'Réécriture Arthur. Catch Scull → godilles (vocab MySWYM). IM build court en technique. Objectifs endurance/mixte (IM léger — pas eau_libre pur). Total 2200m.'
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
