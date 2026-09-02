/**
 * Matériel : pédagogie d'abord (éducatif → outil), jamais au hasard sur le titre.
 * Interdit pull + palmes dans le même exercice (même ligne) :
 * pull-buoy entre les jambes = pas de battements ; palmes = battements.
 * Posséder les deux, ou les utiliser le même jour sur des lignes distinctes : OK.
 * Engagement : inventaire non vide hors récup/taper → ≥1 item visible quand possible.
 * @typedef {'none'|'optional'|'meaningful'} EquipmentUsage
 */

const KNOWN = ["palmes", "tuba", "pull", "plaquettes", "plaquettes_doigts", "pull-buoy", "planche", "elastique"];

export function normalizeEquipmentList(equipment) {
  if (!Array.isArray(equipment)) return [];
  return equipment
    .map((e) => String(e || "").toLowerCase().trim())
    .filter((e) => KNOWN.includes(e) || e === "pullbuoy" || e === "élastique" || e === "finger paddles" || e === "finger paddle" || e === "plaquettes doigts")
    .map((e) => {
      if (e === "pullbuoy" || e === "pull-buoy") return "pull";
      if (e === "élastique") return "elastique";
      if (e === "finger paddles" || e === "finger paddle" || e === "plaquettes doigts") return "plaquettes_doigts";
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

/** Outils utiles pour un focus, premier possédé = celui qu'on prend. */
export function pedagogicalTechEquipment(techFocus, level = "regulier") {
  switch (techFocus) {
    case "technique_jambes":
      return ["planche", "palmes"];
    case "technique_roulis":
      return ["palmes"];
    case "technique_respiration":
    case "technique_croisement":
      return ["tuba"];
    case "technique_catchup":
      return level === "regulier" || level === "decouverte"
        ? ["palmes"]
        : ["plaquettes_doigts", "plaquettes", "palmes"];
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
  const paddles = ["plaquettes", "plaquettes_doigts"];
  if (techFocus === "technique_roulis") return [...paddles];
  if (techFocus === "technique_jambes") return ["pull", "elastique", ...paddles];
  if (techFocus === "technique_respiration") return [...paddles, "palmes"];
  return [];
}

function firstOwned(prefer, available) {
  return prefer.find((eq) => available.includes(eq)) || null;
}

function displayName(eq) {
  if (eq === "pull") return "pull-buoy";
  if (eq === "tuba") return "tuba frontal";
  if (eq === "plaquettes_doigts") return "plaquettes doigts";
  if (eq === "elastique") return "élastique";
  return eq;
}

/** Si les deux paddle types sont possédés : fingers = appui, plaquettes = force. Un seul = il couvre les deux. */
function preferPaddleForRole(available, role) {
  const hasFingers = available.includes("plaquettes_doigts");
  const hasClassic = available.includes("plaquettes");
  if (hasFingers && hasClassic) {
    return role === "appui" ? "plaquettes_doigts" : "plaquettes";
  }
  if (role === "appui") return hasFingers ? "plaquettes_doigts" : hasClassic ? "plaquettes" : null;
  return hasClassic ? "plaquettes" : hasFingers ? "plaquettes_doigts" : null;
}

function pickOne(list, rng) {
  if (!list.length) return null;
  return list[Math.floor(rng() * list.length) % list.length];
}

/**
 * Décide si / comment utiliser le matos disponible.
 * Lié à l'éducatif du jour, pas un roll indépendant.
 * Inventaire non vide + hors exempt → engagement visible.
 */
export function resolveEquipmentUsage(brief = {}, rng = Math.random) {
  const rawAvailable = normalizeEquipmentList(brief.equipment);
  const empty = {
    usage: "none",
    applied: [],
    note: "",
    techNote: "",
    corpsNote: "",
    engaged: false,
  };
  const intent = brief.sessionIntent || brief.intent || "";
  const quality = !!brief.qualitySession;
  const techFocus = brief.techFocus || brief.primaryTechnicalGoal || "";
  const level = brief.level || "regulier";
  const available = level === "decouverte"
    ? rawAvailable.filter((e) => !["plaquettes", "plaquettes_doigts", "elastique"].includes(e))
    : rawAvailable;
  if (!available.length) return empty;
  const forbidden = forbiddenTechEquipment(techFocus);
  const exempt = isEquipmentEngagementExempt(brief);
  const roll = typeof rng === "function" ? rng() : Math.random();

  if (exempt) {
    // Soft optionnel en récup/taper, rarement
    if (roll >= 0.18) return empty;
  }

  const prefer = pedagogicalTechEquipment(techFocus, level);
  const wishPrefer = Array.isArray(brief.wishPreferEquipment)
    ? brief.wishPreferEquipment.filter((e) => available.includes(e))
    : [];
  let techEq =
    firstOwned(wishPrefer.length ? wishPrefer : prefer, available) ||
    firstOwned(prefer, available);
  if (techEq === "plaquettes" || techEq === "plaquettes_doigts") {
    const role = /catchup|appui/.test(techFocus) ? "appui" : "force";
    techEq = preferPaddleForRole(available, role) || techEq;
  }

  let useTech = false;
  if (techEq === "planche" && techFocus === "technique_jambes") useTech = roll < 0.9;
  else if (techEq === "palmes" && techFocus === "technique_roulis") useTech = roll < 0.85;
  else if (techEq === "tuba" && /respiration|croisement|fleche|chien/.test(techFocus)) useTech = roll < 0.8;
  else if (techEq) useTech = roll < (exempt ? 0.45 : 0.72);
  else if (!exempt && available.length) useTech = roll < 0.55;

  const applied = [];
  const techNote = [];
  const corpsNote = [];

  if (useTech && techEq && !forbidden.includes(techEq)) {
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

  // Engagement hors exempt : garantir ≥1 item pédagogique / wish / inventaire
  if (!exempt && applied.length === 0 && available.length) {
    let fallbackPool = wishPrefer.length
      ? wishPrefer
      : prefer.filter((e) => available.includes(e)).length
        ? prefer.filter((e) => available.includes(e))
        : available.filter((e) => !forbidden.includes(e));
    if (available.includes("plaquettes") && available.includes("plaquettes_doigts")) {
      const keep = /catchup|appui/.test(techFocus) ? "plaquettes_doigts" : "plaquettes";
      const drop = keep === "plaquettes_doigts" ? "plaquettes" : "plaquettes_doigts";
      const narrowed = fallbackPool.filter((e) => e !== drop);
      if (narrowed.length) fallbackPool = narrowed;
    }
    const pick = pickOne(fallbackPool.length ? fallbackPool : available, typeof rng === "function" ? rng : Math.random);
    if (pick && !forbidden.includes(pick)) {
      applied.push(pick);
      if (pick === "pull") corpsNote.push("pull-buoy");
      else if (pick === "elastique") corpsNote.push("élastique");
      else techNote.push(displayName(pick));
    }
  }

  const canPull =
    available.includes("pull") &&
    !quality &&
    !/vitesse|vo2|test/.test(intent) &&
    !forbidden.includes("pull");
  const rollC = typeof rng === "function" ? rng() : Math.random();
  if (canPull && rollC < 0.4 && !applied.includes("pull") && !wishPrefer.includes("palmes")) {
    // Autorisé même si palmes déjà dans la séance : conflit géré à la ligne d'exo.
    applied.push("pull");
    corpsNote.push("pull-buoy");
  }

  const canElastique =
    available.includes("elastique") &&
    !quality &&
    !/vitesse|vo2|test/.test(intent) &&
    !forbidden.includes("elastique");
  if (canElastique && !applied.includes("elastique") && (applied.includes("pull") ? rollC < 0.55 : rollC < 0.32)) {
    applied.push("elastique");
    corpsNote.push("élastique");
    // Premier temps : pull + élastique, plus facile (jambes portées).
    if (canPull && !applied.includes("pull")) {
      applied.push("pull");
      corpsNote.push("pull-buoy");
    }
  }

  const forcePaddle = preferPaddleForRole(available, "force");
  if (
    forcePaddle &&
    !applied.includes(forcePaddle) &&
    !applied.includes("plaquettes") &&
    !applied.includes("plaquettes_doigts") &&
    !forbidden.includes(forcePaddle) &&
    (applied.includes("pull") || applied.includes("elastique")) &&
    rollC < 0.35
  ) {
    applied.push(forcePaddle);
    corpsNote.push(displayName(forcePaddle));
  }

  // Plus de purge session-wide pull+palmes, règle = même exercice seulement.

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
  if (/palmes|tuba|pull|planche|plaquette|[ée]lastique|avec\s/i.test(base)) return base;
  return `${base} avec ${eqUsage.corpsNote}`;
}
