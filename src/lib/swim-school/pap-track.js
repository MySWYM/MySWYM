/**
 * Parcours papillon (brouillon). Source : docs/natation-savoir/nager2-papillon.md
 * Contenu à corriger par Arthur. UI : « étape X », jamais PAP.
 */

import { chainSteps, nextIdIn, prevIdIn, stepById, stepIndexOf } from "./track-utils.js";

export const PAP_TRACK_ID = "pap";

/** @type {import("./anc-track.js").SchoolStep[]} */
export const PAP_STEPS = chainSteps("PAP", [
  {
    title: "Deux attitudes",
    objectif: "Sentir bascule et redressement, pas un côté gauche / droite.",
    cue: "Bascule : tête et épaules plongent, fesses à la surface. Redressement : tête qui remonte à la poussée, inspire quand les coudes sortent.",
    bonSi: "Tu changes d’attitude sans nager « sur le côté ».",
    pasEncore: "Immobile, tu mime bascule puis redressement dans l’eau.",
    avoid: "Penser papillon comme un crawl synchronisé.",
    dosage: "4-6 × 15 m · repos 20 s",
  },
  {
    title: "Plongeon en canard",
    objectif: "Basculer la tête vers le fond, hanches qui montent.",
    cue: "Tête vers le fond, puis redressement. Genoux tendus. Enchaîne plusieurs canards. Regard vers le fond. Puis coulée profonde, bras tendus.",
    bonSi: "Les hanches montent. Tu ne ressors pas trop tôt.",
    pasEncore: "Canards isolés sur 5 m, puis tu enchaînes.",
    avoid: "Genoux pliés qui cassent l’axe.",
    dosage: "6-10 canards · puis 4 × 25 m · repos 20 s",
  },
  {
    title: "Bras simultanés (planche)",
    objectif: "Forme de la poussée et équilibre, pas encore le papillon.",
    cue: "Planche, visage dans l’eau, jambes serrées immobiles. 2-3 cycles lents. Pousse jusqu’aux cuisses, arrêt, retour sous l’eau, arrêt à l’entrée.",
    bonSi: "Tu gardes la planche. Poussée longue.",
    pasEncore: "10 m seulement, arrêts plus longs.",
    avoid: "Fuir vers l’avant et perdre la planche.",
    dosage: "10-20 m · repos 20-30 s",
  },
  {
    title: "Papillon un bras",
    objectif: "Bascule avant de tirer. Fesses visibles d’abord.",
    cue: "À chaque entrée, première attitude 1-2 s. Les fesses sortent avant de tirer. Mollets puis genoux, fouetté profond (deuxième attitude).",
    bonSi: "Tu attends les fesses avant de tirer.",
    pasEncore: "Avec planche. Un bras, puis l’autre.",
    avoid: "Enchaîner trop tôt sans bascule.",
    dosage: "4 × 50 m ou 8 × 25 m · repos 20 s",
  },
  {
    title: "Complet en apnée",
    objectif: "3-5 mouvements sans inspirer trop tôt.",
    cue: "Départ mur, arrêt prolongé bras devant, retour souple. Inspirer trop tôt = hanches qui coulent.",
    bonSi: "Les fesses sortent encore même sans inspire.",
    pasEncore: "3 mouvements seulement, plus de repos.",
    avoid: "Lever la tête dès le premier cycle.",
    dosage: "5-10 × 3-5 mouvements · repos 20-30 s",
  },
  {
    title: "Entrée des bras",
    objectif: "Entrée serrée pour avoir le temps de basculer.",
    cue: "Débutant : mains presque qui se touchent. Plus tard : largeur d’épaules si le dauphin est déjà là.",
    bonSi: "Tu as le temps de sortir les hanches après l’entrée.",
    pasEncore: "Entrée encore plus serrée, distances courtes.",
    avoid: "Dicter chaque angle de poignet.",
    dosage: "4-8 × 25 m · repos 20 s",
  },
  {
    title: "Fin de poussée et retour",
    objectif: "Relâcher près de la surface, retour tendu juste au-dessus.",
    cue: "Mains qui se relâchent. Court instant. Bras tendus juste au-dessus de l’eau. Plus on est relâché, mieux ça va.",
    bonSi: "Retour souple, pas de « boxe » vers l’avant.",
    pasEncore: "Un seul cycle lent, focus relâchement.",
    avoid: "Boxer l’eau pour sortir les bras.",
    dosage: "4-8 × 25 m · repos 20 s",
  },
  {
    title: "Tête et bras ensemble",
    objectif: "Bascule tête forte, visage au fond dès l’entrée.",
    cue: "Bascule tête forte et rapide. Redressement plus progressif. À l’entrée des mains, visage déjà vers le fond.",
    bonSi: "Coordination nette. Hanches qui suivent.",
    pasEncore: "Remets l’apnée (étape 5).",
    avoid: "Inspirer pendant l’appui.",
    dosage: "4-6 × 25 m · repos 20 s",
  },
  {
    title: "Où inspirer",
    objectif: "Inspirer à la sortie des coudes, pas sur l’appui.",
    cue: "Moment : coudes qui sortent, mains qui relâchent. Frontale : menton qui avance plus qu’il ne monte. Regard devant.",
    bonSi: "Hanches restent mieux. Inspire hors appui.",
    pasEncore: "Apnée plus souvent, inspire 1 fois sur 2.",
    avoid: "Monter trop la tête (hanches qui coulent).",
    dosage: "4-8 × 25 m · repos 20 s",
  },
  {
    title: "Papillon qui tient",
    objectif: "Enchaîner des cycles propres, amplitude d’abord.",
    cue: "Tous les 2 temps en base. Priorité bascule + fesses. Peu de volume : le papillon n’est pas une priorité au début.",
    bonSi: "Tu tiens 15-25 m sans t’écrouler.",
    pasEncore: "Remets un bras ou l’apnée.",
    avoid: "Pull-buoy ou plaquettes (surtout jeune).",
    dosage: "4-6 × 25 m · repos 30 s",
  },
]);

export function getPapStep(id) {
  return stepById(PAP_STEPS, id);
}
export function papStepIndex(id) {
  return stepIndexOf(PAP_STEPS, id);
}
export function nextPapStepId(id) {
  return nextIdIn(PAP_STEPS, id);
}
export function prevPapStepId(id) {
  return prevIdIn(PAP_STEPS, id);
}
