-- Banque de séances coach (templates Arthur).
-- V1 : seed des 18 archétypes confirmé (ex-OW_BASE_SESSIONS).
-- Référence volume : bassin 50m, niveau performance, repos R… (gratuit).
-- Le générateur JS reste source runtime ; cette table = mémoire / CMS coach.

create table if not exists public.session_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  type text not null,
  intensity text not null default '',
  -- Lignes séance (format affiché), référence confirmé / 50m
  details jsonb not null default '[]'::jsonb,
  -- Découpage Arthur : depart / technique / corps / rac
  blocks jsonb not null default '{}'::jsonb,
  base_distance_m integer,
  pool_ref integer not null default 50 check (pool_ref in (25, 50)),
  niveaux text[] not null default '{confirme,triathlete}',
  objectifs text[] not null default '{eau_libre,mixte,endurance}',
  phases text[] not null default '{}',
  focus_tags text[] not null default '{}',
  role text,                    -- technique | endurance | recuperation | seuil | vitesse
  week_slot text,               -- S1.1 … S6.3 (rotation banque confirmé)
  archetype_index integer,      -- index OW_BASE_SESSIONS (0..17)
  source text not null default 'js_ow_base'
    check (source in ('js_ow_base', 'arthur_excel', 'coach_approved', 'draft')),
  quality text not null default 'seed'
    check (quality in ('seed', 'gold', 'draft', 'deprecated')),
  active boolean not null default true,
  sort_order integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists session_templates_active_idx
  on public.session_templates (active) where active = true;
create index if not exists session_templates_niveaux_idx
  on public.session_templates using gin (niveaux);
create index if not exists session_templates_objectifs_idx
  on public.session_templates using gin (objectifs);
create index if not exists session_templates_phases_idx
  on public.session_templates using gin (phases);
create index if not exists session_templates_focus_idx
  on public.session_templates using gin (focus_tags);
create index if not exists session_templates_archetype_idx
  on public.session_templates (archetype_index)
  where archetype_index is not null;

alter table public.session_templates enable row level security;

drop policy if exists "Lecture publique des templates actifs" on public.session_templates;
create policy "Lecture publique des templates actifs"
  on public.session_templates
  for select
  using (active = true);

