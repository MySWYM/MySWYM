import { paceTagFromT100 } from "./swim-pace.js";
import { sanitizeSessionDetails, humanizeBeginnerZoneTags } from "./sports-engine/session-labels.js";
import {
  roundTo,
  estimateLinesDistance,
  TECHNIQUE,
  CORPS_PHYSIO,
  DEPARTS_SEMAINE,
  DEPARTS_AVEC_JAMBES,
  FINS_SEMAINE,
  FOCUS_CYCLE,
  FOCUS_CYCLE_DECOUVERTE,
  MATERIEL_DECOUVERTE,
  OW_BASE_SESSIONS,
} from "./swim-banks/index.js";

/* ============== BASE DE DONNÉES ============== */
/* Banques extraites vers src/lib/swim-banks/ (étape 1 refonte).
   Contenu inchangé — ré-export runtime depuis swim-banks.
   Principe : chaque bloc de contenu porte sa distance EXACTE, calculée à
   partir des mêmes nombres que ceux affichés dans le texte. Le total d'une
   séance est TOUJOURS la somme réelle de ses blocs — jamais une estimation
   séparée qui pourrait diverger de ce qui est affiché. */

const NIVEAUX = {
  debutant:      { label:"Débutant / loisir", warmupBase:150, blockUnit:50 },
  intermediaire: { label:"Intermédiaire",      warmupBase:250, blockUnit:75 },
  confirme:      { label:"Confirmé",           warmupBase:350, blockUnit:100 },
  triathlete:    { label:"Triathlète",         warmupBase:350, blockUnit:100 }
};

const PHASES = {
  foncier:       { label:"Foncier",       zones:["Z1","Z1","Z2"], note:"volume prioritaire, technique propre à allure modérée" },
  developpement: { label:"Développement", zones:["Z2","Z2","Z3"], note:"montée progressive en intensité" },
  specifique:    { label:"Spécifique",    zones:["Z3","Z3","Z4"], note:"allure cible, blocs qualité" },
  affutage:      { label:"Affûtage",      zones:["Z3","Z4"],      note:"volume réduit, fraîcheur avant échéance" }
};

/* ============== UTILITAIRES ============== */

const lastPicks = {};
function pick(arr, key){
  if(arr.length === 1) return arr[0];
  if(!key) return arr[Math.floor(Math.random()*arr.length)];
  let idx;
  do{ idx = Math.floor(Math.random()*arr.length); }
  while(idx === lastPicks[key] && arr.length > 1);
  lastPicks[key] = idx;
  return arr[idx];
}

