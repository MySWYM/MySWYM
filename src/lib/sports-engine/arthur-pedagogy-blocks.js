/**
 * Blocs pédagogie Arthur pour composeSession (RAC, éducatifs, corps fun).
 * Fallback = chemins existants du composeur si budget / contraintes incompatibles.
 * Formats plats (N × Xm) pour cohérence volume sets ↔ details.
 */

import { humanizeArthurDisplayTerms, explicitEducatifLabel } from "./session-labels.js";
import { ARTHUR_DRAFT_DRILLS } from "../arthur-composer/arthur-drills-data.js";

const DECOUVERTE_ALLOW = new Set([
  "educatif_fleche",
  "educatif_grand_chien",
  "arthur_crawl_avec_tuba_frontal",
  "arthur_battements_bras_en_opposition",
  "nouveau_dos_deux_bras",
  "arthur_papillon_un_bras",
  "nouveau_jet_eau",
  "nouveau_ondule_tete",
  "nouveau_pousse_tete",
  "nouveau_papillon_baleine",
  "educatif_jambes_crawl",
  "educatif_jambes_dos",
]);

function roundTo(m, pool) {
  const p = pool === 50 ? 50 : 25;
  return Math.max(p, Math.round(Number(m) / p) * p);
}

function pick(rng, arr) {
  if (!arr?.length) return null;
  const r = typeof rng === "function" ? rng() : Math.random();
  return arr[Math.floor(r * arr.length)];
}

function hasEquip(available, need) {
  if (!need?.length) return true;
  const set = new Set((available || []).map((e) => String(e).toLowerCase()));
  const aliases = {
    tuba: ["tuba"],
    palmes: ["palmes", "palme"],
    "pull-buoy": ["pull-buoy", "pull", "pull buoy"],
    planche: ["planche"],
  };
  return need.every((n) => {
    const keys = aliases[n] || [n];
    return keys.some((k) => set.has(k));
  });
}

function line(text) {
  const body = String(text || "").replace(/^-/, "").trim();
  return `-${humanizeArthurDisplayTerms(body)}`;
}

function restCue(level, hard = false) {
  if (level === "decouverte") return hard ? "repos 30s" : "repos 15s";
  if (level === "regulier") return hard ? "repos 30s" : "repos 20s";
  return hard ? "repos 40s" : "repos 20s";
}

function makeContinuous(distance, { label, cue, block, exerciseId, zone }) {
  const s = {
    reps: 1,
    distancePerRep: distance,
    restSec: 0,
    label,
    cue: cue || "",
    block,
    exerciseId,
    continuous: true,
  };
  if (zone) s.zone = zone;
  return s;
}

function makeSeries(reps, distancePerRep, { label, cue, restSec, block, exerciseId, zone }) {
  const s = {
    reps,
    distancePerRep,
    restSec: restSec || 20,
    label,
    cue: cue || "",
    block,
    exerciseId,
    continuous: false,
  };
  if (zone) s.zone = zone;
  return s;
}

function volumeOf(sets) {
  return sets.reduce((a, s) => a + Number(s.reps || 0) * Number(s.distancePerRep || 0), 0);
}

/** Recalcule les lignes depuis les sets (évite désync volume). */
function linesFromSets(sets) {
  return sets.map((s) => {
    if (s.continuous || (s.reps === 1 && !s.restSec)) {
      return line(`${s.distancePerRep} m ${s.label}${s.cue ? ` — ${s.cue}` : ""}`);
    }
    return line(
      `${s.reps} × ${s.distancePerRep} m ${s.label}${s.cue ? ` — ${s.cue}` : ""} — repos ${s.restSec || 20}s`,
    );
  });
}

