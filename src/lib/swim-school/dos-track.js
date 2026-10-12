/**
 * Parcours dos Découverte : étapes 1-12 (ids techniques DOS1-DOS12).
 * Source : docs/natation-savoir/nager2-dos.md (D1-D4, D6-D13 ; dosage D17).
 * Textes reformulés, pas de copie livre. UI nageur : « étape X », jamais DOS.
 */

export const DOS_TRACK_ID = "dos";

/**
 * @typedef {{
 *   id: string,
 *   prereq: string | null,
 *   title: string,
 *   objectif: string,
 *   cue: string,
 *   bonSi: string,
 *   pasEncore: string,
 *   avoid: string,
 *   dosage: string,
 * }} SchoolStep
 */

/** @type {SchoolStep[]} */
export const DOS_STEPS = [
  {
    id: "DOS1",
    prereq: null,
    title: "Dos sur le côté",
    objectif: "Sentir que le dos se nage sur le côté, pas à plat.",
    cue: "Un côté puis l’autre. Un bras devant dans l’axe de l’épaule, l’autre le long du corps, épaule sortie. Tête fixe, regard vers le haut. Souffle un peu par le nez.",
    bonSi: "Tu restes long. L’épaule haute sort vraiment de l’eau.",
    pasEncore: "Plus court, palmes OK, même pose.",
    avoid: "Bouger la tête pour « chercher » l’air.",
    dosage: "4-8 × 25 m · chaque côté · repos 15-20 s",
  },
  {
    id: "DOS2",
    prereq: "DOS1",
    title: "Tête immobile",
    objectif: "Garder la tête et les yeux stables.",
    cue: "Même si tu frôles quelqu’un ou le mur : ni la tête ni les yeux ne bougent. Regard au plafond.",
    bonSi: "Ta tête ne suit pas le roulis des épaules.",
    pasEncore: "25 m tout doux, tu penses seulement à la tête.",
    avoid: "Regarder tes pieds ou le mur du bout.",
    dosage: "4-6 × 25 m · repos 15 s",
  },
  {
    id: "DOS3",
    prereq: "DOS2",
    title: "Gainage",
    objectif: "Tenir le corps d’un bloc avant le reste.",
    cue: "Torse et hanches solidaires. Première consigne en dos, avant les bras. Petits battements pour tenir la ligne.",
    bonSi: "Tu ne te tords pas entre poitrine et bassin.",
    pasEncore: "Coulée dos courte, bras le long du corps, gainage seul.",
    avoid: "« S’asseoir » dans l’eau (fesses qui descendent).",
    dosage: "6-8 coulées ou 4 × 25 m · repos 20 s",
  },
  {
    id: "DOS4",
    prereq: "DOS3",
    title: "Battement position idéale",
    objectif: "Battre depuis les hanches, corps long.",
    cue: "Bras tendus et serrés derrière la tête, main sur main, tête posée sur les bras, oreilles juste sous l’eau. Battement depuis les hanches, genoux sous l’eau, bassin près de la surface.",
    bonSi: "Tu glisses. Genoux invisibles, bassin haut.",
    pasEncore: "Planche sur les genoux, ou un bras devant / un le long du corps. Palmes OK.",
    avoid: "Planche derrière la nuque (tête relevée, hanches qui coulent).",
    dosage: "4-8 × 25 m ou 4 × 50 m avec palmes · 4 × 25 m sans · repos 20-30 s",
  },
  {
    id: "DOS5",
    prereq: "DOS4",
    title: "Dos à deux bras",
    objectif: "Pousser des deux bras ensemble sans perdre le plat.",
    cue: "Entrée bras tendus, paumes vers l’extérieur. Les mains descendent un peu avant de tirer. Traction jusqu’aux cuisses, fouetté des mains vers le bas. Deux arrêts : après l’entrée, puis bras le long des cuisses (inspire). Compte jusqu’à 3 à chaque arrêt.",
    bonSi: "Tête et hanches restent hautes. Tu inspires aux cuisses.",
    pasEncore: "Arrêts plus longs. Si tu « t’assieds » : battements seuls, bras le long du corps.",
    avoid: "Fouetter les mains vers le haut en fin de poussée.",
    dosage: "environ 200 m · avec et sans palmes · longs arrêts · repos 15-20 s",
  },
  {
    id: "DOS6",
    prereq: "DOS5",
    title: "Battement costal",
    objectif: "Battre sur le côté, épaule sortie.",
    cue: "Regard vers le haut. Bras devant tendu à la surface, paume vers l’extérieur. Autre bras le long de la cuisse, épaule bien sortie de l’eau.",
    bonSi: "L’épaule haute reste hors de l’eau tout le long.",
    pasEncore: "Palmes d’abord, puis sans, plus court, plus de repos.",
    avoid: "Rouler à plat ventre ou regarder sur le côté.",
    dosage: "4-8 × 50 m avec palmes, puis 4 × 50 à 8 × 25 m sans · repos 10-20 s",
  },
  {
    id: "DOS7",
    prereq: "DOS6",
    title: "L’échange",
    objectif: "Changer de côté en gardant tête et gainage.",
    cue: "Quelques mètres de battement costal, échange des deux bras en même temps, battement costal de l’autre côté. Bras devant : s’enfonce paume vers le bas. Retour : bras tendu, arc vertical, dynamique.",
    bonSi: "Tête immobile. Torse et hanches bougent ensemble.",
    pasEncore: "Échange toutes les 5 s, puis plus régulier avec arrêt court.",
    avoid: "Retour en biais sur le côté.",
    dosage: "4-8 × 50 m avec palmes, puis 4 × 50 à 8 × 25 m sans · repos 10-20 s",
  },
  {
    id: "DOS8",
    prereq: "DOS7",
    title: "Vers la nage complète",
    objectif: "Garder le roulis de l’échange en nageant.",
    cue: "Sans l’arrêt, le débutant nage à plat. Dans les éducatifs, épaule sortie dès la fin de poussée. Alterne échange et nage complète. Raccourcis l’arrêt petit à petit.",
    bonSi: "Tu roules encore. La main prend l’eau tout de suite en nage complète.",
    pasEncore: "Toujours avec un mini-arrêt. Pas de longues distances encore.",
    avoid: "Automatiser l’arrêt de la main en surface pour toujours.",
    dosage: "4-8 × 50 m avec palmes, 4 × 50 à 8 × 25 m sans · repos 10-20 s",
  },
  {
    id: "DOS9",
    prereq: "DOS8",
    title: "Prise d’eau et traction",
    objectif: "Entrer la main sans ralentir, puis appuyer.",
    cue: "La main entre et appuie d’abord vers le bas, puis vers l’extérieur. Bras tendu en éducatif. Pas de trajet unique imposé.",
    bonSi: "Tu sens un appui tôt, pas un « râteau » en surface.",
    pasEncore: "Un seul bras, l’autre devant. Distances courtes.",
    avoid: "Tirer tout de suite sur le côté, trop près de la surface.",
    dosage: "4-8 × 25 m · repos 15-20 s",
  },
  {
    id: "DOS10",
    prereq: "DOS9",
    title: "Sync des bras",
    objectif: "Lier entrée et fouetté pour le roulis.",
    cue: "Une main entre quand l’autre finit son fouetté vers le bas. Ce fouetté fait sortir l’épaule. Retour : bras tendu, au-dessus de l’épaule, pas sur le côté.",
    bonSi: "Les deux actions se croisent. L’épaule sort au bon moment.",
    pasEncore: "Ralentis. Compte « entre / fouette » à voix haute.",
    avoid: "Retour bras plié sur le côté.",
    dosage: "4-8 × 25 m · repos 15-20 s",
  },
  {
    id: "DOS11",
    prereq: "DOS10",
    title: "Respiration en dos",
    objectif: "Respirer sans bouger la tête.",
    cue: "Inspire par la bouche quand une main sort de l’eau. Souffle un peu par le nez. Tête immobile. Pas de respiration restreinte type 3 temps : inutile en dos. Si tu te déséquilibres en 2 temps, essaie 1 temps (chaque bras).",
    bonSi: "Tu inspires sans tourner la tête ni lever le menton.",
    pasEncore: "25 m en pensant seulement à l’inspire + nez.",
    avoid: "Bloquer le souffle ou relever la tête pour « mieux » inspirer.",
    dosage: "4-8 × 25 m · repos 15 s",
  },
  {
    id: "DOS12",
    prereq: "DOS11",
    title: "Dos qui tient",
    objectif: "Enchaîner un dos complet propre, position d’abord.",
    cue: "Nage complète avec l’arrêt de l’échange encore un peu présent. Priorité à la position et à la tête, pas à la cadence. Coulées et arrivées soignées.",
    bonSi: "Tu tiens 25 à 50 m sans t’asseoir ni bouger la tête.",
    pasEncore: "Remets l’échange (étape 7), puis reviens.",
    avoid: "Allonger la distance tant que la position casse.",
    dosage: "4-8 × 50 m avec palmes · 4 × 50 à 8 × 25 m sans · repos 10-20 s",
  },
];

export function getDosStep(id) {
  return DOS_STEPS.find((s) => s.id === id) || null;
}

export function dosStepIndex(id) {
  return DOS_STEPS.findIndex((s) => s.id === id);
}

export function nextDosStepId(id) {
  const i = dosStepIndex(id);
  if (i < 0 || i >= DOS_STEPS.length - 1) return null;
  return DOS_STEPS[i + 1].id;
}

export function prevDosStepId(id) {
  const i = dosStepIndex(id);
  if (i <= 0) return null;
  return DOS_STEPS[i - 1].id;
}
