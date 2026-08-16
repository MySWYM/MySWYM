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
assert.ok(levelsOf("educatif_grand_chien").includes("decouverte"));
assert.ok(levelsOf("educatif_fleche").includes("decouverte"));
assert.ok(levelsOf("nouveau_dos_deux_bras").includes("decouverte"));
assert.ok(!levelsOf("nouveau_dos_soldat").includes("decouverte"));
assert.ok(!levelsOf("nouveau_brasse_opposition").includes("regulier"));
assert.ok(levelsOf("nouveau_brasse_opposition").includes("sportif"));

// Sélection live : pas de petit chien / toucher cuisse / six battements en Découverte
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
  assert.ok(!ids.includes("educatif_petit_chien"), `petit chien seed ${i}`);
  assert.ok(!ids.includes("educatif_toucher_cuisse"), `toucher cuisse seed ${i}`);
  assert.ok(!ids.includes("educatif_six_battements_par_roulis"), `6 battements seed ${i}`);
  assert.ok(!ids.includes("educatif_crawl_rattrape"), `rattrapé seed ${i}`);
  assert.ok(!ids.includes("educatif_roulis"), `roulis seed ${i}`);
}

// 4 nages : éducatifs Excel tagués, filtrés par niveau
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
  const ids = (block.drills || []).map((d) => d.id);
  assert.ok(!ids.includes("nouveau_dos_soldat"), `dos soldat hors Découverte ${i}`);
  assert.ok(!ids.includes("nouveau_brasse_opposition"), `brasse opposition hors Découverte ${i}`);
  assert.ok(
    ids.some((id) =>
      ["nouveau_dos_deux_bras", "arthur_papillon_un_bras", "nouveau_papillon_baleine"].includes(id),
    ),
    `éducatif 4n Découverte attendu ${i}: ${ids.join(",")}`,
  );
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
