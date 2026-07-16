
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
  technique_chiens: { label:"Grand chien & petit chien", drills:[
    // Format Excel Arthur — très fréquent
    block(400, ["· 8x50 : 25m grand chien · 25m normal"]),
    block(400, ["· 8x50 : 25m petit chien · 25m normal"]),
    block(400, ["· 6x50 : · 25m grand chien · 25m normal"]),
    block(400, ["· 6x50 : · 25m petit chien · 25m normal"]),
    block(300, ["· 5x50 tubas lent : · 25m grand chien · 25m normal"]),
    block(300, ["· 5x50 tubas lent : · 25m petit chien · 25m normal"]),
    block(400, ["· 4x50 tubas lent en grand chien", "· 4x50 tubas lent en petit chien"]),
    block(400, ["· 8x25m grand chien lent R15''", "· 8x25m petit chien (traction courte sous le buste, coudes hauts) R15''"]),
    block(450, ["· 6x25m grand chien (bras large, entrée devant l'épaule) R15''", "· 6x25m petit chien (mains près du corps, pas d'extension longue) R15''", "· 4x50m nage normale"]),
    block(400, ["· 8x25m petit chien → grand chien alterné R15''", "· 4x50m nage normale, garder la précision de l'entrée"]),
    block(400, ["· 8x25m grand chien avec pause 1s bras tendu devant R15''", "· 4x50m : 25m petit chien · 25m normal"]),
    block(500, ["· 8x25m grand chien lent R15''", "· 4x50m alterné grand chien / nage normale par 25m", "· 4x25m petit chien focus regard vers le fond"]),
    block(400, ["· 10x25m grand chien, main qui entre devant l'épaule pas devant la tête R15''", "· 4x50m : 25m petit chien · 25m crawl"]),
  ]},
  technique_croisement: { label:"Croisement des bras (correction)", drills:[
    block(450, ["· 6x25m grand chien (bras large, entrée devant l'épaule) R15''", "· 4x50m focus entrée de main alignée épaule R20''", "· 4x25m nage normale, penser à l'entrée large"]),
    block(500, ["· 8x25m grand chien lent R15''", "· 4x50m alterné grand chien / nage normale par 25m", "· 4x25m focus regard vers le fond en respirant"]),
    block(400, ["· 8x50 : 25m grand chien · 25m normal"]),
    block(400, ["· 8x50 : 25m petit chien · 25m normal"]),
    block(450, ["· 10x25m grand chien, main qui entre devant l'épaule pas devant la tête R15''", "· 4x50m nage normale, checker l'alignement toutes les 25m"]),
    block(400, ["· 8x25m grand chien avec pause 1s bras tendu devant R15''", "· 4x50m alterné 25 petit chien / 25 normal, focus regard bas"]),
    block(400, ["· 6x50m grand chien + palmes, sentir l'appui large R20''", "· 4x25m nage complète, contrôle de l'entrée de main"]),
  ]},
  technique_virages: { label:"Virages culbute", drills:[
    block(470, ["· 8x15m culbute sans mur (rotation seule) R20''", "· 6x25m approche + virage, mains fixes hauteur hanches R20''", "· 4x50m avec virage au mur, sortie propulsée"]),
    block(470, ["· 6x25m virage + 5m de sortie en apnée R20''", "· 8x15m rotation seule, focus mains basses fixes", "· 4x50m enchaînement 2 virages par longueur"]),
    block(350, ["· 10x15m culbute isolée R15''", "· 4x50m virage + accélération sortie de mur R25''"]),
    block(270, ["· 8x15m rotation seule, compter 1-2 pour la rotation autour des épaules R20''", "· 6x25m virage complet, focus mains qui ne remontent pas R20''"]),
    block(350, ["· 6x25m approche à vitesse réelle + virage R20''", "· 4x50m 2 longueurs avec virage, sortie en 5 coups de jambes"])
  ]}
};