function parseTime(str){
  if(!str) return null;
  str = str.trim();
  let m = str.match(/(\d+)[:'](\d{1,2})/);
  if(m) return parseInt(m[1])*60+parseInt(m[2]);
  let n = parseFloat(str.replace(",", "."));
  return isNaN(n) ? null : n;
}
function formatTime(sec){
  sec = Math.max(1, Math.round(sec));
  const m = Math.floor(sec/60);
  const s = sec%60;
  return `${m}:${s.toString().padStart(2,'0')}`;
}
// Allures : T100 uniquement — voir src/lib/swim-pace.js (bandes adaptatives)
function paceTag(ref100Seconds, _ref400Unused, zoneKey, distance){
  return paceTagFromT100(ref100Seconds, zoneKey, distance);
}

/** Distance d'allure : « par 100m » / « 8x50 » prioritaire, sinon distance de tête. */
function extractPaceDistance(line){
  const par = line.match(/par\s+(\d+)\s*m/i);
  if(par) return parseInt(par[1], 10);
  const reps = line.match(/(\d+)\s*x\s*(\d+)\s*m?/i);
  if(reps) return parseInt(reps[2], 10);
  const lead = line.match(/-?\s*(\d+)\s*m\b/i);
  if(lead) return parseInt(lead[1], 10);
  return 100;
}

/** Remplace les (Z1) nus par (Z1 @mm:ss-mm:ss) si T100 dispo (Premium). */
function annotateBareZones(lignes, ref100Seconds){
  if(!ref100Seconds) return lignes;
  return lignes.map(line => {
    if(/\(Z[1-4]\s*@/i.test(line)) return line;
    return line.replace(/\(Z([1-4])\)/g, (_m, n) =>
      paceTagFromT100(ref100Seconds, `Z${n}`, extractPaceDistance(line))
    );
  });
}

/* ============== GÉNÉRATEUR — SEMAINE COMPLÈTE ============== */

function computeWeekTarget(niveauKey, typeSemaine, prevDistance){
  const refTotal = { debutant:3600, intermediaire:4800, confirme:6000, triathlete:6600 }[niveauKey] || 4800;
  if(typeSemaine === "reference" || !prevDistance || prevDistance <= 0){
    return { target: refTotal, maxAutorise:null, statutLabel:"Référence (1ère semaine)", prevDistance:0, refTotal };
  }
  if(typeSemaine === "allegee"){
    const target = Math.round(prevDistance*0.70/100)*100;
    return { target, maxAutorise:null, statutLabel:"Semaine allégée — décharge (~-30%)", prevDistance, refTotal };
  }
  if(typeSemaine === "test"){
    // Volume modéré : on garde de la fraîcheur pour des chronos propres
    const target = Math.round(prevDistance*0.85/100)*100;
    return { target, maxAutorise:null, statutLabel:"Semaine test — chronos de contrôle", prevDistance, refTotal };
  }
  const maxAutorise = Math.floor((prevDistance*1.10) / 100) * 100;
  return { target: maxAutorise, maxAutorise, statutLabel:"Charge normale — cible +10%", prevDistance, refTotal };
}

/** Normalise bassin onboarding → 25 | 50 (défaut 50). */
function normalizePool(pool) {
  return pool === 25 ? 25 : 50;
}

/** Bloc compatible avec le bassin ? (défaut : OK partout) */
function corpsFitsPool(r, pool) {
  if (!r.pools) return true;
  return r.pools.includes(pool);
}

/** Choisit un corps physio dans une fourchette de volume (évite 1200m + 400m n'importe comment). */
function pickCorpsInRange(objectifKey, minDist, maxDist, pickKey, pool = 50){
  const poolKey = CORPS_PHYSIO[objectifKey] ? objectifKey : "endurance";
  const builders = CORPS_PHYSIO[poolKey];
  const scored = builders
    .map((fn, i) => ({ i, r: fn() }))
    .filter(({ r }) => corpsFitsPool(r, pool) && r.distance >= minDist && r.distance <= maxDist);
  const list = scored.length
    ? scored
    : builders.map((fn, i) => ({ i, r: fn() })).filter(({ r }) => corpsFitsPool(r, pool));
  const fallback = list.length ? list : builders.map((fn, i) => ({ i, r: fn() }));
  const chosen = pick(fallback, pickKey);
  return chosen.r;
}

/**
 * En bassin 50m : Nx25m → Nx50m « 25m à bloc + 25m relâché » (même nb de reps, fini au mur).
 * Éducatifs flèche / grand chien : simple doublement 25→50 (pas de sprint + relâché).
 * Ne touche pas aux « 25m A · 25m B » déjà structurés dans une longueur de 50.
 */
function adaptLineRepsForPool50(line) {
  if (!line) return line;
  let t = line;
  const isEducatifGlisse = /flèche|grand\s*chien/i.test(t);
  if (isEducatifGlisse) {
    t = t.replace(/(\d+)\s*x\s*\(\s*(\d+)\s*x\s*25\s*m\s*\)/gi, (_m, a, b) => `${a}x(${b}x50m)`);
    // 8x25m flèche → 8x50m flèche ; laisse « 6x50m : 25m A · 25m B » intact
    t = t.replace(/(\d+)\s*x\s*25\s*m/gi, (_m, n) => `${n}x50m`);
    return t;
  }
  t = t.replace(/(\d+)\s*x\s*\(\s*(\d+)\s*x\s*25\s*m\s*\)/gi, (_m, a, b) =>
    `${a}x(${b}x50m : 25m à bloc + 25m relâché)`
  );
  // « 8x25m godilles R15'' » → « 8x50m : 25m à bloc + 25m relâché — godilles R15'' »
  t = t.replace(/(\d+)\s*x\s*25\s*m(?:\s+(.+?))?(?=\s+R\d|\s*$)/gi, (_m, n, desc) => {
    const cue = desc && desc.trim() ? ` — ${desc.trim()}` : "";
    return `${n}x50m : 25m à bloc + 25m relâché${cue}`;
  });
  return t;
}

function appendMatosIfMissing(line, materiel) {
  const note = String(materiel || "").trim();
  if (!note) return line;
  if (/palmes|tuba/i.test(line)) return line;
  return `${line.replace(/\s*$/, "")} avec ${note.replace(/^avec\s+/i, "")}`;
}

/** Bloc technique : lignes d'éducatif nommées — jamais « 600m respiration ». */
function pushExplicitTechLines(lignes, techPicked, materiel = "") {
  const drills = (techPicked?.lines || [])
    .map((l) => String(l).trim().replace(/^[·\-\s]+/, ""))
    .filter(Boolean);
  if (!drills.length) {
    const vol = techPicked?.distance || 200;
    const reps = Math.max(2, Math.round(vol / 50));
    lignes.push(`-${reps}x50m crawl facile, respiration sur le côté habituel`);
    return;
  }
  drills.forEach((d, i) => {
    let line = appendMatosIfMissing(d, i === 0 ? materiel : "");
    lignes.push(`-${line.replace(/^-/, "")}`);
  });
}
/** Adapte un bloc technique au bassin 50 — distance = somme réelle des reps adaptées. */
function adaptTechBlockForPool(blk, pool) {
  if (pool !== 50 || !blk) return blk;
  const lines = blk.lines.map(adaptLineRepsForPool50);
  const dist = estimateLinesDistance(lines);
  return { distance: dist > 0 ? Math.max(25, roundTo(dist, 25)) : blk.distance, lines };
}

/**
 * Volume relatif — même structure de séance, distances adaptées au niveau.
 * MySWYM = générateur de séances, pas école de natation.
 */
const VOL_BY_NIVEAU_KEY = {
  debutant: 0.7,
  intermediaire: 1.0,
  confirme: 1.25,
  triathlete: 1.35,
};

/** Multiplicateur volume depuis le level UI (découverte → performance). */
function volumeMultFromProfileLevel(level, category) {
  if (category === "triathlon" && (level === "performance" || level === "advanced")) return 1.35;
  const m = {
    découverte: 0.55,
    beginner: 0.6,
    régulier: 0.8,
    sportif: 1.0,
    intermediate: 1.0,
    performance: 1.25,
    advanced: 1.25,
  };
  return m[level] ?? 1.0;
}

function scaleDepartBlock(depart, volMult) {
  const d = Math.max(100, roundTo(depart.distance * volMult, 50));
  const text = depart.text.replace(/^-\d+m/, `-${d}m`);
  return { distance: d, text };
}

/**
 * Wording débutant : zones / repos lisibles. Pas un tutoriel technique
 * (MySWYM = générateur de séances).
 */
function clarifyBeginnerLine(line) {
  if (!line) return line;
  const indent = line.match(/^\s*/)?.[0] || "";
  let t = line.trim();

  t = t.replace(/\bR(\d+)''/g, "— repos $1s");
  t = t.replace(/\bR(\d+)"/g, "— repos $1s");
  t = t.replace(/\bR(\d+)'(?!\d)/g, "— repos $1min");
  t = t.replace(/\bD(\d+)'(\d+)"/g, "— départ toutes les $1min$2s");
  t = t.replace(/\bD(\d+)'(?!\d)/g, "— départ toutes les $1min");
  t = t.replace(/\bD(\d+)"/g, "— départ toutes les $1s");

  t = humanizeBeginnerZoneTags(t);

  t = t.replace(/\(RAC\)/gi, "(récup)");
  t = t.replace(/\bRAC\b/g, "récup");
  t = t.replace(/\bCr\/Dos\b/g, "crawl/dos");
  t = t.replace(/\bDos\/Cr\b/g, "dos/crawl");
  t = t.replace(/\bCr\b(?=\s|\/|$)/g, "crawl");
  t = t.replace(/\btubas\b/gi, "tuba");

  t = t.replace(/^(-?\d+x\d+)(?=\s|—|$|\()/i, "$1m");
  t = t.replace(/\b(\d+x\d+)(?=\s*:)/g, "$1m");

  t = t.replace(/\s*—\s*—\s*/g, " — ");
  t = t.replace(/\s{2,}/g, " ").trim();
  return indent + t;
}

function clarifyBeginnerSession(lignes) {
  return lignes.map(clarifyBeginnerLine);
}

function genererSeanceDeSemaine(niveauKey, objectifKey, phaseKey, numSemaine, indexSeance, techniqueFocusKey, ref100Seconds, ref400Seconds, pool = 50, forcedZone = null, volumeTier = "normale", volMult = null, simplifyWording = null, weekScale = 1){
  const phase = PHASES[phaseKey];
  const lignes = [];
  const bassin = normalizePool(pool);
  const mult = (volMult ?? VOL_BY_NIVEAU_KEY[niveauKey] ?? 1) * (weekScale > 0 ? weekScale : 1);
  const isBeginner = simplifyWording != null ? !!simplifyWording : niveauKey === "debutant";
  const isTest = objectifKey === "test";

  // Départ Z1 — jamais jambes si le focus technique est déjà jambes
  // Découverte : départs simples (pas de godilles)
  let departPool;
  if (isBeginner) {
    departPool = DEPARTS_SEMAINE.filter((fn) => !/godille|jambes/i.test(fn().text));
    if (!departPool.length) departPool = DEPARTS_SEMAINE;
  } else if (techniqueFocusKey === "technique_jambes") {
    departPool = DEPARTS_SEMAINE;
  } else {
    departPool = [...DEPARTS_SEMAINE, ...DEPARTS_AVEC_JAMBES];
  }
  const depart = scaleDepartBlock(pick(departPool, "depart")(), isTest ? Math.min(mult, 0.85) : mult);
  lignes.push(depart.text);

  // Technique rotative — adapter Nx25m si bassin 50
  // Découverte : flèche / grand chien (FOCUS_CYCLE_DECOUVERTE)
  const techKey = (isBeginner && TECHNIQUE[techniqueFocusKey]) ? techniqueFocusKey
    : (isBeginner ? "technique_fleche" : techniqueFocusKey);
  const techBlock = TECHNIQUE[techKey] || TECHNIQUE.technique_fleche;
  const techPicked = adaptTechBlockForPool(
    pick(techBlock.drills, "tech_semaine_"+techKey),
    bassin,
  );
  // Matos : dans la ligne d'éducatif (Découverte : palmes et tuba frontal).
  const materiel = isBeginner ? pick(MATERIEL_DECOUVERTE, "materiel") : "";
  pushExplicitTechLines(lignes, techPicked, materiel);

  const zone = forcedZone || pick(phase.zones, "zone_"+indexSeance);
  let principalDist, principalLines;

  // Fourchettes corps : tier × niveau × progression hebdo
  const baseCorps =
    volumeTier === "allegee" ? [300, 600]
    : volumeTier === "test" ? [300, 500]
    : volumeTier === "reference" ? [400, 800]
    : [500, 1200];
  const corpsRange = [
    Math.max(200, roundTo(baseCorps[0] * mult, 50)),
    Math.max(300, roundTo(baseCorps[1] * mult, 50)),
  ];

  if(objectifKey.startsWith("technique_")){
    const mainTech = TECHNIQUE[objectifKey];
    const mainPicked = adaptTechBlockForPool(
      pick(mainTech.drills, "tech_principal_"+objectifKey),
      bassin,
    );
    principalDist = mainPicked.distance;
    principalLines = [];
    pushExplicitTechLines(principalLines, mainPicked, "");
  } else if (isTest) {
    const r = pick(CORPS_PHYSIO.test, "physio_test")();
    const tag = paceTag(ref100Seconds, ref400Seconds, zone === "Z4" ? "Z4" : "Z3", r.repDist);
    principalDist = r.distance;
    principalLines = [
      `-${r.text} ${tag}`,
      `  → Note ton temps. Compare avec le test précédent.`,
    ];
  } else {
    const r = pickCorpsInRange(objectifKey, corpsRange[0], corpsRange[1], "physio_semaine_"+objectifKey, bassin);
    const tag = paceTag(ref100Seconds, ref400Seconds, zone, r.repDist);
    principalDist = r.distance;
    principalLines = [`-${r.text} ${tag}`];
  }
  lignes.push(...principalLines);

  // Fin RAC — scale légère ; total toujours multiple du bassin (25 ou 50)
  const subtotal = depart.distance + techPicked.distance + principalDist;
  const finBase = volumeTier === "allegee" || volumeTier === "test" ? 150 : 200;
  const finTarget = Math.max(100, roundTo(finBase * Math.min(1.2, Math.max(0.6, mult)), 50));
  const quantum = bassin === 50 ? 50 : 25;
  const totalArrondi = roundTo(subtotal + finTarget, Math.max(100, quantum));
  const finReal = Math.max(quantum * 2, totalArrondi - subtotal);
  const finClean = Math.min(400, Math.max(100, roundTo(finReal, quantum)));
  const totalFinal = roundTo(subtotal + finClean, quantum);
  lignes.push(pick(FINS_SEMAINE, "fin")(finClean));

  // Départ / fin : (Zx) → (Zx @…) si Premium + T100 ; corps déjà taggé via paceTag
  const withPace = annotateBareZones(lignes, ref100Seconds);
  const clarified = isBeginner ? clarifyBeginnerSession(withPace) : withPace;
  const body = sanitizeSessionDetails(clarified);
  const header = `S${numSemaine}.${indexSeance} : ${totalFinal}m`;
  return { text: header + "\n" + body.join("\n"), total: totalFinal, zone, role: objectifKey };
}

/** Retourne les séances structurées pour intégration app (sans en-tête semaine).
 *  sessionRoles (optionnel) : tableau [{ objectif, zone }] longueur = nbSeances — pilotage COSD.
 *  opts.volMult : scale distances (même base, volume selon niveau).
 *  opts.simplifyWording : clarifier Z1/R15 pour découverte uniquement.
 *  opts.pool : 25 | 50 — longueur de bassin (onboarding).
 *  opts.tasteHints : goûts client (focus technique / clarté) — voir user-taste.js. */
export function genererSemaineSessions(niveauKey, objectifKey, phaseKey, nbSeances, numSemaine, ref100Str, _ref400Str, typeSemaine, prevDistance, sessionRoles = null, opts = {}) {
  const ref100Seconds = parseTime(ref100Str);
  const bassin = normalizePool(opts.pool);
  const simplifyWording = opts.simplifyWording ?? null;
  const focusCycle = simplifyWording ? FOCUS_CYCLE_DECOUVERTE : FOCUS_CYCLE;
  const volumeTier = typeSemaine === "allegee" ? "allegee" : typeSemaine === "test" ? "test" : typeSemaine === "reference" ? "reference" : "normale";
  const volMult = opts.volMult ?? null;
  const tasteHints = opts.tasteHints || null;
  const { target, refTotal } = computeWeekTarget(niveauKey, typeSemaine, prevDistance);
  const weekScale = Math.max(0.55, Math.min(1.45, target / (refTotal || target)));

  const sessions = [];
  let totalReel = 0;
  for (let i = 1; i <= nbSeances; i++) {
    // Rotation sur semaine + séance → tout le cycle apparaît même à 2–3×/sem
    // Goûts : léger biais jambes vs éducatifs (cap soft — générateur ≠ école)
    const cycleIdx = (numSemaine - 1 + i - 1) % focusCycle.length;
    let focus = focusCycle[cycleIdx];
    if (tasteHints?.ready) {
      if (tasteHints.preferJambes) {
        const jambes = focusCycle.find((f) => String(f).includes("jambes"));
        if (jambes && (i + numSemaine) % 2 === 0) focus = jambes;
      } else if (tasteHints.educatifBias > 0.25) {
        const tech = focusCycle.find((f) => !String(f).includes("jambes") && !String(f).includes("chiens"));
        if (tech && (i + numSemaine) % 3 === 0) focus = tech;
      }
    }
    const role = sessionRoles && sessionRoles[i - 1] ? sessionRoles[i - 1] : null;
    const obj = role?.objectif || objectifKey;
    const zone = role?.zone || null;
    const res = genererSeanceDeSemaine(niveauKey, obj, phaseKey, numSemaine, i, focus, ref100Seconds, null, bassin, zone, volumeTier, volMult, simplifyWording, weekScale);
    sessions.push(res);
    totalReel += res.total;
  }
  return { sessions, totalDistance: totalReel };
}

/* Banque confirmé : OW_BASE_SESSIONS importé depuis swim-banks/session-archetypes.js */

export function calcDetailsDistance(details = []) {
  let total = 0;
  for (const line of details) {
    let rest = line;
    let counted = false;
    rest = rest.replace(/(\d+)\s*[×x]\s*(\d+)\s*m/g, (_, n, x) => {
      total += parseInt(n, 10) * parseInt(x, 10);
      counted = true;
      return "";
    });
    rest = rest.replace(/(\d+(?:\s*[–\-]\s*\d+)+)\s*m/g, (_, seq) => {
      seq.split(/[–\-]/).forEach((v) => {
        const n = parseInt(v.trim(), 10);
        if (!Number.isNaN(n)) total += n;
      });
      counted = true;
      return "";
    });
    rest.replace(/\b(\d+)\s*m\b/g, (_, x) => {
      if (!counted) {
        total += parseInt(x, 10);
        counted = true;
      }
      return "";
    });
  }
  return total;
}

/**
 * Séance MySWYM depuis la banque confirmé.
 * @param {number} archeIdx — typiquement wi*3+si
 * @param {25|50} pool
 * @param {string} level — profile.level (performance/advanced pour confirmé)
 * @param {{ isPremium?: boolean, pace100?: number|null }} opts
 */
export function buildConfirmeArchetypeSession(archeIdx, pool, level, opts = {}) {
  const P = pool === 25 ? 25 : 50;
  const n = OW_BASE_SESSIONS.length;
  const idx = ((archeIdx % n) + n) % n;
  const arche = OW_BASE_SESSIONS[idx](P, level, opts);
  const dist = calcDetailsDistance(arche.details);
  return {
    type: arche.type,
    title: arche.title,
    intensity: arche.intensity,
    details: arche.details,
    distance: `${dist}m`,
    duration: Math.max(40, Math.min(90, Math.round(dist / 35))),
    completed: false,
    skipped: null,
  };
}

export function usesConfirmeArchetypeBank(niveauKey, profilObj) {
  const niveauOk = niveauKey === "confirme" || niveauKey === "triathlete";
  const objOk = profilObj === "eau_libre" || profilObj === "mixte" || profilObj === "endurance";
  return niveauOk && objOk;
}

export {
  genererSeanceDeSemaine,
  TECHNIQUE,
  CORPS_PHYSIO,
  DEPARTS_SEMAINE,
  DEPARTS_AVEC_JAMBES,
  FINS_SEMAINE,
  FOCUS_CYCLE,
  FOCUS_CYCLE_DECOUVERTE,
  estimateLinesDistance,
  PHASES,
  NIVEAUX,
  volumeMultFromProfileLevel,
  VOL_BY_NIVEAU_KEY,
  OW_BASE_SESSIONS,
};

