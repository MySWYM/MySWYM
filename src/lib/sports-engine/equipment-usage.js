/**
 * Matériel : pédagogie d'abord (éducatif → outil), jamais au hasard sur le titre.
 * Interdit pull + palmes dans la même séance :
 * pull-buoy entre les jambes = pas de battements (bras seuls) ;
 * palmes = battements. Les deux en même temps n'ont aucun sens.
 * Inventaire : on peut posséder les deux ; on ne les combine pas le même jour.
 * Engagement : inventaire non vide hors récup/taper → ≥1 item visible quand possible.
 * @typedef {'none'|'optional'|'meaningful'} EquipmentUsage
 */

const KNOWN = ["palmes", "tuba", "pull", "plaquettes", "pull-buoy", "planche", "elastique"];

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

/**
 * Outils utiles pour un focus — premier possédé = celui qu'on prend.
 * 3T/5T = 1 respiration tous les N coups de bras (tête qui tourne) → PAS de tuba frontal
 * (le tuba fixe la tête et annule l'exercice). Tuba = flèche / grand chien / aisance débutant.
 */
export function pedagogicalTechEquipment(techFocus, level = "regulier") {
  switch (techFocus) {
    case "technique_jambes":
      return ["planche", "palmes"];
    case "technique_roulis":
      return ["palmes"];
    case "technique_respiration":
    case "technique_croisement":
      // Respiration rythmée (3T/5T/bilatéral) : pas de matos — surtout pas de tuba
      return [];
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
  // 3T/5T = rotation de tête pour respirer → tuba frontal interdit (et palmes/plaquettes inutiles)
  if (techFocus === "technique_respiration" || techFocus === "technique_croisement") {
    return ["plaquettes", "palmes", "tuba"];
  }
  return [];
}

/** Ligne éducatif 3T/5T/7T / bilatéral : incompatible avec tuba frontal. */
export function isBreathPatternLine(text) {
  return /\b\d+\s*T\b|3T|5T|7T|9T|bilatéral|hypoxie\s*\d|respiration\s+(?:3|5|7)\s*temps/i.test(
    String(text || ""),
  );
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
  const forbidden = forbiddenTechEquipment(techFocus);
  const wishPrefer = Array.isArray(brief.wishPreferEquipment)
    ? brief.wishPreferEquipment.filter((e) => available.includes(e) && !forbidden.includes(e))
    : [];
  const techEq =
    firstOwned(wishPrefer.length ? wishPrefer : prefer, available) ||
    firstOwned(prefer, available);
  const techEqOk = techEq && !forbidden.includes(techEq);

  let useTech = false;
  if (techEqOk && techEq === "planche" && techFocus === "technique_jambes") useTech = roll < 0.9;
  else if (techEqOk && techEq === "palmes" && techFocus === "technique_roulis") useTech = roll < 0.85;
  else if (techEqOk && techEq === "tuba" && /fleche|chien/.test(techFocus)) useTech = roll < 0.8;
  else if (techEqOk) useTech = roll < (exempt ? 0.45 : 0.72);
  else if (!exempt && available.length && prefer.length === 0 && /respiration|croisement/.test(techFocus)) {
    // Respiration 3T/5T : pas de matos sur l'éducatif ; engagement via corps (pull) si possible
    useTech = false;
  } else if (!exempt && available.length) useTech = roll < 0.55;

  const applied = [];
  const techNote = [];
  const corpsNote = [];

  if (useTech && techEqOk) {
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
  // Interdits = pas sur l'éducatif (ex. tuba sur 3T, pull sur jambes) ;
  // le pull reste OK au corps même un jour jambes.
  if (!exempt && applied.length === 0 && available.length) {
    const techSafe = available.filter((e) => !forbidden.includes(e));
    const preferAvail = prefer.filter((e) => techSafe.includes(e));
    const wishTech = wishPrefer.filter((e) => techSafe.includes(e));

    if (/respiration|croisement/.test(techFocus) && available.includes("pull")) {
      applied.push("pull");
      corpsNote.push("pull-buoy");
    } else if (wishTech.length || preferAvail.length) {
      const pick = pickOne(
        wishTech.length ? wishTech : preferAvail,
        typeof rng === "function" ? rng : Math.random,
      );
      if (pick) {
        applied.push(pick);
        if (pick === "pull") corpsNote.push("pull-buoy");
        else techNote.push(displayName(pick));
      }
    } else if (available.includes("pull") && !available.includes("palmes")) {
      applied.push("pull");
      corpsNote.push("pull-buoy");
    } else if (techSafe.length) {
      const pick = pickOne(techSafe, typeof rng === "function" ? rng : Math.random);
      if (pick) {
        applied.push(pick);
        if (pick === "pull") corpsNote.push("pull-buoy");
        else techNote.push(displayName(pick));
      }
    }
    // Sinon : inventaire entièrement inutilisable pour ce focus (ex. seul tuba un jour 3T)
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

  // Dedupe (engagement + corps pull peuvent doubler)
  const uniq = (arr) => [...new Set(arr)];
  const appliedUniq = uniq(applied);
  const techNoteUniq = uniq(techNote);
  const corpsNoteUniq = uniq(corpsNote);

  const usage =
    appliedUniq.length === 0
      ? "none"
      : techNoteUniq.length && corpsNoteUniq.length
        ? "meaningful"
        : appliedUniq.length
          ? "optional"
          : "none";
  const note = [...techNoteUniq, ...corpsNoteUniq].join(" + ");
  const engagementSkippedReason =
    !exempt &&
    available.length > 0 &&
    appliedUniq.length === 0 &&
    available.every((e) => forbidden.includes(e) || (e === "pull" && available.includes("palmes")))
      ? "forbidden_for_focus"
      : null;

  return {
    usage,
    applied: appliedUniq,
    note,
    techNote: techNoteUniq.join(" + "),
    corpsNote: corpsNoteUniq.join(" + "),
    engaged: appliedUniq.length > 0,
    engagementSkippedReason,
  };
}

/** Suffixe label nage avec matos corps (format restitution : `avec …`). */
export function labelWithEquipment(baseLabel, eqUsage) {
  if (!eqUsage?.corpsNote) return baseLabel;
  const base = String(baseLabel || "nage").trim();
  if (/palmes|tuba|pull|planche|plaquette|avec\s/i.test(base)) return base;
  return `${base} avec ${eqUsage.corpsNote}`;
}
