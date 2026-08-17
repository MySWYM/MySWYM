import assert from "node:assert/strict";
import { parseArthurEducatifLevels } from "./parse-arthur-educatif-levels.js";
import { ARTHUR_DRAFT_DRILLS } from "./arthur-drills-data.js";
import { buildArthurTechniqueBlock } from "../sports-engine/arthur-pedagogy-blocks.js";

function levelsOf(id) {
  return ARTHUR_DRAFT_DRILLS.find((d) => d.id === id)?.levels || [];
}

// « adaptable à tous » ne doit PAS ouvrir la découverte
assert.deepEqual(
  parseArthurEducatifLevels(
    "régulier — adaptable à tous niveaux avec une vitesse lente et une consigne simple.",
  ),
  ["regulier", "sportif", "performance"],
);

// Grand chien : notes Excel « pour les découvertes »
assert.deepEqual(
  parseArthurEducatifLevels(
    "régulier — adaptable à tous niveaux avec une vitesse lente et une consigne simple.",
    {
      id: "educatif_grand_chien",
      notes: "Tubas conseillé pour les découvertes et possible pour les autres niveaux",
    },
  ),
  ["decouverte", "regulier", "sportif", "performance"],
);

assert.deepEqual(
  parseArthurEducatifLevels("Régulier, sportif et performant"),
  ["regulier", "sportif", "performance"],
);

assert.deepEqual(parseArthurEducatifLevels("Tous les niveaux"), [
  "decouverte",
  "regulier",
  "sportif",
  "performance",
]);

assert.deepEqual(
  parseArthurEducatifLevels("Découverte et régulier ; à adapter aux autres niveaux."),
  ["decouverte", "regulier"],
);

assert.ok(!levelsOf("educatif_petit_chien").includes("decouverte"));
assert.ok(!levelsOf("educatif_toucher_cuisse").includes("decouverte"));
assert.ok(!levelsOf("educatif_six_battements_par_roulis").includes("decouverte"));
assert.ok(levelsOf("educatif_fleche").includes("decouverte"));
assert.ok(levelsOf("nouveau_dos_deux_bras").includes("decouverte"));
assert.ok(!levelsOf("nouveau_dos_soldat").includes("decouverte"));
assert.ok(!levelsOf("nouveau_brasse_opposition").includes("regulier"));
assert.ok(levelsOf("nouveau_brasse_opposition").includes("sportif"));

// Sélection live : Découverte a accès à tout le catalogue (pas seulement flèche/chien)
const seen = new Set();
for (let i = 0; i < 20; i += 1) {
  const block = buildArthurTechniqueBlock({
    budget: 200,
    pool: 25,
    level: "decouverte",
    equipment: ["tuba", "palmes", "pull-buoy"],
    rng: () => (i * 0.037) % 1,
  });
  assert.ok(block, `technique block seed ${i}`);
  const ids = (block.drills || []).map((d) => d.id);
  ids.forEach((id) => seen.add(id));
}
assert.ok(seen.size >= 2, `Découverte doit varier les éducatifs, got ${[...seen].join(",")}`);
assert.ok(
  [...seen].some((id) =>
    [
      "educatif_toucher_cuisse",
      "educatif_petit_chien",
      "educatif_crawl_rattrape",
      "educatif_roulis",
      "educatif_six_battements_par_roulis",
    ].includes(id),
  ),
  `Découverte doit sortir du duo flèche/chien, got ${[...seen].join(",")}`,
);

// 4 nages : Découverte peut piocher dans tout le catalogue 4n
for (let i = 0; i < 15; i += 1) {
  const block = buildArthurTechniqueBlock({
    budget: 200,
    pool: 25,
    level: "decouverte",
    objective: "4_nages",
    equipment: ["tuba", "palmes"],
    papillonOk: true,
    rng: () => (i * 0.041) % 1,
  });
  assert.ok(block, `4n decouverte seed ${i}`);
  assert.ok((block.drills || []).length > 0, `4n decouverte drills ${i}`);
}

for (let i = 0; i < 12; i += 1) {
  const block = buildArthurTechniqueBlock({
    budget: 300,
    pool: 25,
    level: "sportif",
    objective: "4_nages",
    equipment: ["tuba", "palmes"],
    papillonOk: true,
    rng: () => (i * 0.053) % 1,
  });
  assert.ok(block, `4n sportif seed ${i}`);
  const ids = (block.drills || []).map((d) => d.id);
  assert.ok(
    ids.every((id) => {
      const d = ARTHUR_DRAFT_DRILLS.find((x) => x.id === id);
      return d?.levels?.includes("sportif");
    }),
    `tous les éducatifs 4n sportif ont le niveau ${i}: ${ids.join(",")}`,
  );
}

console.log("parse-arthur-educatif-levels.test.js: ok");