/** Ajuste sets/lines pour coller au budget (± unit). */
function fitToBudget(sets, lines, budget, pool, maxContinuous, block = "corps") {
  const unit = Math.min(pool === 50 ? 50 : 25, maxContinuous);
  let distance = volumeOf(sets);
  // Réduire
  while (distance > budget + unit && sets.length) {
    const last = sets[sets.length - 1];
    if (!last.continuous && last.reps > 2) {
      last.reps -= 1;
      distance -= last.distancePerRep;
    } else if (sets.length > 1) {
      const removed = sets.pop();
      distance -= removed.reps * removed.distancePerRep;
    } else {
      break;
    }
  }
  // Compléter
  while (distance + unit * 2 <= budget) {
    const need = budget - distance;
    const r = Math.max(2, Math.floor(need / unit));
    const add = r * unit;
    if (add > need + unit) break;
    sets.push(
      makeSeries(r, unit, {
        label: "crawl facile",
        cue: "sans forcer",
        restSec: 15,
        block,
        exerciseId: `${block}_fit`,
      }),
    );
    distance += add;
  }
  distance = volumeOf(sets);
  if (Math.abs(distance - budget) > 100) return null;
  return { sets, lines: linesFromSets(sets), distance };
}

/**
 * Mappe intent / brief → objectif pédagogique (corps fun).
 */
export function mapBriefToPedagogyObjective(brief = {}, intent = {}) {
  const id = String(intent.id || brief.sessionIntent || brief.family || "").toLowerCase();
  const obj = String(brief.objectif || "").toLowerCase();
  if (
    /quatre_nages|4n|decouverte_4n/.test(id) ||
    brief.strokeFocus === "4n" ||
    /4\s*nages|quatre/.test(obj)
  ) {
    return "4_nages";
  }
  if (/vo2|sprint/.test(id)) return "sprint";
  if (/vitesse|allure_specifique|course_piscine/.test(id)) return "vitesse";
  if (/seuil|qualite|allure_progressive|css|test/.test(id)) return "seuil";
  if (
    /technique|aisance|glisse|respiration|premieres|materiel|jambes|roulis|fleche|chien/.test(id)
  ) {
    return "technique";
  }
  if (/endurance|aerobie|eau_libre|triathlon|recuperation|reprise|seance_courte/.test(id)) {
    return "endurance";
  }
  if (/sprint/.test(obj)) return "sprint";
  if (/vitesse|speed/.test(obj)) return "vitesse";
  if (/seuil|css/.test(obj)) return "seuil";
  if (/tech/.test(obj)) return "technique";
  return "endurance";
}

/**
 * D10 — dos à deux bras 100 ou 200 m « facile, sans forcer ».
 * Respecte maxContinuous (séries si besoin). Distance totale = budget.
 */
