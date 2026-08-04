-- Séance gold : échelle 300-200-100 ×2 + miroir WU/CD (inspirée concurrente),
-- réécrite format Arthur. Total 2700m.

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'gold-echelle-300-200-100',
  'Échelle 300-200-100',
  'ENDURANCE',
  'Z1-Z2/Z4 — fond + finition meilleure effort',
  $json$[
    "2×150m crawl D2'50\" · 2×100m pull D2'00\" · 2×50m jambes D1'20\" — Z1 — pull-buoy, jambes régulières",
    "3×100m crawl dégressif D2'00\" — Z1→Z2 — chaque 100 plus rapide que le précédent",
    "2×(300m crawl D5'30\" · 200m crawl D3'40\" · 100m crawl meilleur effort D2'00\") — Z2 sur 300/200, Z4 sur le 100 — garde de la marge pour finir fort",
    "2×50m jambes D1'20\" · 2×100m pull D2'00\" · 2×150m crawl D2'50\" — Z1 souple (miroir de l'échauffement)"
  ]$json$::jsonb,
  $json${
    "depart": "2×150m crawl D2'50\" · 2×100m pull D2'00\" · 2×50m jambes D1'20\" — Z1 — pull-buoy, jambes régulières",
    "technique": [
      "3×100m crawl dégressif D2'00\" — Z1→Z2 — chaque 100 plus rapide que le précédent"
    ],
    "corps": [
      "2×(300m crawl D5'30\" · 200m crawl D3'40\" · 100m crawl meilleur effort D2'00\") — Z2 sur 300/200, Z4 sur le 100 — garde de la marge pour finir fort"
    ],
    "rac": "2×50m jambes D1'20\" · 2×100m pull D2'00\" · 2×150m crawl D2'50\" — Z1 souple (miroir de l'échauffement)"
  }$json$::jsonb,
  2700,
  50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['endurance', 'mixte', 'eau_libre']::text[],
  array['base', 'development']::text[],
  array['echelle', 'degressif', 'pull', 'meilleur_effort', 'endurance']::text[],
  'endurance',
  null,
  null,
  'coach_approved',
  'gold',
  true,
  230,
  'Réécriture Arthur. WU free/pull/kick → descend 100 → échelle 300-200-100 ×2 → CD miroir. Total 2700m. Crawl dominant = ok eau_libre.'
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