-- Écritures via service_role / dashboard (pas d'insert/update anon).

-- ── Seed : 18 archétypes banque confirmé ─────────────────────────────────

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'confirme-s1-1-grand-chien-roulis',
  'Grand chien & roulis',
  'TECHNIQUE',
  'Z1/Z2 — réathlétisation, nage appliquée sans forcer',
  '["Échauffement : 400m crawl/dos par 50m — Z1, alterne à chaque longueur","4×50m grand chien + tuba frontal — le plus lentement possible — R20\" — un bras tendu devant, échange complet, sens la prise d''eau","4×50m palmes + tuba roulis — R20\" — rotation du bassin, talons à la surface","10×50m crawl — R0''30\" — respiration 3 temps, nage appliquée — garde la technique des éducatifs, sighting tous les 8 bras","Retour au calme : 200"]'::jsonb,
  '{"depart":"Échauffement : 400m crawl/dos par 50m — Z1, alterne à chaque longueur","technique":["4×50m grand chien + tuba frontal — le plus lentement possible — R20\" — un bras tendu devant, échange complet, sens la prise d''eau","4×50m palmes + tuba roulis — R20\" — rotation du bassin, talons à la surface"],"corps":["10×50m crawl — R0''30\" — respiration 3 temps, nage appliquée — garde la technique des éducatifs, sighting tous les 8 bras"],"rac":"Retour au calme : 200"}'::jsonb,
  1350,
  50,
  ARRAY['confirme', 'triathlete']::text[],
  ARRAY['eau_libre', 'mixte', 'endurance']::text[],
  ARRAY['base', 'reprise']::text[],
  ARRAY['grand_chien', 'roulis', 'sighting']::text[],
  'technique',
  'S1.1',
  0,
  'js_ow_base',
  'seed',
  true,
  10,
  'Banque confirmé — slot S1.1, rotation archeIdx=wi*3+si. Contenu généré depuis OW_BASE_SESSIONS[0] (performance, bassin 50, R…). Scaling volume reste côté JS.'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  intensity = excluded.intensity,
  details = excluded.details,
  blocks = excluded.blocks,
  base_distance_m = excluded.base_distance_m,
  phases = excluded.phases,
  focus_tags = excluded.focus_tags,
  role = excluded.role,
  week_slot = excluded.week_slot,
  archetype_index = excluded.archetype_index,
  notes = excluded.notes,
  updated_at = now();

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'confirme-s1-2-position-endurance-100',
  'Position & endurance 100m',
  'ENDURANCE',
  'Z2 — allure régulière, recherche de position dans l''eau',
  '["Échauffement : 400m crawl palmes — Z1, jambes actives, corps à plat","200m le plus lent possible — recherche de sensation, loin devant / loin derrière, teste différentes positions","4×50m palmes : 50m bras droit devant / gauche cuisse · 50m inversé — respiration latérale — R20\"","6×100m crawl — R20\" — Z2, allure régulière, respiration 3 temps","Retour au calme : 300"]'::jsonb,
  '{"depart":"Échauffement : 400m crawl palmes — Z1, jambes actives, corps à plat","technique":["200m le plus lent possible — recherche de sensation, loin devant / loin derrière, teste différentes positions","4×50m palmes : 50m bras droit devant / gauche cuisse · 50m inversé — respiration latérale — R20\""],"corps":["6×100m crawl — R20\" — Z2, allure régulière, respiration 3 temps"],"rac":"Retour au calme : 300"}'::jsonb,
  1500,
  50,
  ARRAY['confirme', 'triathlete']::text[],
  ARRAY['eau_libre', 'mixte', 'endurance']::text[],
  ARRAY['base', 'reprise']::text[],
  ARRAY['position', 'endurance_100']::text[],
  'endurance',
  'S1.2',
  1,
  'js_ow_base',
  'seed',
  true,
  20,
  'Banque confirmé — slot S1.2, rotation archeIdx=wi*3+si. Contenu généré depuis OW_BASE_SESSIONS[1] (performance, bassin 50, R…). Scaling volume reste côté JS.'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  intensity = excluded.intensity,
  details = excluded.details,
  blocks = excluded.blocks,
  base_distance_m = excluded.base_distance_m,
  phases = excluded.phases,
  focus_tags = excluded.focus_tags,
  role = excluded.role,
  week_slot = excluded.week_slot,
  archetype_index = excluded.archetype_index,
  notes = excluded.notes,
  updated_at = now();

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'confirme-s1-3-sensibilite-continuite',
  'Sensibilité & continuité',
  'RÉCUPÉRATION',
  'Z1/Z2 léger — efficacité et position, sans pression',
  '["Échauffement : 200m crawl + 200m dos — Z1","8×50m le moins de mouvements possible par 50m — R20\" — concentre-toi sur la position, efficacité de traction, loin devant / loin derrière","400m crawl Z2 — sans pause, rythme régulier — tu dois tenir de bout en bout","200m palmes : 50m ondulation sous l''eau / 150m crawl — R20\" — sens l''ondulation, enchaîne en nage fluide","Retour au calme : 100 relâché — Z1"]'::jsonb,
  '{"depart":"Échauffement : 200m crawl + 200m dos — Z1","technique":["8×50m le moins de mouvements possible par 50m — R20\" — concentre-toi sur la position, efficacité de traction, loin devant / loin derrière","400m crawl Z2 — sans pause, rythme régulier — tu dois tenir de bout en bout"],"corps":["200m palmes : 50m ondulation sous l''eau / 150m crawl — R20\" — sens l''ondulation, enchaîne en nage fluide"],"rac":"Retour au calme : 100 relâché — Z1"}'::jsonb,
  1650,
  50,
  ARRAY['confirme', 'triathlete']::text[],
  ARRAY['eau_libre', 'mixte', 'endurance']::text[],
  ARRAY['base', 'reprise']::text[],
  ARRAY['dps', 'continuite', 'palmes']::text[],
  'recuperation',
  'S1.3',
  2,
  'js_ow_base',
  'seed',
  true,
  30,
  'Banque confirmé — slot S1.3, rotation archeIdx=wi*3+si. Contenu généré depuis OW_BASE_SESSIONS[2] (performance, bassin 50, R…). Scaling volume reste côté JS.'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  intensity = excluded.intensity,
  details = excluded.details,
  blocks = excluded.blocks,
  base_distance_m = excluded.base_distance_m,
  phases = excluded.phases,
  focus_tags = excluded.focus_tags,
  role = excluded.role,
  week_slot = excluded.week_slot,
  archetype_index = excluded.archetype_index,
  notes = excluded.notes,
  updated_at = now();

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'confirme-s2-1-dps-progressif-degressif',
  'DPS & progressif/dégressif',
  'TECHNIQUE',
  'Z2 — modulation d''allure sans vitesse, nage appliquée',
  '["Échauffement : 400m crawl/dos par 100m — Z1","4×50m le moins de coups de bras possible sur 50m — R20\" — compte tes bras, vise moins de cycles","4×50m progressif : 1 lent · 2 ↗ · 3 ↗ · 4 rapide — R20\" — monte en puissance sur la série","10×50m crawl — R0''30\" — respiration 3 temps, nage appliquée — même technique qu''en éducatif","4×50m dégressif : 1 rapide · 2 ↘ · 3 ↘ · 4 lent — R20\" — redescends progressivement","Retour au calme : 300"]'::jsonb,
  '{"depart":"Échauffement : 400m crawl/dos par 100m — Z1","technique":["4×50m le moins de coups de bras possible sur 50m — R20\" — compte tes bras, vise moins de cycles","4×50m progressif : 1 lent · 2 ↗ · 3 ↗ · 4 rapide — R20\" — monte en puissance sur la série"],"corps":["10×50m crawl — R0''30\" — respiration 3 temps, nage appliquée — même technique qu''en éducatif","4×50m dégressif : 1 rapide · 2 ↘ · 3 ↘ · 4 lent — R20\" — redescends progressivement"],"rac":"Retour au calme : 300"}'::jsonb,
  1650,
  50,
  ARRAY['confirme', 'triathlete']::text[],
  ARRAY['eau_libre', 'mixte', 'endurance']::text[],
  ARRAY['base']::text[],
  ARRAY['dps', 'modulation']::text[],
  'technique',
  'S2.1',
  3,
  'js_ow_base',
  'seed',
  true,
  40,
  'Banque confirmé — slot S2.1, rotation archeIdx=wi*3+si. Contenu généré depuis OW_BASE_SESSIONS[3] (performance, bassin 50, R…). Scaling volume reste côté JS.'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  intensity = excluded.intensity,
  details = excluded.details,
  blocks = excluded.blocks,
  base_distance_m = excluded.base_distance_m,
  phases = excluded.phases,
  focus_tags = excluded.focus_tags,
  role = excluded.role,
  week_slot = excluded.week_slot,
  archetype_index = excluded.archetype_index,
  notes = excluded.notes,
  updated_at = now();

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'confirme-s2-2-endurance-100-position-palmes',
  'Endurance 100m & position palmes',
  'ENDURANCE',
  'Z2 — fond aérobie, travail de position en échauffement',
  '["Échauffement : 400m crawl palmes — Z1","4×50m palmes : 50m bras droit devant / gauche cuisse · 50m inversé — respiration latérale — R20\"","8×100m crawl — R20\" — Z2, allure tenue du 1er au dernier 100m","200m le plus lent possible — recherche de sensation, relâche les épaules","Retour au calme : 200"]'::jsonb,
  '{"depart":"Échauffement : 400m crawl palmes — Z1","technique":["4×50m palmes : 50m bras droit devant / gauche cuisse · 50m inversé — respiration latérale — R20\"","8×100m crawl — R20\" — Z2, allure tenue du 1er au dernier 100m"],"corps":["200m le plus lent possible — recherche de sensation, relâche les épaules"],"rac":"Retour au calme : 200"}'::jsonb,
  1800,
  50,
  ARRAY['confirme', 'triathlete']::text[],
  ARRAY['eau_libre', 'mixte', 'endurance']::text[],
  ARRAY['base']::text[],
  ARRAY['endurance_100', 'palmes']::text[],
  'endurance',
  'S2.2',
  4,
  'js_ow_base',
  'seed',
  true,
  50,
  'Banque confirmé — slot S2.2, rotation archeIdx=wi*3+si. Contenu généré depuis OW_BASE_SESSIONS[4] (performance, bassin 50, R…). Scaling volume reste côté JS.'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  intensity = excluded.intensity,
  details = excluded.details,
  blocks = excluded.blocks,
  base_distance_m = excluded.base_distance_m,
  phases = excluded.phases,
  focus_tags = excluded.focus_tags,
  role = excluded.role,
  week_slot = excluded.week_slot,
  archetype_index = excluded.archetype_index,
  notes = excluded.notes,
  updated_at = now();

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'confirme-s2-3-hypoxie-integree',
  'Hypoxie intégrée',
  'TECHNIQUE',
  'Z2 — contrôle respiratoire intégré au set, pas de sprint',
  '["Échauffement : 400m au choix — Z1, crawl ou dos","200m jambes planche — battements mains en flèche, corps gainé","6×100m : 50m grand chien · 50m normal — R15\" — le plus lentement possible sur l''éducatif","6×100m crawl — R20\" — respiration par 100m : 3 temps · 5 temps · 7 temps · 9 temps · 7 temps · 5 temps","Retour au calme : 200"]'::jsonb,
  '{"depart":"Échauffement : 400m au choix — Z1, crawl ou dos","technique":["200m jambes planche — battements mains en flèche, corps gainé","6×100m : 50m grand chien · 50m normal — R15\" — le plus lentement possible sur l''éducatif"],"corps":["6×100m crawl — R20\" — respiration par 100m : 3 temps · 5 temps · 7 temps · 9 temps · 7 temps · 5 temps"],"rac":"Retour au calme : 200"}'::jsonb,
  2000,
  50,
  ARRAY['confirme', 'triathlete']::text[],
  ARRAY['eau_libre', 'mixte', 'endurance']::text[],
  ARRAY['base']::text[],
  ARRAY['hypoxie', 'jambes']::text[],
  'technique',
  'S2.3',
  5,
  'js_ow_base',
  'seed',
  true,
  60,
  'Banque confirmé — slot S2.3, rotation archeIdx=wi*3+si. Contenu généré depuis OW_BASE_SESSIONS[5] (performance, bassin 50, R…). Scaling volume reste côté JS.'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  intensity = excluded.intensity,
  details = excluded.details,
  blocks = excluded.blocks,
  base_distance_m = excluded.base_distance_m,
  phases = excluded.phases,
  focus_tags = excluded.focus_tags,
  role = excluded.role,
  week_slot = excluded.week_slot,
  archetype_index = excluded.archetype_index,
  notes = excluded.notes,
  updated_at = now();

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'confirme-s3-1-volume-50-hypoxie-rotative',
  'Volume 50m & hypoxie rotative',
  'TECHNIQUE',
  'Z2 — montée de volume, nage appliquée, épaule en confiance',
  '["Échauffement : 400m crawl/dos par 50m — Z1","5×50m tuba lent : 50m grand chien · 50m crawl normal — R20\" — le plus lentement possible","5×50m palmes + tuba roulis — R20\" — rotation consciente","12×50m crawl — R0''30\" — respiration 3 temps, nage appliquée — respiration par 50m en rotation : 3 temps · 5 temps · 7 temps · 9 temps","400m le plus lent possible — recherche de sensation + récup — relâche tout"]'::jsonb,
  '{"depart":"Échauffement : 400m crawl/dos par 50m — Z1","technique":["5×50m tuba lent : 50m grand chien · 50m crawl normal — R20\" — le plus lentement possible","5×50m palmes + tuba roulis — R20\" — rotation consciente"],"corps":["12×50m crawl — R0''30\" — respiration 3 temps, nage appliquée — respiration par 50m en rotation : 3 temps · 5 temps · 7 temps · 9 temps"],"rac":"400m le plus lent possible — recherche de sensation + récup — relâche tout"}'::jsonb,
  2100,
  50,
  ARRAY['confirme', 'triathlete']::text[],
  ARRAY['eau_libre', 'mixte', 'endurance']::text[],
  ARRAY['base', 'development']::text[],
  ARRAY['volume_50', 'hypoxie', 'grand_chien']::text[],
  'technique',
  'S3.1',
  6,
  'js_ow_base',
  'seed',
  true,
  70,
  'Banque confirmé — slot S3.1, rotation archeIdx=wi*3+si. Contenu généré depuis OW_BASE_SESSIONS[6] (performance, bassin 50, R…). Scaling volume reste côté JS.'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  intensity = excluded.intensity,
  details = excluded.details,
  blocks = excluded.blocks,
  base_distance_m = excluded.base_distance_m,
  phases = excluded.phases,
  focus_tags = excluded.focus_tags,
  role = excluded.role,
  week_slot = excluded.week_slot,
  archetype_index = excluded.archetype_index,
  notes = excluded.notes,
  updated_at = now();

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'confirme-s3-2-endurance-100-sous-eau',
  'Endurance 100m & travail sous l''eau',
  'ENDURANCE',
  'Z2 — fond aérobie, volume en hausse sans monter l''intensité',
  '["Échauffement : 400m crawl palmes — Z1","2×100m rattrapé drill + tuba — le plus lentement possible — R20\" — un bras attend l''autre","8×50m palmes : 1× crawl sous l''eau · 1× godille pied en avant sur le dos — R20\" — alterne les 50m","10×100m crawl — R20\" — Z2, allure régulière — note si tu tiens le même rythme sur toutes les reps","Retour au calme : 200"]'::jsonb,
  '{"depart":"Échauffement : 400m crawl palmes — Z1","technique":["2×100m rattrapé drill + tuba — le plus lentement possible — R20\" — un bras attend l''autre","8×50m palmes : 1× crawl sous l''eau · 1× godille pied en avant sur le dos — R20\" — alterne les 50m"],"corps":["10×100m crawl — R20\" — Z2, allure régulière — note si tu tiens le même rythme sur toutes les reps"],"rac":"Retour au calme : 200"}'::jsonb,
  2050,
  50,
  ARRAY['confirme', 'triathlete']::text[],
  ARRAY['eau_libre', 'mixte', 'endurance']::text[],
  ARRAY['base', 'development']::text[],
  ARRAY['endurance_100', 'rattrape', 'ondulation']::text[],
  'endurance',
  'S3.2',
  7,
  'js_ow_base',
  'seed',
  true,
  80,
  'Banque confirmé — slot S3.2, rotation archeIdx=wi*3+si. Contenu généré depuis OW_BASE_SESSIONS[7] (performance, bassin 50, R…). Scaling volume reste côté JS.'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  intensity = excluded.intensity,
  details = excluded.details,
  blocks = excluded.blocks,
  base_distance_m = excluded.base_distance_m,
  phases = excluded.phases,
  focus_tags = excluded.focus_tags,
  role = excluded.role,
  week_slot = excluded.week_slot,
  archetype_index = excluded.archetype_index,
  notes = excluded.notes,
  updated_at = now();

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'confirme-s3-3-reps-150-ondulation',
  'Reps 150m & ondulation palmes',
  'ENDURANCE',
  'Z2 — reps longues, respiration et ondulation, gestion d''allure',
  '["Échauffement : 400m au choix — Z1","8×100m : 50m grand chien · 50m crawl normal — R15\" — le plus lentement possible sur l''éducatif","4×150m crawl — R25\" — respiration par 25m : 3 temps · 5 temps · 7 temps · 5 temps · 3 temps — même allure malgré le changement respiratoire","4×100m palmes : 50m ondulation sous l''eau / 150m crawl — R0''30\" — sens l''ondulation, enchaîne en nage fluide","200m le plus lent possible — souple + sensation"]'::jsonb,
  '{"depart":"Échauffement : 400m au choix — Z1","technique":["8×100m : 50m grand chien · 50m crawl normal — R15\" — le plus lentement possible sur l''éducatif","4×150m crawl — R25\" — respiration par 25m : 3 temps · 5 temps · 7 temps · 5 temps · 3 temps — même allure malgré le changement respiratoire"],"corps":["4×100m palmes : 50m ondulation sous l''eau / 150m crawl — R0''30\" — sens l''ondulation, enchaîne en nage fluide"],"rac":"200m le plus lent possible — souple + sensation"}'::jsonb,
  2725,
  50,
  ARRAY['confirme', 'triathlete']::text[],
  ARRAY['eau_libre', 'mixte', 'endurance']::text[],
  ARRAY['development']::text[],
  ARRAY['reps_150', 'hypoxie', 'ondulation']::text[],
  'endurance',
  'S3.3',
  8,
  'js_ow_base',
  'seed',
  true,
  90,
  'Banque confirmé — slot S3.3, rotation archeIdx=wi*3+si. Contenu généré depuis OW_BASE_SESSIONS[8] (performance, bassin 50, R…). Scaling volume reste côté JS.'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  intensity = excluded.intensity,
  details = excluded.details,
  blocks = excluded.blocks,
  base_distance_m = excluded.base_distance_m,
  phases = excluded.phases,
  focus_tags = excluded.focus_tags,
  role = excluded.role,
  week_slot = excluded.week_slot,
  archetype_index = excluded.archetype_index,
  notes = excluded.notes,
  updated_at = now();

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'confirme-s4-1-rythme-frequence-bras',
  'Rythme de nage & fréquence de bras',
  'TECHNIQUE',
  'Z2 — conscience du rythme, pas de vitesse pure',
  '["Échauffement : 400m crawl/dos — Z1, respiration libre","6×50m compte tes cycles de bras par longueur — R15\" — vise le même chiffre à chaque fois","8×100m crawl — R0''30\" — respiration 3 temps, nage appliquée — garde la même fréquence du 1er au dernier","Retour au calme : 200"]'::jsonb,
  '{"depart":"Échauffement : 400m crawl/dos — Z1, respiration libre","technique":["6×50m compte tes cycles de bras par longueur — R15\" — vise le même chiffre à chaque fois"],"corps":["8×100m crawl — R0''30\" — respiration 3 temps, nage appliquée — garde la même fréquence du 1er au dernier"],"rac":"Retour au calme : 200"}'::jsonb,
  1500,
  50,
  ARRAY['confirme', 'triathlete']::text[],
  ARRAY['eau_libre', 'mixte', 'endurance']::text[],
  ARRAY['development']::text[],
  ARRAY['rythme', 'frequence_bras']::text[],
  'technique',
  'S4.1',
  9,
  'js_ow_base',
  'seed',
  true,
  100,
  'Banque confirmé — slot S4.1, rotation archeIdx=wi*3+si. Contenu généré depuis OW_BASE_SESSIONS[9] (performance, bassin 50, R…). Scaling volume reste côté JS.'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  intensity = excluded.intensity,
  details = excluded.details,
  blocks = excluded.blocks,
  base_distance_m = excluded.base_distance_m,
  phases = excluded.phases,
  focus_tags = excluded.focus_tags,
  role = excluded.role,
  week_slot = excluded.week_slot,
  archetype_index = excluded.archetype_index,
  notes = excluded.notes,
  updated_at = now();

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'confirme-s4-2-endurance-200-allure',
  'Endurance 200m & gestion d''allure',
  'ENDURANCE',
  'Z2 — allure tenue sur des reps longues',
  '["Échauffement : 400m crawl palmes — Z1","4×50m accélération progressive sur la longueur — R15\"","200m le plus lent possible — recherche de sensation, relâche les épaules","4×200m crawl — R20\" — Z2, même allure du 1er au dernier 200m","Retour au calme : 200"]'::jsonb,
  '{"depart":"Échauffement : 400m crawl palmes — Z1","technique":["4×50m accélération progressive sur la longueur — R15\"","200m le plus lent possible — recherche de sensation, relâche les épaules"],"corps":["4×200m crawl — R20\" — Z2, même allure du 1er au dernier 200m"],"rac":"Retour au calme : 200"}'::jsonb,
  1800,
  50,
  ARRAY['confirme', 'triathlete']::text[],
  ARRAY['eau_libre', 'mixte', 'endurance']::text[],
  ARRAY['development']::text[],
  ARRAY['endurance_200', 'gestion_allure']::text[],
  'endurance',
  'S4.2',
  10,
  'js_ow_base',
  'seed',
  true,
  110,
  'Banque confirmé — slot S4.2, rotation archeIdx=wi*3+si. Contenu généré depuis OW_BASE_SESSIONS[10] (performance, bassin 50, R…). Scaling volume reste côté JS.'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  intensity = excluded.intensity,
  details = excluded.details,
  blocks = excluded.blocks,
  base_distance_m = excluded.base_distance_m,
  phases = excluded.phases,
  focus_tags = excluded.focus_tags,
  role = excluded.role,
  week_slot = excluded.week_slot,
  archetype_index = excluded.archetype_index,
  notes = excluded.notes,
  updated_at = now();

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'confirme-s4-3-virages-reprise',
  'Virages & reprise de nage',
  'TECHNIQUE',
  'Z2 — technique de virage, pas de vitesse',
  '["Échauffement : 400m crawl/dos par 50m — Z1","8×50m virage + 5m de coulée + tuba — R15\" — reprise de nage progressive après le mur","8×100m crawl — R20\" — enchaîne le virage sans casser l''allure","Retour au calme : 200"]'::jsonb,
  '{"depart":"Échauffement : 400m crawl/dos par 50m — Z1","technique":["8×50m virage + 5m de coulée + tuba — R15\" — reprise de nage progressive après le mur"],"corps":["8×100m crawl — R20\" — enchaîne le virage sans casser l''allure"],"rac":"Retour au calme : 200"}'::jsonb,
  1655,
  50,
  ARRAY['confirme', 'triathlete']::text[],
  ARRAY['eau_libre', 'mixte', 'endurance']::text[],
  ARRAY['development']::text[],
  ARRAY['virages', 'coulee']::text[],
  'technique',
  'S4.3',
  11,
  'js_ow_base',
  'seed',
  true,
  120,
  'Banque confirmé — slot S4.3, rotation archeIdx=wi*3+si. Contenu généré depuis OW_BASE_SESSIONS[11] (performance, bassin 50, R…). Scaling volume reste côté JS.'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  intensity = excluded.intensity,
  details = excluded.details,
  blocks = excluded.blocks,
  base_distance_m = excluded.base_distance_m,
  phases = excluded.phases,
  focus_tags = excluded.focus_tags,
  role = excluded.role,
  week_slot = excluded.week_slot,
  archetype_index = excluded.archetype_index,
  notes = excluded.notes,
  updated_at = now();

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'confirme-s5-1-sighting-navigation',
  'Sighting avancé & navigation',
  'ENDURANCE',
  'Z2 — sighting fréquent, nage appliquée',
  '["Échauffement : 400m crawl palmes — Z1","4×50m sighting tous les 4 bras — R15\" — lève les yeux sans casser le rythme","10×50m crawl — R0''30\" — respiration 3 temps, nage appliquée — sighting tous les 6-8 bras, garde le cap","Retour au calme : 200"]'::jsonb,
  '{"depart":"Échauffement : 400m crawl palmes — Z1","technique":["4×50m sighting tous les 4 bras — R15\" — lève les yeux sans casser le rythme"],"corps":["10×50m crawl — R0''30\" — respiration 3 temps, nage appliquée — sighting tous les 6-8 bras, garde le cap"],"rac":"Retour au calme : 200"}'::jsonb,
  1100,
  50,
  ARRAY['confirme', 'triathlete']::text[],
  ARRAY['eau_libre', 'mixte', 'endurance']::text[],
  ARRAY['development', 'peak']::text[],
  ARRAY['sighting', 'eau_libre']::text[],
  'endurance',
  'S5.1',
  12,
  'js_ow_base',
  'seed',
  true,
  130,
  'Banque confirmé — slot S5.1, rotation archeIdx=wi*3+si. Contenu généré depuis OW_BASE_SESSIONS[12] (performance, bassin 50, R…). Scaling volume reste côté JS.'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  intensity = excluded.intensity,
  details = excluded.details,
  blocks = excluded.blocks,
  base_distance_m = excluded.base_distance_m,
  phases = excluded.phases,
  focus_tags = excluded.focus_tags,
  role = excluded.role,
  week_slot = excluded.week_slot,
  archetype_index = excluded.archetype_index,
  notes = excluded.notes,
  updated_at = now();

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'confirme-s5-2-endurance-negatif-split',
  'Endurance longue & négatif split',
  'ENDURANCE',
  'Z2 — 2ème moitié plus rapide que la 1ère',
  '["Échauffement : 400m au choix — Z1","600m crawl — première moitié Z1/Z2 souple, deuxième moitié un peu plus soutenue","Retour au calme : 300"]'::jsonb,
  '{"depart":"Échauffement : 400m au choix — Z1","technique":[],"corps":["600m crawl — première moitié Z1/Z2 souple, deuxième moitié un peu plus soutenue"],"rac":"Retour au calme : 300"}'::jsonb,
  1000,
  50,
  ARRAY['confirme', 'triathlete']::text[],
  ARRAY['eau_libre', 'mixte', 'endurance']::text[],
  ARRAY['development', 'peak']::text[],
  ARRAY['negatif_split', 'endurance_longue']::text[],
  'endurance',
  'S5.2',
  13,
  'js_ow_base',
  'seed',
  true,
  140,
  'Banque confirmé — slot S5.2, rotation archeIdx=wi*3+si. Contenu généré depuis OW_BASE_SESSIONS[13] (performance, bassin 50, R…). Scaling volume reste côté JS.'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  intensity = excluded.intensity,
  details = excluded.details,
  blocks = excluded.blocks,
  base_distance_m = excluded.base_distance_m,
  phases = excluded.phases,
  focus_tags = excluded.focus_tags,
  role = excluded.role,
  week_slot = excluded.week_slot,
  archetype_index = excluded.archetype_index,
  notes = excluded.notes,
  updated_at = now();

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'confirme-s5-3-jambes-gainage',
  'Jambes & gainage',
  'TECHNIQUE',
  'Z2 — renforcement jambes/gainage, pas de vitesse',
  '["Échauffement : 400m au choix — Z1","300m jambes planche — battements réguliers, corps gainé","6×50m pull-buoy sans battements — R15\" — focus gainage et rotation","Retour au calme : 200"]'::jsonb,
  '{"depart":"Échauffement : 400m au choix — Z1","technique":["300m jambes planche — battements réguliers, corps gainé"],"corps":["6×50m pull-buoy sans battements — R15\" — focus gainage et rotation"],"rac":"Retour au calme : 200"}'::jsonb,
  1000,
  50,
  ARRAY['confirme', 'triathlete']::text[],
  ARRAY['eau_libre', 'mixte', 'endurance']::text[],
  ARRAY['development']::text[],
  ARRAY['jambes', 'gainage', 'pull']::text[],
  'technique',
  'S5.3',
  14,
  'js_ow_base',
  'seed',
  true,
  150,
  'Banque confirmé — slot S5.3, rotation archeIdx=wi*3+si. Contenu généré depuis OW_BASE_SESSIONS[14] (performance, bassin 50, R…). Scaling volume reste côté JS.'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  intensity = excluded.intensity,
  details = excluded.details,
  blocks = excluded.blocks,
  base_distance_m = excluded.base_distance_m,
  phases = excluded.phases,
  focus_tags = excluded.focus_tags,
  role = excluded.role,
  week_slot = excluded.week_slot,
  archetype_index = excluded.archetype_index,
  notes = excluded.notes,
  updated_at = now();

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'confirme-s6-1-simulation-allure-course',
  'Simulation allure course',
  'ENDURANCE',
  'Z2/Z3 — allure objectif, régularité',
  '["Échauffement : 400m crawl progressif — Z1","6×100m crawl — R0''30\" — allure course cible, note si tu tiens le rythme","Retour au calme : 200"]'::jsonb,
  '{"depart":"Échauffement : 400m crawl progressif — Z1","technique":[],"corps":["6×100m crawl — R0''30\" — allure course cible, note si tu tiens le rythme"],"rac":"Retour au calme : 200"}'::jsonb,
  1000,
  50,
  ARRAY['confirme', 'triathlete']::text[],
  ARRAY['eau_libre', 'mixte', 'endurance']::text[],
  ARRAY['peak']::text[],
  ARRAY['allure_course', 'simulation']::text[],
  'endurance',
  'S6.1',
  15,
  'js_ow_base',
  'seed',
  true,
  160,
  'Banque confirmé — slot S6.1, rotation archeIdx=wi*3+si. Contenu généré depuis OW_BASE_SESSIONS[15] (performance, bassin 50, R…). Scaling volume reste côté JS.'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  intensity = excluded.intensity,
  details = excluded.details,
  blocks = excluded.blocks,
  base_distance_m = excluded.base_distance_m,
  phases = excluded.phases,
  focus_tags = excluded.focus_tags,
  role = excluded.role,
  week_slot = excluded.week_slot,
  archetype_index = excluded.archetype_index,
  notes = excluded.notes,
  updated_at = now();

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'confirme-s6-2-volume-200-respiration',
  'Volume 200m & respiration contrôlée',
  'ENDURANCE',
  'Z2 — fond aérobie, contrôle respiratoire',
  '["Échauffement : 400m au choix — Z1","4×200m crawl — R20\" — respiration par 200m : 3 temps · 5 temps · 7 temps · 9 temps","Retour au calme : 300"]'::jsonb,
  '{"depart":"Échauffement : 400m au choix — Z1","technique":[],"corps":["4×200m crawl — R20\" — respiration par 200m : 3 temps · 5 temps · 7 temps · 9 temps"],"rac":"Retour au calme : 300"}'::jsonb,
  1400,
  50,
  ARRAY['confirme', 'triathlete']::text[],
  ARRAY['eau_libre', 'mixte', 'endurance']::text[],
  ARRAY['peak']::text[],
  ARRAY['endurance_200', 'respiration']::text[],
  'endurance',
  'S6.2',
  16,
  'js_ow_base',
  'seed',
  true,
  170,
  'Banque confirmé — slot S6.2, rotation archeIdx=wi*3+si. Contenu généré depuis OW_BASE_SESSIONS[16] (performance, bassin 50, R…). Scaling volume reste côté JS.'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  intensity = excluded.intensity,
  details = excluded.details,
  blocks = excluded.blocks,
  base_distance_m = excluded.base_distance_m,
  phases = excluded.phases,
  focus_tags = excluded.focus_tags,
  role = excluded.role,
  week_slot = excluded.week_slot,
  archetype_index = excluded.archetype_index,
  notes = excluded.notes,
  updated_at = now();

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'confirme-s6-3-recup-sensations',
  'Récupération active & sensations fines',
  'RÉCUPÉRATION',
  'Z1 — très facile, aucune pression',
  '["Échauffement : 300m dos/crawl très facile — Z1","400m crawl Z1 — sans pause, relâché, focus respiration","200m palmes ondulation très facile — sens le corps qui glisse","Retour au calme : 200 relâché — Z1"]'::jsonb,
  '{"depart":"Échauffement : 300m dos/crawl très facile — Z1","technique":["400m crawl Z1 — sans pause, relâché, focus respiration"],"corps":["200m palmes ondulation très facile — sens le corps qui glisse"],"rac":"Retour au calme : 200 relâché — Z1"}'::jsonb,
  900,
  50,
  ARRAY['confirme', 'triathlete']::text[],
  ARRAY['eau_libre', 'mixte', 'endurance']::text[],
  ARRAY['base', 'taper']::text[],
  ARRAY['recuperation', 'sensations', 'palmes']::text[],
  'recuperation',
  'S6.3',
  17,
  'js_ow_base',
  'seed',
  true,
  180,
  'Banque confirmé — slot S6.3, rotation archeIdx=wi*3+si. Contenu généré depuis OW_BASE_SESSIONS[17] (performance, bassin 50, R…). Scaling volume reste côté JS.'
)
on conflict (slug) do update set
  title = excluded.title,
  type = excluded.type,
  intensity = excluded.intensity,
  details = excluded.details,
  blocks = excluded.blocks,
  base_distance_m = excluded.base_distance_m,
  phases = excluded.phases,
  focus_tags = excluded.focus_tags,
  role = excluded.role,
  week_slot = excluded.week_slot,
  archetype_index = excluded.archetype_index,
  notes = excluded.notes,
  updated_at = now();
