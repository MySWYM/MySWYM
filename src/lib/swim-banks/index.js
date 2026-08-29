/**
 * Façade banques natation, étape 1 (extraction mécanique).
 * Runtime historique continue via swim-session-generator.js (ré-exports).
 */
export { LEGACY_SOURCE_FILE, roundTo, estimateLinesDistance, block, bankMeta } from "./_helpers.js";

export {
  DEPARTS_SEMAINE,
  DEPARTS_AVEC_JAMBES,
  ECHAUFFEMENTS,
  WARMUP_ENTRIES,
} from "./warmups.js";

export {
  FINS_SEMAINE,
  RETOURS_CALME,
  COOLDOWN_ENTRIES,
} from "./cooldowns.js";

export {
  TECHNIQUE,
  FOCUS_CYCLE,
  FOCUS_CYCLE_DECOUVERTE,
  TECHNIQUE_FOCUS_KEYS,
  TECHNIQUE_DRILL_ENTRIES,
} from "./technique-drills.js";

export {
  CORPS_PHYSIO,
  MAIN_SET_POOL_KEYS,
  MAIN_SET_ENTRIES,
} from "./main-sets.js";

export {
  OW_BASE_SESSIONS,
  SESSION_ARCHETYPE_ENTRIES,
} from "./session-archetypes.js";

export {
  MATERIEL_DECOUVERTE,
  RESPIRATIONS,
  LABEL_ENTRIES,
} from "./labels.js";

export {
  CANONICAL_DRILLS,
  LEGACY_TECHNIQUE_SERIES,
  CANONICAL_DRILL_META,
  getCanonicalDrills,
  getCanonicalDrillById,
  countCanonicalByStatus,
  listExactCanonicalDuplicates,
  assertCanonicalDrillShape,
} from "./canonical-drills.js";

import { WARMUP_ENTRIES } from "./warmups.js";
import { COOLDOWN_ENTRIES } from "./cooldowns.js";
import { TECHNIQUE_DRILL_ENTRIES } from "./technique-drills.js";
import { MAIN_SET_ENTRIES } from "./main-sets.js";
import { SESSION_ARCHETYPE_ENTRIES } from "./session-archetypes.js";
import { LABEL_ENTRIES } from "./labels.js";
import { CANONICAL_DRILLS } from "./canonical-drills.js";

/** Inventaire plat métadonnées (id / source / status), banques runtime étape 1. */
export function getBankCatalog() {
  return {
    warmups: WARMUP_ENTRIES,
    cooldowns: COOLDOWN_ENTRIES,
    techniqueDrills: TECHNIQUE_DRILL_ENTRIES,
    mainSets: MAIN_SET_ENTRIES,
    sessionArchetypes: SESSION_ARCHETYPE_ENTRIES,
    labels: LABEL_ENTRIES,
    /** Préparation étape 2, ne pas utiliser pour composer une séance. */
    canonicalDrills: CANONICAL_DRILLS,
  };
}

export function countBankItems() {
  const c = getBankCatalog();
  return {
    departs: c.warmups.filter((e) => e.kind === "depart").length,
    departsJambes: c.warmups.filter((e) => e.kind === "depart_jambes").length,
    echauffementsDead: c.warmups.filter((e) => e.kind === "echauffement_dead").length,
    fins: c.cooldowns.filter((e) => e.kind === "fin").length,
    retoursDead: c.cooldowns.filter((e) => e.kind === "retour_calme_dead").length,
    techniqueDrills: c.techniqueDrills.length,
    mainSets: c.mainSets.length,
    archetypes: c.sessionArchetypes.length,
    labels: c.labels.length,
  };
}
