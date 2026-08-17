/**
 * Composition séance : volume → architecture ; filtrage matériel / complexité.
 * Le rendu détaillé reste dans swim-session-generator (blocs Arthur).
 */
import { splitSessionBlocks, splitSessionBlocksDecouverte, splitSessionBlocksRegulier, splitSessionBlocksSportif, splitSessionBlocksPerformance, biasBlocksForObjectif, applySessionShape } from "./volume.js";
import { isEducatifSession } from "./week-roles.js";
import { EQUIPMENT_IDS } from "./types.js";

const EQUIP_KEYWORDS = {
  planche: /planche/i,
  pull: /pull|pull-buoy|pull buoy/i,
  palmes: /palmes?/i,
  tuba: /tuba/i,
  plaquettes: /plaquette/i,
  elastique: /elastique|élastique|elastic\s*band/i,
};

/** Détecte le matériel requis dans des lignes de détail */
export function detectEquipmentInDetails(details = []) {
  const text = details.join(" ").replace(/sans\s+(planche|palmes|pull|tuba|plaquettes?)/gi, "");
  return EQUIPMENT_IDS.filter((id) => EQUIP_KEYWORDS[id].test(text));
}

/**
 * Pull-buoy (entre les jambes → bras seuls, pas de battements)
 * et palmes (battements) sont incompatibles dans la même séance.
 * Posséder les deux dans l'inventaire est OK ; les combiner le même jour, non.
 */
export function hasPullPalmesConflict(source) {
  const text = Array.isArray(source) ? source.filter(Boolean).join(" ") : String(source || "");
  return /pull/i.test(text) && /palmes?/i.test(text);
}

/**
 * True si la séance est compatible inventaire.
 * equipment=null → inventaire inconnu → autorise tout sauf combos interdits.
 */
export function sessionFitsEquipment(details, equipment) {
  const required = detectEquipmentInDetails(details);
  if (hasPullPalmesConflict(details)) return false;

  if (equipment == null) return true; // inconnu
  if (equipment.length === 0) {
    // Aucun matos : refuser lignes qui exigent matos
    return required.length === 0;
  }
  return required.every((eq) => equipment.includes(eq));
}

/**
 * Blueprint volume avant génération des lignes.
 */
export function composeSessionBlueprint({
  volumeTarget,
  family = "endurance",
  level = "regulier",
  phase = "base",
  isKeySession = false,
  objectif = null,
  roleObjectif = null,
  educatifSession = null,
  sessionIntent = null,
} = {}) {
  let blocks =
    level === "decouverte"
      ? splitSessionBlocksDecouverte(volumeTarget)
      : level === "regulier"
        ? splitSessionBlocksRegulier(volumeTarget)
        : level === "sportif"
          ? splitSessionBlocksSportif(volumeTarget)
          : level === "performance"
            ? splitSessionBlocksPerformance(volumeTarget)
            : splitSessionBlocks(volumeTarget);
  const objKey = roleObjectif || objectif || family;
  blocks = biasBlocksForObjectif(blocks, objKey, level);
  const educatif =
    educatifSession === true ||
    (educatifSession == null &&
      isEducatifSession({ family, sessionIntent: sessionIntent || objKey, intent: sessionIntent }));
  blocks = applySessionShape(blocks, { educatif });
  return {
    family,
    phase,
    isKeySession,
    level,
    objectif: objKey,
    volumeTarget: blocks.total,
    educatifSession: !!educatif,
    blocks,
    why: `${family} · ${objKey || "—"} · ${blocks.depart}+${blocks.technique}+${blocks.corps}+${blocks.rac}m`,
  };
}

/** Affichage intensité selon niveau (§22) */
export function displayIntensity(zone, level, beginnerFriendly = false) {
  if (level === "decouverte" || beginnerFriendly) {
    if (!zone || /Z1$/.test(zone)) return "Très facile";
    if (/Z2/.test(zone) && !/Z3|Z4/.test(zone)) return "Facile";
    return "Modéré";
  }
  if (level === "regulier") {
    if (/Z1$/.test(zone || "")) return "Facile";
    if (/Z2/.test(zone || "") && !/Z3|Z4/.test(zone || "")) return "Modéré";
    return "Soutenu";
  }
  // Sportif / Performance : zones réelles sauf Z1 (D9 — jamais Z1 visible)
  if (!zone) return "Z2";
  if (/Z4/.test(zone)) return "Z4";
  if (/Z3/.test(zone)) return "Z3";
  if (/Z2/.test(zone)) return "Z2";
  return "Facile";
}