/* ---- Corps de séance physio : distances PROPRES (50/100/150/200/400) comme Excel Arthur ----
   repDist = distance d'une répétition pour le calcul d'allure */
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
    () => ({ text: `10x25m départ plongé R30''`, distance: 250, repDist: 25 }),
    () => ({ text: `4x(4x25m) R15'' — R1' entre séries`, distance: 400, repDist: 25 }),
    () => ({ text: `6x25m R45'' RAC`, distance: 150, repDist: 25 }),
    () => ({ text: `4x50m progressif : · 1 — lent · 2 — ↗ · 3 — ↗ · 4 — rapide`, distance: 200, repDist: 50 }),
    () => ({ text: `4x50m dégressif : · 1 — rapide · 2 — ↘ · 3 — ↘ · 4 — lent`, distance: 200, repDist: 50 }),
  ],
  mixte: [
    () => ({ text: `4x100m : 50m technique + 50m physio R20''`, distance: 400, repDist: 100 }),
    () => ({ text: `6x75m : 25m éducatif + 50m physio R20''`, distance: 450, repDist: 75 }),
    () => ({ text: `3x(2x100m physio + 2x25m technique) R20''`, distance: 750, repDist: 100 }),
    () => ({ text: `4x50m technique + 4x50m physio R20''`, distance: 400, repDist: 50 }),
    () => ({ text: `5x100m : 25m catch-up + 75m physio R20''`, distance: 500, repDist: 100 }),
  ],
  eau_libre: [
    () => ({ text: `8x100m, visée toutes les 6 coups (sighting) R20''`, distance: 800, repDist: 100 }),
    () => ({ text: `6x150m continu, focus navigation R30''`, distance: 900, repDist: 150 }),
    () => ({ text: `4x200m, simulation peloton (drafting mental) R30''`, distance: 800, repDist: 200 }),
    () => ({ text: `2x400m allure course, sighting régulier R1'`, distance: 800, repDist: 400 }),
    () => ({ text: `5x100m avec départ groupé simulé R20''`, distance: 500, repDist: 100 }),
    () => ({ text: `3x300m continu, sighting toutes les 8 coups R30''`, distance: 900, repDist: 300 }),
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
  () => ({ distance: 400, text: `-400m au choix (3ème 25m chq 100 en grand chien) (Z1)` }),
  () => ({ distance: 400, text: `-400m au choix (3ème 25m chq 100 en petit chien) (Z1)` }),
  () => ({ distance: 400, text: `-400m au choix (3ème 25m chq 100 en godille) (Z1)` }),
  () => ({ distance: 400, text: `-400m Dos/Cr par 100m (Z1)` }),
  () => ({ distance: 400, text: `-400m Cr palmes (Z1)` }),
  () => ({ distance: 400, text: `-400m mixte crawl/dos souple (Z1)` }),
  () => ({ distance: 350, text: `-350m mixte crawl/dos (Z1)` }),
  () => ({ distance: 400, text: `-400m Cr/Dos par 50m (Z1)` }),
];

