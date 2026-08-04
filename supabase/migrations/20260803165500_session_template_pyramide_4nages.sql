-- Séance gold : pyramide 4 nages Fly↔Free (inspirée concurrente),
-- pas de CD dans la source → RAC court ajouté. Total ~2100m. Mixte.

insert into public.session_templates (
  slug, title, type, intensity, details, blocks, base_distance_m, pool_ref,
  niveaux, objectifs, phases, focus_tags, role, week_slot, archetype_index,
  source, quality, active, sort_order, notes
) values (
  'gold-pyramide-4nages-fly-free',
  'Pyramide 4 nages Fly↔Free',
  'TECHNIQUE',
  'Z1-Z2/Z3 — 4 nages en miroir, technique + allure',
  $json$[
    "2×(200m crawl D3'40\" · 50m pull progressif D1'10\") — Z1",
    "2×(2×50m traînée des doigts + palmes D1'20\" · 100m crawl + palmes D2'00\" · 2×50m jambes progressives D1'20\") — Z1 — coude haut sur la traînée",
    "50m papillon D1'10\" · 100m dos D2'00\" · 150m brasse D3'20\" · 200m crawl D3'40\" · 150m brasse D3'20\" · 100m dos D2'00\" · 50m papillon D1'10\" — Z2 — miroir 4 nages, même qualité à l'aller et au retour",
    "200m au choix souple — Z1 (RAC ajouté : absente dans la source)"
  ]$json$::jsonb,
  $json${
    "depart": "2×(200m crawl D3'40\" · 50m pull progressif D1'10\") — Z1",
    "technique": [
      "2×(2×50m traînée des doigts + palmes D1'20\" · 100m crawl + palmes D2'00\" · 2×50m jambes progressives D1'20\") — Z1 — coude haut sur la traînée"
    ],
    "corps": [
      "50m papillon D1'10\" · 100m dos D2'00\" · 150m brasse D3'20\" · 200m crawl D3'40\" · 150m brasse D3'20\" · 100m dos D2'00\" · 50m papillon D1'10\" — Z2 — miroir 4 nages, même qualité à l'aller et au retour"
    ],
    "rac": "200m au choix souple — Z1 (RAC ajouté : absente dans la source)"
  }$json$::jsonb,
  2100,
  50,
  array['confirme', 'triathlete', 'sportif']::text[],
  array['mixte']::text[],
  array['development', 'peak']::text[],
  array['4_nages', 'pyramide', 'papillon', 'brasse', 'palmes', 'educatif']::text[],
  'technique',
  null,
  null,
  'coach_approved',
  'gold',
  true,
  340,
  'Réécriture Arthur. Source sans Cool Down → RAC 200m ajouté. Total 2100m (1900 source + 200 RAC). Mixte/piscine only.'
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
