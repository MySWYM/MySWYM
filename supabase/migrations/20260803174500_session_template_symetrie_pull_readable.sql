-- Symétrie pull : détails multi-lignes (UX lisible — plus de mur « A · B · C »).

update public.session_templates
set
  details = $json$[
    "500m — Z1 :",
    "  · 6×50m crawl D1'10\"",
    "  · 2×100m pull D2'00\"",
    "500m — Z1 — même rythme, focus position dos :",
    "  · 6×50m dos D1'10\"",
    "  · 2×100m pull D2'00\"",
    "1600m — Z2 — structure en miroir, allure régulière sur les 100 :",
    "  · 100m jambes D2'30\"",
    "  · 2×100m crawl D2'00\"",
    "  · 300m pull D5'30\"",
    "  · 4×100m crawl D2'00\"",
    "  · 300m pull D5'30\"",
    "  · 2×100m crawl D2'00\"",
    "  · 100m jambes D2'30\"",
    "400m — Z1 souple :",
    "  · 50m dos D1'10\"",
    "  · 150m crawl D3'00\"",
    "  · 50m brasse D1'20\"",
    "  · 150m crawl D3'00\""
  ]$json$::jsonb,
  blocks = $json${
    "depart": ["500m — Z1 :", "  · 6×50m crawl D1'10\"", "  · 2×100m pull D2'00\""],
    "technique": ["500m — Z1 — même rythme, focus position dos :", "  · 6×50m dos D1'10\"", "  · 2×100m pull D2'00\""],
    "corps": ["1600m — Z2 — structure en miroir :", "  · 100m jambes D2'30\"", "  · 2×100m crawl D2'00\"", "  · 300m pull D5'30\"", "  · 4×100m crawl D2'00\"", "  · 300m pull D5'30\"", "  · 2×100m crawl D2'00\"", "  · 100m jambes D2'30\""],
    "rac": ["400m — Z1 souple :", "  · 50m dos D1'10\"", "  · 150m crawl D3'00\"", "  · 50m brasse D1'20\"", "  · 150m crawl D3'00\""]
  }$json$::jsonb,
  notes = 'Réécriture UX multi-lignes. Total 3000m. Affichage : 1 n° = 1 bloc + sous-séries.',
  updated_at = now()
where slug = 'gold-symetrie-kick-pull-100';
