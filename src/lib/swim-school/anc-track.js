/**
 * Parcours crawl Découverte : étapes 1-18 (ids techniques ANC1-ANC18).
 * Source : docs/natation-savoir/crawl-performant-anc.md (validé Arthur).
 * Textes reformulés, pas de copie livre. Pas une 3e banque de drills.
 * UI nageur : « étape X », jamais le sigle ANC.
 */

export const ANC_TRACK_ID = "anc";
export const ANC_GATE_STEP_ID = "ANC17";
export const SCHOOL_PROGRESS_VERSION = 1;
export const YES_NEEDED = 1;

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
export const ANC_STEPS = [
  {
    id: "ANC1",
    prereq: null,
    title: "Coulée ventrale",
    objectif: "Glisser loin, corps long et à plat.",
    cue: "Pousse du mur, bras tendus, tête sous les bras. Grande inspire, apnée jusqu’au bout.",
    bonSi: "Tu vas loin et tu restes horizontal.",
    pasEncore: "Plus court, yeux ouverts, même pose.",
    avoid: "Plonger en canard pour descendre.",
    dosage: "6-8 coulées",
  },
  {
    id: "ANC2",
    prereq: "ANC1",
    title: "Coulée + battements",
    objectif: "Allonger la glisse avec de petits battements.",
    cue: "Même coulée, puis petits battements. Corps aligné. Inspire seulement à l’arrêt.",
    bonSi: "Plus loin qu’à l’étape 1, sans te cabrer.",
    pasEncore: "Battements tout doux sur 5 m, puis tu rallonges.",
    avoid: "Grandes jambes qui cassent la ligne.",
    dosage: "6-8 coulées + battements",
  },
  {
    id: "ANC3",
    prereq: "ANC2",
    title: "Inspirer, bras devant",
    objectif: "Respirer sans casser l’équilibre.",
    cue: "Coulée + battements. Tête sort un peu, inspire, tête reprend l’eau. Bras immobiles devant.",
    bonSi: "Tu inspires et tu restes long.",
    pasEncore: "Un seul inspire par 25 m, tête à peine hors de l’eau.",
    avoid: "Lever trop la tête.",
    dosage: "4-6 × 15-25 m · repos 20 s",
  },
  {
    id: "ANC4",
    prereq: "ANC3",
    title: "Inspirer sur le dos",
    objectif: "Apprendre à inspirer à plat dos.",
    cue: "Coulée + battements + demi-vrille. Bras tendus devant. Inspire seulement à plat dos.",
    bonSi: "Oreilles entre les bras, corps long.",
    pasEncore: "Demi-vrille sans inspire d’abord, puis tu ajoutes l’inspire.",
    avoid: "Inspirer avant d’être vraiment dos.",
    dosage: "4-6 vrilles · change de côté",
  },
  {
    id: "ANC5",
    prereq: "ANC4",
    title: "Les deux bras ensemble",
    objectif: "Pousser avec les deux bras sans perdre le plat.",
    cue: "Traction + poussée des deux bras en même temps. À la fin : inspire devant.",
    bonSi: "Tu restes plat. Les bras allongent la glisse.",
    pasEncore: "Un seul geste, puis tu glisses.",
    avoid: "Ramer trop tôt ou lever la tête.",
    dosage: "6-8 × 10-15 m · repos 20-30 s",
  },
  {
    id: "ANC6",
    prereq: "ANC5",
    title: "Un bras, puis l’autre",
    objectif: "Alterner les bras sans tout mélanger.",
    cue: "Un bras complet, pause stable, puis l’autre. Inspire après le 2e, petit arrêt.",
    bonSi: "Pas de mélange. Les deux bras avancent.",
    pasEncore: "Temps mort entre chaque bras et l’inspire.",
    avoid: "Enchaîner les deux bras trop vite.",
    dosage: "4 × 25 m · repos 20 s",
  },
  {
    id: "ANC7",
    prereq: "ANC6",
    title: "Retour sous l’eau",
    objectif: "Ramener les deux bras sous l’eau, près du corps. Dérivé du grand chien.",
    cue: "Après la poussée, ramène les deux bras sous l’eau, près du corps. Inspire après le 2e bras + arrêt.",
    bonSi: "Tu enchaînes sans te cabrer. Le retour freine peu.",
    pasEncore: "Retour sous l’eau un bras à la fois.",
    avoid: "Inspirer pendant le retour des bras.",
    dosage: "4-6 × 15-25 m · repos 20 s",
  },
  {
    id: "ANC8",
    prereq: "ANC7",
    title: "Retour en l’air",
    objectif: "Ramener le bras au-dessus de l’eau, coude d’abord.",
    cue: "Les bras reviennent en l’air, un après l’autre. Coude haut, main molle. Inspire après le 2e.",
    bonSi: "Un cycle entier tient sans te déséquilibrer.",
    pasEncore: "Un seul retour aérien, puis glisse.",
    avoid: "Bras tendu qui claque à l’eau.",
    dosage: "4 × 25 m · repos 20-30 s",
  },
  {
    id: "ANC9",
    prereq: "ANC8",
    title: "Cycle, puis inspire dos",
    objectif: "Enchaîner un cycle puis inspirer à plat dos.",
    cue: "Bras + retour aérien + demi-vrille. Inspire à plat dos, tête horizontale.",
    bonSi: "Inspire seulement à plat dos. Le cycle tient.",
    pasEncore: "Cycle sans vrille, puis vrille à part.",
    avoid: "Inspirer avant d’être dos.",
    dosage: "4-6 cycles + vrille",
  },
  {
    id: "ANC10",
    prereq: "ANC9",
    title: "Inspire dos, bras opposés",
    objectif: "Inspirer dos avec un bras devant et l’autre derrière.",
    cue: "Un bras a fini, l’autre pas. Inspire dos dans cette pose, puis termine le retour.",
    bonSi: "Tu inspires sans tout mélanger.",
    pasEncore: "Garde le même bras et le même côté jusqu’à ce que ça tienne.",
    avoid: "Passer dos sans ramener le bras à l’horizontale.",
    dosage: "4 × 25 m · repos 20 s",
  },
  {
    id: "ANC11",
    prereq: "ANC10",
    title: "Rattrapé avant + inspire dos",
    objectif: "Échafaudage temporaire : mains qui se rejoignent devant.",
    cue: "1 bras, vrille, inspire dos, reviens, l’autre bras. Les mains se retrouvent devant.",
    bonSi: "Tu bouges seulement quand tu es déjà stable.",
    pasEncore: "Un seul bras + vrille. L’autre attend devant.",
    avoid: "Garder le rattrapé comme nage finale.",
    dosage: "4 × 25 m · alterne le bras",
  },
  {
    id: "ANC12",
    prereq: "ANC11",
    title: "Rattrapé avant + inspire côté",
    objectif: "Passer de l’inspire dos à l’inspire côté.",
    cue: "1 bras complet. Tête sur le côté (pas tout le dos), inspire court, tête dans l’axe, bras devant.",
    bonSi: "Tête encore horizontale. Tu enchaînes droite puis gauche.",
    pasEncore: "Quart de vrille max. Inspire très court.",
    avoid: "Lever la tête vers le ciel.",
    dosage: "4-8 × 25 m · repos 20-30 s",
  },
  {
    id: "ANC13",
    prereq: "ANC12",
    title: "Rattrapé arrière + inspire côté",
    objectif: "Mains qui se rejoignent derrière, inspire côté.",
    cue: "Plus d’appui devant. Mains derrière. Inspire côté, une oreille dans l’eau.",
    bonSi: "Tu attends d’être stable avant chaque geste.",
    pasEncore: "Inspire 1 fois sur 2, même côté, puis tu changes.",
    avoid: "Inspirer pendant qu’un bras pousse.",
    dosage: "4 × 25 m · repos 20 s",
  },
  {
    id: "ANC14",
    prereq: "ANC13",
    title: "Rattrapé avant, 3 temps",
    objectif: "Respirer tous les 3 passages, hors poussée.",
    cue: "Des deux côtés. Bras séparés. Inspire hors des poussées, petit arrêt.",
    bonSi: "Tête à plat à l’inspire. Poussée et retour ne se marchent pas dessus.",
    pasEncore: "25 m plus lent. Un inspire de moins si besoin.",
    avoid: "Inspirer pendant la poussée.",
    dosage: "4-8 × 25 m",
  },
  {
    id: "ANC15",
    prereq: "ANC14",
    title: "Rattrapé arrière, 3 temps",
    objectif: "Même respiration, sans l’appui devant.",
    cue: "Comme l’étape 14, sans appui avant. Pas d’inspire pendant qu’un bras pousse.",
    bonSi: "Tu allonges sous cette forme sans casser.",
    pasEncore: "Reviens à l’étape 14 un 25 m, puis retente.",
    avoid: "Vitesse trop tôt.",
    dosage: "4 × 25 m, puis 2 × 50 m si ça tient",
  },
  {
    id: "ANC16",
    prereq: "ANC15",
    title: "Opposition + arrêt",
    objectif: "Un bras pousse pendant que l’autre revient.",
    cue: "Les deux actions en même temps. Marque début et fin. Inspire après un arrêt, hors poussée.",
    bonSi: "Les deux actions partent ensemble. Pas de trou devant.",
    pasEncore: "Un côté, puis l’autre, avec un vrai stop.",
    avoid: "Redevenir rattrapé devant.",
    dosage: "4-8 × 25 m · repos 20-30 s",
  },
  {
    id: "ANC17",
    prereq: "ANC16",
    title: "Le crawl",
    objectif: "Nager le crawl : opposition + inspire tous les 3 temps.",
    cue: "Un bras pousse, l’autre revient. Inspire courte sur le 3e temps.",
    bonSi: "Tête horizontale. Tu tiens 25 m comme ça.",
    pasEncore: "Remets un mini-arrêt (étape 16), puis retire-le.",
    avoid: "Garder le rattrapé.",
    dosage: "4-8 × 25 m et 4 × 50 m",
  },
  {
    id: "ANC18",
    prereq: "ANC17",
    title: "Moins de cycles",
    objectif: "Aller plus loin avec moins de mouvements.",
    cue: "Même nage. Compte tes passages. Plus d’amplitude, pas plus de frénésie.",
    bonSi: "Tu vises autour de 9 cycles / 25 m (un de plus ou de moins exprès).",
    pasEncore: "Compte seulement. Pas besoin du 9 tout de suite.",
    avoid: "Ramer plus vite pour « faire le chiffre ».",
    dosage: "4 × 25 m compte, puis 1 × 25 m avec 1 cycle de moins",
  },
];

export function getAncStep(id) {
  return ANC_STEPS.find((s) => s.id === id) || null;
}

export function ancStepIndex(id) {
  return ANC_STEPS.findIndex((s) => s.id === id);
}

export function nextAncStepId(id) {
  const i = ancStepIndex(id);
  if (i < 0 || i >= ANC_STEPS.length - 1) return null;
  return ANC_STEPS[i + 1].id;
}

export function prevAncStepId(id) {
  const i = ancStepIndex(id);
  if (i <= 0) return null;
  return ANC_STEPS[i - 1].id;
}
