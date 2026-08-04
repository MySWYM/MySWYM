-- Séances Arthur coaché — eau libre, semaines 6–7
-- (S6 construction volume 5900m / S7 décharge 4200m).

-- ── S6.1 ──────────────────────────────────────────────────────────────────
insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'arthur-ow-s6-1-continu-800',
  'Continu 800 & hypoxie — S6.1',
  'ENDURANCE',
  'Z1-Z2 — construction volume, continu aérobie',
  $json$[
    "300m crawl palmes — Z1",
    "8×25m aucune respiration R20\"",
    "4×50m respiration 3 temps avec accélération dernier 15m R20\"",
    "800m continu (sans pause) — Z2 @13:28-14:35",
    "200m jambes relâché — RAC"
  ]$json$::jsonb,
  $json${
    "depart": "300m crawl palmes — Z1",
    "technique": [
      "8×25m aucune respiration R20\"",
      "4×50m respiration 3 temps avec accélération dernier 15m R20\""
    ],
    "corps": [
      "800m continu (sans pause) — Z2 @13:28-14:35"
    ],
    "rac": "200m jambes relâché — RAC"
  }$json$::jsonb,
  1700, 50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['eau_libre']::text[],
  array['development']::text[],
  array['continu', 'hypoxie', 'palmes', 'volume', 'eau_libre']::text[],
  'endurance', 'S6.1', null,
  'coach_approved', 'gold', true, 500,
  'Arthur coaché eau libre — S6 construction volume (semaine 5900m).'
)
on conflict (slug) do update set
  title = excluded.title, type = excluded.type, intensity = excluded.intensity,
  details = excluded.details, blocks = excluded.blocks, base_distance_m = excluded.base_distance_m,
  niveaux = excluded.niveaux, objectifs = excluded.objectifs, phases = excluded.phases,
  focus_tags = excluded.focus_tags, role = excluded.role, week_slot = excluded.week_slot,
  source = excluded.source, quality = excluded.quality, notes = excluded.notes, updated_at = now();

-- ── S6.2 ──────────────────────────────────────────────────────────────────
insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'arthur-ow-s6-2-6x200-z3',
  '6×200 Z3 & DPS — S6.2',
  'SEUIL',
  'Z1-Z3 — efficacité de traction puis série 200 seuil',
  $json$[
    "300m dos/crawl par 50m — Z1",
    "8×50m le moins de mouvements possible / 25m — focus position, efficacité de traction R20\"",
    "6×200m D4'15\" — Z3 @3:09-3:20",
    "200m au choix — RAC"
  ]$json$::jsonb,
  $json${
    "depart": "300m dos/crawl par 50m — Z1",
    "technique": [
      "8×50m le moins de mouvements possible / 25m — focus position, efficacité de traction R20\""
    ],
    "corps": [
      "6×200m D4'15\" — Z3 @3:09-3:20"
    ],
    "rac": "200m au choix — RAC"
  }$json$::jsonb,
  2100, 50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['eau_libre']::text[],
  array['development']::text[],
  array['seuil', 'dps', 'endurance_200', 'eau_libre']::text[],
  'seuil', 'S6.2', null,
  'coach_approved', 'gold', true, 510,
  'Arthur coaché eau libre S6.2 — construction volume.'
)
on conflict (slug) do update set
  title = excluded.title, type = excluded.type, intensity = excluded.intensity,
  details = excluded.details, blocks = excluded.blocks, base_distance_m = excluded.base_distance_m,
  niveaux = excluded.niveaux, objectifs = excluded.objectifs, phases = excluded.phases,
  focus_tags = excluded.focus_tags, role = excluded.role, week_slot = excluded.week_slot,
  source = excluded.source, quality = excluded.quality, notes = excluded.notes, updated_at = now();

