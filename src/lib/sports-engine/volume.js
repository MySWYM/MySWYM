/**
 * Volume cible + levier unique de progression (pas de +10% absolu).
 */

const WEEK_REF = {
  decouverte: 2800,
  regulier: 4000,
  sportif: 5200,
  performance: 6200,
};

const PHASE_MULT = {
  base: 1.0,
  development: 1.08,
  peak: 0.95,
  taper: 0.65,
  competition: 0.45,
  race: 0.15,
  test: 0.85,
  bilan: 0.7,
};

/**
 * @returns {{ weekTarget: number, sessionTargets: number[], lever: string, typeSemaine: string, why: string }}
 */
export function planWeekVolume({
  level = "regulier",
  phase = "base",
  freq = 3,
  prevWeekDistance = 0,
  volumeAdj = 1,
  capacityFactor = 1,
  ambition = "full",
  weekIndex = 0,
  adaptiveDeload = false,
  leverHint = null,
  adaptation = null,
}) {
  const ref = WEEK_REF[level] ?? WEEK_REF.regulier;
  let typeSemaine = "normale";
  let lever = leverHint || "volume";

  // Décharge planifiée ~4 semaines OU adaptative
  const plannedDeload = weekIndex > 0 && (weekIndex + 1) % 4 === 0;
  if (phase === "taper" || phase === "competition" || phase === "bilan" || phase === "race") typeSemaine = "allegee";
  else if (phase === "test") typeSemaine = "test";
  else if (weekIndex === 0) typeSemaine = "reference";
  else if (plannedDeload || adaptiveDeload) typeSemaine = "allegee";

  let weekTarget = Math.round(ref * (PHASE_MULT[phase] ?? 1) * volumeAdj * capacityFactor);

  if (ambition === "finish") weekTarget = Math.round(weekTarget * 0.9);
  if (ambition === "rebuild") weekTarget = Math.round(weekTarget * 0.75);

  if (typeSemaine === "reference") {
    weekTarget = Math.round(ref * volumeAdj * Math.min(1, capacityFactor));
    lever = "volume";
  } else if (typeSemaine === "allegee") {
    const base = prevWeekDistance > 0 ? prevWeekDistance : weekTarget;
    weekTarget = Math.round((base * 0.7) / 100) * 100;
    lever = "volume";
  } else if (typeSemaine === "test") {
    const base = prevWeekDistance > 0 ? prevWeekDistance : weekTarget;
    weekTarget = Math.round((base * 0.85) / 100) * 100;
    lever = "specificity";
  } else if (prevWeekDistance > 0) {
    // Multi-leviers : une seule contrainte principale
    if (lever === "volume") {
      const softUp = adaptation?.magnitude === "+small" ? 1.05 : adaptation?.magnitude === "+large" ? 1.06 : 1.08;
      const softDown = adaptation?.magnitude === "-small" ? 0.94 : adaptation?.magnitude === "-large" ? 0.88 : null;
      if (softDown != null && (adaptation?.action === "REDUCE" || adaptation?.action === "ADJUST")) {
        weekTarget = Math.round((prevWeekDistance * softDown) / 100) * 100;
      } else {
        const cap = Math.floor((prevWeekDistance * softUp) / 100) * 100;
        weekTarget = Math.min(weekTarget, Math.max(prevWeekDistance, cap));
      }
    } else if (lever === "effort_duration" || lever === "density" || lever === "intensity" || lever === "specificity") {
      // Même volume approximatif, progression / réduction ailleurs (pas vol+int+densité)
      weekTarget = Math.round(prevWeekDistance / 100) * 100;
    } else {
      weekTarget = Math.min(weekTarget, Math.floor((prevWeekDistance * 1.08) / 100) * 100);
    }
  }

  weekTarget = Math.max(800, Math.round(weekTarget / 100) * 100);

  const weights = Array.from({ length: freq }, (_, i) => (i === Math.min(1, freq - 1) ? 1.15 : 1));
  const sumW = weights.reduce((a, b) => a + b, 0);
  const sessionTargets = weights.map((w) => Math.max(400, Math.round((weekTarget * w) / sumW / 50) * 50));

  const why = `phase=${phase} type=${typeSemaine} levier=${lever} cibleSemaine=${weekTarget}m${
    adaptation ? ` adapt=${adaptation.action}` : ""
  }`;

  return { weekTarget, sessionTargets, lever, typeSemaine, why, adaptation: adaptation || null };
}

/** Split 4 blocs Arthur (fourchettes) */
export function splitSessionBlocks(totalM) {
  const t = Math.max(400, totalM);
  const depart = Math.round(t * 0.2 / 50) * 50;
  const technique = Math.round(t * 0.2 / 50) * 50;
  const rac = Math.round(t * 0.1 / 50) * 50;
  let corps = t - depart - technique - rac;
  corps = Math.max(100, Math.round(corps / 50) * 50);
  return { depart, technique, corps, rac, total: depart + technique + corps + rac };
}

