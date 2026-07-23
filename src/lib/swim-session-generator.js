import { paceTagFromT100 } from "./swim-pace.js";

/* ============== BASE DE DONNÉES ============== */
/* Principe : chaque bloc de contenu porte sa distance EXACTE, calculée à
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
  foncier:       { label:"Foncier",       zones:["Z1","Z1","Z2"], volMult:1.15, note:"volume prioritaire, technique propre à allure modérée" },
  developpement: { label:"Développement", zones:["Z2","Z2","Z3"], volMult:1.0,  note:"montée progressive en intensité" },
  specifique:    { label:"Spécifique",    zones:["Z3","Z3","Z4"], volMult:0.9,  note:"allure cible, blocs qualité" },
  affutage:      { label:"Affûtage",      zones:["Z3","Z4"],      volMult:0.65, note:"volume réduit, fraîcheur avant échéance" }
};

function roundTo(n, step){ return Math.round(n/step)*step; }
function block(distance, lines){ return { distance, lines: Array.isArray(lines) ? lines : [lines] }; }

/* ---- Échauffements : fonction(w, resp) -> {distance, lines} ---- */
const ECHAUFFEMENTS = [
  (w,resp)=> block(2*w+100, [`· ${w}m crawl libre, respiration ${resp}`, `· ${w}m dos`, `· 4x25m jambes crawl R15''`]),
  (w,resp)=> block(w+300,   [`· ${w}m crawl ${resp}`, `· 4x50m alterné 25 crawl / 25 dos`, `· 4x25m gainage bras tendu`]),
  (w,resp)=> block(w+250,   [`· ${w}m crawl libre facile`, `· 6x25m éducatif rattrapé R10''`, `· 4x25m accél. progressive`]),
  (w,resp)=> block(w+300,   [`· ${w}m mixte (crawl/dos), respiration ${resp}`, `· 4x50m pull-buoy Z1`, `· 4x25m sprint court R20''`]),
  (w,resp)=> block(w+300,   [`· ${w}m crawl ${resp}`, `· 4x50m jambes avec planche R15''`, `· 4x25m gainage + battements`]),
  (w,resp)=> block(w+250,   [`· ${w}m crawl libre, focus glisse`, `· 6x25m éducatif catch-up R10''`, `· 4x25m dos facile`]),
  (w,resp)=> block(w+300,   [`· ${w}m mixte crawl/dos souple`, `· 8x25m 1 bras alterné R10''`, `· 4x25m crawl vitesse contrôlée`])
];

