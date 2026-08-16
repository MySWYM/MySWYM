/**
 * Composeur brouillon Arthur — sessions complètes hors générateur runtime.
 *
 * Principe non négociable (Arthur 2026-08-15) :
 * **Du fun dans tout l’entraînement et dans tous les entraînements.**
 * Pas de monolithes répétitifs, pas deux séries d’affilée à la même allure,
 * préférer blocs progressifs / contrastés (nage + jambes + éducatif + facile).
 *
 * Sources : fiches Arthur, recettes d’échauffement Arthur, fins gelées humanisées,
 * règles D9/D10 + niveaux documentés.
 * Ne remplace pas `composeSession` / `swim-session-generator`.
 */

import { humanizeArthurDisplayTerms } from "../sports-engine/session-labels.js";
import { ARTHUR_DRAFT_DRILLS, ARTHUR_WARMUP_RECIPES } from "./arthur-drills-data.js";
import { createSeededRng, pick, shuffle } from "./rng.js";

const LEVELS = new Set(["decouverte", "regulier", "sportif", "performance"]);
const OBJECTIVES = new Set(["technique", "endurance", "vitesse", "sprint", "seuil", "4_nages"]);

/** Volumes cibles par défaut (m) si non fournis. */
const DEFAULT_VOLUME = {
  decouverte: 900,
  regulier: 1800,
  sportif: 2400,
  performance: 3000,
};

/** Découverte : éducatifs autorisés (tableur Arthur + règle produit flèche/grand chien). */
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

