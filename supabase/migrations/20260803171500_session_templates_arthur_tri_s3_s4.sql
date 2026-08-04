-- Séances Arthur coaché — triathlon, semaines 3–4 (construction volume + 4N).
-- source=coach_approved, quality=gold. Objectif mixte (triathlon).

-- ── S3.1 ──────────────────────────────────────────────────────────────────
insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'arthur-tri-s3-1-volume-4n',
  'Construction volume 4N — S3.1',
  'ENDURANCE',
  'Z1-Z2 — construction du volume, 4N + hypoxie + pull',
  $json$[
    "200m 4 nages par 12,5m — Z1",
    "200m jambes palmes — accélération dans les virages",
    "6×50m palmes + tuba : 25m mains sur les épaules (nages avec les coudes) · 25m normal",
    "8×50m respiration 3T/5T/7T/9T D1' — Z2 @49\"-53\"",
    "5×100m pull + plaquettes R20\" — Z2 @1:37-1:45",
    "200m le plus lent possible — sensation + récup"
  ]$json$::jsonb,
  $json${
    "depart": "200m 4 nages par 12,5m — Z1",
    "technique": [
      "200m jambes palmes — accélération dans les virages",
      "6×50m palmes + tuba : 25m mains sur les épaules (nages avec les coudes) · 25m normal"
    ],
    "corps": [
      "8×50m respiration 3T/5T/7T/9T D1' — Z2 @49\"-53\"",
      "5×100m pull + plaquettes R20\" — Z2 @1:37-1:45"
    ],
    "rac": "200m le plus lent possible — sensation + récup"
  }$json$::jsonb,
  1800, 50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['mixte']::text[],
  array['development']::text[],
  array['4_nages', 'hypoxie', 'pull', 'plaquettes', 'tuba', 'volume', 'triathlon']::text[],
  'endurance', 'S3.1', null,
  'coach_approved', 'gold', true, 400,
  'Arthur coaché triathlon — Semaine 3 construction volume + 4N. Fidèle au brief coach.'
)
on conflict (slug) do update set
  title = excluded.title, type = excluded.type, intensity = excluded.intensity,
  details = excluded.details, blocks = excluded.blocks, base_distance_m = excluded.base_distance_m,
  niveaux = excluded.niveaux, objectifs = excluded.objectifs, phases = excluded.phases,
  focus_tags = excluded.focus_tags, role = excluded.role, week_slot = excluded.week_slot,
  source = excluded.source, quality = excluded.quality, notes = excluded.notes, updated_at = now();

-- ── S3.2 ──────────────────────────────────────────────────────────────────
insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'arthur-tri-s3-2-pull-z3',
  'Pull Z3 — S3.2',
  'SEUIL',
  'Z1-Z3 — éducatifs sous l''eau + série pull seuil',
  $json$[
    "200m 4 nages — Z1",
    "200m pull : 25m bras D · 25m bras G",
    "2×(4×25m) palmes : · crawl sous l'eau · godille pied en avant sur le dos + plaquettes",
    "10×100m pull D2'15\" — Z3 @1:31-1:36",
    "300m libre récup"
  ]$json$::jsonb,
  $json${
    "depart": "200m 4 nages — Z1",
    "technique": [
      "200m pull : 25m bras D · 25m bras G",
      "2×(4×25m) palmes : · crawl sous l'eau · godille pied en avant sur le dos + plaquettes"
    ],
    "corps": [
      "10×100m pull D2'15\" — Z3 @1:31-1:36"
    ],
    "rac": "300m libre récup"
  }$json$::jsonb,
  1900, 50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['mixte']::text[],
  array['development']::text[],
  array['pull', 'seuil', 'godilles', 'palmes', '4_nages', 'triathlon', 'brick_run']::text[],
  'seuil', 'S3.2', null,
  'coach_approved', 'gold', true, 410,
  'Arthur coaché triathlon S3.2. Après nat : petit run léger (brick).'
)
on conflict (slug) do update set
  title = excluded.title, type = excluded.type, intensity = excluded.intensity,
  details = excluded.details, blocks = excluded.blocks, base_distance_m = excluded.base_distance_m,
  niveaux = excluded.niveaux, objectifs = excluded.objectifs, phases = excluded.phases,
  focus_tags = excluded.focus_tags, role = excluded.role, week_slot = excluded.week_slot,
  source = excluded.source, quality = excluded.quality, notes = excluded.notes, updated_at = now();