/* ---- Focus technique : blocs à distance fixe (le contenu ne dépend pas du niveau) ---- */
const TECHNIQUE = {
  technique_respiration: { label:"Respiration", drills:[
    block(600, ["· 8x25m respiration 3T (3 temps) R15''", "· 8x25m respiration 5T R15''", "· 4x50m alterné 3T/5T par 25m"]),
    block(600, ["· 6x50m bilatéral 3T R20''", "· 4x25m apnée contrôlée 2 coups sans respirer + reprise", "· 4x50m 3T/5T alterné"]),
    block(450, ["· 10x25m respiration 5T, focus sortie d'eau tête basse R10''", "· 4x50m 3T aller / 5T retour R20''"]),
    block(400, ["· 8x25m respiration 7T (endurance apnée) R20''", "· 4x50m 3T avec accélération dernier 15m R20''"]),
    block(450, ["· 6x50m bilatéral 3T, focus rythme régulier R20''", "· 6x25m sans respirer 15m + reprise 3T R15''"]),
    block(700, ["· 4x150 : 3T/5T/7T/5T/3T par 25m", "· 4x25m respiration tardive, tête qui reste basse R15''"]),
    block(600, ["· 6x100m : (3T/5T/7T/9T par 50m)"]),
    block(600, ["· 12x50 D1' (Z2) — (3T/5T/7T/9T par 50m)"])
  ]},
  technique_roulis: { label:"Roulis / rotation du corps", drills:[
    block(600, ["· 6x50m roulis exagéré, épaule qui sort de l'eau R20''", "· 4x25m avec pull-buoy, focus rotation bassin", "· 4x50m amplitude + roulis R15''"]),
    block(400, ["· 8x25m un bras (l'autre tendu devant), focus rotation R15''", "· 4x50m roulis marqué, respiration tardive R20''"]),
    block(400, ["· 6x50m roulis + glisse prolongée R20''", "· 4x25m pull-buoy rotation complète épaules-hanches"]),
    block(400, ["· 8x25m « 6 battements par roulis » R15''", "· 4x50m roulis contrôlé, regard fixe vers le fond R20''"]),
    block(400, ["· 6x50m roulis avec pull-buoy + palmes, focus appui R20''", "· 4x25m nage complète, garder l'amplitude de roulis"]),
    block(200, ["· 4x50 palmes : 25m bras droit devant / gauche cuisse ; 25m inversé — respiration latérale"]),
    block(400, ["· 8x50m le moins de mouvements possible/25m — focus position, efficacité de traction R20''"]),
    block(200, ["· 8x25m palmes : 1x crawl sous l'eau · 1x godille pieds en avant sur le dos R15''"])
  ]},
  technique_catchup: { label:"Catch-up", drills:[
    block(500, ["· 8x25m catch-up (mains qui se touchent devant) R15''", "· 4x50m catch-up lent, focus glisse", "· 4x25m catch-up rapide, transition vers nage normale"]),
    block(500, ["· 6x50m catch-up R20''", "· 4x25m catch-up avec palmes, focus appui", "· 4x25m retour à nage complète, garder la glisse"]),
    block(450, ["· 10x25m catch-up très lent, glisse maximale R15''", "· 4x50m catch-up progressif (lent → rapide) R20''"]),
    block(400, ["· 6x50m catch-up + plaquettes légères, focus prise d'appui R20''", "· 4x25m nage complète en gardant le temps de glisse"]),
    block(400, ["· 8x25m catch-up, compter le temps de glisse à voix haute R15''", "· 4x50m catch-up / nage normale alterné par 25m"])
  ]},
  /** Jambes = série battements + toujours un éducatif court avant (jamais jambes→jambes). */
  technique_jambes: { label:"Éducatif + jambes", drills:[
    block(400, ["· 4x25m catch-up R15''", "· 6x50m jambes crawl planche R15''"]),
    block(400, ["· 4x50m un bras (l'autre tendu devant) R20''", "· 4x50m jambes crawl planche R15''"]),
    block(400, ["· 8x25m godilles R15''", "· 6x50m jambes dos planche R15''"]),
    block(450, ["· 4x25m catch-up R15''", "· 4x50m jambes crawl palmes R20''", "· 4x25m nage complète"]),
    block(400, ["· 6x25m crawl lent regard fond R15''", "· 5x50m jambes crawl planche R15''"]),
    block(400, ["· 4x50m catch-up R20''", "· 4x50m jambes crawl sans planche (bras devant) R20''"]),
    block(450, ["· 8x25m un bras R15''", "· 6x50m jambes crawl planche R15''", "· 2x25m nage complète"]),
    block(400, ["· 4x25m entrée de main alignée R15''", "· 4x50m jambes crawl planche R15''", "· 4x25m nage"]),
    block(500, ["· 4x50m catch-up R20''", "· 4x100m : 50m jambes · 50m crawl R20''"]),
    block(400, ["· 6x25m glisse / position R15''", "· 4x50m jambes crawl R15''", "· 4x25m nage complète"]),
  ]},
  /** Chien = rare (1 slot / cycle). Blocs courts, peu de jargon. */
  technique_chiens: { label:"Grand chien & petit chien", drills:[
    block(400, ["· 8x50 : 25m grand chien · 25m normal"]),
    block(400, ["· 8x50 : 25m petit chien · 25m normal"]),
    block(300, ["· 6x25m grand chien R15''", "· 6x25m petit chien R15''", "· 4x50m nage normale"]),
    block(400, ["· 8x25m grand chien R15''", "· 4x50m nage complète"]),
  ]},
  technique_croisement: { label:"Alignement / entrée de main", drills:[
    block(400, ["· 8x50m focus entrée de main alignée épaule R20''"]),
    block(400, ["· 6x50m : 25m un bras · 25m nage complète R20''"]),
    block(450, ["· 8x25m crawl lent, regard vers le fond R15''", "· 4x50m nage normale, checker l'alignement"]),
    block(400, ["· 8x50m : 25m catch-up large · 25m nage R20''"]),
    block(400, ["· 6x50m nage complète, entrée de main devant l'épaule R20''"]),
  ]},
  technique_virages: { label:"Virages culbute", drills:[
    block(470, ["· 8x15m culbute sans mur (rotation seule) R20''", "· 6x25m approche + virage, mains fixes hauteur hanches R20''", "· 4x50m avec virage au mur, sortie propulsée"]),
    block(470, ["· 6x25m virage + 5m de sortie en apnée R20''", "· 8x15m rotation seule, focus mains basses fixes", "· 4x50m enchaînement 2 virages par longueur"]),
    block(350, ["· 10x15m culbute isolée R15''", "· 4x50m virage + accélération sortie de mur R25''"]),
    block(270, ["· 8x15m rotation seule, compter 1-2 pour la rotation autour des épaules R20''", "· 6x25m virage complet, focus mains qui ne remontent pas R20''"]),
    block(350, ["· 6x25m approche à vitesse réelle + virage R20''", "· 4x50m 2 longueurs avec virage, sortie en 5 coups de jambes"])
  ]}
};

/* ---- Corps de séance physio : distances PROPRES (multiples du bassin) ----
   repDist = distance d'une répétition pour le calcul d'allure
   pools = bassins autorisés ([25], [50], ou [25,50] par défaut) */