/**
 * Découverte : un peu plus de technique, corps un peu moins dense
 * (ex. 750 → 150 / 200 / 300 / 100, apprendre → appliquer → nager → récupérer).
 */
export function splitSessionBlocksDecouverte(totalM) {
  const t = Math.max(400, totalM);
  const depart = Math.round((t * 0.2) / 50) * 50;
  const technique = Math.round((t * 0.27) / 50) * 50;
  const rac = Math.round((t * 0.13) / 50) * 50;
  let corps = t - depart - technique - rac;
  corps = Math.max(100, Math.round(corps / 50) * 50);
  return { depart, technique, corps, rac, total: depart + technique + corps + rac };
}

/**
 * Régulier : corps dominant ~55-65 % (apprendre à s'entraîner).
 * Ex. 1800 → 250 / 350 / 1000 / 200.
 */
export function splitSessionBlocksRegulier(totalM) {
  const t = Math.max(800, totalM);
  const depart = Math.round((t * 0.15) / 50) * 50;
  const technique = Math.round((t * 0.2) / 50) * 50;
  const rac = Math.round((t * 0.1) / 50) * 50;
  let corps = t - depart - technique - rac;
  corps = Math.max(400, Math.round(corps / 50) * 50);
  return { depart, technique, corps, rac, total: depart + technique + corps + rac };
}

/**
 * Sportif : corps dense ~60 % (s'entraîner pour progresser).
 * Ex. 2500 → 300 / 400 / 1500 / 300.
 */
export function splitSessionBlocksSportif(totalM) {
  const t = Math.max(1200, totalM);
  const depart = Math.round((t * 0.12) / 50) * 50;
  const technique = Math.round((t * 0.16) / 50) * 50;
  const rac = Math.round((t * 0.1) / 50) * 50;
  let corps = t - depart - technique - rac;
  corps = Math.max(600, Math.round(corps / 50) * 50);
  return { depart, technique, corps, rac, total: depart + technique + corps + rac };
}

/**
 * Performance : corps dense ~62 %, volume typiquement plus élevé.
 * Plancher bas autorisé en taper (Étape G), pas « plus de Z4 ».
 */
export function splitSessionBlocksPerformance(totalM) {
  const t = Math.max(600, totalM);
  const depart = Math.max(50, Math.round((t * 0.11) / 50) * 50);
  const technique = Math.max(50, Math.round((t * 0.14) / 50) * 50);
  const rac = Math.max(50, Math.round((t * 0.09) / 50) * 50);
  let corps = t - depart - technique - rac;
  corps = Math.max(200, Math.round(corps / 50) * 50);
  // Recaler si arrondis dépassent
  const sum = depart + technique + rac + corps;
  if (sum !== t && t >= 600) {
    corps = Math.max(200, corps - (sum - t));
  }
  return { depart, technique, corps, rac, total: depart + technique + corps + rac };
}

/**
 * Biais proportions départ/technique/corps/fin selon l’objectif produit
 * (même niveau + même volume → structures mesurablement différentes).
 */
export function biasBlocksForObjectif(blocks, objectif = "", level = "regulier") {
  if (!blocks || !Number(blocks.total)) return blocks;
  const t = Number(blocks.total);
  const key = String(objectif || "").toLowerCase();
  if (!key) return blocks;

  let departR;
  let techR;
  let racR;
  if (/course|compet|compét|maitre|maître|seuil|vitesse/.test(key)) {
    departR = 0.12;
    techR = level === "decouverte" ? 0.18 : 0.1;
    racR = 0.1;
  } else if (/triathlon|eau_libre|open_water/.test(key)) {
    departR = 0.14;
    techR = level === "decouverte" ? 0.2 : 0.12;
    racR = 0.08;
  } else if (/reprendre|reprise|recup/.test(key)) {
    departR = 0.18;
    techR = 0.22;
    racR = 0.15;
  } else if (/progress|nager_progresser|technique|aisance/.test(key)) {
    departR = 0.15;
    techR = level === "decouverte" ? 0.3 : 0.22;
    racR = 0.1;
  } else {
    return blocks;
  }

  const depart = Math.max(50, Math.round((t * departR) / 50) * 50);
  const technique = Math.max(50, Math.round((t * techR) / 50) * 50);
  const rac = Math.max(50, Math.round((t * racR) / 50) * 50);
  let corps = t - depart - technique - rac;
  corps = Math.max(100, Math.round(corps / 50) * 50);
  const drift = t - (depart + technique + corps + rac);
  if (drift !== 0) corps = Math.max(100, corps + drift);
  return { depart, technique, corps, rac, total: depart + technique + corps + rac };
}
