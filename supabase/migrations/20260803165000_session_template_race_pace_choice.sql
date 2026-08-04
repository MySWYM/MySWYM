-- Séance gold : WU long IM/pull/kick + race pace choice ×3 (inspirée concurrente),
-- réécrite format Arthur. Total 3000m. Mixte/piscine.

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'gold-race-pace-choice-im',
  'Allure course au choix & IM',
  'VITESSE',
  'Z1-Z4 — préparation qualité, race pace, DPS récup',
  $json$[
    "200m crawl D3'40\" · 4×50m 4 nages progressif D1'10\" · 200m pull D3'40\" · 4×50m 4 nages progressif D1'10\" · 200m jambes D5'00\" — Z1→Z2 — monte sur chaque série IM",
    "4×50m crawl : 25m rapide · 25m facile D1'10\" — Z1/Z3 — contraste net",
    "3×(2×50m au choix allure course D1'10\" · 100m au choix meilleur effort D2'00\" · 100m crawl DPS D2'00\") — Z3/Z4 sur les efforts, Z1 sur le DPS — choice = nage de course (pap/dos/brasse/crawl)",
    "3×(2×50m jambes : 25m rapide · 25m facile D1'20\" · 200m : 100m crawl · 100m dos D3'40\") — Z1 souple sur le 200, contraste sur les jambes"
  ]$json$::jsonb,
  $json${
    "depart": "200m crawl D3'40\" · 4×50m 4 nages progressif D1'10\" · 200m pull D3'40\" · 4×50m 4 nages progressif D1'10\" · 200m jambes D5'00\" — Z1→Z2 — monte sur chaque série IM",
    "technique": [
      "4×50m crawl : 25m rapide · 25m facile D1'10\" — Z1/Z3 — contraste net"
    ],
    "corps": [
      "3×(2×50m au choix allure course D1'10\" · 100m au choix meilleur effort D2'00\" · 100m crawl DPS D2'00\") — Z3/Z4 sur les efforts, Z1 sur le DPS — choice = nage de course (pap/dos/brasse/crawl)"
    ],
    "rac": "3×(2×50m jambes : 25m rapide · 25m facile D1'20\" · 200m : 100m crawl · 100m dos D3'40\") — Z1 souple sur le 200, contraste sur les jambes"
  }$json$::jsonb,
  3000,
  50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['mixte']::text[],
  array['development', 'peak']::text[],
  array['race_pace', '4_nages', 'vitesse', 'dps', 'contraste', 'choice']::text[],
  'vitesse',
  null,
  null,
  'coach_approved',
  'gold',
  true,
  330,
  'Réécriture Arthur. Race pace / best effort au choix + IM en WU. Total 3000m. Mixte/piscine uniquement (IM + choice 4 nages).'
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