-- ── S6.3 ──────────────────────────────────────────────────────────────────
insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'arthur-ow-s6-3-150-z3-7t',
  '8×150 Z3 + 7T — S6.3',
  'ENDURANCE',
  'Z1-Z3 — éducatifs + 150 composés Z3/Z2',
  $json$[
    "4×50m 4 nages (200m enchaîné) palmes — 1 nage par 12,5m — Z1",
    "8×25m tapé derrière + main frôlé R15\"",
    "4×50m respiration 7 temps — virages compris",
    "8×150m R15\" : 100m Z3 @1:30-1:40 · 50m respiration 7T Z2 @50\"-55\"",
    "200m le plus lent possible — recherche de sensation — RAC"
  ]$json$::jsonb,
  $json${
    "depart": "4×50m 4 nages (200m enchaîné) palmes — 1 nage par 12,5m — Z1",
    "technique": [
      "8×25m tapé derrière + main frôlé R15\"",
      "4×50m respiration 7 temps — virages compris"
    ],
    "corps": [
      "8×150m R15\" : 100m Z3 @1:30-1:40 · 50m respiration 7T Z2 @50\"-55\""
    ],
    "rac": "200m le plus lent possible — recherche de sensation — RAC"
  }$json$::jsonb,
  2000, 50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['eau_libre']::text[],
  array['development']::text[],
  array['hypoxie', 'reps_150', '4_nages', 'palmes', 'eau_libre']::text[],
  'endurance', 'S6.3', null,
  'coach_approved', 'gold', true, 520,
  'Arthur coaché eau libre S6.3. Label coach 2100m — somme détails 2000m (à vérifier). Semaine 6 total label 5900m.'
)
on conflict (slug) do update set
  title = excluded.title, type = excluded.type, intensity = excluded.intensity,
  details = excluded.details, blocks = excluded.blocks, base_distance_m = excluded.base_distance_m,
  niveaux = excluded.niveaux, objectifs = excluded.objectifs, phases = excluded.phases,
  focus_tags = excluded.focus_tags, role = excluded.role, week_slot = excluded.week_slot,
  source = excluded.source, quality = excluded.quality, notes = excluded.notes, updated_at = now();

-- ── S7.1 (décharge) ───────────────────────────────────────────────────────
insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'arthur-ow-s7-1-decharge-vo2',
  'Décharge + touches VO2 — S7.1',
  'VITESSE',
  'Z1-Z4 — semaine décharge, volume bas, touches vitesse',
  $json$[
    "200m crawl palmes — Z1",
    "4×150m — respiration 3T/5T/7T/7T/5T/3T par 25m",
    "6×25m R15\" : 15m Z4 VO2/vitesse + 10m relâché",
    "4×100m D2' — Z2 @1:41-1:49",
    "2×25m apnée à la surface en crawl",
    "200m recherche de sensation — expiration contrôlée"
  ]$json$::jsonb,
  $json${
    "depart": "200m crawl palmes — Z1",
    "technique": [
      "4×150m — respiration 3T/5T/7T/7T/5T/3T par 25m"
    ],
    "corps": [
      "6×25m R15\" : 15m Z4 VO2/vitesse + 10m relâché",
      "4×100m D2' — Z2 @1:41-1:49",
      "2×25m apnée à la surface en crawl"
    ],
    "rac": "200m recherche de sensation — expiration contrôlée"
  }$json$::jsonb,
  1600, 50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['eau_libre']::text[],
  array['taper']::text[],
  array['decharge', 'vo2', 'hypoxie', 'apnee', 'eau_libre']::text[],
  'vitesse', 'S7.1', null,
  'coach_approved', 'gold', true, 530,
  'Arthur coaché eau libre S7.1 — fin de bloc volume = décharge (semaine 4200m).'
)
on conflict (slug) do update set
  title = excluded.title, type = excluded.type, intensity = excluded.intensity,
  details = excluded.details, blocks = excluded.blocks, base_distance_m = excluded.base_distance_m,
  niveaux = excluded.niveaux, objectifs = excluded.objectifs, phases = excluded.phases,
  focus_tags = excluded.focus_tags, role = excluded.role, week_slot = excluded.week_slot,
  source = excluded.source, quality = excluded.quality, notes = excluded.notes, updated_at = now();