const CORPS_PHYSIO = {
  endurance: [
    () => ({ text: `8x100m D2'`, distance: 800, repDist: 100 }),
    () => ({ text: `6x100m R20''`, distance: 600, repDist: 100 }),
    () => ({ text: `10x50 D1'`, distance: 500, repDist: 50 }),
    () => ({ text: `12x50 D1'`, distance: 600, repDist: 50 }),
    () => ({ text: `3x400m R30''`, distance: 1200, repDist: 400 }),
    () => ({ text: `4x200m R20''`, distance: 800, repDist: 200 }),
    () => ({ text: `6x200m R20''`, distance: 1200, repDist: 200 }),
    () => ({ text: `4x150m R20''`, distance: 600, repDist: 150 }),
    () => ({ text: `400m continu (sans pause)`, distance: 400, repDist: 400 }),
    () => ({ text: `800m continu (sans pause)`, distance: 800, repDist: 800 }),
    () => ({ text: `5x100m ↗ progressif R20''`, distance: 500, repDist: 100 }),
    () => ({ text: `8x50m R15''`, distance: 400, repDist: 50 }),
  ],
  vitesse: [
    () => ({ text: `8x50m R30''`, distance: 400, repDist: 50 }),
    () => ({ text: `6x50m R45'' RAC`, distance: 300, repDist: 50 }),
    // 25m : bassin 25 uniquement (sinon stop au milieu en 50m)
    () => ({ text: `10x25m départ plongé R30''`, distance: 250, repDist: 25, pools: [25] }),
    () => ({ text: `4x(4x25m) R15'' — R1' entre séries`, distance: 400, repDist: 25, pools: [25] }),
    () => ({ text: `6x25m R45'' RAC`, distance: 150, repDist: 25, pools: [25] }),
    // Bassin 50 : même nb de reps, chaque 50 = 25m à bloc + 25m relâché (fini au mur)
    () => ({ text: `10x50m : 25m à bloc + 25m relâché — départ plongé R30''`, distance: 500, repDist: 50, pools: [50] }),
    () => ({ text: `4x(4x50m : 25m à bloc + 25m relâché) R15'' — R1' entre séries`, distance: 800, repDist: 50, pools: [50] }),
    () => ({ text: `6x50m : 25m à bloc + 25m relâché R45'' RAC`, distance: 300, repDist: 50, pools: [50] }),
    () => ({ text: `4x50m progressif : · 1 — lent · 2 — ↗ · 3 — ↗ · 4 — rapide`, distance: 200, repDist: 50 }),
    () => ({ text: `4x50m dégressif : · 1 — rapide · 2 — ↘ · 3 — ↘ · 4 — lent`, distance: 200, repDist: 50 }),
  ],
  mixte: [
    () => ({ text: `4x100m : 50m technique + 50m physio R20''`, distance: 400, repDist: 100 }),
    () => ({ text: `6x75m : 25m éducatif + 50m physio R20''`, distance: 450, repDist: 75, pools: [25] }),
    () => ({ text: `6x100m : 50m éducatif + 50m physio R20''`, distance: 600, repDist: 100, pools: [50] }),
    () => ({ text: `3x(2x100m physio + 2x25m technique) R20''`, distance: 750, repDist: 100, pools: [25] }),
    () => ({ text: `3x(2x100m physio + 1x50m technique) R20''`, distance: 750, repDist: 100, pools: [50] }),
    () => ({ text: `4x50m technique + 4x50m physio R20''`, distance: 400, repDist: 50 }),
    () => ({ text: `5x100m : 25m catch-up + 75m physio R20''`, distance: 500, repDist: 100, pools: [25] }),
    () => ({ text: `5x100m : 50m catch-up + 50m physio R20''`, distance: 500, repDist: 100, pools: [50] }),
  ],
  eau_libre: [
    () => ({ text: `8x100m, visée toutes les 6 coups (sighting) R20''`, distance: 800, repDist: 100 }),
    () => ({ text: `6x150m continu, focus navigation R30''`, distance: 900, repDist: 150 }),
    () => ({ text: `4x200m, simulation peloton (drafting mental) R30''`, distance: 800, repDist: 200 }),
    () => ({ text: `2x400m allure course, sighting régulier R1'`, distance: 800, repDist: 400 }),
    () => ({ text: `5x100m avec départ groupé simulé R20''`, distance: 500, repDist: 100 }),
    () => ({ text: `3x300m continu, sighting toutes les 8 coups R30''`, distance: 900, repDist: 300 }),
  ],
  /** Chronos de contrôle — noter les temps pour mesurer l'évolution */
  test: [
    () => ({ text: `400m chrono continu — note ton temps (CSS)`, distance: 400, repDist: 400 }),
    () => ({ text: `2x200m chrono R3' — note chaque temps`, distance: 400, repDist: 200 }),
    () => ({ text: `100m chrono max + 300m facile R3' — note le 100m`, distance: 400, repDist: 100 }),
    () => ({ text: `3x100m chrono R2'30 — note chaque 100m (régularité)`, distance: 300, repDist: 100 }),
    () => ({ text: `200m allure course + 100m max R2' — note les 2 temps`, distance: 300, repDist: 100 }),
    () => ({ text: `8x50m D1'15 (Z3) — note le temps moyen /50m`, distance: 400, repDist: 50 }),
  ],
};

/* ---- Retours au calme / fins de séance : fonction(distance) -> lignes exactes ---- */
const RETOURS_CALME = [
  (d)=>[`· ${d}m dos/crawl très facile`],
  (d)=>[`· ${d}m nage libre facile, respiration relâchée`],
  (d)=>[`· ${d}m souple, respiration relâchée`],
  (d)=>{ const a=roundTo(d*0.8,25); return [`· ${a}m facile + ${d-a}m étirements bras/épaules`]; },
  (d)=>[`· ${d}m mixte crawl/dos, respiration relâchée`],
  (d)=>{ const a=roundTo(d/2,25); return [`· ${a}m crawl très facile + ${d-a}m dos`]; }
];
const FINS_SEMAINE = [
  (d) => `-${d}m au choix (RAC)`,
  (d) => `-${d}m libre récup`,
  (d) => `-${d}m le + lent possible, recherche de sensation`,
  (d) => `-${d}m au choix (Z1)`,
  (d) => `-${d}m au choix - souple`,
];
const DEPARTS_SEMAINE = [
  () => ({ distance: 400, text: `-400m Dos/Cr par 100m (Z1)` }),
  () => ({ distance: 400, text: `-400m Cr/Dos par 50m (Z1)` }),
  () => ({ distance: 400, text: `-400m Cr palmes (Z1)` }),
  () => ({ distance: 400, text: `-400m mixte crawl/dos souple (Z1)` }),
  () => ({ distance: 350, text: `-350m mixte crawl/dos (Z1)` }),
  () => ({ distance: 400, text: `-400m au choix (3ème 25m chq 100 en godille) (Z1)` }),
  () => ({ distance: 400, text: `-400m Cr souple (Z1)` }),
  () => ({ distance: 400, text: `-400m Dos/Cr par 50m (Z1)` }),
];
/** Départs avec jambes — uniquement si le focus technique n'est PAS déjà jambes. */
const DEPARTS_AVEC_JAMBES = [
  () => ({ distance: 400, text: `-400m au choix (3ème 25m chq 100 en jambes) (Z1)` }),
  () => ({ distance: 400, text: `-400m jambes crawl planche (Z1)` }),
];

