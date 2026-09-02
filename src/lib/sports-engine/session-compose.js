/**
 * Composition séance : volume → architecture ; filtrage matériel / complexité.
 * Le rendu détaillé reste dans swim-session-generator (blocs Arthur).
 */
import { splitSessionBlocks, splitSessionBlocksDecouverte, splitSessionBlocksRegulier, splitSessionBlocksSportif, splitSessionBlocksPerformance, biasBlocksForObjectif } from "./volume.js";
import { EQUIPMENT_IDS } from "./types.js";

const FINGER_PADDLE_RE = /finger\s*paddles?|plaquettes?\s*doigts|palettes?\s*digitales/i;
const EQUIP_KEYWORDS = {
  planche: /planche/i,
  pull: /pull|pull-buoy|pull buoy/i,
  palmes: /palmes?/i,
  tuba: /tuba/i,
  plaquettes_doigts: FINGER_PADDLE_RE,
  plaquettes: /plaquette/i,
  elastique: /elastique|élastique|ankle\s*band/i,
};

function stripSansEquipment(text) {
  return String(text || "").replace(
    /sans\s+(planche|palmes|pull|tuba|plaquettes?(?:\s*doigts)?|finger\s*paddles?|[ée]lastique)/gi,
    "",
  );
}

/** Détecte le matériel requis dans des lignes de détail */
export function detectEquipmentInDetails(details = []) {
  const text = stripSansEquipment(details.join(" "));
  return EQUIPMENT_IDS.filter((id) => {
    if (id === "plaquettes") {
      const stripped = text.replace(FINGER_PADDLE_RE, "");
      return EQUIP_KEYWORDS.plaquettes.test(stripped);
    }
    return EQUIP_KEYWORDS[id]?.test(text);
  });
}

function eachDetailLine(source, fn) {
  const chunks = Array.isArray(source) ? source.filter(Boolean) : [String(source || "")];
  for (const chunk of chunks) {
    for (const line of String(chunk).split(/\n+/)) {
      const t = line.trim();
      if (!t) continue;
      if (fn(t)) return true;
    }
  }
  return false;
}

/**
 * Pull-buoy et palmes sont incompatibles **dans le même exercice** (même ligne).
 * Posséder les deux, ou les utiliser le même jour sur des lignes différentes, est OK.
 */
export function hasPullPalmesConflict(source) {
  return eachDetailLine(source, (t) => /pull/i.test(t) && /palmes?/i.test(t));
}

/** Élastique chevilles : jamais avec palmes ni planche sur la même ligne. Pull + élastique OK. */
export function hasElastiqueKickConflict(source) {
  return eachDetailLine(source, (t) => {
    if (!/[ée]lastique/i.test(t)) return false;
    return /palmes?/i.test(t) || /planche/i.test(t);
  });
}

export function hasEquipmentLineConflict(source) {
  return hasPullPalmesConflict(source) || hasElastiqueKickConflict(source);
}

/**
 * True si la séance est compatible inventaire.
 * equipment=null → inventaire inconnu → autorise tout sauf combos interdits.
 */
export function sessionFitsEquipment(details, equipment) {
  const required = detectEquipmentInDetails(details);
  if (hasEquipmentLineConflict(details)) return false;

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
    why: `${family} · ${objKey || " - "} · ${blocks.depart}+${blocks.technique}+${blocks.corps}+${blocks.rac}m`,
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