export function buildArthurCooldownForBudget({
  budget,
  pool = 25,
  level = "regulier",
  objective = "endurance",
  equipment = [],
  maxContinuous = 200,
  rng = Math.random,
  zone = null,
} = {}) {
  const target = roundTo(budget, pool);
  if (!target || target < 50) return null;

  const p = pool === 50 ? 50 : 25;
  const unit = Math.min(p, maxContinuous);
  const cue = "facile, sans forcer";

  const usePap = false; // papillon un bras en RAC seulement si maîtrise + palmes (bâché : QG papillon)

  let coreDist = target >= 200 && level !== "decouverte" ? (rng() > 0.45 ? 200 : 100) : 100;
  if (level === "decouverte") coreDist = Math.min(100, target);
  if (coreDist !== 100 && coreDist !== 200) coreDist = 100;
  if (coreDist > target) coreDist = target >= 100 ? 100 : target;

  const label = usePap ? "papillon un bras avec palmes" : "dos à deux bras";
  const exerciseId = usePap ? "arthur_papillon_un_bras" : "nouveau_dos_deux_bras";

  const sets = [];
  const lines = [];
  let remaining = target;

  const preferDos =
    level === "decouverte" ||
    level === "regulier" ||
    objective === "technique" ||
    usePap ||
    rng() > 0.25;

  if (preferDos && coreDist >= 100 && coreDist <= target) {
    if (coreDist <= maxContinuous) {
      sets.push(
        makeContinuous(coreDist, {
          label,
          cue,
          block: "fin",
          exerciseId,
          zone,
        }),
      );
      lines.push(line(`${coreDist} m ${label} — ${cue}`));
    } else {
      const reps = Math.max(2, Math.round(coreDist / unit));
      const dist = reps * unit;
      if (Math.abs(dist - coreDist) > 50 && unit * 2 > maxContinuous) return null;
      sets.push(
        makeSeries(reps, unit, {
          label,
          cue,
          restSec: 15,
          block: "fin",
          exerciseId,
          zone,
        }),
      );
      lines.push(line(`${reps} × ${unit} m ${label} — ${cue} — repos 15s`));
      coreDist = reps * unit;
    }
    remaining = target - coreDist;
  }

  if (remaining >= unit) {
    const fillLabel = "crawl facile";
    if (remaining <= maxContinuous) {
      sets.push(
        makeContinuous(remaining, {
          label: fillLabel,
          cue: "retour au calme, sans forcer",
          block: "fin",
          exerciseId: "fin_arthur_fill",
          zone,
        }),
      );
      lines.push(line(`${remaining} m ${fillLabel} — retour au calme, sans forcer`));
    } else {
      const reps = Math.max(2, Math.round(remaining / unit));
      const dist = reps * unit;
      sets.push(
        makeSeries(reps, unit, {
          label: fillLabel,
          cue: "retour au calme",
          restSec: 15,
          block: "fin",
          exerciseId: "fin_arthur_fill",
          zone,
        }),
      );
      lines.push(line(`${reps} × ${unit} m ${fillLabel} — retour au calme — repos 15s`));
      // Ajuster si écart
      const got = reps * unit;
      if (got !== remaining && sets.length) {
        // laisser tolérance volume globale
      }
    }
  }

  if (!sets.length) {
    // Fallback simple sans dos
    if (target <= maxContinuous) {
      sets.push(
        makeContinuous(target, {
          label: "au choix",
          cue: "retour au calme, sans forcer",
          block: "fin",
          exerciseId: "fin_arthur_easy",
          zone,
        }),
      );
      lines.push(line(`${target} m au choix — retour au calme, sans forcer`));
    } else {
      const reps = Math.max(2, Math.round(target / unit));
      sets.push(
        makeSeries(reps, unit, {
          label: "au choix",
          cue: "retour au calme",
          restSec: 15,
          block: "fin",
          exerciseId: "fin_arthur_easy",
          zone,
        }),
      );
      lines.push(line(`${reps} × ${unit} m au choix — retour au calme — repos 15s`));
    }
  }

  const distance = sets.reduce((a, s) => a + s.reps * s.distancePerRep, 0);
  if (Math.abs(distance - target) > 100) {
    const fitted = fitToBudget(sets, lines, target, pool, maxContinuous, "fin");
    if (!fitted) return null;
    return {
      distance: fitted.distance,
      sets: fitted.sets,
      lines: fitted.lines,
      recipeId: exerciseId || "fin_arthur",
    };
  }

  return {
    distance,
    sets,
    lines,
    recipeId: exerciseId || "fin_arthur",
  };
}

