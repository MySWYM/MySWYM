/**
 * Utilisation du matériel Régulier — influence la composition sans être systématique.
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

/**
 * Décide si / comment utiliser le matos disponible.
 * Jamais tout le matos d'un coup. Déterministe via rng.
 */
export function resolveEquipmentUsage(brief = {}, rng = Math.random) {
  const available = normalizeEquipmentList(brief.equipment);
  if (!available.length) {
    return { usage: "none", applied: [], note: "", techNote: "", corpsNote: "" };
  }

  const intent = brief.sessionIntent || brief.intent || "";
  const quality = !!brief.qualitySession;
  const phase = brief.effectivePhase || brief.phase || "";
  const taperish = phase === "taper" || phase === "competition" || !!brief.taperStage;

  // Bias : technique / reprise / 4n → plus souvent meaningful ; récup / taper → souvent none
  let roll = rng();
  if (intent === "recuperation" || taperish) roll = Math.min(1, roll + 0.25);
  if (intent === "technique_endurance" || intent === "quatre_nages" || intent === "reprise") {
    roll = Math.max(0, roll - 0.15);
  }
  if (quality) roll = Math.max(0, roll - 0.05);

  /** @type {EquipmentUsage} */
  let usage = "none";
  if (roll < 0.32) usage = "meaningful";
  else if (roll < 0.62) usage = "optional";
  else usage = "none";

  if (usage === "none") {
    return { usage, applied: [], note: "", techNote: "", corpsNote: "" };
  }

  // Choisir 1 item (meaningful) ou 0–1 (optional)
  const pick = (list) => list[Math.floor(rng() * list.length) % list.length];

  // Préférences sémantiques
  const preferTech = [];
  const preferCorps = [];
  if (available.includes("tuba")) preferTech.push("tuba");
  if (available.includes("palmes")) {
    preferTech.push("palmes");
    preferCorps.push("palmes");
  }
  if (available.includes("pull")) preferCorps.push("pull");

  let applied = [];
  if (usage === "optional") {
    if (rng() < 0.55) {
      applied = [pick(preferTech.length ? preferTech : available)];
    }
  } else {
    // meaningful : 1 item, parfois 2 si complementary (palmes+tuba) sans pull+palmes
    const primaryPool = preferTech.length || preferCorps.length
      ? [...new Set([...preferTech, ...preferCorps])]
      : available;
    applied = [pick(primaryPool)];
    if (
      applied.includes("palmes") &&
      available.includes("tuba") &&
      rng() < 0.4 &&
      !applied.includes("tuba")
    ) {
      applied.push("tuba");
    }
    // Interdit pull + palmes
    if (applied.includes("pull") && applied.includes("palmes")) {
      applied = rng() < 0.5 ? ["pull"] : ["palmes"];
    }
  }

  const techNote = [];
  const corpsNote = [];
  if (applied.includes("tuba")) techNote.push("tuba frontal");
  if (applied.includes("palmes")) {
    if (intent === "technique_endurance" || usage === "meaningful") techNote.push("palmes");
    else corpsNote.push("palmes");
  }
  if (applied.includes("pull")) corpsNote.push("pull-buoy");

  const note =
    applied.length === 0
      ? ""
      : applied.includes("palmes") && applied.includes("tuba")
        ? "palmes + tuba"
        : applied[0] === "pull"
          ? "pull-buoy"
          : applied[0] === "tuba"
            ? "tuba frontal"
            : applied.join(" + ");

  return {
    usage,
    applied,
    note,
    techNote: techNote.length ? techNote.join(" + ") : "",
    corpsNote: corpsNote.length ? corpsNote.join(" + ") : "",
  };
}

/** Suffixe label nage avec matos corps si pertinent. */
export function labelWithEquipment(baseLabel, eqUsage) {
  if (!eqUsage?.corpsNote) return baseLabel;
  return `${baseLabel} · ${eqUsage.corpsNote}`;
}
