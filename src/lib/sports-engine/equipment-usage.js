/**
 * Utilisation du matériel — engagement quand inventaire non vide.
 * Filtre (ne jamais demander du matos absent) + injection visible.
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
    !!brief.taperLoad?.taperStage;
  if (taperish) return true;
  if (/recuperation|recup|repos|^race$|race_day|competition/.test(intent)) return true;
  if (brief.role?.isRaceDay || brief.isRaceDay || brief.role?.sessionIntent === "race") return true;
  return false;
}

function pickOne(list, rng) {
  if (!list.length) return null;
  return list[Math.floor(rng() * list.length) % list.length];
}

function buildNotes(applied, intent, usage) {
  const techNote = [];
  const corpsNote = [];
  if (applied.includes("tuba")) techNote.push("tuba frontal");
  if (applied.includes("planche")) techNote.push("planche");
  if (applied.includes("elastique")) techNote.push("élastique");
  if (applied.includes("palmes")) {
    if (intent === "technique_endurance" || intent === "quatre_nages" || usage === "meaningful") {
      techNote.push("palmes");
    } else {
      corpsNote.push("palmes");
    }
  }
  if (applied.includes("pull")) corpsNote.push("pull-buoy");
  if (applied.includes("plaquettes")) corpsNote.push("plaquettes");

  const note =
    applied.length === 0
      ? ""
      : applied.includes("palmes") && applied.includes("tuba")
        ? "palmes + tuba"
        : applied[0] === "pull"
          ? "pull-buoy"
          : applied[0] === "tuba"
            ? "tuba frontal"
            : applied[0] === "elastique"
              ? "élastique"
              : applied.join(" + ");

  return {
    note,
    techNote: techNote.length ? techNote.join(" + ") : "",
    corpsNote: corpsNote.length ? corpsNote.join(" + ") : "",
  };
}

/**
 * Décide si / comment utiliser le matos disponible.
 * Inventaire non vide + hors exempt → toujours ≥1 item appliqué (visible).
 * Jamais tout le matos d'un coup. Déterministe via rng.
 */
export function resolveEquipmentUsage(brief = {}, rng = Math.random) {
  const available = normalizeEquipmentList(brief.equipment);
  if (!available.length) {
    return { usage: "none", applied: [], note: "", techNote: "", corpsNote: "", engaged: false };
  }

  const intent = brief.sessionIntent || brief.intent || "";
  const quality = !!brief.qualitySession;
  const exempt = isEquipmentEngagementExempt(brief);

  /** @type {EquipmentUsage} */
  let usage = "none";

  if (exempt) {
    // Affûtage / récup / course : rarement un peu de matos, jamais forcé
    const roll = rng();
    if (roll >= 0.18) {
      return { usage: "none", applied: [], note: "", techNote: "", corpsNote: "", engaged: false };
    }
    usage = "optional";
  } else {
    // Engagement : meaningful ~55 %, optional ~45 % — jamais none
    let roll = rng();
    if (intent === "technique_endurance" || intent === "quatre_nages" || intent === "reprise") {
      roll = Math.max(0, roll - 0.12);
    }
    if (quality) roll = Math.max(0, roll - 0.05);
    usage = roll < 0.55 ? "meaningful" : "optional";
  }

  const preferTech = [];
  const preferCorps = [];
  if (available.includes("tuba")) preferTech.push("tuba");
  if (available.includes("planche")) preferTech.push("planche");
  if (available.includes("elastique")) preferTech.push("elastique");
  if (available.includes("palmes")) {
    preferTech.push("palmes");
    preferCorps.push("palmes");
  }
  if (available.includes("pull")) preferCorps.push("pull");
  if (available.includes("plaquettes")) preferCorps.push("plaquettes");

  const primaryPool = preferTech.length || preferCorps.length
    ? [...new Set([...preferTech, ...preferCorps])]
    : available;

  let applied = [pickOne(primaryPool, rng)].filter(Boolean);

  // meaningful : parfois palmes + tuba (complémentaires), jamais pull + palmes
  if (usage === "meaningful" && applied.includes("palmes") && available.includes("tuba") && rng() < 0.45) {
    if (!applied.includes("tuba")) applied.push("tuba");
  }

  if (applied.includes("pull") && applied.includes("palmes")) {
    applied = rng() < 0.5 ? ["pull"] : ["palmes"];
  }

  // Engagement hors exempt : garantir ≥1
  if (!exempt && applied.length === 0 && available.length) {
    applied = [pickOne(available, rng)].filter(Boolean);
  }

  const notes = buildNotes(applied, intent, usage);
  return {
    usage: applied.length ? usage : "none",
    applied,
    ...notes,
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
