/**
 * Parcours départ crawl (brouillon). Source : docs/natation-savoir/crawl-performant-adc.md
 * Contenu à corriger par Arthur. UI : « étape X », jamais ADC.
 */

import { chainSteps, nextIdIn, prevIdIn, stepById, stepIndexOf } from "./track-utils.js";

export const DEPART_TRACK_ID = "depart";

/** @type {import("./anc-track.js").SchoolStep[]} */
export const DEPART_STEPS = chainSteps("ADC", [
  {
    title: "Chute avant du bord",
    objectif: "Se laisser tomber. Pas de poussée.",
    cue: "Bras devant, tête rentrée, corps dur. Se laisser tomber. Tuer le réflexe de se redresser.",
    bonSi: "Tête entre les bras tout le temps. Peu d’éclaboussures.",
    pasEncore: "Yeux fermés. Puis depuis le plot.",
    avoid: "Pousser trop tôt.",
    dosage: "6-8 chutes · repos 15 s",
  },
  {
    title: "Déséquilibre puis poussée",
    objectif: "D’abord tomber, ensuite pousser.",
    cue: "D’abord le déséquilibre, ensuite tu pousses. Tête toujours entre les bras.",
    bonSi: "Plus d’envol, peu d’eau qui gicle.",
    pasEncore: "Yeux fermés. Perche de plus en plus haute.",
    avoid: "Pousser avant d’être déséquilibré.",
    dosage: "6-8 départs · repos 15 s",
  },
  {
    title: "Action des bras",
    objectif: "Lier bras et jambes à l’impulsion.",
    cue: "Bras qui descendent quand les jambes plient. Bras qui montent quand les jambes poussent. À l’entrée : tête entre les bras.",
    bonSi: "Envol + peu d’éclaboussures.",
    pasEncore: "Changer le trajet des bras. Puis plot.",
    avoid: "Tête qui sort entre les bras.",
    dosage: "6-8 départs · repos 15 s",
  },
  {
    title: "Cerceau + coulée",
    objectif: "Percer le trou, glisser loin.",
    cue: "Pareil, tu vises un cerceau, puis tu glisses. Ne pas toucher le cerceau. Nuque pliée, corps dur.",
    bonSi: "Tu perces le trou, tu glisses loin.",
    pasEncore: "Cerceau plus près, puis plus loin.",
    avoid: "Toucher le cerceau ou s’écraser.",
    dosage: "6-8 passages · repos 15-20 s",
  },
  {
    title: "Départ entier + reprise",
    objectif: "Poussée → entrée → coulée → nage.",
    cue: "Enchaîne. D’abord les jambes, puis un bras. Sépare encore les phases dans la tête.",
    bonSi: "Peu d’éclaboussures. Distance après 1 cycle.",
    pasEncore: "Au signal. Nager encore 5-10 m.",
    avoid: "Mélanger toutes les phases sans les sentir.",
    dosage: "6-8 départs + 10 m · repos 20 s",
  },
  {
    title: "Agrippé : tirer pour basculer",
    objectif: "Les bras font le déséquilibre.",
    cue: "Mains au plot. Tu tires, le corps bascule. Tête rentrée, corps dur. Viser tête / mains en premier contact, pas le ventre.",
    bonSi: "Tu vois quelle partie touche l’eau en premier.",
    pasEncore: "Bascule plus ou moins forte. Yeux fermés.",
    avoid: "Agrippé dès l’étape 1 (trop tôt dans l’échelle).",
    dosage: "6-8 grab-starts · repos 15 s",
  },
  {
    title: "Agrippé + tête qui se relève",
    objectif: "Tête qui se lève en début de bascule, puis rentre.",
    cue: "Comme l’agrippé, mais au début : jambes qui plient, tête qui se lève, puis tu rentres par la tête. D’abord les 3 gestes séparés.",
    bonSi: "À l’eau, tête entre les bras. Envol propre.",
    pasEncore: "Finir en coulée longue.",
    avoid: "Garder la tête haute jusqu’à l’eau.",
    dosage: "6-8 départs · repos 15-20 s",
  },
  {
    title: "Pieds décalés",
    objectif: "Track-start : rentrer dans l’axe malgré 2 pieds différents.",
    cue: "Mains libres. Une jambe bascule, l’autre pousse, les bras aident. D’abord séparé, puis collé.",
    bonSi: "Tu rentres dans l’axe. Tête entre les bras.",
    pasEncore: "Coulée longue après.",
    avoid: "Partir en vrille hors axe.",
    dosage: "6-8 track-starts · repos 15 s",
  },
  {
    title: "Cerceau + reprise",
    objectif: "Départ plot, trou, glisse, puis nage.",
    cue: "Ne pas toucher le cerceau. Nuque pliée. Garde de la vitesse avant et après la coulée.",
    bonSi: "Distance avant et après la coulée.",
    pasEncore: "Cerceau plus loin. Yeux fermés.",
    avoid: "Tout perdre à l’entrée.",
    dosage: "6-8 départs · repos 20 s",
  },
  {
    title: "Au signal",
    objectif: "Réagir au sifflet, envol dur, reprise.",
    cue: "Prépare-toi. Au sifflet : tout de suite. Envol dur. Coulée. Reprise. Mesure : temps jusqu’à l’eau, puis 5 m et 10 m.",
    bonSi: "Réaction vive + coulée + reprise propres.",
    pasEncore: "Agrippé ou libre. Pieds joints ou décalés.",
    avoid: "Ne regarder que le temps de réaction.",
    dosage: "6-10 départs au signal · repos 20-30 s",
  },
]);

export function getDepartStep(id) {
  return stepById(DEPART_STEPS, id);
}
export function departStepIndex(id) {
  return stepIndexOf(DEPART_STEPS, id);
}
export function nextDepartStepId(id) {
  return nextIdIn(DEPART_STEPS, id);
}
export function prevDepartStepId(id) {
  return prevIdIn(DEPART_STEPS, id);
}
