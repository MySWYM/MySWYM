/**
 * Bibliothèque d'exercices = inventaire normalisé des pools existants
 * (TECHNIQUE, CORPS_PHYSIO, DEPARTS, FINS) — pas une nouvelle banque inventée.
 */
import {
  TECHNIQUE,
  CORPS_PHYSIO,
  DEPARTS_SEMAINE,
  DEPARTS_AVEC_JAMBES,
  FINS_SEMAINE,
} from "../swim-banks/index.js";
import { EQUIPMENT_IDS } from "./types.js";
import { detectEquipmentInDetails } from "./session-compose.js";

const LEVEL_RANK = { decouverte: 0, regulier: 1, sportif: 2, performance: 3 };

const FOCUS_META = {
  technique_fleche: {
    minLevel: "decouverte",
    maxLevel: "performance",
    technicalGoals: ["fleche", "glisse"],
    complexity: 1,
    incompatibilities: [],
  },
  technique_grand_chien: {
    minLevel: "decouverte",
    maxLevel: "performance",
    technicalGoals: ["grand_chien", "aisance"],
    complexity: 1,
    incompatibilities: [],
  },
  technique_chiens: {
    minLevel: "regulier",
    maxLevel: "performance",
    technicalGoals: ["chien", "aisance"],
    complexity: 2,
    incompatibilities: ["decouverte"], // petit chien interdit Découverte
  },
  technique_jambes: {
    minLevel: "regulier",
    maxLevel: "performance",
    technicalGoals: ["jambes", "gainage"],
    complexity: 2,
    incompatibilities: ["decouverte"],
  },
  technique_catchup: {
    minLevel: "regulier",
    maxLevel: "performance",
    technicalGoals: ["rattrape", "glisse"],
    complexity: 3,
    incompatibilities: ["decouverte"],
  },
  technique_roulis: {
    minLevel: "regulier",
    maxLevel: "performance",
    technicalGoals: ["roulis", "rotation"],
    complexity: 3,
    incompatibilities: ["decouverte"],
  },
  technique_respiration: {
    minLevel: "regulier",
    maxLevel: "performance",
    technicalGoals: ["respiration"],
    complexity: 3,
    incompatibilities: ["decouverte"], // apnée / 5T / 7T trop avancés
  },
  technique_croisement: {
    minLevel: "regulier",
    maxLevel: "performance",
    technicalGoals: ["alignement", "entree_main"],
    complexity: 2,
    incompatibilities: ["decouverte"],
  },
  technique_virages: {
    minLevel: "sportif",
    maxLevel: "performance",
    technicalGoals: ["virage", "culbute"],
    complexity: 4,
    incompatibilities: ["decouverte", "regulier"],
  },
};

