-- Séance gold : qualité 4 nages / descend / best effort (inspirée concurrente),
-- réécrite format Arthur. Total 2000m. Piscine / mixte (pas eau libre pure).

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'gold-qualite-4nages-descend',
  'Qualité 4 nages & dégressif',
  'VITESSE',
  'Z1-Z3/Z4 — touches vitesse, 4 nages, efforts max contrôlés',
  $json$[
    "3×100m crawl D2'00\" — Z1, respiration libre, nage propre",
    "2×(3×50m crawl dégressif D1'10\" · 100m 4 nages soutenu ~80% D2'15\") — Z1/Z2 — chaque 50 plus rapide ; 4 nages fluide sans forcer les transitions",
    "2×(2×50m papillon D1'10\" · 100m dos progressif D2'00\" · 2×50m brasse : 1 facile · 1 rapide D1'20\" · 100m crawl meilleur effort D2'00\") — Z2→Z4 — qualité sur chaque nage, récupère vraiment entre les blocs",
    "2×(2×50m jambes meilleur effort D1'20\" · 100m dos D2'00\") — Z1 sur le dos, Z3/Z4 sur les jambes puis relâche"
  ]$json$::jsonb,
  $json${
    "depart": "3×100m crawl D2'00\" — Z1, respiration libre, nage propre",
    "technique": [
      "2×(3×50m crawl dégressif D1'10\" · 100m 4 nages soutenu ~80% D2'15\") — Z1/Z2 — chaque 50 plus rapide ; 4 nages fluide sans forcer les transitions"
    ],
    "corps": [
      "2×(2×50m papillon D1'10\" · 100m dos progressif D2'00\" · 2×50m brasse : 1 facile · 1 rapide D1'20\" · 100m crawl meilleur effort D2'00\") — Z2→Z4 — qualité sur chaque nage, récupère vraiment entre les blocs"
    ],
    "rac": "2×(2×50m jambes meilleur effort D1'20\" · 100m dos D2'00\") — Z1 sur le dos, Z3/Z4 sur les jambes puis relâche"
  }$json$::jsonb,
  2000,
  50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['mixte']::text[],
  array['development', 'peak']::text[],
  array['4_nages', 'papillon', 'brasse', 'degressif', 'vitesse', 'qualite']::text[],
  'vitesse',
  null,
  null,
  'coach_approved',
  'gold',
  true,
  220,
  'Réécriture Arthur. Structure concurrente WU / pre descend+IM / main 4 nages / CD jambes+dos. Total 2000m. Orientée piscine/mixte — éviter en eau_libre pur (papillon/brasse/IM). Règle MySWYM : pas de bloc IM « Alternée 4 nages » saturé brasse en perf eau libre.'
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