-- ── S7.2 ──────────────────────────────────────────────────────────────────
insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'arthur-ow-s7-2-roulis-kayak',
  'Roulis / kayak décharge — S7.2',
  'TECHNIQUE',
  'Z1-Z2 — décharge technique, roulis et amplitude',
  $json$[
    "2×100m 4 nages — 25m nage complète / 25m complet (inversé sur le 2e) — Z1",
    "8×50m palmes : 25m roulis · 25m kayak",
    "4×25m nage complète — garder l'amplitude de roulis et le coude haut",
    "6×50m R20\" — Z2 @0:50-0:55",
    "200m au choix — RAC"
  ]$json$::jsonb,
  $json${
    "depart": "2×100m 4 nages — 25m nage complète / 25m complet (inversé sur le 2e) — Z1",
    "technique": [
      "8×50m palmes : 25m roulis · 25m kayak",
      "4×25m nage complète — garder l'amplitude de roulis et le coude haut"
    ],
    "corps": [
      "6×50m R20\" — Z2 @0:50-0:55"
    ],
    "rac": "200m au choix — RAC"
  }$json$::jsonb,
  1200, 50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['eau_libre']::text[],
  array['taper']::text[],
  array['decharge', 'roulis', 'kayak', 'palmes', 'technique', 'eau_libre']::text[],
  'technique', 'S7.2', null,
  'coach_approved', 'gold', true, 540,
  'Arthur coaché eau libre S7.2 — décharge. Note : « 25 NC / 25 complet » du brief → nage complète / complet (à clarifier si éducatif spécifique).'
)
on conflict (slug) do update set
  title = excluded.title, type = excluded.type, intensity = excluded.intensity,
  details = excluded.details, blocks = excluded.blocks, base_distance_m = excluded.base_distance_m,
  niveaux = excluded.niveaux, objectifs = excluded.objectifs, phases = excluded.phases,
  focus_tags = excluded.focus_tags, role = excluded.role, week_slot = excluded.week_slot,
  source = excluded.source, quality = excluded.quality, notes = excluded.notes, updated_at = now();

-- ── S7.3 ──────────────────────────────────────────────────────────────────
insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'arthur-ow-s7-3-ondulation-z3',
  'Ondulation & 3×(4×50) Z3 — S7.3',
  'SEUIL',
  'Z1-Z3 — décharge qualitative, ondulation + séries Z3',
  $json$[
    "75m crawl · 50m dos · 25m papillon — Z1",
    "5×50m palmes R30\" : 15m ondulation sous l'eau à bloc · 35m crawl récup",
    "4×25m palmes — ondulation sous l'eau",
    "4×25m crawl à l'envers (mouvement inverse)",
    "3×(4×50m) D1' — R1' entre séries — Z3 @47\"-50\"",
    "200m libre récup"
  ]$json$::jsonb,
  $json${
    "depart": "75m crawl · 50m dos · 25m papillon — Z1",
    "technique": [
      "5×50m palmes R30\" : 15m ondulation sous l'eau à bloc · 35m crawl récup",
      "4×25m palmes — ondulation sous l'eau",
      "4×25m crawl à l'envers (mouvement inverse)"
    ],
    "corps": [
      "3×(4×50m) D1' — R1' entre séries — Z3 @47\"-50\""
    ],
    "rac": "200m libre récup"
  }$json$::jsonb,
  1400, 50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['eau_libre']::text[],
  array['taper']::text[],
  array['decharge', 'ondulation', 'seuil', 'palmes', 'eau_libre']::text[],
  'seuil', 'S7.3', null,
  'coach_approved', 'gold', true, 550,
  'Arthur coaché eau libre S7.3 — décharge (semaine 4200m).'
)
on conflict (slug) do update set
  title = excluded.title, type = excluded.type, intensity = excluded.intensity,
  details = excluded.details, blocks = excluded.blocks, base_distance_m = excluded.base_distance_m,
  niveaux = excluded.niveaux, objectifs = excluded.objectifs, phases = excluded.phases,
  focus_tags = excluded.focus_tags, role = excluded.role, week_slot = excluded.week_slot,
  source = excluded.source, quality = excluded.quality, notes = excluded.notes, updated_at = now();