function selectDrills(rng, { level, objective, equipment, count = 2, papillonOk = false }) {
  let pool = ARTHUR_DRAFT_DRILLS.filter((d) => {
    if (d.id === "ui_catalog_progressif") return false;
    // Excel « niveau Arthur » : l’éducatif doit lister le niveau utilisateur.
    if (!Array.isArray(d.levels) || !d.levels.includes(level)) return false;
    // Découverte : allowlist pédagogique (règle 8) en plus des niveaux Excel.
    if (level === "decouverte" && !DECOUVERTE_ALLOW.has(d.id)) return false;
    if (d.recoveryOnly && (level === "sportif" || level === "performance")) return false;
    if (!hasEquip(equipment, d.equipmentRequired)) return false;
    if (!papillonOk && /papillon/i.test(`${d.name} ${d.stroke} ${d.id}`)) return false;
    return true;
  });

  if (objective === "technique") {
    pool = [...pool].sort((a, b) => Number(b.isArthurAdd) - Number(a.isArthurAdd));
  } else if (objective === "4_nages") {
    const tagged = pool.filter((d) => (d.objectiveTags || []).includes("4_nages"));
    if (tagged.length >= count) {
      pool = tagged;
    } else {
      const filtered = pool.filter(
        (d) => /dos|brasse|papillon|4/i.test(d.stroke) || /dos|brasse|papillon/i.test(d.name),
      );
      if (filtered.length >= count) pool = filtered;
    }
  }

  // Prefer drills that engage declared matos, then shuffle lightly
  const eqScore = (d) => {
    const need = [...(d.equipmentRequired || []), ...(d.equipmentOptional || [])];
    return need.filter((e) => hasEquip(equipment, [e])).length;
  };
  pool = [...pool].sort((a, b) => {
    const diff = eqScore(b) - eqScore(a);
    if (diff !== 0) return diff;
    return (typeof rng === "function" ? rng() : Math.random()) - 0.5;
  });

  const chosen = [];
  const used = new Set();
  for (const d of pool) {
    if (chosen.length >= count) break;
    if (used.has(d.id)) continue;
    chosen.push(d);
    used.add(d.id);
  }

  if (level === "decouverte" && chosen.length) {
    const mustIds =
      objective === "4_nages"
        ? ["nouveau_dos_deux_bras", "arthur_papillon_un_bras", "nouveau_papillon_baleine"]
        : ["educatif_fleche", "educatif_grand_chien", "arthur_crawl_avec_tuba_frontal"];
    const must = mustIds
      .map((id) =>
        ARTHUR_DRAFT_DRILLS.find(
          (d) =>
            d.id === id &&
            d.levels?.includes("decouverte") &&
            DECOUVERTE_ALLOW.has(d.id) &&
            hasEquip(equipment, d.equipmentRequired) &&
            (papillonOk || !/papillon/i.test(`${d.name} ${d.stroke} ${d.id}`)),
        ),
      )
      .filter(Boolean);
    if (must.length) {
      chosen[0] = pick(rng, must);
    }
  }

  return chosen.slice(0, count);
}

/**
 * Bloc technique éducatifs Arthur — volume ≈ targetVol.
 */