/**
 * Cycle focus : ~3/8 jambes, chiens rare (1/8).
 * MySWYM = générateur de séances, pas école d'éducatifs.
 */
const FOCUS_CYCLE = [
  "technique_jambes",
  "technique_respiration",
  "technique_roulis",
  "technique_jambes",
  "technique_catchup",
  "technique_virages",
  "technique_chiens",
  "technique_jambes",
];

const MATERIEL = ["", " palmes", " palmes + tubas", " plaquettes", " palmes + plaquettes"];
/** Roulis / chiens : jamais de plaquettes — uniquement palmes (consigne Arthur). */
const MATERIEL_ROULIS = [" palmes", " palmes + tubas", " palmes"];
const RESPIRATIONS = ["bilatérale 3T", "libre", "bilatérale alternée"];

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

/* ============== GÉNÉRATEUR — SÉANCE UNIQUE ============== */

function genererSeance(niveauKey, objectifKey, phaseKey, dureeMin){
  const niveau = NIVEAUX[niveauKey];
  const phase = PHASES[phaseKey];
  const u = niveau.blockUnit;
  const w = roundTo(niveau.warmupBase * phase.volMult, 25);
  const resp = pick(RESPIRATIONS, "resp");
  const zonePrincipale = phase.zones[phase.zones.length-1];

  const ech = pick(ECHAUFFEMENTS, "echauffement")(w, resp);

  let corpsLines, corpsDist, objectifLabel;
  if(objectifKey.startsWith("technique_")){
    const techBlock = TECHNIQUE[objectifKey];
    objectifLabel = "Technique — " + techBlock.label;
    const b = pick(techBlock.drills, "tech_"+objectifKey);
    corpsLines = b.lines;
    corpsDist = b.distance;
  } else {
    const labels = { endurance:"Endurance", vitesse:"Vitesse / VMA", mixte:"Mixte technique + physio", eau_libre:"Eau libre" };
    objectifLabel = labels[objectifKey];
    const r = pick(CORPS_PHYSIO[objectifKey], "physio_"+objectifKey)(u);
    corpsLines = [`· ${r.text} (${zonePrincipale})`];
    corpsDist = r.distance;
  }

  const subtotal = ech.distance + corpsDist;
  const totalDist = roundTo(subtotal + 150, 100);
  const retourDist = totalDist - subtotal;
  const retourLines = pick(RETOURS_CALME, "retour")(retourDist);

  const lines = [];
  lines.push(`Séance – ${objectifLabel} (${phase.label})`);
  lines.push(`Total : ${totalDist}m — ${dureeMin}-${parseInt(dureeMin)+15} min`);
  lines.push("");
  lines.push(`Échauffement (${ech.distance}m)`);
  lines.push(...ech.lines);
  lines.push("");
  lines.push(`Corps de séance (${corpsDist}m) — ${zonePrincipale}`);
  lines.push(...corpsLines);
  lines.push("");
  lines.push(`Retour au calme (${retourDist}m)`);
  lines.push(...retourLines);
  lines.push("");
  lines.push(`${niveau.label} · ${phase.note}`);

  return lines.join("\n");
}

/* ============== GÉNÉRATEUR — SEMAINE COMPLÈTE ============== */

// Distance moyenne d'un pool de blocs technique (pour orienter la recherche d'unité de base)
function avgTechDistance(){
  let sum = 0, count = 0;
  Object.values(TECHNIQUE).forEach(cat => cat.drills.forEach(b => { sum += b.distance; count++; }));
  return sum / count;
}
const AVG_TECH_DIST = avgTechDistance();

function avgPhysioDistance(objectifKey){
  const builders = CORPS_PHYSIO[objectifKey];
  const sum = builders.reduce((s, fn) => s + fn().distance, 0);
  return sum / builders.length;
}

function estimateSessionTotal(objectifKey){
  const departEstimate = 400;
  const techEstimate = AVG_TECH_DIST;
  const principalEstimate = objectifKey.startsWith("technique_")
    ? avgTechDistance()
    : avgPhysioDistance(objectifKey);
  return departEstimate + techEstimate + principalEstimate + 200;
}

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
 * Ne touche pas aux « 25m A · 25m B » déjà structurés dans une longueur de 50.
 */
