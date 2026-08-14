/**
 * Matériel : pédagogie d'abord (éducatif → outil), jamais au hasard sur le titre.
 * Interdit pull + palmes dans la même séance :
 * pull-buoy entre les jambes = pas de battements (bras seuls) ;
 * palmes = battements. Les deux en même temps n'ont aucun sens.
 * Inventaire : on peut posséder les deux ; on ne les combine pas le même jour.
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

/** Outils utiles pour un focus — premier possédé = celui qu'on prend. */
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
      return level === "regulier" || level === "decouverte" ? ["palmes"] : ["plaquettes", "palmes"];
    case "technique_fleche":
    case "technique_grand_chien":
      return ["palmes", "tuba"];
    default:
      return [];
  }
}

export function forbiddenTechEquipment(techFocus) {
  if (techFocus === "technique_roulis") return ["plaquettes"];
  if (techFocus === "technique_jambes") return ["pull", "plaquettes"];
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

/**
 * Décide si / comment utiliser le matos disponible.
 * Lié à l'éducatif du jour — pas un roll indépendant.
 */
export function resolveEquipmentUsage(brief = {}, rng = Math.random) {
  const available = normalizeEquipmentList(brief.equipment);
  const empty = { usage: "none", applied: [], note: "", techNote: "", corpsNote: "" };
  if (!available.length) return empty;

  const intent = brief.sessionIntent || brief.intent || "";
  const quality = !!brief.qualitySession;
  const phase = brief.effectivePhase || brief.phase || "";
  const taperish =
    phase === "taper" ||
    phase === "competition" ||
    !!brief.taperStage ||
    ["s1", "s2", "race_week", "race_day"].includes(brief.taperLoad?.taperStage);
  const techFocus = brief.techFocus || brief.primaryTechnicalGoal || "";
  const level = brief.level || "regulier";
  const recup = intent === "recuperation" || intent === "reprise";

  if (taperish || recup) return empty;

  const prefer = pedagogicalTechEquipment(techFocus, level);
  const techEq = firstOwned(prefer, available);
  const roll = typeof rng === "function" ? rng() : Math.random();

  let useTech = false;
  if (techEq === "planche" && techFocus === "technique_jambes") useTech = roll < 0.9;
  else if (techEq === "palmes" && techFocus === "technique_roulis") useTech = roll < 0.85;
  else if (techEq === "tuba" && /respiration|croisement|fleche|chien/.test(techFocus)) useTech = roll < 0.8;
  else if (techEq) useTech = roll < 0.55;

  const applied = [];
  const techNote = [];
  const corpsNote = [];

  if (useTech && techEq) {
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

  const palmesOn = applied.includes("palmes");
  const canPull =
    available.includes("pull") &&
    !palmesOn &&
    !quality &&
    !/vitesse|vo2|test/.test(intent);
  const rollC = typeof rng === "function" ? rng() : Math.random();
  if (canPull && rollC < 0.4) {
    applied.push("pull");
    corpsNote.push("pull-buoy");
  }

  if (applied.includes("pull") && applied.includes("palmes")) {
    applied.splice(applied.indexOf("pull"), 1);
    corpsNote.length = 0;
  }

  const usage = applied.length === 0 ? "none" : techNote.length && corpsNote.length ? "meaningful" : applied.length ? "optional" : "none";
  const note = [...techNote, ...corpsNote].join(" + ");

  return {
    usage,
    applied,
    note,
    techNote: techNote.join(" + "),
    corpsNote: corpsNote.join(" + "),
  };
}

/** Suffixe label nage avec matos corps si pertinent. */
export function labelWithEquipment(baseLabel, eqUsage) {
  if (!eqUsage?.corpsNote) return baseLabel;
  return `${baseLabel} · ${eqUsage.corpsNote}`;
}
