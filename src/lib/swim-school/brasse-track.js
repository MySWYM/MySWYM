/**
 * Parcours brasse (brouillon). Source : docs/natation-savoir/nager2-brasse.md
 * Contenu à corriger par Arthur. UI : « étape X », jamais BRA.
 */

import { chainSteps, nextIdIn, prevIdIn, stepById, stepIndexOf } from "./track-utils.js";

export const BRASSE_TRACK_ID = "brasse";

/** @type {import("./anc-track.js").SchoolStep[]} */
export const BRASSE_STEPS = chainSteps("BRA", [
  {
    title: "Le ciseau d’abord",
    objectif: "Un ciseau qui pousse avant le reste.",
    cue: "Talons vers les fesses. Genoux pas trop avancés, pas plus larges que les hanches. Pas de coup de rein. Retour de jambes vif.",
    bonSi: "Tu avances vraiment sur le ciseau seul.",
    pasEncore: "Assis au bord : sens la flexion des pieds.",
    avoid: "Écarter trop les genoux (ligaments).",
    dosage: "8-12 ciseaux · repos 15 s",
  },
  {
    title: "Seul le fouetté pousse",
    objectif: "Placer les pieds, puis fouetter vers l’intérieur et le fond.",
    cue: "Avant : pieds en flexion, tournés dehors. Puis fouetté vers l’intérieur et le fond en allongeant. Fin : pieds face à face (« en prière »), puis relâchés.",
    bonSi: "Tu sens l’appui au fouetté, pas avant.",
    pasEncore: "Hors de l’eau : pronation puis supination des pieds.",
    avoid: "Garder les pieds en pronation pendant tout le fouetté.",
    dosage: "8-12 × ciseau · repos 15 s",
  },
  {
    title: "Nage du prisonnier",
    objectif: "Corriger le ciseau sans planche qui triche.",
    cue: "Mains dans le dos. Tête hors de l’eau au moins pour inspirer. Si le ciseau ne pousse pas, la tête coule. Puis reviens planche et compte les cycles.",
    bonSi: "Ciseau symétrique et assez profond.",
    pasEncore: "Distance très courte, jeu pas punition.",
    avoid: "Ciseau trop plat avec planche seule.",
    dosage: "4-6 × 15-25 m · repos 20 s",
  },
  {
    title: "Deux attitudes",
    objectif: "Lier bras, jambes, tête : bascule puis redressement.",
    cue: "Bascule : bras tendus devant, hanches hautes. Redressement : mains qui rentrent, inspire, relance. Ça ne dure pas. On ne s’arrête pas là.",
    bonSi: "Tu sens les deux temps sans rester « debout ».",
    pasEncore: "Mime lent, un cycle à la fois.",
    avoid: "Corriger bras et jambes séparément sans le corps.",
    dosage: "4-8 × 25 m · repos 20 s",
  },
  {
    title: "Pause bonnet hors de l’eau",
    objectif: "Gainer sur la relance (ancien règlement = outil).",
    cue: "Pendant relance et allonge, une partie du bonnet hors de l’eau. Pause stable = mieux gainé. Tête sous l’eau seulement plus tard, si la relance est vive.",
    bonSi: "Allonge stable. Ciseau qui arrive à temps.",
    pasEncore: "Pause plus longue, moins de distance.",
    avoid: "Plonger la tête trop tôt et s’écrouler.",
    dosage: "4-6 × 25 m · repos 20 s",
  },
  {
    title: "Relance des bras vite",
    objectif: "Ramener les bras devant vite, pas doucement.",
    cue: "Relance rapide devant. Débutant : petit temps de glisse, bras serrés, haut de tête à la surface.",
    bonSi: "Moins de freinage. Bascule tout de suite après.",
    pasEncore: "Un cycle, focus vitesse de relance.",
    avoid: "Ramener les bras « tout doux » (ça freine).",
    dosage: "4-8 × 25 m · repos 20 s",
  },
  {
    title: "Prise d’eau puis fouetté des mains",
    objectif: "Écarter pour placer, puis rentrer vite. Coudes écartés jusqu’à la fin.",
    cue: "Phase 1 : mains qui s’écartent un peu vers le bas. Phase 2 : rentrée vers l’axe, de plus en plus vite. Puis urgence vers l’avant.",
    bonSi: "Tu sens une vraie poussée avant la relance.",
    pasEncore: "Mains seules, jambes planche ou prisonnier.",
    avoid: "Rentrer les coudes trop tôt.",
    dosage: "4-8 × 25 m · repos 20 s",
  },
  {
    title: "Corps assez plat",
    objectif: "Petit dauphin, pas de montagnes russes chez le jeune.",
    cue: "Hanches qui remontent à la bascule, puis tête qui monte. Style assez plat. Le corps avance plus vite que la tête ne plonge.",
    bonSi: "Tu n’es pas cambré. Hanches ne plongent pas.",
    pasEncore: "Moins d’amplitude verticale.",
    avoid: "Forcer les vagues du corps.",
    dosage: "4-6 × 25 m · repos 20 s",
  },
  {
    title: "Inspirer hors appui",
    objectif: "Retarder l’inspiration. Pas la brasse de sauvetage.",
    cue: "N’inspire pas dès que les mains s’écartent. Moment : avec la relance des bras et le regroupement des jambes.",
    bonSi: "Nage plus longue, tête pas toujours dehors.",
    pasEncore: "Compte « 1 écart, 2 inspire ».",
    avoid: "Inspirer sur l’appui (tête toujours hors de l’eau).",
    dosage: "4-8 × 25 m · repos 20 s",
  },
  {
    title: "Bras puis jambes, sans trou",
    objectif: "Jambes calées sur la relance. Pas de trou debout.",
    cue: "Recale les jambes sur la relance des bras. Après le fouetté des jambes : prise d’eau tout de suite.",
    bonSi: "Tu ne restes pas debout entre les cycles.",
    pasEncore: "Un seul défaut à la fois : timing jambes.",
    avoid: "Corriger 5 défauts en même temps.",
    dosage: "4-8 × 25 m · repos 20-30 s",
  },
]);

export function getBrasseStep(id) {
  return stepById(BRASSE_STEPS, id);
}
export function brasseStepIndex(id) {
  return stepIndexOf(BRASSE_STEPS, id);
}
export function nextBrasseStepId(id) {
  return nextIdIn(BRASSE_STEPS, id);
}
export function prevBrasseStepId(id) {
  return prevIdIn(BRASSE_STEPS, id);
}
