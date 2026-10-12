/**
 * Parcours virage crawl (brouillon). Source : docs/natation-savoir/crawl-performant-avc.md
 * Contenu à corriger par Arthur. UI : « étape X », jamais AVC.
 */

import { chainSteps, nextIdIn, prevIdIn, stepById, stepIndexOf } from "./track-utils.js";

export const VIRAGE_TRACK_ID = "virage";

/** @type {import("./anc-track.js").SchoolStep[]} */
export const VIRAGE_STEPS = chainSteps("AVC", [
  {
    title: "2 mains, bascule, coulée dos",
    objectif: "Toucher des 2 mains, partir sur le dos.",
    cue: "Tu touches des 2 mains. Tête en arrière, bras lancés en arrière. Tu glisses sur le dos.",
    bonSi: "Tête et bras partent ensemble.",
    pasEncore: "Bras sous l’eau d’abord, puis au-dessus. Coulées plus longues.",
    avoid: "Tourner la culbute dès cette étape.",
    dosage: "6-8 virages · change de côté",
  },
  {
    title: "1 main, demi-tour ventre",
    objectif: "Tourner sur le côté et repartir ventre.",
    cue: "Même amorti. Tu tournes sur le côté, tu repars ventre. Tête qui bascule latéralement. Bras qui aident.",
    bonSi: "Tu es déjà droit au moment de glisser.",
    pasEncore: "2 bras sous l’eau, ou 1 au-dessus. Coulées plus longues.",
    avoid: "Sauter directement à la culbute au mur.",
    dosage: "6-8 virages · alterne D/G",
  },
  {
    title: "Un bras en l’air",
    objectif: "Un bras sous l’eau, l’autre en l’air au tour.",
    cue: "Comme l’étape d’avant. Le bras du côté du tour revient sous l’eau. L’autre revient en l’air.",
    bonSi: "Placement nickel à la coulée.",
    pasEncore: "Un côté, puis l’autre.",
    avoid: "Perdre l’axe à la reprise.",
    dosage: "6-8 virages · repos 15 s",
  },
  {
    title: "Coulée + reprise",
    objectif: "Coulée ventre puis premier bras, sans trou.",
    cue: "Mains un peu décalées. Inspire avant le mur, apnée jusqu’à la nage. Coulée puis 1er bras.",
    bonSi: "Pas de trou entre coulée et nage.",
    pasEncore: "Un peu de dauphin entre coulée et battements.",
    avoid: "Inspirer pendant la coulée.",
    dosage: "6-8 reprises · alterne D/G",
  },
  {
    title: "Roulade sans mur",
    objectif: "La tête lance la rotation, pas les bras.",
    cue: "Coulée ventre, les 2 bras poussent, arrêt, puis roulade. Menton qui fléchit. Attends d’avoir un peu ralenti.",
    bonSi: "Coulée, bras et roulade s’enchaînent.",
    pasEncore: "Sans coulée d’élan. Revenir à plat ventre après.",
    avoid: "Forcer la rotation avec les bras.",
    dosage: "8-10 roulades · repos 15 s",
  },
  {
    title: "Crawl, arrêt, roulade",
    objectif: "Séparer ce qui pousse et ce qui tourne.",
    cue: "Tu nages. Un bras s’arrête derrière (rattrapé arrière). Stop. Puis roulade. Tête très fléchie.",
    bonSi: "Le stop est visible. Puis tu repars ventre.",
    pasEncore: "Yeux fermés sur la roulade.",
    avoid: "Tourner sans arrêt net.",
    dosage: "6-8 × approche + roulade",
  },
  {
    title: "Battements, pieds au mur",
    objectif: "Choisir quand tourner. Pieds déjà placés.",
    cue: "Jambes vers le mur, bras derrière (planche OK). Demi-roulade. Pieds au mur, genoux pliés, sur le dos. Lis la ligne de fond.",
    bonSi: "Distance juste (pas trop près, pas trop loin).",
    pasEncore: "Enlever la planche. 2 mains hors de l’eau derrière.",
    avoid: "Tourner trop tôt ou trop tard.",
    dosage: "8-10 approches · repos 15 s",
  },
  {
    title: "Crawl + pieds au mur",
    objectif: "Arriver en crawl, finir dos pieds prêts.",
    cue: "Comme l’étape d’avant, mais tu arrives en crawl. Même lecture du mur. Tu finis dos, pieds posés, genoux pliés.",
    bonSi: "Tu tournes au bon moment, pieds déjà prêts.",
    pasEncore: "Changer d’allure à l’approche.",
    avoid: "Chercher la poussée avant d’être placé.",
    dosage: "6-8 virages · repos 15-20 s",
  },
  {
    title: "Poussée dos + jambes",
    objectif: "Pousser sur le dos, coulée longue.",
    cue: "Pareil, puis tu pousses sur le dos, tu repars en battements dos. Pieds au mur, épaules à plat.",
    bonSi: "La coulée est longue.",
    pasEncore: "Puis demi-vrille pendant la poussée, reprise ventre.",
    avoid: "Pousser de travers.",
    dosage: "6-8 poussées · repos 15 s",
  },
  {
    title: "Virage entier + nage",
    objectif: "Virage complet et reprise crawl.",
    cue: "Quart de vrille, poussée sur le côté, encore un quart, crawl. Dans la tête : nage → rattrapé → rotation → pieds → vrille → poussée → reprise.",
    bonSi: "5 m avant + 5 m après le mur propres.",
    pasEncore: "50 m avec 1 virage, puis plus long.",
    avoid: "Sauter des morceaux pour « aller plus vite ».",
    dosage: "4-6 × 50 m avec virage · repos 20-30 s",
  },
]);

export function getVirageStep(id) {
  return stepById(VIRAGE_STEPS, id);
}
export function virageStepIndex(id) {
  return stepIndexOf(VIRAGE_STEPS, id);
}
export function nextVirageStepId(id) {
  return nextIdIn(VIRAGE_STEPS, id);
}
export function prevVirageStepId(id) {
  return prevIdIn(VIRAGE_STEPS, id);
}
