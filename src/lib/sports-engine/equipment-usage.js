/**
 * Matériel : pédagogie d'abord (éducatif → outil), jamais au hasard sur le titre.
 * Interdit pull + palmes dans la même séance :
 * pull-buoy entre les jambes = pas de battements (bras seuls) ;
 * palmes = battements. Les deux en même temps n'ont aucun sens.
 * Inventaire : on peut posséder les deux ; on ne les combine pas le même jour.
 * Beat / tempo (3T, 5T, 7T, 9T) : le moteur ne colle jamais de tuba dessus
 * (le tuba coupe le compte). Tuba OK s’il est déjà noté dans l’Excel sur l’éducatif.
 * Engagement : inventaire non vide hors récup/taper → ≥1 item visible quand possible.
 * @typedef {'none'|'optional'|'meaningful'} EquipmentUsage
 */

const KNOWN = ["palmes", "tuba", "pull", "plaquettes", "pull-buoy", "planche", "elastique"];

/** Compte de respiration / tempo (3, 5, 7, 9 beats). */
export const BREATHING_BEAT_RE =
  /\b(?:3|5|7|9)\s*T\b|(?:respiration|bilatéral(?:e)?)\s*(?:3|5|7|9)(?:\s*T)?|(?:3|5|7|9)\s*temps/i;

export function hasBreathingBeat(text) {
  return BREATHING_BEAT_RE.test(String(text || ""));
}

/** Même ligne (ou même prescription) : beat/tempo + tuba = interdit. */
export function hasBeatTubaConflict(source) {
  const lines = Array.isArray(source)
    ? source.filter(Boolean).map(String)
    : String(source || "")
        .split("\n")
        .filter(Boolean);
  return lines.some((line) => hasBreathingBeat(line) && /\btuba\b/i.test(line));
}

/** Retire le tuba d'une ligne qui demande un beat/tempo. */
export function stripTubaFromBeatLine(text) {
  const raw = String(text ?? "");
  if (!hasBreathingBeat(raw) || !/\btuba\b/i.test(raw)) return raw;
  return raw
    .replace(/\bpalmes\s*(?:\+|et)\s*tuba(?:\s+frontal)?\b/gi, "palmes")
    .replace(/\btuba(?:\s+frontal)?\b/gi, "")
    .replace(/\s*\+\s*(?=\s*[·—–,]|$)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,;·])/g, "$1")
    .replace(/\s+—\s*—/g, " — ")
    .replace(/\s+$/g, "")
    .replace(/^\s+/g, "")
    .replace(/\s+avec\s*$/i, "")
    .trim();
}

