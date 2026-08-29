/**
 * Archétypes de séance confirmé (ex-OW_BASE_SESSIONS) + helpers de scaling.
 * Extrait mécaniquement de src/lib/swim-session-generator.js.
 * Doublon potentiel avec session_templates (Supabase), non unifié à l'étape 1.
 */
import { bankMeta } from "./_helpers.js";

/* ============== BANQUE CONFIRMÉ (ex-OW_BASE_SESSIONS) ============== */
/* Niveau confirmé (performance/advanced → niveauKey confirme|triathlete).
   Objectifs : eau_libre, mixte (triathlon), endurance (nager & progresser).
   Rotation archeIdx = wi*3+si sur tout le plan. */

export function owSnap(d, P) { return Math.max(P, Math.round(d / P) * P); }
export function owLvlIndex(level) {
  return ({
    découverte: 0, beginner: 1, régulier: 1,
    intermediate: 2, sportif: 2,
    advanced: 3, performance: 3,
  })[level] ?? 1;
}
export function owFmtS(s) {
  return `${Math.floor(s / 60)}'${Math.round(s % 60).toString().padStart(2, "0")}"`;
}
/** D… (Premium) ou R… (gratuit), autonome, sans App.jsx */
export function owDep(meters, lvl, zone = "easy", opts = {}) {
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


/* Banque confirmé (ex-OW_BASE_SESSIONS), signature coach Arthur */
export const OW_VOL = { découverte: 0.35, beginner: 0.55, régulier: 0.55, intermediate: 0.75, sportif: 0.75, advanced: 1, performance: 1 };
export const owVol = (level) => OW_VOL[level] ?? 0.75;
export const owRep = (n, level, min = 2) => Math.max(min, Math.round(n * (owVol(level) >= 1 ? 1 : owVol(level) >= 0.75 ? 0.8 : 0.6)));
export const owM = (m, level, P, floor = 100) => Math.max(floor, owSnap(Math.round(m * owVol(level) / P) * P, P));
export const owBeg = (level) => level === "découverte" || level === "beginner" || level === "régulier";
export const owTuba = (level) => owLvlIndex(level) >= 2;
export const ow50Int = (P, level, lvl, opts = {}) => owBeg(level)
  ? `R${P <= 25 ? "25\"" : "30\""} - respiration 3 temps, nage propre`
  : `${owDep(P, lvl, "threshold", opts)} - respiration 3 temps, nage appliquée`;
export const ow100Rest = (P, level) => owBeg(level) ? `R${P <= 25 ? "30\"" : "25\""}` : `R20"`;
export const owRAC = (m, level, P) => `${owM(m, level, P, P)}m au choix - souple, sans chrono`;

const OW_BASE_SESSIONS_RAW = [
  // S1.1, Grand chien & roulis
  (P, level, opts = {}) => {
    const lvl = owLvlIndex(level), tuba = owTuba(level);
    const w = owM(400, level, P), n50 = owRep(4, level), nMain = owRep(10, level, 4), rac = owM(200, level, P, P);
    return {
      type: "TECHNIQUE",
      title: "Grand chien & roulis",
      intensity: "Z1/Z2 - réathlétisation, nage appliquée sans forcer",
      details: [
        `Échauffement : ${w}m crawl/dos par ${P}m - Z1, alterne à chaque longueur`,
        `${n50}×${P}m grand chien${tuba ? " + tuba frontal" : ""} - le plus lentement possible - R20" - un bras tendu devant, échange complet, sens la prise d'eau`,
        tuba
          ? `${n50}×${P}m palmes + tuba roulis - R20" - rotation du bassin, talons à la surface`
          : `${n50}×${P}m palmes crawl - R20" - jambes actives, corps à plat`,
        `${nMain}×${P}m crawl - ${ow50Int(P, level, lvl, opts)} - garde la technique des éducatifs, sighting tous les 8 bras`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S1.2, Position & endurance 100m
  (P, level, opts = {}) => {
    const w = owM(400, level, P), n50 = owRep(4, level), n100 = owRep(6, level, 3), slow = owM(200, level, P), rac = owM(300, level, P, P);
    return {
      type: "ENDURANCE",
      title: "Position & endurance 100m",
      intensity: "Z2 - allure régulière, recherche de position dans l'eau",
      details: [
        `Échauffement : ${w}m crawl palmes - Z1, jambes actives, corps à plat`,
        `${slow}m le plus lent possible - recherche de sensation, loin devant / loin derrière, teste différentes positions`,
        `${n50}×${P}m palmes : ${P}m bras droit devant / gauche cuisse · ${P}m inversé - respiration latérale - R20"`,
        `${n100}×${2*P}m crawl - ${ow100Rest(P, level)} - Z2, allure régulière, respiration 3 temps`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S1.3, Sensibilité & continuité
  (P, level, opts = {}) => {
    const w1 = owM(200, level, P), w2 = owM(200, level, P), n50 = owRep(8, level, 4), cont = owM(400, level, P), palmes = owM(200, level, P), rac = owM(100, level, P, P);
    return {
      type: "RÉCUPÉRATION",
      title: "Sensibilité & continuité",
      intensity: "Z1/Z2 léger - efficacité et position, sans pression",
      details: [
        `Échauffement : ${w1}m crawl + ${w2}m dos - Z1`,
        `${n50}×${P}m le moins de mouvements possible par ${P}m - R20" - concentre-toi sur la position, efficacité de traction, loin devant / loin derrière`,
        `${cont}m crawl Z2 - sans pause, rythme régulier - tu dois tenir de bout en bout`,
        `${palmes}m palmes : ${P}m ondulation sous l'eau / ${3*P}m crawl - R20" - sens l'ondulation, enchaîne en nage fluide`,
        `Retour au calme : ${rac} relâché - Z1`,
      ],
    };
  },
  // S2.1, DPS & progressif/dégressif
  (P, level, opts = {}) => {
    const lvl = owLvlIndex(level), w = owM(400, level, P), n50 = owRep(4, level), nMain = owRep(10, level, 4), rac = owM(300, level, P, P);
    return {
      type: "TECHNIQUE",
      title: "DPS & progressif/dégressif",
      intensity: "Z2 - modulation d'allure sans vitesse, nage appliquée",
      details: [
        `Échauffement : ${w}m crawl/dos par ${2*P}m - Z1`,
        `${n50}×${P}m le moins de coups de bras possible sur ${P}m - R20" - compte tes bras, vise moins de cycles`,
        `${n50}×${P}m progressif : 1 lent · 2 ↗ · 3 ↗ · 4 rapide - R20" - monte en puissance sur la série`,
        `${nMain}×${P}m crawl - ${ow50Int(P, level, lvl, opts)} - même technique qu'en éducatif`,
        `${n50}×${P}m dégressif : 1 rapide · 2 ↘ · 3 ↘ · 4 lent - R20" - redescends progressivement`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S2.2, Endurance 100m & position palmes
  (P, level, opts = {}) => {
    const w = owM(400, level, P), n50 = owRep(4, level), n100 = owRep(8, level, 4), slow = owM(200, level, P), rac = owM(200, level, P, P);
    return {
      type: "ENDURANCE",
      title: "Endurance 100m & position palmes",
      intensity: "Z2 - fond aérobie, travail de position en échauffement",
      details: [
        `Échauffement : ${w}m crawl palmes - Z1`,
        `${n50}×${P}m palmes : ${P}m bras droit devant / gauche cuisse · ${P}m inversé - respiration latérale - R20"`,
        `${n100}×${2*P}m crawl - ${ow100Rest(P, level)} - Z2, allure tenue du 1er au dernier 100m`,
        `${slow}m le plus lent possible - recherche de sensation, relâche les épaules`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S2.3, Hypoxie intégrée
  (P, level, opts = {}) => {
    const w = owM(400, level, P), jambes = owM(200, level, P), n50 = owRep(6, level), n100 = owRep(6, level, 3), rac = owM(200, level, P, P);
    const hyp50 = owBeg(level) ? `${P}m resp. 3 temps · ${P}m normal` : `${P}m grand chien · ${P}m normal`;
    const hyp100 = owBeg(level)
      ? "3 temps · 3 temps · 5 temps · 5 temps · 3 temps · 3 temps"
      : "3 temps · 5 temps · 7 temps · 9 temps · 7 temps · 5 temps";
    return {
      type: "TECHNIQUE",
      title: "Hypoxie intégrée",
      intensity: "Z2 - contrôle respiratoire intégré au set, pas de sprint",
      details: [
        `Échauffement : ${w}m au choix - Z1, crawl ou dos`,
        `${jambes}m jambes planche - battements mains en flèche, corps gainé`,
        `${n50}×${2*P}m : ${hyp50} - R15" - le plus lentement possible sur l'éducatif`,
        `${n100}×${2*P}m crawl - ${ow100Rest(P, level)} - respiration par 100m : ${hyp100}`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S3.1, Volume 50m & hypoxie rotative
  (P, level, opts = {}) => {
    const lvl = owLvlIndex(level), tuba = owTuba(level), w = owM(400, level, P), n50 = owRep(5, level), nMain = owRep(12, level, 6), slow = owM(400, level, P);
    const hypRot = owBeg(level) ? "3 temps · 3 temps · 5 temps · 5 temps" : "3 temps · 5 temps · 7 temps · 9 temps";
    return {
      type: "TECHNIQUE",
      title: "Volume 50m & hypoxie rotative",
      intensity: "Z2 - montée de volume, nage appliquée, épaule en confiance",
      details: [
        `Échauffement : ${w}m crawl/dos par ${P}m - Z1`,
        `${n50}×${P}m${tuba ? " tuba lent" : ""} : ${P}m grand chien · ${P}m crawl normal - R20" - le plus lentement possible`,
        tuba ? `${n50}×${P}m palmes + tuba roulis - R20" - rotation consciente` : `${n50}×${P}m palmes crawl - R20" - rotation du bassin`,
        `${nMain}×${P}m crawl - ${ow50Int(P, level, lvl, opts)} - respiration par 50m en rotation : ${hypRot}`,
        `${slow}m le plus lent possible - recherche de sensation + récup - relâche tout`,
      ],
    };
  },
  // S3.2, Endurance 100m & travail sous l'eau
  (P, level, opts = {}) => {
    const lvl = owLvlIndex(level), tuba = owTuba(level), w = owM(400, level, P), n25 = owRep(8, level, 4), n100 = owRep(10, level, 5), rac = owM(200, level, P, P);
    const edu = tuba ? `2×${2*P}m rattrapé drill + tuba - le plus lentement possible - R20" - un bras attend l'autre` : `2×${2*P}m rattrapé drill - R20" - un bras attend l'autre, nage lente`;
    return {
      type: "ENDURANCE",
      title: "Endurance 100m & travail sous l'eau",
      intensity: "Z2 - fond aérobie, volume en hausse sans monter l'intensité",
      details: [
        `Échauffement : ${w}m crawl palmes - Z1`,
        edu,
        `${n25}×${P}m palmes : 1× crawl sous l'eau · 1× godille pied en avant sur le dos - R20" - alterne les ${P}m`,
        `${n100}×${2*P}m crawl - ${ow100Rest(P, level)} - Z2, allure régulière - note si tu tiens le même rythme sur toutes les reps`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S3.3, Reps 150m & ondulation palmes
  (P, level, opts = {}) => {
    const lvl = owLvlIndex(level), w = owM(400, level, P), n50 = owRep(8, level, 4), n150 = owRep(4, level, 2), n100 = owRep(4, level, 2), slow = owM(200, level, P), rep150 = Math.min(6*P, 150);
    const hyp150 = owBeg(level) ? "3 temps · 3 temps · 5 temps · 3 temps · 3 temps" : "3 temps · 5 temps · 7 temps · 5 temps · 3 temps";
    const palmesDep = owBeg(level) ? `R${P <= 25 ? "30\"" : "25\""}` : owDep(2*P, lvl, "threshold", opts);
    return {
      type: "ENDURANCE",
      title: "Reps 150m & ondulation palmes",
      intensity: "Z2 - reps longues, respiration et ondulation, gestion d'allure",
      details: [
        `Échauffement : ${w}m au choix - Z1`,
        `${n50}×${2*P}m : ${P}m grand chien · ${P}m crawl normal - R15" - le plus lentement possible sur l'éducatif`,
        `${n150}×${rep150}m crawl - R25" - respiration par 25m : ${hyp150} - même allure malgré le changement respiratoire`,
        `${n100}×${2*P}m palmes : ${P}m ondulation sous l'eau / ${3*P}m crawl - ${palmesDep} - sens l'ondulation, enchaîne en nage fluide`,
        `${slow}m le plus lent possible - souple + sensation`,
      ],
    };
  },
  // S4.1, Rythme de nage & fréquence de bras
  (P, level, opts = {}) => {
    const lvl = owLvlIndex(level);
    const w = owM(400, level, P), n50 = owRep(6, level, 3), nMain = owRep(8, level, 4), rac = owM(200, level, P, P);
    return {
      type: "TECHNIQUE",
      title: "Rythme de nage & fréquence de bras",
      intensity: "Z2 - conscience du rythme, pas de vitesse pure",
      details: [
        `Échauffement : ${w}m crawl/dos - Z1, respiration libre`,
        `${n50}×${P}m compte tes cycles de bras par longueur - R15" - vise le même chiffre à chaque fois`,
        `${nMain}×${2*P}m crawl - ${ow50Int(P, level, lvl, opts)} - garde la même fréquence du 1er au dernier`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S4.2, Endurance 200m & gestion d'allure
  (P, level, opts = {}) => {
    const w = owM(400, level, P), n50 = owRep(4, level), n200 = owRep(4, level, 2), slow = owM(200, level, P), rac = owM(200, level, P, P);
    return {
      type: "ENDURANCE",
      title: "Endurance 200m & gestion d'allure",
      intensity: "Z2 - allure tenue sur des reps longues",
      details: [
        `Échauffement : ${w}m crawl palmes - Z1`,
        `${n50}×${P}m accélération progressive sur la longueur - R15"`,
        `${slow}m le plus lent possible - recherche de sensation, relâche les épaules`,
        `${n200}×${4*P}m crawl - ${ow100Rest(P, level)} - Z2, même allure du 1er au dernier 200m`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S4.3, Virages & reprise de nage
  (P, level, opts = {}) => {
    const lvl = owLvlIndex(level), tuba = owTuba(level);
    const w = owM(400, level, P), n25 = owRep(8, level, 4), nMain = owRep(8, level, 4), rac = owM(200, level, P, P);
    return {
      type: "TECHNIQUE",
      title: "Virages & reprise de nage",
      intensity: "Z2 - technique de virage, pas de vitesse",
      details: [
        `Échauffement : ${w}m crawl/dos par ${P}m - Z1`,
        `${n25}×${P}m virage + 5m de coulée${tuba ? " + tuba" : ""} - R15" - reprise de nage progressive après le mur`,
        `${nMain}×${2*P}m crawl - ${ow100Rest(P, level)} - enchaîne le virage sans casser l'allure`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S5.1, Sighting avancé & navigation
  (P, level, opts = {}) => {
    const lvl = owLvlIndex(level);
    const w = owM(400, level, P), n50 = owRep(4, level), nMain = owRep(10, level, 5), rac = owM(200, level, P, P);
    return {
      type: "ENDURANCE",
      title: "Sighting avancé & navigation",
      intensity: "Z2 - sighting fréquent, nage appliquée",
      details: [
        `Échauffement : ${w}m crawl palmes - Z1`,
        `${n50}×${P}m sighting tous les 4 bras - R15" - lève les yeux sans casser le rythme`,
        `${nMain}×${P}m crawl - ${ow50Int(P, level, lvl, opts)} - sighting tous les 6-8 bras, garde le cap`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S5.2, Endurance longue & négatif split
  (P, level, opts = {}) => {
    const w = owM(400, level, P), cont = owM(600, level, P), rac = owM(300, level, P, P);
    return {
      type: "ENDURANCE",
      title: "Endurance longue & négatif split",
      intensity: "Z2 - 2ème moitié plus rapide que la 1ère",
      details: [
        `Échauffement : ${w}m au choix - Z1`,
        `${cont}m crawl - première moitié Z1/Z2 souple, deuxième moitié un peu plus soutenue`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S5.3, Jambes & gainage
  (P, level, opts = {}) => {
    const w = owM(400, level, P), jambes = owM(300, level, P), n50 = owRep(6, level), rac = owM(200, level, P, P);
    return {
      type: "TECHNIQUE",
      title: "Jambes & gainage",
      intensity: "Z2 - renforcement jambes/gainage, pas de vitesse",
      details: [
        `Échauffement : ${w}m au choix - Z1`,
        `${jambes}m jambes planche - battements réguliers, corps gainé`,
        `${n50}×${P}m pull-buoy sans battements - R15" - focus gainage et rotation`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S6.1, Simulation allure course
  (P, level, opts = {}) => {
    const lvl = owLvlIndex(level);
    const w = owM(400, level, P), n100 = owRep(6, level, 3), rac = owM(200, level, P, P);
    return {
      type: "ENDURANCE",
      title: "Simulation allure course",
      intensity: "Z2/Z3 - allure objectif, régularité",
      details: [
        `Échauffement : ${w}m crawl progressif - Z1`,
        `${n100}×${2*P}m crawl - ${owDep(2*P, lvl, "threshold", opts)} - allure course cible, note si tu tiens le rythme`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S6.2, Volume 200m & respiration contrôlée
  (P, level, opts = {}) => {
    const w = owM(400, level, P), n200 = owRep(4, level, 2), rac = owM(300, level, P, P);
    const resp = owBeg(level) ? "3 temps · 3 temps · 5 temps · 5 temps" : "3 temps · 5 temps · 7 temps · 9 temps";
    return {
      type: "ENDURANCE",
      title: "Volume 200m & respiration contrôlée",
      intensity: "Z2 - fond aérobie, contrôle respiratoire",
      details: [
        `Échauffement : ${w}m au choix - Z1`,
        `${n200}×${4*P}m crawl - ${ow100Rest(P, level)} - respiration par 200m : ${resp}`,
        `Retour au calme : ${rac}`,
      ],
    };
  },
  // S6.3, Récupération active & sensations fines
  (P, level, opts = {}) => {
    const w = owM(300, level, P), cont = owM(400, level, P), palmes = owM(200, level, P), rac = owM(200, level, P, P);
    return {
      type: "RÉCUPÉRATION",
      title: "Récupération active & sensations fines",
      intensity: "Z1 - très facile, aucune pression",
      details: [
        `Échauffement : ${w}m dos/crawl très facile - Z1`,
        `${cont}m crawl Z1 - sans pause, relâché, focus respiration`,
        `${palmes}m palmes ondulation très facile - sens le corps qui glisse`,
        `Retour au calme : ${rac} relâché - Z1`,
      ],
    };
  },
];

export const OW_BASE_SESSIONS = OW_BASE_SESSIONS_RAW;

export const SESSION_ARCHETYPE_ENTRIES = OW_BASE_SESSIONS.map((build, index) => {
  const sample = build(50, "performance", { isPremium: false });
  return {
    ...bankMeta({
      id: `ow_archetype_${index}`,
      sourceSymbol: `OW_BASE_SESSIONS[${index}]`,
      status: "candidate",
    }),
    index,
    title: sample.title,
    type: sample.type,
    build,
  };
});