-- ── S3.3 ──────────────────────────────────────────────────────────────────
insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'arthur-tri-s3-3-hypox-z4',
  'Hypoxie & touches Z4 — S3.3',
  'VITESSE',
  'Z1-Z4 — grand chien, hypoxie 300, touches pull/plaq Z4',
  $json$[
    "400m 4 nages par 50m — Z1",
    "8×50m : 25m grand chien · 25m normal",
    "2×300m — respiration 3T/5T/7T/7T/5T/3T par 25m",
    "8×25m D1' pull + plaquettes : 12,5m godille · 12,5m nage complète — Z4 @23\"-24\"",
    "100m au choix souple"
  ]$json$::jsonb,
  $json${
    "depart": "400m 4 nages par 50m — Z1",
    "technique": [
      "8×50m : 25m grand chien · 25m normal"
    ],
    "corps": [
      "2×300m — respiration 3T/5T/7T/7T/5T/3T par 25m",
      "8×25m D1' pull + plaquettes : 12,5m godille · 12,5m nage complète — Z4 @23\"-24\""
    ],
    "rac": "100m au choix souple"
  }$json$::jsonb,
  1700, 50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['mixte']::text[],
  array['development']::text[],
  array['hypoxie', 'grand_chien', 'godilles', 'z4', '4_nages', 'triathlon']::text[],
  'vitesse', 'S3.3', null,
  'coach_approved', 'gold', true, 420,
  'Arthur coaché triathlon S3.3. Label coach 2000m — somme détails 1700m (à vérifier si bloc manquant).'
)
on conflict (slug) do update set
  title = excluded.title, type = excluded.type, intensity = excluded.intensity,
  details = excluded.details, blocks = excluded.blocks, base_distance_m = excluded.base_distance_m,
  niveaux = excluded.niveaux, objectifs = excluded.objectifs, phases = excluded.phases,
  focus_tags = excluded.focus_tags, role = excluded.role, week_slot = excluded.week_slot,
  source = excluded.source, quality = excluded.quality, notes = excluded.notes, updated_at = now();

-- ── S4.1 ──────────────────────────────────────────────────────────────────
insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'arthur-tri-s4-1-24x50-pull',
  '24×50 pull/plaq — S4.1',
  'ENDURANCE',
  'Z1-Z2 — volume pull+plaquettes, 4N en échauffement',
  $json$[
    "200m crawl/dos",
    "100m jambes",
    "200m papillon/brasse",
    "2×150m : 25m pap · 25m dos · 25m brasse · 50m crawl",
    "24×50m pull-buoy + plaquettes — Z2 @49\"-53\"",
    "400m pull-buoy + plaquettes — Z1 @7:05-7:41"
  ]$json$::jsonb,
  $json${
    "depart": "200m crawl/dos · 100m jambes · 200m papillon/brasse",
    "technique": [
      "2×150m : 25m pap · 25m dos · 25m brasse · 50m crawl"
    ],
    "corps": [
      "24×50m pull-buoy + plaquettes — Z2 @49\"-53\""
    ],
    "rac": "400m pull-buoy + plaquettes — Z1 @7:05-7:41"
  }$json$::jsonb,
  2400, 50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['mixte']::text[],
  array['development']::text[],
  array['pull', 'plaquettes', 'volume_50', '4_nages', 'triathlon']::text[],
  'endurance', 'S4.1', null,
  'coach_approved', 'gold', true, 430,
  'Arthur coaché triathlon S4.1 — construction volume + 4N, seuil intro semaine.'
)
on conflict (slug) do update set
  title = excluded.title, type = excluded.type, intensity = excluded.intensity,
  details = excluded.details, blocks = excluded.blocks, base_distance_m = excluded.base_distance_m,
  niveaux = excluded.niveaux, objectifs = excluded.objectifs, phases = excluded.phases,
  focus_tags = excluded.focus_tags, role = excluded.role, week_slot = excluded.week_slot,
  source = excluded.source, quality = excluded.quality, notes = excluded.notes, updated_at = now();