export function buildArthurTechniqueBlock({
  budget,
  pool = 25,
  level = "regulier",
  objective = "technique",
  equipment = [],
  maxContinuous = 200,
  rng = Math.random,
  zone = null,
  papillonOk = false,
  engageEquipment = true,
} = {}) {
  const target = roundTo(budget, pool);
  if (!target || target < 50) return null;

  const p = pool === 50 ? 50 : 25;
  const unit = Math.min(p, maxContinuous);
  const drills = selectDrills(rng, {
    level,
    objective,
    equipment,
    papillonOk,
    count: target >= unit * 6 ? 2 : level === "decouverte" ? 2 : 1,
  });
  if (!drills.length) return null;
  // Découverte : toujours 2 formats (variété pédagogique)
  if (level === "decouverte" && drills.length === 1) {
    const alt = selectDrills(rng, { level, objective, equipment, papillonOk, count: 2 }).find(
      (d) => d.id !== drills[0].id,
    );
    if (alt) drills.push(alt);
  }

  const sets = [];
  const lines = [];
  const used = [];
  let remaining = target;
  const perDrill = Math.floor(target / drills.length);

  drills.forEach((d, idx) => {
    const slice = idx === drills.length - 1 ? remaining : Math.min(perDrill, remaining);
    const reps = Math.max(2, Math.round(slice / unit));
    const dist = reps * unit;
    remaining -= dist;
    const displayName =
      explicitEducatifLabel(d.name) ||
      explicitEducatifLabel(d.id) ||
      d.name;
    const ownedMat = [];
    for (const e of d.equipmentRequired || []) {
      if (hasEquip(equipment, [e])) ownedMat.push(e === "pull-buoy" ? "pull-buoy" : e);
    }
    for (const e of d.equipmentOptional || []) {
      if (hasEquip(equipment, [e]) && !ownedMat.includes(e)) ownedMat.push(e);
    }
    // Découverte + matos dispo : coller sur flèche / grand chien
    if (
      level === "decouverte" &&
      /flèche|fleche|grand chien|chien/i.test(d.name + d.id)
    ) {
      if (hasEquip(equipment, ["palmes"]) && !ownedMat.includes("palmes")) ownedMat.push("palmes");
      if (hasEquip(equipment, ["tuba"]) && !ownedMat.includes("tuba")) ownedMat.push("tuba");
    }
    // Sportif/régulier : 1er éducatif engage 1 item déclaré si l’éducatif n’en a pas
    if (engageEquipment && idx === 0 && level !== "decouverte" && !ownedMat.length) {
      if (hasEquip(equipment, ["tuba"])) ownedMat.push("tuba");
      else if (hasEquip(equipment, ["palmes"])) ownedMat.push("palmes");
      else if (hasEquip(equipment, ["pull-buoy"])) ownedMat.push("pull-buoy");
      else if (hasEquip(equipment, ["planche"])) ownedMat.push("planche");
    }
    const needLabel = ownedMat.filter((e) => {
      const token = String(e).replace(/-buoy/i, "").replace(/s$/, "");
      return !new RegExp(token, "i").test(displayName);
    });
    const mat = needLabel.length
      ? ` avec ${needLabel.map((e) => (e === "pull-buoy" ? "pull-buoy" : e === "tuba" ? "tuba frontal" : e)).join(" et ")}`
      : "";
    const cue = "facile, sans forcer — focus geste";
    const rest = restCue(level);
    sets.push(
      makeSeries(reps, unit, {
        label: `${displayName}${mat}`,
        cue,
        restSec: level === "decouverte" ? 15 : 20,
        block: "technique",
        exerciseId: d.id,
        zone,
      }),
    );
    lines.push(line(`${reps} × ${unit} m ${displayName}${mat} — ${cue} — ${rest}`));
    used.push({ id: d.id, name: displayName });
  });

  // Petit contraste fun si reste (pas un 2e éducatif clone)
  if (remaining >= unit * 2) {
    const reps = Math.max(2, Math.floor(remaining / unit));
    const usePlanche = engageEquipment && hasEquip(equipment, ["planche"]);
    const label = usePlanche ? "jambes crawl avec planche" : "crawl jeu";
    const cue = usePlanche ? "battements souples, tête neutre" : "accélère les 10 derniers mètres";
    sets.push(
      makeSeries(reps, unit, {
        label,
        cue,
        restSec: 15,
        block: "technique",
        exerciseId: usePlanche ? "tech_arthur_jambes_planche" : "tech_arthur_fun",
        zone,
      }),
    );
    lines.push(line(`${reps} × ${unit} m ${label} — ${cue} — repos 15s`));
    remaining -= reps * unit;
  }

  const distance = sets.reduce((a, s) => a + s.reps * s.distancePerRep, 0);
  if (distance < target * 0.55) return null;
  const fitted = fitToBudget(sets, lines, target, pool, maxContinuous, "technique");
  if (!fitted) return null;

  return { distance: fitted.distance, sets: fitted.sets, lines: fitted.lines, drills: used };
}

/**
 * Corps fun par objectif — formats plats, allures contrastées.
 */