function adaptLineRepsForPool50(line) {
  if (!line) return line;
  let t = line;
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

/** Distance approximative d'un bloc technique (lignes · NxXm / Ax(BxCm)). */
function estimateLinesDistance(lines) {
  let total = 0;
  for (const raw of lines) {
    let t = String(raw);
    t = t.replace(/(\d+)\s*x\s*\(\s*(\d+)\s*x\s*(\d+)\s*m/gi, (_m, a, b, d) => {
      total += parseInt(a, 10) * parseInt(b, 10) * parseInt(d, 10);
      return "";
    });
    t.replace(/(\d+)\s*x\s*(\d+)\s*m/gi, (_m, n, d) => {
      total += parseInt(n, 10) * parseInt(d, 10);
      return "";
    });
  }
  return total;
}

/** Adapte un bloc technique au bassin 50 — distance = somme réelle des reps adaptées. */
function adaptTechBlockForPool(blk, pool) {
  if (pool !== 50 || !blk) return blk;
  const lines = blk.lines.map(adaptLineRepsForPool50);
  const dist = estimateLinesDistance(lines);
  return { distance: dist > 0 ? dist : blk.distance, lines };
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

  t = t.replace(/\(Z1\s*@/g, "(facile @");
  t = t.replace(/\(Z2\s*@/g, "(confortable @");
  t = t.replace(/\(Z3\s*@/g, "(soutenu @");
  t = t.replace(/\(Z4\s*@/g, "(rapide @");
  t = t.replace(/\(Z1\)/g, "(facile)");
  t = t.replace(/\(Z2\)/g, "(confortable)");
  t = t.replace(/\(Z3\)/g, "(soutenu)");
  t = t.replace(/\(Z4\)/g, "(rapide)");
  t = t.replace(/\(Z1 souple\)/gi, "(facile — souple)");

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
  const departPool = techniqueFocusKey === "technique_jambes"
    ? DEPARTS_SEMAINE
    : [...DEPARTS_SEMAINE, ...DEPARTS_AVEC_JAMBES];
  const depart = scaleDepartBlock(pick(departPool, "depart")(), isTest ? Math.min(mult, 0.85) : mult);
  lignes.push(depart.text);

  // Technique rotative — adapter Nx25m si bassin 50
  const techBlock = TECHNIQUE[techniqueFocusKey];
  const techPicked = adaptTechBlockForPool(
    pick(techBlock.drills, "tech_semaine_"+techniqueFocusKey),
    bassin,
  );
  const materielPool = (techniqueFocusKey === "technique_roulis" || techniqueFocusKey === "technique_chiens")
    ? MATERIEL_ROULIS
    : techniqueFocusKey === "technique_jambes"
      ? [""] // matériel déjà dans les lignes (planche / palmes)
      : MATERIEL;
  const materiel = pick(materielPool, "materiel");
  lignes.push(`-${techPicked.distance}m ${techBlock.label.toLowerCase()}${materiel}`);
  techPicked.lines.forEach(l => lignes.push("  " + l));

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
    principalLines = [`-${principalDist}m ${mainTech.label.toLowerCase()}`, ...mainPicked.lines.map(l => "  " + l)];
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

  // Fin RAC — scale légère
  const subtotal = depart.distance + techPicked.distance + principalDist;
  const finBase = volumeTier === "allegee" || volumeTier === "test" ? 150 : 200;
  const finTarget = Math.max(100, roundTo(finBase * Math.min(1.2, Math.max(0.6, mult)), 50));
  const totalArrondi = roundTo(subtotal + finTarget, 100);
  const finReal = Math.max(100, totalArrondi - subtotal);
  const finClean = Math.min(400, Math.max(100, roundTo(finReal, 50)));
  const totalFinal = subtotal + finClean;
  lignes.push(pick(FINS_SEMAINE, "fin")(finClean));

  // Départ / fin : (Zx) → (Zx @…) si Premium + T100 ; corps déjà taggé via paceTag
  const withPace = annotateBareZones(lignes, ref100Seconds);
  const body = isBeginner ? clarifyBeginnerSession(withPace) : withPace;
  const header = `S${numSemaine}.${indexSeance} : ${totalFinal}m`;
  return { text: header + "\n" + body.join("\n"), total: totalFinal, zone, role: objectifKey };
}

function genererSemaine(niveauKey, objectifKey, phaseKey, nbSeances, numSemaine, ref100Str, _ref400Str, typeSemaine, prevDistance, pool = 50){
  const ref100Seconds = parseTime(ref100Str);
  const focusCycle = FOCUS_CYCLE;
  const bassin = normalizePool(pool);

  const { target, maxAutorise, statutLabel, refTotal } = computeWeekTarget(niveauKey, typeSemaine, prevDistance);
  const volumeTier = typeSemaine === "allegee" ? "allegee" : typeSemaine === "test" ? "test" : typeSemaine === "reference" ? "reference" : "normale";
  const weekScale = Math.max(0.55, Math.min(1.45, target / (refTotal || target)));

  const blocs = [];
  let totalReel = 0;
  for(let i=1;i<=nbSeances;i++){
    const focus = focusCycle[(numSemaine - 1 + i - 1) % focusCycle.length];
    const res = genererSeanceDeSemaine(niveauKey, objectifKey, phaseKey, numSemaine, i, focus, ref100Seconds, null, bassin, null, volumeTier, null, null, weekScale);
    blocs.push(res.text);
    totalReel += res.total;
  }

  let statutFinal = statutLabel;
  if(maxAutorise){
    statutFinal += totalReel <= maxAutorise ? " · Statut : OK" : " · Statut : Dépassement";
  }

  let entete = `Semaine ${numSemaine} — ${PHASES[phaseKey].label} (${NIVEAUX[niveauKey].label})`;
  entete += `\nDistance semaine : ${totalReel}m — ${statutFinal}`;
  if(maxAutorise) entete += `\nSemaine précédente : ${prevDistance}m · Max autorisé (+10%) : ${maxAutorise}m`;
  if(ref100Seconds) entete += `\nAllure repère 100m (T100) : ${formatTime(ref100Seconds)}`;
  else entete += `\nPas d'allure repère renseignée — zones affichées sans chiffres (Z1/Z2/Z3/Z4).`;

  return entete + "\n\n" + blocs.join("\n\n");
}

/** Retourne les séances structurées pour intégration app (sans en-tête semaine).
 *  sessionRoles (optionnel) : tableau [{ objectif, zone }] longueur = nbSeances — pilotage COSD.
 *  opts.volMult : scale distances (même base, volume selon niveau).
 *  opts.simplifyWording : clarifier Z1/R15 pour découverte uniquement.
 *  opts.pool : 25 | 50 — longueur de bassin (onboarding). */
export function genererSemaineSessions(niveauKey, objectifKey, phaseKey, nbSeances, numSemaine, ref100Str, _ref400Str, typeSemaine, prevDistance, sessionRoles = null, opts = {}) {
  const ref100Seconds = parseTime(ref100Str);
  const bassin = normalizePool(opts.pool);
  const focusCycle = FOCUS_CYCLE;
  const volumeTier = typeSemaine === "allegee" ? "allegee" : typeSemaine === "test" ? "test" : typeSemaine === "reference" ? "reference" : "normale";
  const volMult = opts.volMult ?? null;
  const simplifyWording = opts.simplifyWording ?? null;
  const { target, refTotal } = computeWeekTarget(niveauKey, typeSemaine, prevDistance);
  const weekScale = Math.max(0.55, Math.min(1.45, target / (refTotal || target)));

  const sessions = [];
  let totalReel = 0;
  for (let i = 1; i <= nbSeances; i++) {
    // Rotation sur semaine + séance → tout le cycle apparaît même à 2–3×/sem
    const focus = focusCycle[(numSemaine - 1 + i - 1) % focusCycle.length];
    const role = sessionRoles && sessionRoles[i - 1] ? sessionRoles[i - 1] : null;
    const obj = role?.objectif || objectifKey;
    const zone = role?.zone || null;
    const res = genererSeanceDeSemaine(niveauKey, obj, phaseKey, numSemaine, i, focus, ref100Seconds, null, bassin, zone, volumeTier, volMult, simplifyWording, weekScale);
    sessions.push(res);
    totalReel += res.total;
  }
  return { sessions, totalDistance: totalReel };
}


/* ============== BANQUE CONFIRMÉ (ex-OW_BASE_SESSIONS) ============== */
/* Niveau confirmé (performance/advanced → niveauKey confirme|triathlete).
   Objectifs : eau_libre, mixte (triathlon), endurance (nager & progresser).
   Rotation archeIdx = wi*3+si sur tout le plan. */

function owSnap(d, P) { return Math.max(P, Math.round(d / P) * P); }
function owLvlIndex(level) {
  return ({
    découverte: 0, beginner: 1, régulier: 1,
    intermediate: 2, sportif: 2,
    advanced: 3, performance: 3,
  })[level] ?? 1;
}
function owFmtS(s) {
  return `${Math.floor(s / 60)}'${Math.round(s % 60).toString().padStart(2, "0")}"`;
}
/** D… (Premium) ou R… (gratuit) — autonome, sans App.jsx */
function owDep(meters, lvl, zone = "easy", opts = {}) {
  const restPrem = { sprint: 90, threshold: 15, easy: 20 };
  const restFree = { sprint: 90, threshold: 30, easy: 20 };
  if (!opts.isPremium) return `R${owFmtS(restFree[zone] ?? 20)}`;
  const zoneMult = { easy: 1.35, threshold: 1.08, sprint: 0.95 };
  const paceFallback = { easy: [220, 170, 130, 105], threshold: [200, 155, 112, 90], sprint: [180, 140, 95, 75] };
  const li = Math.min(3, Math.max(0, lvl));
  const secsPer100 = opts.pace100 > 0
    ? opts.pace100 * (zoneMult[zone] ?? 1.35)
    : paceFallback[zone][li];
  const totalSecs = Math.ceil((meters * secsPer100 / 100 + (restPrem[zone] ?? 20)) / 5) * 5;
  if (opts.pace100 > 0) {
    return `D${owFmtS(totalSecs)} · allure cible ${owFmtS(Math.round(secsPer100))}/100m`;
  }
  return `D${owFmtS(totalSecs)}`;
}


/* Banque confirmé (ex-OW_BASE_SESSIONS) — signature coach Arthur */
const OW_VOL = { découverte: 0.35, beginner: 0.55, régulier: 0.55, intermediate: 0.75, sportif: 0.75, advanced: 1, performance: 1 };
const owVol = (level) => OW_VOL[level] ?? 0.75;
const owRep = (n, level, min = 2) => Math.max(min, Math.round(n * (owVol(level) >= 1 ? 1 : owVol(level) >= 0.75 ? 0.8 : 0.6)));
const owM = (m, level, P, floor = 100) => Math.max(floor, owSnap(Math.round(m * owVol(level) / P) * P, P));
const owBeg = (level) => level === "découverte" || level === "beginner" || level === "régulier";
const owTuba = (level) => owLvlIndex(level) >= 2;
const ow50Int = (P, level, lvl, opts = {}) => owBeg(level)
  ? `R${P <= 25 ? "25\"" : "30\""} — respiration 3 temps, nage propre`
  : `${owDep(P, lvl, "threshold", opts)} — respiration 3 temps, nage appliquée`;
const ow100Rest = (P, level) => owBeg(level) ? `R${P <= 25 ? "30\"" : "25\""}` : `R20"`;
const owRAC = (m, level, P) => `${owM(m, level, P, P)}m au choix — souple, sans chrono`;

const OW_BASE_SESSIONS = [
  // S1.1 — Grand chien & roulis
  (P, level, opts = {}) => {
    const lvl = owLvlIndex(level), tuba = owTuba(level);
    const w = owM(400, level, P), n50 = owRep(4, level), nMain = owRep(10, level, 4), rac = owM(200, level, P, P);
    return {
      type: "TECHNIQUE",
      title: "Grand chien & roulis",
      intensity: "Z1/Z2 — réathlétisation, nage appliquée sans forcer",
      details: [
        `Échauffement : ${w}m crawl/dos par ${P}m — Z1, alterne à chaque longueur`,
        `${n50}×${P}m grand chien${tuba ? " + tuba frontal" : ""} — le plus lentement possible — R20" — un bras tendu devant, échange complet, sens la prise d'eau`,
        tuba
          ? `${n50}×${P}m palmes + tuba roulis — R20" — rotation du bassin, talons à la surface`
          : `${n50}×${P}m palmes crawl — R20" — jambes actives, corps à plat`,
        `${nMain}×${P}m crawl — ${ow50Int(P, level, lvl, opts)} — garde la technique des éducatifs, sighting tous les 8 bras`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S1.2 — Position & endurance 100m
  (P, level, opts = {}) => {
    const w = owM(400, level, P), n50 = owRep(4, level), n100 = owRep(6, level, 3), slow = owM(200, level, P), rac = owM(300, level, P, P);
    return {
      type: "ENDURANCE",
      title: "Position & endurance 100m",
      intensity: "Z2 — allure régulière, recherche de position dans l'eau",
      details: [
        `Échauffement : ${w}m crawl palmes — Z1, jambes actives, corps à plat`,
        `${slow}m le plus lent possible — recherche de sensation, loin devant / loin derrière, teste différentes positions`,
        `${n50}×${P}m palmes : ${P}m bras droit devant / gauche cuisse · ${P}m inversé — respiration latérale — R20"`,
        `${n100}×${2*P}m crawl — ${ow100Rest(P, level)} — Z2, allure régulière, respiration 3 temps`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S1.3 — Sensibilité & continuité
  (P, level, opts = {}) => {
    const w1 = owM(200, level, P), w2 = owM(200, level, P), n50 = owRep(8, level, 4), cont = owM(400, level, P), palmes = owM(200, level, P), rac = owM(100, level, P, P);
    return {
      type: "RÉCUPÉRATION",
      title: "Sensibilité & continuité",
      intensity: "Z1/Z2 léger — efficacité et position, sans pression",
      details: [
        `Échauffement : ${w1}m crawl + ${w2}m dos — Z1`,
        `${n50}×${P}m le moins de mouvements possible par ${P}m — R20" — concentre-toi sur la position, efficacité de traction, loin devant / loin derrière`,
        `${cont}m crawl Z2 — sans pause, rythme régulier — tu dois tenir de bout en bout`,
        `${palmes}m palmes : ${P}m ondulation sous l'eau / ${3*P}m crawl — R20" — sens l'ondulation, enchaîne en nage fluide`,
        `Retour au calme : ${rac} relâché — Z1`,
      ],
    };
  },
  // S2.1 — DPS & progressif/dégressif
  (P, level, opts = {}) => {
    const lvl = owLvlIndex(level), w = owM(400, level, P), n50 = owRep(4, level), nMain = owRep(10, level, 4), rac = owM(300, level, P, P);
    return {
      type: "TECHNIQUE",
      title: "DPS & progressif/dégressif",
      intensity: "Z2 — modulation d'allure sans vitesse, nage appliquée",
      details: [
        `Échauffement : ${w}m crawl/dos par ${2*P}m — Z1`,
        `${n50}×${P}m le moins de coups de bras possible sur ${P}m — R20" — compte tes bras, vise moins de cycles`,
        `${n50}×${P}m progressif : 1 lent · 2 ↗ · 3 ↗ · 4 rapide — R20" — monte en puissance sur la série`,
        `${nMain}×${P}m crawl — ${ow50Int(P, level, lvl, opts)} — même technique qu'en éducatif`,
        `${n50}×${P}m dégressif : 1 rapide · 2 ↘ · 3 ↘ · 4 lent — R20" — redescends progressivement`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S2.2 — Endurance 100m & position palmes
  (P, level, opts = {}) => {
    const w = owM(400, level, P), n50 = owRep(4, level), n100 = owRep(8, level, 4), slow = owM(200, level, P), rac = owM(200, level, P, P);
    return {
      type: "ENDURANCE",
      title: "Endurance 100m & position palmes",
      intensity: "Z2 — fond aérobie, travail de position en échauffement",
      details: [
        `Échauffement : ${w}m crawl palmes — Z1`,
        `${n50}×${P}m palmes : ${P}m bras droit devant / gauche cuisse · ${P}m inversé — respiration latérale — R20"`,
        `${n100}×${2*P}m crawl — ${ow100Rest(P, level)} — Z2, allure tenue du 1er au dernier 100m`,
        `${slow}m le plus lent possible — recherche de sensation, relâche les épaules`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S2.3 — Hypoxie intégrée
  (P, level, opts = {}) => {
    const w = owM(400, level, P), jambes = owM(200, level, P), n50 = owRep(6, level), n100 = owRep(6, level, 3), rac = owM(200, level, P, P);
    const hyp50 = owBeg(level) ? `${P}m resp. 3 temps · ${P}m normal` : `${P}m grand chien · ${P}m normal`;
    const hyp100 = owBeg(level)
      ? "3 temps · 3 temps · 5 temps · 5 temps · 3 temps · 3 temps"
      : "3 temps · 5 temps · 7 temps · 9 temps · 7 temps · 5 temps";
    return {
      type: "TECHNIQUE",
      title: "Hypoxie intégrée",
      intensity: "Z2 — contrôle respiratoire intégré au set, pas de sprint",
      details: [
        `Échauffement : ${w}m au choix — Z1, crawl ou dos`,
        `${jambes}m jambes planche — battements mains en flèche, corps gainé`,
        `${n50}×${2*P}m : ${hyp50} — R15" — le plus lentement possible sur l'éducatif`,
        `${n100}×${2*P}m crawl — ${ow100Rest(P, level)} — respiration par 100m : ${hyp100}`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S3.1 — Volume 50m & hypoxie rotative
  (P, level, opts = {}) => {
    const lvl = owLvlIndex(level), tuba = owTuba(level), w = owM(400, level, P), n50 = owRep(5, level), nMain = owRep(12, level, 6), slow = owM(400, level, P);
    const hypRot = owBeg(level) ? "3 temps · 3 temps · 5 temps · 5 temps" : "3 temps · 5 temps · 7 temps · 9 temps";
    return {
      type: "TECHNIQUE",
      title: "Volume 50m & hypoxie rotative",
      intensity: "Z2 — montée de volume, nage appliquée, épaule en confiance",
      details: [
        `Échauffement : ${w}m crawl/dos par ${P}m — Z1`,
        `${n50}×${P}m${tuba ? " tuba lent" : ""} : ${P}m grand chien · ${P}m crawl normal — R20" — le plus lentement possible`,
        tuba ? `${n50}×${P}m palmes + tuba roulis — R20" — rotation consciente` : `${n50}×${P}m palmes crawl — R20" — rotation du bassin`,
        `${nMain}×${P}m crawl — ${ow50Int(P, level, lvl, opts)} — respiration par 50m en rotation : ${hypRot}`,
        `${slow}m le plus lent possible — recherche de sensation + récup — relâche tout`,
      ],
    };
  },
  // S3.2 — Endurance 100m & travail sous l'eau
  (P, level, opts = {}) => {
    const lvl = owLvlIndex(level), tuba = owTuba(level), w = owM(400, level, P), n25 = owRep(8, level, 4), n100 = owRep(10, level, 5), rac = owM(200, level, P, P);
    const edu = tuba ? `2×${2*P}m catch-up drill + tuba — le plus lentement possible — R20" — un bras attend l'autre` : `2×${2*P}m catch-up drill — R20" — un bras attend l'autre, nage lente`;
    return {
      type: "ENDURANCE",
      title: "Endurance 100m & travail sous l'eau",
      intensity: "Z2 — fond aérobie, volume en hausse sans monter l'intensité",
      details: [
        `Échauffement : ${w}m crawl palmes — Z1`,
        edu,
        `${n25}×${P}m palmes : 1× crawl sous l'eau · 1× godille pied en avant sur le dos — R20" — alterne les ${P}m`,
        `${n100}×${2*P}m crawl — ${ow100Rest(P, level)} — Z2, allure régulière — note si tu tiens le même rythme sur toutes les reps`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S3.3 — Reps 150m & ondulation palmes
  (P, level, opts = {}) => {
    const lvl = owLvlIndex(level), w = owM(400, level, P), n50 = owRep(8, level, 4), n150 = owRep(4, level, 2), n100 = owRep(4, level, 2), slow = owM(200, level, P), rep150 = Math.min(6*P, 150);
    const hyp150 = owBeg(level) ? "3 temps · 3 temps · 5 temps · 3 temps · 3 temps" : "3 temps · 5 temps · 7 temps · 5 temps · 3 temps";
    const palmesDep = owBeg(level) ? `R${P <= 25 ? "30\"" : "25\""}` : owDep(2*P, lvl, "threshold", opts);
    return {
      type: "ENDURANCE",
      title: "Reps 150m & ondulation palmes",
      intensity: "Z2 — reps longues, respiration et ondulation, gestion d'allure",
      details: [
        `Échauffement : ${w}m au choix — Z1`,
        `${n50}×${2*P}m : ${P}m grand chien · ${P}m crawl normal — R15" — le plus lentement possible sur l'éducatif`,
        `${n150}×${rep150}m crawl — R25" — respiration par 25m : ${hyp150} — même allure malgré le changement respiratoire`,
        `${n100}×${2*P}m palmes : ${P}m ondulation sous l'eau / ${3*P}m crawl — ${palmesDep} — sens l'ondulation, enchaîne en nage fluide`,
        `${slow}m le plus lent possible — souple + sensation`,
      ],
    };
  },
];

/** Distance totale depuis les lignes de détail (même logique que App.calcSessionDistance). */
export function calcDetailsDistance(details = []) {
  let total = 0;
  for (const line of details) {
    let rest = line;
    rest = rest.replace(/(\d+)\s*[×x]\s*(\d+)\s*m/g, (_, n, x) => {
      total += parseInt(n, 10) * parseInt(x, 10);
      return "";
    });
    rest = rest.replace(/(\d+(?:\s*[–\-]\s*\d+)+)\s*m/g, (_, seq) => {
      seq.split(/[–\-]/).forEach((v) => {
        const n = parseInt(v.trim(), 10);
        if (!Number.isNaN(n)) total += n;
      });
      return "";
    });
    rest.replace(/\b(\d+)\s*m\b/g, (_, x) => { total += parseInt(x, 10); });
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

export { genererSeance, genererSemaine, genererSeanceDeSemaine, TECHNIQUE, PHASES, NIVEAUX, volumeMultFromProfileLevel, VOL_BY_NIVEAU_KEY, OW_BASE_SESSIONS };