-- ── S4.2 ──────────────────────────────────────────────────────────────────
insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'arthur-tri-s4-2-seuil-intro',
  'Seuil intro pull/plaq — S4.2',
  'SEUIL',
  'Z1-Z3 — alternance Z2/Z3 + 200 composés, brick run',
  $json$[
    "200m au choix",
    "200m pull / jambes (répartition 50%)",
    "4×50m palmes — respiration latérale : 25m bras droit devant / gauche cuisse · 25m inversé",
    "8×50m pull-buoy + plaquettes R15\" — (1× Z2 · 1× Z3)×4 : Z2 @49\"-53\" · Z3 @45\"-48\"",
    "6×200m crawl pull & plaquettes : 4×25m plaquettes Z3 D35\" · 100m pull Z2 @1:37-1:45 D2'15\"",
    "300m souple"
  ]$json$::jsonb,
  $json${
    "depart": "200m au choix · 200m pull / jambes (répartition 50%)",
    "technique": [
      "4×50m palmes — respiration latérale : 25m bras droit devant / gauche cuisse · 25m inversé"
    ],
    "corps": [
      "8×50m pull-buoy + plaquettes R15\" — (1× Z2 · 1× Z3)×4 : Z2 @49\"-53\" · Z3 @45\"-48\"",
      "6×200m crawl pull & plaquettes : 4×25m plaquettes Z3 D35\" · 100m pull Z2 @1:37-1:45 D2'15\""
    ],
    "rac": "300m souple"
  }$json$::jsonb,
  2500, 50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['mixte']::text[],
  array['development']::text[],
  array['seuil', 'pull', 'plaquettes', 'palmes', 'triathlon', 'brick_run']::text[],
  'seuil', 'S4.2', null,
  'coach_approved', 'gold', true, 440,
  'Arthur coaché triathlon S4.2 — seuil intro. Après nat : run léger minimum 20 min endurance (brick).'
)
on conflict (slug) do update set
  title = excluded.title, type = excluded.type, intensity = excluded.intensity,
  details = excluded.details, blocks = excluded.blocks, base_distance_m = excluded.base_distance_m,
  niveaux = excluded.niveaux, objectifs = excluded.objectifs, phases = excluded.phases,
  focus_tags = excluded.focus_tags, role = excluded.role, week_slot = excluded.week_slot,
  source = excluded.source, quality = excluded.quality, notes = excluded.notes, updated_at = now();

-- ── S4.3 ──────────────────────────────────────────────────────────────────
insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'arthur-tri-s4-3-ondulation-hypox',
  'Ondulation palmes & hypoxie — S4.3',
  'ENDURANCE',
  'Z1-Z2 — 4N, grand chien, ondulation, pull, hypoxie 300',
  $json$[
    "400m 4 nages par 100m — Z1",
    "8×50m : 25m grand chien · 25m normal",
    "4×100m palmes D2'30\" : 25m ondulation sous l'eau · 75m crawl",
    "6×100m pull-buoy + plaquettes R20\" — Z2 @1:37-1:45",
    "2×300m — respiration 3T/5T/7T/7T/5T/3T par 25m",
    "200m comme tu veux"
  ]$json$::jsonb,
  $json${
    "depart": "400m 4 nages par 100m — Z1",
    "technique": [
      "8×50m : 25m grand chien · 25m normal",
      "4×100m palmes D2'30\" : 25m ondulation sous l'eau · 75m crawl"
    ],
    "corps": [
      "6×100m pull-buoy + plaquettes R20\" — Z2 @1:37-1:45",
      "2×300m — respiration 3T/5T/7T/7T/5T/3T par 25m"
    ],
    "rac": "200m comme tu veux"
  }$json$::jsonb,
  2600, 50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['mixte']::text[],
  array['development']::text[],
  array['hypoxie', 'ondulation', 'grand_chien', 'pull', '4_nages', 'triathlon']::text[],
  'endurance', 'S4.3', null,
  'coach_approved', 'gold', true, 450,
  'Arthur coaché triathlon S4.3. Label coach 2400m — somme détails 2600m (à vérifier).'
)
on conflict (slug) do update set
  title = excluded.title, type = excluded.type, intensity = excluded.intensity,
  details = excluded.details, blocks = excluded.blocks, base_distance_m = excluded.base_distance_m,
  niveaux = excluded.niveaux, objectifs = excluded.objectifs, phases = excluded.phases,
  focus_tags = excluded.focus_tags, role = excluded.role, week_slot = excluded.week_slot,
  source = excluded.source, quality = excluded.quality, notes = excluded.notes, updated_at = now();
