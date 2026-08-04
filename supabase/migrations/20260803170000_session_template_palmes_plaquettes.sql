-- Séance gold : 200/pull/kick + 50s palmes+plaquettes ×2 (inspirée concurrente),
-- réécrite format Arthur. Total 2600m.

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'gold-200-pull-palmes-plaquettes',
  '200 / pull / palmes+plaquettes',
  'ENDURANCE',
  'Z1-Z2 — fond + finition matériel (palmes & plaquettes)',
  $json$[
    "3×100m : 50m crawl · 50m jambes D2'15\" — Z1",
    "2×(50m jambes progressives D1'20\" · 100m crawl soutenu ~80% D2'00\") — Z1/Z2",
    "2×(200m crawl D3'30\" · 2×150m pull D2'30\" · 100m jambes D2'15\" · 6×50m crawl palmes + plaquettes D0'50\") — Z2 — sur les 50 matériel, nage longue et rythmée",
    "200m : 100m dos · 100m crawl — Z1 souple"
  ]$json$::jsonb,
  $json${
    "depart": "3×100m : 50m crawl · 50m jambes D2'15\" — Z1",
    "technique": [
      "2×(50m jambes progressives D1'20\" · 100m crawl soutenu ~80% D2'00\") — Z1/Z2"
    ],
    "corps": [
      "2×(200m crawl D3'30\" · 2×150m pull D2'30\" · 100m jambes D2'15\" · 6×50m crawl palmes + plaquettes D0'50\") — Z2 — sur les 50 matériel, nage longue et rythmée"
    ],
    "rac": "200m : 100m dos · 100m crawl — Z1 souple"
  }$json$::jsonb,
  2600,
  50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['endurance', 'mixte', 'eau_libre']::text[],
  array['base', 'development']::text[],
  array['pull', 'palmes', 'plaquettes', 'jambes', 'endurance']::text[],
  'endurance',
  null,
  null,
  'coach_approved',
  'gold',
  true,
  350,
  'Réécriture Arthur. Fins & Paddles en fin de bloc main. Total 2600m. Crawl dominant = ok eau_libre.'
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