function normLevel(raw) {
  const t = String(raw || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (t.startsWith("decouv") || t === "debutant" || t === "beginner") return "decouverte";
  if (t.startsWith("regul")) return "regulier";
  if (t.startsWith("sport")) return "sportif";
  if (t.startsWith("perform")) return "performance";
  return "regulier";
}

function normObjective(raw) {
  const t = String(raw || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, " ");
  if (/4\s*nages|quatre\s*nages|medley|\bim\b/.test(t)) return "4_nages";
  if (/sprint/.test(t)) return "sprint";
  if (/seuil|css|tempo/.test(t)) return "seuil";
  if (/vitesse|speed/.test(t)) return "vitesse";
  if (/endurance|aero|volume|continu/.test(t)) return "endurance";
  if (/tech|educatif|aisance|glisse/.test(t)) return "technique";
  return "technique";
}

function roundToPool(m, pool) {
  const p = pool === 50 ? 50 : 25;
  return Math.max(p, Math.round(m / p) * p);
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
  const t = String(text || "").trim();
  if (!t) return "";
  const body = t.startsWith("-") ? t.slice(1).trim() : t;
  return `-${humanizeArthurDisplayTerms(body)}`;
}

function restCue(level, hard = false) {
  if (level === "decouverte") return hard ? "repos 30s" : "repos 15s";
  if (level === "regulier") return hard ? "repos 30s" : "repos 20s";
  return hard ? "repos 40s" : "repos 20s";
}

function effortCue(objective, part) {
  if (part === "warm") return "mise en route, facile";
  if (part === "cool") return "retour au calme, sans forcer";
  if (part === "tech") return "facile, sans forcer — focus geste";
  if (objective === "sprint") return "rapide, récupération complète";
  if (objective === "vitesse") return "soutenu, technique propre";
  if (objective === "seuil") return "allure tenue, régulière";
  if (objective === "endurance") return "confortable, à ton rythme";
  if (objective === "4_nages") return "nage complète, sans forcer le volume";
  return "confortable";
}

function longRestCue(level) {
  return level === "decouverte" ? "repos 40s entre les blocs" : "repos 45–60s entre les blocs";
}

/** Bloc contraste réutilisable — injecte du fun (jambes / éducatif / facile). */
function funContrastLine(p, cycles, rest) {
  return `${cycles} × (${p * 2} m jambes crawl · ${p} m éducatif au choix · ${p} m crawl facile) — ${rest}`;
}

/**
 * Formats d’éducatif (brouillon) — prescriptions tableur souvent incomplètes.
 * Multiples du bassin uniquement. On alterne formats pour éviter la monotonie.
 */
function formatDrillSet(rng, { pool, level, budget }) {
  const p = pool === 50 ? 50 : 25;
  const options =
    level === "decouverte"
      ? [
          { reps: 4, dist: p },
          { reps: 6, dist: p },
          { reps: 8, dist: p },
        ]
      : level === "regulier"
        ? [
            { reps: 6, dist: p },
            { reps: 8, dist: p },
            { reps: 4, dist: p * 2 },
            { reps: 6, dist: p * 2 },
          ]
        : [
            { reps: 8, dist: p },
            { reps: 6, dist: p * 2 },
            { reps: 4, dist: p * 2 },
            { reps: 4, dist: Math.min(budget, p * 4) },
          ];
  const feasible = options.filter((o) => o.reps * o.dist <= budget + p && o.dist % p === 0);
  const choice = pick(rng, feasible.length ? feasible : [{ reps: 4, dist: p }]);
  return choice;
}

function drillAllowedForLevel(d, level) {
  if (!d || d.id === "ui_catalog_progressif") return false;
  if (!Array.isArray(d.levels) || !d.levels.includes(level)) return false;
  if (level === "decouverte" && !DECOUVERTE_ALLOW.has(d.id)) return false;
  return true;
}

function selectDrills(rng, { level, objective, equipment, count = 2, forRecovery = false }) {
  let pool = ARTHUR_DRAFT_DRILLS.filter((d) => {
    if (!drillAllowedForLevel(d, level)) return false;
    if (d.recoveryOnly && !forRecovery && (level === "sportif" || level === "performance")) {
      return false;
    }
    if (!hasEquip(equipment, d.equipmentRequired)) return false;
    return true;
  });

  if (objective === "technique") {
    pool = shuffle(rng, pool).sort((a, b) => Number(b.isArthurAdd) - Number(a.isArthurAdd));
  } else if (objective === "4_nages") {
    const tagged = pool.filter((d) => (d.objectiveTags || []).includes("4_nages"));
    const byStroke = pool.filter(
      (d) => /dos|brasse|papillon|4/i.test(d.stroke) || /dos|brasse|papillon/i.test(d.name),
    );
    pool = shuffle(rng, tagged.length >= count ? tagged : byStroke.length >= count ? byStroke : pool);
  } else {
    pool = shuffle(rng, pool);
  }

  const chosen = [];
  const used = new Set();
  for (const d of pool) {
    if (chosen.length >= count) break;
    if (used.has(d.id)) continue;
    chosen.push(d);
    used.add(d.id);
  }

  if (level === "decouverte" && chosen.length) {
    const must =
      objective === "4_nages"
        ? ["nouveau_dos_deux_bras", "arthur_papillon_un_bras", "nouveau_papillon_baleine"]
        : ["educatif_fleche", "educatif_grand_chien", "arthur_crawl_avec_tuba_frontal"];
    const replace = must
      .map((id) =>
        ARTHUR_DRAFT_DRILLS.find(
          (d) => d.id === id && drillAllowedForLevel(d, "decouverte") && hasEquip(equipment, d.equipmentRequired),
        ),
      )
      .filter(Boolean);
    if (replace.length) {
      chosen[0] = replace[Math.floor(rng() * replace.length)];
      if (chosen.length > 1 && chosen[1].id === chosen[0].id) {
        const alt = pool.find((d) => d.id !== chosen[0].id);
        if (alt) chosen[1] = alt;
      }
    }
  }

  return chosen.slice(0, count);
}

function buildWarmup(rng, { level, objective, pool, budget }) {
  const recipes = ARTHUR_WARMUP_RECIPES.filter((r) => {
    if (!r.levels.includes(level)) return false;
    if (r.needs4n && objective !== "4_nages" && level === "decouverte") return false;
    if (r.needs4n && level === "decouverte") return false;
    return true;
  });
  let recipe = pick(rng, recipes);
  if (!recipe) {
    recipe = ARTHUR_WARMUP_RECIPES.find((r) => r.id === "arthur_echauff_cr_dos_25");
  }

  const cue = effortCue(objective, "warm");

  if (recipe.kind === "fixed") {
    const total = recipe.total;
    return {
      distance: total,
      lines: [line(`${total} m — ${recipe.line} — ${cue}`)],
      recipeId: recipe.id,
    };
  }

  if (recipe.kind === "fixed_choice") {
    const choices = (recipe.choices || []).filter((c) => c <= budget);
    const total = pick(rng, choices.length ? choices : [200]) || 200;
    return {
      distance: total,
      lines: [line(`${total} m ${recipe.label} — ${cue}`)],
      recipeId: recipe.id,
    };
  }

  // cycle
  const step = recipe.step || recipe.cycleM;
  let total = Math.min(recipe.maxTotal, Math.max(recipe.minTotal, roundToPool(budget, pool)));
  total = Math.floor(total / step) * step;
  if (total < recipe.minTotal) total = recipe.minTotal;
  if (total > recipe.maxTotal) total = recipe.maxTotal;
  // avoid totals ending 25/75 for 50-step cycles per Arthur notes
  if (step === 50 && total % 100 === 25) total -= 25;
  if (step === 50 && total % 100 === 75) total -= 25;
  const n = Math.max(1, Math.round(total / recipe.cycleM));
  const actual = n * recipe.cycleM;
  const parts = (recipe.parts || []).join(" + ");
  const warmLines = [line(`${actual} m — ${n} × (${parts}) — ${cue}`)];
  // Toujours un zeste de fun dès l’échauffement si le budget le permet
  if (actual + 50 <= budget + 50 && level !== "performance") {
    // petit jeu optionnel inclus dans le même volume si possible — sinon skip
  }
  if (rng() > 0.35 && actual >= 200) {
    // reformule la dernière longueur en jeu plutôt qu’ajouter du volume
    warmLines[0] = line(
      `${actual} m — ${n} × (${parts}) — ${cue} — dernière longueur : glisse la plus longue possible`,
    );
  }
  return {
    distance: actual,
    lines: warmLines,
    recipeId: recipe.id,
  };
}

function buildTechnique(rng, { level, objective, pool, equipment, budget }) {
  const drills = selectDrills(rng, { level, objective, equipment, count: 2 });
  const lines = [];
  const used = [];
  let remaining = budget;
  const p = pool === 50 ? 50 : 25;
  // Réserver un mini jeu entre les 2 éducatifs si budget le permet
  const interleave = budget >= p * 8 && drills.length >= 2;
  const per = Math.floor((budget - (interleave ? p * 2 : 0)) / Math.max(1, drills.length));

  drills.forEach((d, idx) => {
    const fmt = formatDrillSet(rng, { pool, level, budget: Math.min(per, remaining) });
    const dist = fmt.reps * fmt.dist;
    remaining -= dist;
    const needLabel = (d.equipmentRequired || []).filter((e) => {
      const token = e.replace(/-buoy/i, "").replace(/s$/, "");
      return !new RegExp(token, "i").test(d.name);
    });
    const mat = needLabel.length ? ` avec ${needLabel.join(" + ")}` : "";
    const spice =
      idx === 0 && level !== "decouverte" && rng() > 0.5
        ? " — joue : compte tes coups de bras"
        : "";
    lines.push(
      line(
        `${fmt.reps} × ${fmt.dist} m ${d.name}${mat} — ${effortCue(objective, "tech")}${spice} — ${restCue(level)}`,
      ),
    );
    used.push({
      id: d.id,
      name: d.name,
      format: `${fmt.reps} × ${fmt.dist} m`,
      utility: d.utility,
      instructions: d.instructions,
    });
    if (interleave && idx === 0) {
      lines.push(
        line(`${p * 2} m crawl jeu — accélère les 10 derniers mètres — repos 15s`),
      );
      remaining -= p * 2;
    }
  });

  const distance = lines.reduce((a, l) => {
    const nx = String(l).match(/(\d+)\s*×\s*(\d+)\s*m/i);
    if (nx) return a + parseInt(nx[1], 10) * parseInt(nx[2], 10);
    const single = String(l).match(/^-?(\d+)\s*m\b/i);
    return a + (single ? parseInt(single[1], 10) : 0);
  }, 0);

  return { distance, lines, drills: used };
}

function buildMain(rng, { level, objective, pool, equipment, budget }) {
  const p = pool === 50 ? 50 : 25;
  const lines = [];
  let distance = 0;

  const add = (meters, text) => {
    distance += meters;
    lines.push(line(text));
  };

  const longRest = level === "decouverte" ? "repos 40s entre les blocs" : "repos 45–60s entre les blocs";

  /** Bloc progressif lent → moyen → vite (évite 2 séries « confortable » collées). */
  const progressive505 = () => {
    // 5 × (50 lent + 50 moyen + 50 vite) = 15 × 50, ou adapté bassin 50
    const unit = p === 50 ? 50 : 50;
    const cycles = Math.max(3, Math.min(6, Math.floor(budget / (unit * 3))));
    const total = cycles * unit * 3;
    add(
      total,
      `${cycles * 3} × ${unit} m crawl — ${cycles} × (lent · moyen · vite par ${unit} m) — ${longRest}`,
    );
  };

  /** Endurance découverte : formats courts variés, pas un monolithe Nx25. */
  if (objective === "endurance" && level === "decouverte") {
    const a = 4 * (p * 2);
    add(a, `4 × ${p * 2} m crawl facile — change de focus à chaque rep (glisse / respiration / battements) — repos 20s`);
    const left = budget - distance;
    if (left >= p * 4) {
      const reps = Math.min(6, Math.floor(left / (p * 2)));
      add(
        reps * p * 2,
        `${reps} × ${p * 2} m : ${p} m grand chien ou flèche · ${p} m crawl facile — repos 20s`,
      );
    }
    return { distance, lines };
  }

  /** Technique / endurance / vitesse « mono-stimulus » → un seul bloc progressif. */
  if (objective === "technique" || objective === "endurance" || objective === "vitesse") {
    if (objective === "vitesse") {
      // Un bloc : progressif + éventuellement un contraste court, pas 2× soutenu
      progressive505();
      const left = budget - distance;
      if (left >= p * 6) {
        const reps = Math.min(6, Math.floor(left / p));
        add(reps * p, `${reps} × ${p} m crawl rapide — récupération marche au mur — repos 40s`);
      }
      return { distance, lines };
    }

    if (objective === "endurance" && (level === "performance" || level === "sportif")) {
      // Une seule famille de distance, pas 200 puis 100 « confortable »
      const dist = p * 4; // 100@25 ou 200@50
      const reps = Math.max(4, Math.min(10, Math.floor(budget / dist)));
      add(
        reps * dist,
        `${reps} × ${dist} m crawl — allure tenable, focus économie — ${restCue(level)}`,
      );
      const left = budget - distance;
      if (left >= p * 4) {
        // contraste fun : jambes / éducatif, PAS une 2e série confortable
        const cycles = Math.max(2, Math.min(4, Math.floor(left / (p * 4))));
        add(
          cycles * p * 4,
          `${cycles} × (${p * 2} m jambes crawl · ${p * 2} m crawl facile) — ${restCue(level)}`,
        );
      }
      return { distance, lines };
    }

    if (objective === "endurance" && level === "regulier") {
      progressive505();
      const left = budget - distance;
      if (left >= p * 6) {
        const cycles = Math.max(2, Math.min(4, Math.floor(left / (p * 3))));
        add(
          cycles * p * 3,
          `${cycles} × (${p} m crawl · ${p} m jambes · ${p} m crawl facile) — ${restCue(level)}`,
        );
      }
      return { distance, lines };
    }

    // technique : progressif + petit contraste fun (jamais 2× confortable)
    progressive505();
    const leftTech = budget - distance;
    if (leftTech >= p * 4) {
      const cycles = Math.max(2, Math.min(3, Math.floor(leftTech / (p * 4))));
      add(cycles * p * 4, funContrastLine(p, cycles, restCue(level)));
    }
    return { distance, lines };
  }

  if (objective === "seuil") {
    // Blocs seuil + contraste — pas un mur de Nx100 identiques
    const work = p * 4; // 100@25 / 200@50
    const blockM = 2 * work + 100 + 50; // 2×travail + 100 jambes + 50 facile
    const cycles = Math.max(3, Math.min(5, Math.floor(budget / blockM)));
    add(
      cycles * blockM,
      `${cycles} × [2 × ${work} m crawl (allure seuil) · 100 m jambes soutenues · 50 m crawl facile] — ${longRest}`,
    );
    return { distance, lines };
  }

  if (objective === "4_nages") {
    const blockM = p * 4 + p * 2 + p * 2; // 100/200 4N + 50/100 crawl + 50/100 dos jeu
    const im = p * 4;
    const cycles = Math.max(3, Math.min(5, Math.floor(budget / blockM)));
    add(
      cycles * blockM,
      `${cycles} × [${im} m 4 nages · ${p * 2} m crawl jeu (accélérer sur la 2ᵉ moitié) · ${p * 2} m dos facile] — ${longRest}`,
    );
    return { distance, lines };
  }

  if (objective === "sprint") {
    // Ex. Arthur : 2×50 travail + 100 jambes à bloc + 50 facile — répété en blocs
    const work = 50;
    const kick = 100;
    const easy = 50;
    const blockM = 2 * work + kick + easy; // 250
    const cycles = Math.max(3, Math.min(6, Math.floor(budget / blockM)));
    add(
      cycles * blockM,
      `${cycles} × [2 × ${work} m crawl (allure sprint) · ${kick} m jambes à bloc · ${easy} m crawl facile] — ${longRest}`,
    );
    const left = budget - distance;
    if (left >= 200) {
      // Une seule série courte de sprints nets — pas un 2e monolithe Nx25/Nx50
      const reps = Math.min(8, Math.max(4, Math.floor(left / p)));
      add(reps * p, `${reps} × ${p} m crawl sprint — récupération complète au mur — repos 40s`);
    }
    return { distance, lines };
  }

  // fallback
  progressive505();
  return { distance, lines };
}

function buildCooldown(rng, { level, objective, pool, budget, equipment = [] }) {
  // D10 : dos à deux bras = 100 ou 200 uniquement en récup active
  const useDos =
    level === "decouverte" ||
    level === "regulier" ||
    (objective === "technique" && rng() > 0.35);

  let dist = budget >= 200 ? (rng() > 0.5 ? 200 : 100) : 100;
  if (level === "decouverte") dist = 100;
  dist = roundToPool(dist, pool);
  if (dist !== 100 && dist !== 200) dist = 100;

  const pap = ARTHUR_DRAFT_DRILLS.find((d) => d.id === "arthur_papillon_un_bras");
  if (
    pap &&
    (level === "sportif" || level === "performance") &&
    hasEquip(equipment, pap.equipmentRequired) &&
    rng() > 0.65
  ) {
    return {
      distance: dist,
      lines: [line(`${dist} m papillon un bras avec palmes — facile, sans forcer`)],
      drillId: "arthur_papillon_un_bras",
    };
  }

  if (useDos) {
    return {
      distance: dist,
      lines: [line(`${dist} m dos à deux bras — facile, sans forcer`)],
      drillId: "nouveau_dos_deux_bras",
    };
  }

  const variants = [
    `${dist} m au choix — retour au calme, sans forcer`,
    `${dist} m crawl facile — retour au calme`,
    `${dist} m le plus lent possible — sans forcer`,
  ];

  return {
    distance: dist,
    lines: [line(pick(rng, variants))],
    drillId: null,
  };
}

/**
 * @param {object} brief
 * @param {string} brief.level
 * @param {string} brief.objective
 * @param {number} [brief.volumeTarget]
 * @param {25|50} [brief.pool]
 * @param {string[]} [brief.equipment]
 * @param {string} [brief.seed]
 * @returns {{ ok: true, session: object, meta: object }}
 */
export function composeArthurDraftSession(brief = {}) {
  const level = normLevel(brief.level);
  const objective = normObjective(brief.objective);
  const pool = brief.pool === 50 ? 50 : 25;
  const equipment = Array.isArray(brief.equipment) ? brief.equipment : [];
  const seed = brief.seed || `arthur-draft-${level}-${objective}`;
  const rng = createSeededRng(seed);

  let volume = Number(brief.volumeTarget) || DEFAULT_VOLUME[level] || 1800;
  volume = roundToPool(volume, pool);

  // Budget split
  const warmShare = level === "decouverte" ? 0.22 : 0.18;
  const techShare = objective === "technique" ? 0.28 : 0.2;
  const coolShare = level === "decouverte" ? 0.12 : 0.08;
  const mainShare = 1 - warmShare - techShare - coolShare;

  const warm = buildWarmup(rng, {
    level,
    objective,
    pool,
    budget: roundToPool(volume * warmShare, pool),
  });
  const tech = buildTechnique(rng, {
    level,
    objective,
    pool,
    equipment,
    budget: roundToPool(volume * techShare, pool),
  });
  const main = buildMain(rng, {
    level,
    objective,
    pool,
    equipment,
    budget: roundToPool(volume * mainShare, pool),
  });

  // cooldown
  const coolBudget = roundToPool(volume * coolShare, pool);
  const cool = buildCooldown(rng, {
    level,
    objective,
    pool,
    budget: coolBudget,
    equipment,
  });

  const details = [...warm.lines, ...tech.lines, ...main.lines, ...cool.lines].filter(Boolean);
  let total = warm.distance + tech.distance + main.distance + cool.distance;

  // Compléter le volume si écart > 10 % — contraste fun, jamais une 2e série « même allure »
  if (total < volume * 0.9) {
    const p = pool === 50 ? 50 : 25;
    const need = roundToPool(volume - total, pool);
    const mainAlreadyContrast = main.lines.some((l) => /jambes|éducatif|lent · moyen · vite/i.test(l));
    if (need >= p * 6 && !mainAlreadyContrast) {
      const cycles = Math.max(2, Math.floor(need / (p * 4)));
      const fill = cycles * p * 4;
      details.splice(
        details.length - cool.lines.length,
        0,
        line(
          `${cycles} × (${p * 2} m jambes crawl · ${p} m éducatif au choix · ${p} m crawl facile) — repos 30s`,
        ),
      );
      total += fill;
    } else if (need >= p * 6 && mainAlreadyContrast) {
      // petit complément non clone : dos / autre nage
      const reps = Math.max(2, Math.floor(need / (p * 2)));
      const fill = reps * p * 2;
      details.splice(
        details.length - cool.lines.length,
        0,
        line(`${reps} × ${p * 2} m dos ou crawl au choix — facile, sans forcer — repos 20s`),
      );
      total += fill;
    }
  }

  const titleMap = {
    technique: "Technique",
    endurance: "Endurance",
    vitesse: "Vitesse",
    sprint: "Sprint",
    seuil: "Seuil",
    "4_nages": "4 nages",
  };

  const session = {
    title: `${titleMap[objective] || "Séance"} · ${level}`,
    type: String(objective).toUpperCase(),
    intensity: effortCue(objective, "main"),
    details,
    distance: `${total}m`,
    duration: brief.duration || Math.round(total / 25),
    equipmentUsed: equipment,
    engine: "arthur-draft-composer",
    draft: true,
  };

  return {
    ok: true,
    session,
    meta: {
      level,
      objective,
      pool,
      seed,
      volumeTarget: volume,
      volumeActual: total,
      warmupRecipeId: warm.recipeId,
      drills: tech.drills,
      cooldownDrillId: cool.drillId,
      flag: "ARTHUR_DRAFT_COMPOSER",
    },
  };
}

export function isArthurDraftComposerEnabled(env = process.env) {
  return String(env?.ARTHUR_DRAFT_COMPOSER || "").trim() === "1";
}

export { LEVELS, OBJECTIVES, ARTHUR_DRAFT_DRILLS, DECOUVERTE_ALLOW };
