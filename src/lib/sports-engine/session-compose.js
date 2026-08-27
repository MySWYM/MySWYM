/**
 * Composition séance : volume → architecture ; filtrage matériel / complexité.
 * Le rendu détaillé reste dans swim-session-generator (blocs Arthur).
 */
import { splitSessionBlocks, splitSessionBlocksDecouverte, splitSessionBlocksRegulier, splitSessionBlocksSportif, splitSessionBlocksPerformance, biasBlocksForObjectif } from "./volume.js";
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
 * Pull-buoy et palmes sont incompatibles **dans le même exercice** (même ligne).
 * Posséder les deux, ou les utiliser le même jour sur des lignes différentes, est OK.
 */
export function hasPullPalmesConflict(source) {
  const chunks = Array.isArray(source) ? source.filter(Boolean) : [String(source || "")];
  for (const chunk of chunks) {
    for (const line of String(chunk).split(/\n+/)) {
      const t = line.trim();
      if (!t) continue;
      if (/pull/i.test(t) && /palmes?/i.test(t)) return true;
    }
  }
  return false;
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
}) {
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
  return {
    family,
    phase,
    isKeySession,
    level,
    objectif: objKey,
    volumeTarget: blocks.total,
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
  // Sportif / Performance : zones réelles
  if (!zone) return "Z2";
  if (/Z4/.test(zone)) return "Z4";
  if (/Z3/.test(zone)) return "Z3";
  if (/Z2/.test(zone)) return "Z2";
  return "Z1";
}