const ADVANCED_RE = /Z3|Z4|CSS|seuil|VO2|hypoxie|apnée|apnee|7T|9T|chrono|sprint|à bloc|depart plongé|culbute|petit chien|rattrapé|catch-up|plaquettes/i;
const COMPLEX_SERIES_RE = /\d+\s*[x×]\s*\(\s*\d+\s*[x×]/i;

function inferComplexity(text, base = 2) {
  let c = base;
  if (/flèche|grand chien|nage facile|très facile|souple/i.test(text)) c = Math.min(c, 1);
  if (ADVANCED_RE.test(text)) c = Math.max(c, 4);
  if (COMPLEX_SERIES_RE.test(text)) c = Math.max(c, 3);
  if (/3T\/5T\/7T|respiration 7T|respiration 9T/i.test(text)) c = Math.max(c, 4);
  return Math.min(5, c);
}

function inferIntensityRange(text) {
  if (/Z4|sprint|à bloc|chrono max/i.test(text)) return ["Z3", "Z4"];
  if (/Z3|seuil|CSS|@/i.test(text)) return ["Z2", "Z3"];
  if (/Z2/i.test(text)) return ["Z1", "Z2"];
  return ["Z1", "Z2"];
}

function inferIncompatibilities(focusKey, text, meta) {
  const out = new Set(meta.incompatibilities || []);
  if (ADVANCED_RE.test(text) || /petit chien/i.test(text)) out.add("decouverte");
  if (/culbute|virage/i.test(text)) {
    out.add("decouverte");
    out.add("regulier");
  }
  if (focusKey === "technique_respiration" && /apnée|7T|9T/i.test(text)) out.add("decouverte");
  return [...out];
}

function snapRepRange(distance) {
  if (distance <= 200) return [4, 8];
  if (distance <= 400) return [4, 12];
  if (distance <= 600) return [4, 16];
  return [2, 12];
}

/**
 * Inventaire complet des drills TECHNIQUE (~97) + départs / corps / fins.
 * Métadonnées : niveau, objectif, matériel, bloc, complexité, incompatibilités.
 */
export function buildExerciseInventory() {
  /** @type {object[]} */
  const catalog = [];

  for (const [focusKey, focus] of Object.entries(TECHNIQUE)) {
    const meta = FOCUS_META[focusKey] || {
      minLevel: "regulier",
      maxLevel: "performance",
      technicalGoals: [focusKey.replace(/^technique_/, "")],
      complexity: 3,
      incompatibilities: ["decouverte"],
    };
    focus.drills.forEach((drill, idx) => {
      const lines = drill.lines || [];
      const text = lines.join(" ");
      const requiredEquipment = detectEquipmentInDetails(lines);
      const complexity = inferComplexity(text, meta.complexity);
      catalog.push({
        id: `${focusKey}_${idx}`,
        name: focus.label,
        type: "technique",
        strokes: inferStrokes(text),
        minLevel: meta.minLevel,
        maxLevel: meta.maxLevel,
        requiredEquipment,
        technicalGoals: meta.technicalGoals,
        intensityRange: inferIntensityRange(text),
        allowedBlocks: ["technique"],
        distanceRange: [drill.distance, drill.distance],
        repetitionRange: snapRepRange(drill.distance),
        defaultRest: 15,
        complexity,
        instructions: lines,
        variants: [],
        incompatibilities: inferIncompatibilities(focusKey, text, meta),
        source: `TECHNIQUE.${focusKey}[${idx}]`,
        focusKey,
        rawDistance: drill.distance,
      });
    });
  }

  // Départs (wrappers)
  DEPARTS_SEMAINE.forEach((fn, idx) => {
    const sample = fn();
    const text = sample.text || "";
    const requiredEquipment = detectEquipmentInDetails([text]);
    catalog.push({
      id: `depart_${idx}`,
      name: "Départ Z1",
      type: "depart",
      strokes: inferStrokes(text),
      minLevel: /godille/i.test(text) ? "regulier" : "decouverte",
      maxLevel: "performance",
      requiredEquipment,
      technicalGoals: ["aisance", "echauffement"],
      intensityRange: ["Z1"],
      allowedBlocks: ["depart"],
      distanceRange: [sample.distance, sample.distance],
      repetitionRange: [1, 1],
      defaultRest: 0,
      complexity: inferComplexity(text, 1),
      instructions: [text],
      variants: [],
      incompatibilities: /godille|jambes/i.test(text) ? ["decouverte"] : [],
      source: `DEPARTS_SEMAINE[${idx}]`,
      rawDistance: sample.distance,
    });
  });

  DEPARTS_AVEC_JAMBES.forEach((fn, idx) => {
    const sample = fn();
    catalog.push({
      id: `depart_jambes_${idx}`,
      name: "Départ jambes",
      type: "depart",
      strokes: ["crawl", "dos"],
      minLevel: "regulier",
      maxLevel: "performance",
      requiredEquipment: detectEquipmentInDetails([sample.text]),
      technicalGoals: ["jambes"],
      intensityRange: ["Z1"],
      allowedBlocks: ["depart"],
      distanceRange: [sample.distance, sample.distance],
      repetitionRange: [1, 1],
      defaultRest: 0,
      complexity: 2,
      instructions: [sample.text],
      variants: [],
      incompatibilities: ["decouverte"],
      source: `DEPARTS_AVEC_JAMBES[${idx}]`,
      rawDistance: sample.distance,
    });
  });

  // Corps physio — builders matérialisés une fois
  for (const [poolKey, builders] of Object.entries(CORPS_PHYSIO)) {
    builders.forEach((fn, idx) => {
      const sample = fn();
      const text = sample.text || "";
      const requiredEquipment = detectEquipmentInDetails([text]);
      const complexity = inferComplexity(text, poolKey === "test" || poolKey === "vitesse" ? 4 : 2);
      const incompat = [];
      if (complexity >= 3 || /Z3|CSS|chrono|sprint|à bloc|sighting|drafting/i.test(text)) {
        incompat.push("decouverte");
      }
      if (poolKey === "test" || poolKey === "vitesse") {
        incompat.push("decouverte");
        if (poolKey === "test") incompat.push("regulier");
      }
      catalog.push({
        id: `corps_${poolKey}_${idx}`,
        name: `Corps ${poolKey}`,
        type: "corps",
        strokes: ["crawl"],
        minLevel: incompat.includes("decouverte") ? "regulier" : "decouverte",
        maxLevel: "performance",
        requiredEquipment,
        technicalGoals: [poolKey],
        intensityRange: inferIntensityRange(text),
        allowedBlocks: ["corps"],
        distanceRange: [sample.distance, sample.distance],
        repetitionRange: snapRepRange(sample.distance),
        defaultRest: 20,
        complexity,
        instructions: [text],
        variants: [],
        incompatibilities: incompat,
        source: `CORPS_PHYSIO.${poolKey}[${idx}]`,
        poolKey,
        rawDistance: sample.distance,
        repDist: sample.repDist,
        pools: sample.pools || [25, 50],
      });
    });
  }

  // Fins
  FINS_SEMAINE.forEach((fn, idx) => {
    const sample = fn(200);
    catalog.push({
      id: `fin_${idx}`,
      name: "Retour au calme",
      type: "fin",
      strokes: ["crawl", "dos"],
      minLevel: "decouverte",
      maxLevel: "performance",
      requiredEquipment: [],
      technicalGoals: ["recuperation"],
      intensityRange: ["Z1"],
      allowedBlocks: ["fin"],
      distanceRange: [100, 400],
      repetitionRange: [1, 1],
      defaultRest: 0,
      complexity: 1,
      instructions: [sample],
      variants: [],
      incompatibilities: [],
      source: `FINS_SEMAINE[${idx}]`,
      finBuilderIndex: idx,
    });
  });

  return catalog;
}

function inferStrokes(text) {
  const strokes = [];
  if (/crawl|Cr\b/i.test(text)) strokes.push("crawl");
  if (/dos|Dos/i.test(text)) strokes.push("dos");
  if (/brasse/i.test(text)) strokes.push("brasse");
  if (/papillon/i.test(text)) strokes.push("papillon");
  return strokes.length ? strokes : ["crawl"];
}

let _cachedInventory = null;
export function getExerciseInventory() {
  if (!_cachedInventory) _cachedInventory = buildExerciseInventory();
  return _cachedInventory;
}

/** Compte drills TECHNIQUE uniquement */
export function countTechniqueDrills() {
  return Object.values(TECHNIQUE).reduce((n, f) => n + f.drills.length, 0);
}

/**
 * Filtre obligatoire : niveau, matos, bloc, objectif technique, intensité, phase.
 * Ne jamais forcer un exo incompatible pour remplir le volume.
 */
export function filterExercises(catalog, brief, opts = {}) {
  const block = opts.block;
  const level = brief.level || "regulier";
  const levelRank = LEVEL_RANK[level] ?? 1;
  const equipment = brief.equipment;
  const goal = brief.primaryTechnicalGoal;
  const intensity = brief.intensityTarget || "Z1";
  const maxZone = brief.maxIntensityZone || "Z4";

  return catalog.filter((ex) => {
    if (block && !ex.allowedBlocks.includes(block)) return false;
    if ((LEVEL_RANK[ex.minLevel] ?? 0) > levelRank) return false;
    if ((LEVEL_RANK[ex.maxLevel] ?? 3) < levelRank) return false;
    if (ex.incompatibilities?.includes(level)) return false;

    if (Array.isArray(equipment)) {
      if (equipment.length === 0 && ex.requiredEquipment.length > 0) return false;
      if (equipment.length > 0 && !ex.requiredEquipment.every((eq) => equipment.includes(eq))) {
        return false;
      }
    }

    if (block === "technique" && goal) {
      const focusOk =
        ex.focusKey === goal ||
        ex.technicalGoals?.some((g) => goal.includes(g) || g.includes(goal.replace(/^technique_/, "")));
      if (!focusOk && ex.type === "technique") return false;
    }

    // Intensité : rejeter si exo demande plus haut que plafond
    const exMax = ex.intensityRange?.[ex.intensityRange.length - 1] || "Z2";
    if (zoneRank(exMax) > zoneRank(maxZone)) return false;
    if (level === "decouverte" && zoneRank(exMax) > zoneRank("Z2")) return false;
    if (level === "decouverte" && intensity && zoneRank(exMax) > zoneRank(intensity) + 1) return false;

    if (level === "decouverte") {
      if (ex.complexity > 2) return false;
      if (ADVANCED_RE.test(ex.instructions.join(" "))) return false;
      if (COMPLEX_SERIES_RE.test(ex.instructions.join(" "))) return false;
    }

    if (opts.pool && ex.pools && !ex.pools.includes(opts.pool)) return false;

    return true;
  });
}

function zoneRank(z) {
  if (!z) return 1;
  if (/Z4/.test(z)) return 4;
  if (/Z3/.test(z)) return 3;
  if (/Z2/.test(z)) return 2;
  return 1;
}

/** Exercice incompatible matos → true si rejeté */
export function rejectsMissingEquipment(exercise, equipment) {
  if (!Array.isArray(equipment)) return false;
  if (!exercise?.requiredEquipment?.length) return false;
  return !exercise.requiredEquipment.every((eq) => equipment.includes(eq));
}

/** Séance / exo trop complexe pour Découverte */
export function rejectsDecouverteComplexity(exerciseOrText) {
  const text = typeof exerciseOrText === "string"
    ? exerciseOrText
    : (exerciseOrText?.instructions || []).join(" ");
  const complexity = typeof exerciseOrText === "object" ? exerciseOrText.complexity : inferComplexity(text);
  if (complexity > 2) return true;
  if (ADVANCED_RE.test(text)) return true;
  if (COMPLEX_SERIES_RE.test(text)) return true;
  return false;
}

export { EQUIPMENT_IDS, ADVANCED_RE, COMPLEX_SERIES_RE };