export function buildArthurFunMainBlock({
  budget,
  pool = 25,
  level = "regulier",
  objective = "endurance",
  maxContinuous = 200,
  rng = Math.random,
  zone = null,
} = {}) {
  const target = roundTo(budget, pool);
  if (!target || target < 150) return null;

  const p = pool === 50 ? 50 : 25;
  const unit = Math.min(Math.max(p, 25), maxContinuous);
  const longRest = level === "decouverte" ? "repos 40s" : "repos 45s";
  const sets = [];
  const lines = [];

  const pushSeries = (reps, dist, label, cue, restSec, id) => {
    const r = Math.max(2, reps);
    const d = Math.min(dist, maxContinuous);
    sets.push(
      makeSeries(r, d, {
        label,
        cue,
        restSec: restSec || 20,
        block: "corps",
        exerciseId: id,
        zone,
      }),
    );
    lines.push(line(`${r} × ${d} m ${label}${cue ? ` — ${cue}` : ""} — repos ${restSec || 20}s`));
    return r * d;
  };

  let filled = 0;
  const obj = objective;

  if (obj === "sprint") {
    const work = Math.min(50, maxContinuous);
    const kick = Math.min(100, maxContinuous);
    const easy = Math.min(50, maxContinuous);
    const block = work * 2 + kick + easy;
    const cycles = Math.max(2, Math.min(5, Math.floor(target / block)));
    for (let i = 0; i < cycles; i++) {
      filled += pushSeries(2, work, "crawl", "allure sprint", 40, `corps_sprint_w_${i}`);
      filled += pushSeries(
        Math.max(2, Math.round(kick / Math.min(50, maxContinuous))),
        Math.min(50, maxContinuous),
        "jambes crawl",
        "à bloc",
        30,
        `corps_sprint_k_${i}`,
      );
      filled += pushSeries(
        Math.max(2, Math.round(easy / unit)),
        unit,
        "crawl facile",
        "récup active",
        20,
        `corps_sprint_e_${i}`,
      );
    }
  } else if (obj === "seuil") {
    const work = Math.min(p * 4, maxContinuous);
    const cycles = Math.max(3, Math.min(6, Math.floor((target * 0.7) / work)));
    filled += pushSeries(cycles, work, "crawl", "allure seuil, régulière", 30, "corps_seuil");
    const left = target - filled;
    if (left >= unit * 4) {
      const reps = Math.min(4, Math.floor(left / (unit * 2)));
      filled += pushSeries(reps, unit * 2, "jambes crawl", "soutenu", 25, "corps_seuil_kick");
      const left2 = target - filled;
      if (left2 >= unit * 2) {
        filled += pushSeries(
          Math.max(2, Math.floor(left2 / unit)),
          unit,
          "crawl facile",
          "sans forcer",
          20,
          "corps_seuil_easy",
        );
      }
    }
  } else if (obj === "vitesse") {
    const cycles = Math.max(3, Math.min(6, Math.floor(target / (unit * 3))));
    filled += pushSeries(cycles, unit, "crawl", "lent", 20, "corps_vit_lent");
    filled += pushSeries(cycles, unit, "crawl", "moyen", 25, "corps_vit_moy");
    filled += pushSeries(cycles, unit, "crawl", "vite", 40, "corps_vit_vite");
    const left = target - filled;
    if (left >= unit * 4) {
      filled += pushSeries(
        Math.min(6, Math.floor(left / unit)),
        unit,
        "crawl rapide",
        "récupération marche au mur",
        40,
        "corps_vit_fin",
      );
    }
  } else if (obj === "4_nages") {
    const im = Math.min(p * 4, maxContinuous);
    const cycles = Math.max(3, Math.min(5, Math.floor((target * 0.55) / im)));
    filled += pushSeries(cycles, im, "4 nages", "nage complète", 30, "corps_4n");
    const left = target - filled;
    if (left >= unit * 4) {
      const half = Math.floor(left / 2 / unit) * unit;
      const repsA = Math.max(2, Math.floor(half / unit));
      filled += pushSeries(repsA, unit, "crawl jeu", "accélérer 2ᵉ moitié", 25, "corps_4n_jeu");
      const left2 = target - filled;
      filled += pushSeries(
        Math.max(2, Math.floor(left2 / unit)),
        unit,
        "dos facile",
        "sans forcer",
        20,
        "corps_4n_dos",
      );
    }
  } else if (obj === "technique" || (obj === "endurance" && level === "decouverte")) {
    const cycles = Math.max(3, Math.min(5, Math.floor(target / (unit * 3))));
    filled += pushSeries(cycles, unit, "crawl", "lent — focus glisse", 20, "corps_tech_lent");
    filled += pushSeries(cycles, unit, "crawl", "moyen — respiration", 20, "corps_tech_moy");
    filled += pushSeries(cycles, unit, "crawl", "vite — fluide", longRest === "repos 40s" ? 40 : 35, "corps_tech_vite");
    const left = target - filled;
    if (left >= unit * 4) {
      const reps = Math.max(2, Math.floor(left / (unit * 2)));
      filled += pushSeries(reps, unit, "jambes crawl", "confortable", 20, "corps_tech_kick");
      const left2 = target - filled;
      if (left2 >= unit * 2) {
        filled += pushSeries(
          Math.max(2, Math.floor(left2 / unit)),
          unit,
          "crawl facile",
          "sans forcer",
          15,
          "corps_tech_easy",
        );
      }
    }
  } else if (obj === "endurance" && (level === "sportif" || level === "performance")) {
    const dist = Math.min(p * 4, maxContinuous);
    const reps = Math.max(4, Math.min(10, Math.floor((target * 0.75) / dist)));
    filled += pushSeries(reps, dist, "crawl", "allure tenable, focus économie", 25, "corps_end_main");
    const left = target - filled;
    if (left >= unit * 4) {
      const cycles = Math.max(2, Math.min(4, Math.floor(left / (unit * 2))));
      filled += pushSeries(cycles, unit, "jambes crawl", "confortable", 20, "corps_end_kick");
      filled += pushSeries(cycles, unit, "crawl facile", "sans forcer", 20, "corps_end_easy");
    }
  } else {
    // endurance régulier / défaut : progressif + contraste
    const cycles = Math.max(3, Math.min(6, Math.floor(target / (unit * 3))));
    filled += pushSeries(cycles, unit, "crawl", "lent", 20, "corps_end_lent");
    filled += pushSeries(cycles, unit, "crawl", "moyen", 25, "corps_end_moy");
    filled += pushSeries(cycles, unit, "crawl", "vite", 35, "corps_end_vite");
    const left = target - filled;
    if (left >= unit * 3) {
      const c2 = Math.max(2, Math.min(4, Math.floor(left / (unit * 3))));
      filled += pushSeries(c2, unit, "crawl", "confortable", 20, "corps_end_c");
      filled += pushSeries(c2, unit, "jambes crawl", "facile", 20, "corps_end_j");
      filled += pushSeries(c2, unit, "crawl facile", "sans forcer", 20, "corps_end_e");
    }
  }

  // Compléter léger écart restant
  let distance = sets.reduce((a, s) => a + s.reps * s.distancePerRep, 0);
  const gap = target - distance;
  if (gap >= unit * 2) {
    const reps = Math.floor(gap / unit);
    if (reps >= 2) {
      const lastCue = sets[sets.length - 1]?.cue || "";
      const lastLabel = sets[sets.length - 1]?.label || "";
      const useKick = /facile|sans forcer/i.test(lastCue) || /facile/i.test(lastLabel);
      distance += pushSeries(
        reps,
        unit,
        useKick ? "jambes crawl" : "crawl facile",
        useKick ? "relâché, sans forcer" : "facile, sans forcer",
        20,
        "corps_fill",
      );
    }
  }

  distance = sets.reduce((a, s) => a + s.reps * s.distancePerRep, 0);
  if (distance < target * 0.55 || !sets.length) return null;

  // Anti monotony: refuse if two consecutive identical cues
  for (let i = 1; i < sets.length; i++) {
    if (sets[i].cue && sets[i].cue === sets[i - 1].cue && sets[i].label === sets[i - 1].label) {
      sets[i].cue = "contrasté, change de focus";
      const li = lines[i];
      if (li) lines[i] = line(li.replace(/^-/, "").replace(/—[^—]+—/, "— contrasté, change de focus —"));
    }
  }

  const fitted = fitToBudget(sets, lines, target, pool, maxContinuous, "corps");
  if (!fitted) return null;

  const formatByObj = {
    sprint: "broken",
    seuil: "block",
    vitesse: "progressive",
    "4_nages": "alternating",
    technique: "mixed",
    endurance: "progressive",
  };

  return {
    distance: fitted.distance,
    sets: fitted.sets,
    lines: fitted.lines,
    setFormat: formatByObj[obj] || "arthur_fun",
  };
}
