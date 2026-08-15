/**
 * Tests banque canonique éducatifs (étape 2) — non branchée au générateur.
 * Usage : node src/lib/swim-banks/canonical-drills.test.js
 */
import {
  CANONICAL_DRILLS,
  LEGACY_TECHNIQUE_SERIES,
  getCanonicalDrillById,
  countCanonicalByStatus,
  listExactCanonicalDuplicates,
  assertCanonicalDrillShape,
} from "./canonical-drills.js";
import {
  TECHNIQUE,
  TECHNIQUE_DRILL_ENTRIES,
  countBankItems,
} from "./index.js";
import { getExerciseInventory, countTechniqueDrills } from "../sports-engine/exercise-library.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("CD1 unicité des id");
{
  const ids = CANONICAL_DRILLS.map((d) => d.id);
  assert(ids.length === new Set(ids).size, "ids fiches non uniques");
  const seriesIds = LEGACY_TECHNIQUE_SERIES.map((s) => s.id);
  assert(seriesIds.length === new Set(seriesIds).size, "ids séries non uniques");
}

console.log("CD2 pas de doublon canonique exact (nom+nage+catégorie)");
{
  const dupes = listExactCanonicalDuplicates();
  assert(dupes.length === 0, `doublons canoniques: ${JSON.stringify(dupes)}`);
}

console.log("CD3 métadonnées obligatoires");
{
  for (const d of CANONICAL_DRILLS) {
    const { ok, missing } = assertCanonicalDrillShape(d);
    assert(ok, `${d.id} champs manquants: ${missing.join(",")}`);
    assert(["canonical", "legacy", "to_review", "excluded"].includes(d.status), `${d.id} status`);
    assert(typeof d.source === "string" && d.source.length > 0, `${d.id} source`);
  }
}

console.log("CD4 éducatif prêt / review : nage + objectif ; matos cohérent");
{
  for (const d of CANONICAL_DRILLS.filter((x) => x.status === "canonical")) {
    assert(Array.isArray(d.strokes) && d.strokes.length > 0, `${d.id} sans nage`);
    assert(
      (Array.isArray(d.objectiveTags) && d.objectiveTags.length > 0) ||
        (typeof d.utility === "string" && d.utility.length > 0),
      `${d.id} sans objectif`,
    );
    assert(typeof d.category === "string" && d.category.length > 0, `${d.id} sans catégorie`);
    for (const eq of [...d.equipmentRequired, ...d.equipmentOptional]) {
      assert(typeof eq === "string" && eq.length > 0, `${d.id} matos vide`);
      assert(!/^aucun$/i.test(eq), `${d.id} matos « Aucun » dans tableau`);
    }
  }
}

console.log("CD5 compatibilité matériel (tableaux, pas de conflit pull+palmes requis)");
{
  for (const d of CANONICAL_DRILLS) {
    const req = new Set(d.equipmentRequired || []);
    assert(!(req.has("pull") && req.has("palmes")), `${d.id} pull+palmes requis ensemble`);
  }
}

console.log("CD6 inventaire runtime TECHNIQUE inchangé");
{
  assert(countTechniqueDrills() === 97, "97 drills TECHNIQUE");
  assert(TECHNIQUE_DRILL_ENTRIES.length === 97, "TECHNIQUE_DRILL_ENTRIES");
  assert(LEGACY_TECHNIQUE_SERIES.length === 97, "LEGACY_TECHNIQUE_SERIES");
  assert(Object.keys(TECHNIQUE).length === 9, "9 focus");
  const inv = getExerciseInventory().filter((e) => e.type === "technique");
  assert(inv.length === 97, "exercise-library technique count");
  const counts = countBankItems();
  assert(counts.techniqueDrills === 97, "countBankItems technique");
}

console.log("CD7 canonical non vide + lookup");
{
  const counts = countCanonicalByStatus();
  assert(counts.canonical >= 1, "au moins 1 canonical");
  assert(counts.excluded >= 1, "propositions excluded présentes");
  assert(counts.to_review >= 1, "to_review présentes");
  assert(counts.legacy >= 1, "legacy catalogue UI");
  const fleche = getCanonicalDrillById("educatif_fleche");
  assert(fleche && fleche.status === "canonical", "flèche canonical");
  const petit = getCanonicalDrillById("educatif_petit_chien");
  assert(petit && petit.status === "to_review", "petit chien to_review");
}

console.log("CD8 séries legacy pointent vers des ids connus ou vide");
{
  const known = new Set(CANONICAL_DRILLS.map((d) => d.id));
  for (const s of LEGACY_TECHNIQUE_SERIES) {
    for (const id of s.canonicalIds || []) {
      assert(known.has(id) || id.startsWith("educatif_"), `série ${s.id} → ${id}`);
      assert(getCanonicalDrillById(id) || id.startsWith("educatif_"), `lookup ${id}`);
    }
  }
}

const counts = countCanonicalByStatus();
console.log("canonical-drills.test.js OK", counts);