/** Note matos sans tuba si le label demande déjà un beat/tempo. */
export function filterMatosNoteForLabel(label, matosNote) {
  if (!matosNote) return "";
  if (!hasBreathingBeat(label)) return String(matosNote);
  return String(matosNote)
    .replace(/\bpalmes\s*(?:\+|et)\s*tuba(?:\s+frontal)?\b/gi, "palmes")
    .replace(/\btuba(?:\s+frontal)?\b/gi, "")
    .replace(/\s*\+\s*/g, " + ")
    .replace(/^\s*\+\s*|\s*\+\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function normalizeEquipmentList(equipment) {
  if (!Array.isArray(equipment)) return [];
  return equipment
    .map((e) => String(e || "").toLowerCase().trim())
    .filter((e) => KNOWN.includes(e) || e === "pullbuoy" || e === "élastique")
    .map((e) => {
      if (e === "pullbuoy" || e === "pull-buoy") return "pull";
      if (e === "élastique") return "elastique";
      return e;
    });
}

/** Récup / taper / course : pas d’obligation d’engager le matos. */
export function isEquipmentEngagementExempt(brief = {}) {
  const intent = String(brief.sessionIntent || brief.intent || "").toLowerCase();
  const phase = String(brief.effectivePhase || brief.phase || "").toLowerCase();
  const taperStage = brief.taperStage || brief.taperLoad?.taperStage || null;
  const taperish =
    phase === "taper" ||
    phase === "competition" ||
    !!taperStage ||
    ["s1", "s2", "s3", "race_week", "race_day"].includes(String(taperStage || ""));
  if (taperish) return true;
  if (/recuperation|recup|repos|^race$|race_day|competition/.test(intent)) return true;
  if (brief.role?.isRaceDay || brief.isRaceDay || brief.role?.sessionIntent === "race") return true;
  return false;
}

/** Outils utiles pour un focus — premier possédé = celui qu'on prend. */
export function pedagogicalTechEquipment(techFocus, level = "regulier") {
  switch (techFocus) {
    case "technique_jambes":
      return ["planche", "palmes"];
    case "technique_roulis":
      return ["palmes"];
    case "technique_respiration":
      // Pas de matos inventé : 3T/5T… ≠ tuba collé. Tuba seulement s’il est déjà dans l’Excel.
      return [];
    case "technique_croisement":
      // Alignement / entrée de main → tuba OK (souvent noté Excel).
      return ["tuba"];
    case "technique_catchup":
      return level === "regulier" || level === "decouverte" ? ["palmes"] : ["plaquettes", "palmes"];
    case "technique_fleche":
    case "technique_grand_chien":
      return ["palmes", "tuba"];
    case "technique_virages":
      return ["palmes"];
    default:
      return [];
  }
}

export function forbiddenTechEquipment(techFocus) {
  if (techFocus === "technique_roulis") return ["plaquettes"];
  if (techFocus === "technique_jambes") return ["pull", "plaquettes"];
  // Respiration : pas de palmes collées sur 3T. Tuba autorisé s’il est dans l’Excel (pas inventé).
  if (techFocus === "technique_respiration") return ["plaquettes", "palmes"];
  return [];
}

function firstOwned(prefer, available) {
  return prefer.find((eq) => available.includes(eq)) || null;
}

function displayName(eq) {
  if (eq === "pull") return "pull-buoy";
  if (eq === "tuba") return "tuba frontal";
  return eq;
}

function pickOne(list, rng) {
  if (!list.length) return null;
  return list[Math.floor(rng() * list.length) % list.length];
}

/**
 * Décide si / comment utiliser le matos disponible.
 * Lié à l'éducatif du jour — pas un roll indépendant.
 * Inventaire non vide + hors exempt → engagement visible.
 */
export function resolveEquipmentUsage(brief = {}, rng = Math.random) {
  const available = normalizeEquipmentList(brief.equipment);
  const empty = {
    usage: "none",
    applied: [],
    note: "",
    techNote: "",
    corpsNote: "",
    engaged: false,
  };
  if (!available.length) return empty;

  const intent = brief.sessionIntent || brief.intent || "";
  const quality = !!brief.qualitySession;
  const techFocus = brief.techFocus || brief.primaryTechnicalGoal || "";
  const level = brief.level || "regulier";
  const exempt = isEquipmentEngagementExempt(brief);
  const roll = typeof rng === "function" ? rng() : Math.random();

  if (exempt) {
    // Soft optionnel en récup/taper — rarement
    if (roll >= 0.18) return empty;
  }

  const prefer = pedagogicalTechEquipment(techFocus, level);
  const forbidden = new Set(forbiddenTechEquipment(techFocus));
  const wishPrefer = Array.isArray(brief.wishPreferEquipment)
    ? brief.wishPreferEquipment.filter((e) => available.includes(e) && !forbidden.has(e))
    : [];
  const preferAllowed = prefer.filter((e) => available.includes(e) && !forbidden.has(e));
  const techEq =
    firstOwned(wishPrefer.length ? wishPrefer : preferAllowed, available) ||
    firstOwned(preferAllowed, available);

  let useTech = false;
  if (techEq === "planche" && techFocus === "technique_jambes") useTech = roll < 0.9;
  else if (techEq === "palmes" && techFocus === "technique_roulis") useTech = roll < 0.85;
  else if (techEq === "tuba" && /croisement|fleche|chien/.test(techFocus)) useTech = roll < 0.8;
  else if (techEq) useTech = roll < (exempt ? 0.45 : 0.72);
  else if (!exempt && preferAllowed.length) useTech = roll < 0.55;

  const applied = [];
  const techNote = [];
  const corpsNote = [];

  if (useTech && techEq && !forbidden.has(techEq)) {
    if (techFocus === "technique_fleche" || techFocus === "technique_grand_chien") {
      if (available.includes("palmes")) {
        applied.push("palmes");
        techNote.push("palmes");
      }
      if (available.includes("tuba")) {
        applied.push("tuba");
        techNote.push("tuba frontal");
      }
    } else {
      applied.push(techEq);
      techNote.push(displayName(techEq));
    }
  }

  // Engagement hors exempt : ≥1 item.
  // Ne pas inventer de matos tech hors pédagogie / wish (ex. tuba sur respiration 3T) :
  // tuba Excel reste via la banque ; ici on bascule sur le corps.
  if (!exempt && applied.length === 0 && available.length) {
    const techPool = wishPrefer.length
      ? wishPrefer
      : preferAllowed;
    const corpsPool = available.filter(
      (e) => (e === "pull" || forbidden.has(e) || !techPool.includes(e)) && e !== "plaquettes",
    );
    const pick =
      pickOne(techPool, typeof rng === "function" ? rng : Math.random) ||
      pickOne(corpsPool.length ? corpsPool : available, typeof rng === "function" ? rng : Math.random);
    if (pick) {
      applied.push(pick);
      if (techPool.includes(pick) && pick !== "pull" && !forbidden.has(pick)) {
        techNote.push(displayName(pick));
      } else {
        corpsNote.push(displayName(pick));
      }
    }
  }

  const palmesOn = applied.includes("palmes");
  const canPull =
    available.includes("pull") &&
    !palmesOn &&
    !quality &&
    !/vitesse|vo2|test/.test(intent);
  const rollC = typeof rng === "function" ? rng() : Math.random();
  if (canPull && rollC < 0.4 && !wishPrefer.includes("palmes")) {
    applied.push("pull");
    corpsNote.push("pull-buoy");
  }

  if (applied.includes("pull") && applied.includes("palmes")) {
    applied.splice(applied.indexOf("pull"), 1);
    const idx = corpsNote.indexOf("pull-buoy");
    if (idx >= 0) corpsNote.splice(idx, 1);
  }

  const usage =
    applied.length === 0
      ? "none"
      : techNote.length && corpsNote.length
        ? "meaningful"
        : applied.length
          ? "optional"
          : "none";
  const note = [...techNote, ...corpsNote].join(" + ");

  return {
    usage,
    applied,
    note,
    techNote: techNote.join(" + "),
    corpsNote: corpsNote.join(" + "),
    engaged: applied.length > 0,
  };
}

/** Suffixe label nage avec matos corps (format restitution : `avec …`). */
export function labelWithEquipment(baseLabel, eqUsage) {
  if (!eqUsage?.corpsNote) return baseLabel;
  const base = String(baseLabel || "nage").trim();
  if (/palmes|tuba|pull|planche|plaquette|avec\s/i.test(base)) return base;
  return `${base} avec ${eqUsage.corpsNote}`;
}