/** Cycle technique : grand/petit chien très présents (comme Excel Arthur). */
const FOCUS_CYCLE = [
  "technique_chiens",
  "technique_roulis",
  "technique_chiens",
  "technique_respiration",
  "technique_chiens",
  "technique_catchup",
  "technique_croisement",
  "technique_virages",
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
// Vraies valeurs issues de la grille d'allures (% du temps de référence)
const ZONE_MULT = { Z1:[1.18,1.28], Z2:[1.08,1.17], Z3:[1.01,1.07], Z4:[0.92,1.00] };
// Base 400m recommandée pour Z1-Z3, base 100m recommandée pour Z4/sprint
function paceTag(ref100Seconds, ref400Seconds, zoneKey, distance){
  const mult = ZONE_MULT[zoneKey];
  if(!mult) return `(${zoneKey})`;
  let basePace100;
  if(zoneKey === "Z4" && ref100Seconds) basePace100 = ref100Seconds;
  else if(ref400Seconds) basePace100 = ref400Seconds / 4;
  else if(ref100Seconds) basePace100 = ref100Seconds;
  else return `(${zoneKey})`;
  const [lo,hi] = mult;
  const low = basePace100*lo*(distance/100);
  const high = basePace100*hi*(distance/100);
  return `(${zoneKey} @${formatTime(low)}-${formatTime(high)})`;
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

function avgPhysioDistance(objectifKey, u){
  const builders = CORPS_PHYSIO[objectifKey];
  const sum = builders.reduce((s, fn) => s + fn(u).distance, 0);
  return sum / builders.length;
}

function estimateSessionTotal(u, objectifKey){
  const departEstimate = 400;
  const techEstimate = AVG_TECH_DIST;
  const principalEstimate = objectifKey.startsWith("technique_")
    ? avgTechDistance()
    : avgPhysioDistance(objectifKey, u);
  return departEstimate + techEstimate + principalEstimate + 200;
}

/** Unité de bloc = celle du niveau uniquement (50/75/100) — jamais de distance bizarre type 125/175. */
function findBestBlockUnit(niveauKey){
  return NIVEAUX[niveauKey]?.blockUnit || 75;
}

function computeWeekTarget(niveauKey, typeSemaine, prevDistance){
  if(typeSemaine === "reference" || !prevDistance || prevDistance <= 0){
    const refTotal = { debutant:3600, intermediaire:4800, confirme:6000, triathlete:6600 }[niveauKey];
    return { target: refTotal, maxAutorise:null, statutLabel:"Référence (1ère semaine)", prevDistance:0 };
  }
  if(typeSemaine === "allegee"){
    const target = Math.round(prevDistance*0.75/100)*100;
    return { target, maxAutorise:null, statutLabel:"Semaine allégée — décharge (~-25%)", prevDistance };
  }
  const maxAutorise = Math.floor((prevDistance*1.10) / 100) * 100;
  return { target: maxAutorise, maxAutorise, statutLabel:"Charge normale — cible +10%", prevDistance };
}

/** Choisit un corps physio dans une fourchette de volume (évite 1200m + 400m n'importe comment). */
function pickCorpsInRange(objectifKey, minDist, maxDist, pickKey){
  const poolKey = CORPS_PHYSIO[objectifKey] ? objectifKey : "endurance";
  const builders = CORPS_PHYSIO[poolKey];
  const scored = builders
    .map((fn, i) => ({ i, r: fn() }))
    .filter(({ r }) => r.distance >= minDist && r.distance <= maxDist);
  const list = scored.length ? scored : builders.map((fn, i) => ({ i, r: fn() }));
  const chosen = pick(list, pickKey);
  return chosen.r;
}

function genererSeanceDeSemaine(niveauKey, objectifKey, phaseKey, numSemaine, indexSeance, techniqueFocusKey, ref100Seconds, ref400Seconds, u, forcedZone = null, volumeTier = "normale"){
  const phase = PHASES[phaseKey];
  const lignes = [];

  // Départ Z1 — toujours ~400m (format Excel Arthur)
  const depart = pick(DEPARTS_SEMAINE, "depart")();
  lignes.push(depart.text);

  // Technique rotative
  const techBlock = TECHNIQUE[techniqueFocusKey];
  const techPicked = pick(techBlock.drills, "tech_semaine_"+techniqueFocusKey);
  const materielPool = (techniqueFocusKey === "technique_roulis" || techniqueFocusKey === "technique_chiens")
    ? MATERIEL_ROULIS
    : MATERIEL;
  const materiel = pick(materielPool, "materiel");
  lignes.push(`-${techPicked.distance}m ${techBlock.label.toLowerCase()}${materiel}`);
  techPicked.lines.forEach(l => lignes.push("  " + l));

  const zone = forcedZone || pick(phase.zones, "zone_"+indexSeance);
  let principalDist, principalLines;

  // Fourchettes corps selon tier de volume (réf / normale / allégée)
  const corpsRange =
    volumeTier === "allegee" ? [300, 600]
    : volumeTier === "reference" ? [400, 800]
    : [500, 1200];

  if(objectifKey.startsWith("technique_")){
    const mainTech = TECHNIQUE[objectifKey];
    const mainPicked = pick(mainTech.drills, "tech_principal_"+objectifKey);
    principalDist = mainPicked.distance;
    principalLines = [`-${principalDist}m ${mainTech.label.toLowerCase()}`, ...mainPicked.lines.map(l => "  " + l)];
  } else {
    const r = pickCorpsInRange(objectifKey, corpsRange[0], corpsRange[1], "physio_semaine_"+objectifKey);
    const tag = paceTag(ref100Seconds, ref400Seconds, zone, r.repDist);
    principalDist = r.distance;
    principalLines = [`-${r.text} ${tag}`];
  }
  lignes.push(...principalLines);

  // Fin RAC : 200 ou 300m (propre)
  const subtotal = depart.distance + techPicked.distance + principalDist;
  const finDist = volumeTier === "allegee" ? 200 : 200;
  const totalArrondi = roundTo(subtotal + finDist, 100);
  const finReal = Math.max(100, totalArrondi - subtotal);
  // garder fin à 100/200/300/400
  const finClean = Math.min(400, Math.max(100, roundTo(finReal, 100)));
  const totalFinal = subtotal + finClean;
  lignes.push(pick(FINS_SEMAINE, "fin")(finClean));

  const header = `S${numSemaine}.${indexSeance} : ${totalFinal}m`;
  return { text: header + "\n" + lignes.join("\n"), total: totalFinal, zone, role: objectifKey };
}

function genererSemaine(niveauKey, objectifKey, phaseKey, nbSeances, numSemaine, ref100Str, ref400Str, typeSemaine, prevDistance){
  const ref100Seconds = parseTime(ref100Str);
  const ref400Seconds = parseTime(ref400Str);
  const focusCycle = FOCUS_CYCLE;

  const { target, maxAutorise, statutLabel } = computeWeekTarget(niveauKey, typeSemaine, prevDistance);
  const u = findBestBlockUnit(niveauKey);
  const volumeTier = typeSemaine === "allegee" ? "allegee" : typeSemaine === "reference" ? "reference" : "normale";

  const blocs = [];
  let totalReel = 0;
  for(let i=1;i<=nbSeances;i++){
    const focus = focusCycle[(i-1) % focusCycle.length];
    const res = genererSeanceDeSemaine(niveauKey, objectifKey, phaseKey, numSemaine, i, focus, ref100Seconds, ref400Seconds, u, null, volumeTier);
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
  if(ref100Seconds) entete += `\nAllure repère 100m : ${formatTime(ref100Seconds)}`;
  if(ref400Seconds) entete += `\nAllure repère 400m : ${formatTime(ref400Seconds)}`;
  if(!ref100Seconds && !ref400Seconds) entete += `\nPas d'allure repère renseignée — zones affichées sans chiffres (Z1/Z2/Z3/Z4).`;

  return entete + "\n\n" + blocs.join("\n\n");
}

/** Retourne les séances structurées pour intégration app (sans en-tête semaine).
 *  sessionRoles (optionnel) : tableau [{ objectif, zone }] longueur = nbSeances — pilotage COSD. */
export function genererSemaineSessions(niveauKey, objectifKey, phaseKey, nbSeances, numSemaine, ref100Str, ref400Str, typeSemaine, prevDistance, sessionRoles = null) {
  const ref100Seconds = parseTime(ref100Str);
  const ref400Seconds = parseTime(ref400Str);
  const focusCycle = FOCUS_CYCLE;
  const u = findBestBlockUnit(niveauKey);
  const volumeTier = typeSemaine === "allegee" ? "allegee" : typeSemaine === "reference" ? "reference" : "normale";

  const sessions = [];
  let totalReel = 0;
  for (let i = 1; i <= nbSeances; i++) {
    const focus = focusCycle[(i - 1) % focusCycle.length];
    const role = sessionRoles && sessionRoles[i - 1] ? sessionRoles[i - 1] : null;
    const obj = role?.objectif || objectifKey;
    const zone = role?.zone || null;
    const res = genererSeanceDeSemaine(niveauKey, obj, phaseKey, numSemaine, i, focus, ref100Seconds, ref400Seconds, u, zone, volumeTier);
    sessions.push(res);
    totalReel += res.total;
  }
  return { sessions, totalDistance: totalReel };
}

export { genererSeance, genererSemaine, genererSeanceDeSemaine, TECHNIQUE, PHASES, NIVEAUX };
