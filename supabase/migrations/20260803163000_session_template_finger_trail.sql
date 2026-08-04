-- Séance gold : finger trail palmes + 8×100 dégressif (inspirée concurrente),
-- réécrite format Arthur. Total 1700m.

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'gold-finger-trail-8x100-descend',
  'Traînée doigts & 8×100 dégressif',
  'ENDURANCE',
  'Z1-Z2/Z3 — technique recovery + série dégressive 100m',
  $json$[
    "100m crawl D2'30\" · 2×50m pull progressif D1'20\" · 100m crawl D2'30\" · 2×50m jambes progressives D1'30\" — Z1 — monte progressivement sur pull et jambes",
    "4×50m traînée des doigts + palmes D1'00\" — Z1 — doigts qui frôlent l'eau sur le retour de bras, coude haut",
    "8×100m crawl dégressif D2'30\" — Z1→Z3 — chaque 100 un peu plus rapide que le précédent (ou par blocs de 2)",
    "2×150m : 100m crawl · 50m dos D3'00\" — Z1 souple"
  ]$json$::jsonb,
  $json${
    "depart": "100m crawl D2'30\" · 2×50m pull progressif D1'20\" · 100m crawl D2'30\" · 2×50m jambes progressives D1'30\" — Z1 — monte progressivement sur pull et jambes",
    "technique": [
      "4×50m traînée des doigts + palmes D1'00\" — Z1 — doigts qui frôlent l'eau sur le retour de bras, coude haut"
    ],
    "corps": [
      "8×100m crawl dégressif D2'30\" — Z1→Z3 — chaque 100 un peu plus rapide que le précédent (ou par blocs de 2)"
    ],
    "rac": "2×150m : 100m crawl · 50m dos D3'00\" — Z1 souple"
  }$json$::jsonb,
  1700,
  50,
  array['confirme', 'triathlete', 'sportif', 'régulier']::text[],
  array['endurance', 'mixte', 'eau_libre']::text[],
  array['base', 'development']::text[],
  array['degressif', 'dps', 'palmes', 'educatif', 'endurance_100']::text[],
  'endurance',
  null,
  null,
  'coach_approved',
  'gold',
  true,
  290,
  'Réécriture Arthur. Finger Trail Drill → traînée des doigts. CD : intervalle concurrent @1:10 irréaliste pour 150m → D3''00\". Total 1700m. Volume plus accessible (régulier ok).'
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
