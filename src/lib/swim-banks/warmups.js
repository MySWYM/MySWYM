/**
 * Échauffements / départs — banque runtime = DEPARTS_* ; ECHAUFFEMENTS = legacy mort.
 * Extrait mécaniquement de src/lib/swim-session-generator.js.
 */
import { block, bankMeta } from "./_helpers.js";

const ECHAUFFEMENTS_RAW = [
  (w,resp)=> block(2*w+100, [`· ${w}m crawl libre, respiration ${resp}`, `· ${w}m dos`, `· 4x25m jambes crawl R15''`]),
  (w,resp)=> block(w+300,   [`· ${w}m crawl ${resp}`, `· 4x50m alterné 25 crawl / 25 dos`, `· 4x25m gainage bras tendu`]),
  (w,resp)=> block(w+250,   [`· ${w}m crawl libre facile`, `· 6x25m éducatif rattrapé R10''`, `· 4x25m accél. progressive`]),
  (w,resp)=> block(w+300,   [`· ${w}m mixte (crawl/dos), respiration ${resp}`, `· 4x50m pull-buoy Z1`, `· 4x25m sprint court R20''`]),
  (w,resp)=> block(w+300,   [`· ${w}m crawl ${resp}`, `· 4x50m jambes avec planche R15''`, `· 4x25m gainage + battements`]),
  (w,resp)=> block(w+250,   [`· ${w}m crawl libre, focus glisse`, `· 6x25m éducatif rattrapé R10''`, `· 4x25m dos facile`]),
  (w,resp)=> block(w+300,   [`· ${w}m mixte crawl/dos souple`, `· 8x25m 1 bras alterné R10''`, `· 4x25m crawl vitesse contrôlée`])
];

const DEPARTS_SEMAINE_RAW = [
  () => ({ distance: 400, text: `-400m Dos/Cr par 100m (Z1)` }),
  () => ({ distance: 400, text: `-400m Cr/Dos par 50m (Z1)` }),
  () => ({ distance: 400, text: `-400m Cr palmes (Z1)` }),
  () => ({ distance: 400, text: `-400m mixte crawl/dos souple (Z1)` }),
  () => ({ distance: 350, text: `-350m mixte crawl/dos (Z1)` }),
  () => ({ distance: 400, text: `-400m au choix (3ème 25m chq 100 en godille) (Z1)` }),
  () => ({ distance: 400, text: `-400m Cr souple (Z1)` }),
  () => ({ distance: 400, text: `-400m Dos/Cr par 50m (Z1)` }),
  () => ({ distance: 400, text: `-400m Cr/Dos par 25m (Z1)` }),
  () => ({ distance: 400, text: `-400m Cr tuba (Z1)` }),
  () => ({ distance: 400, text: `-400m Dos souple (Z1)` }),
  () => ({ distance: 350, text: `-350m Cr/Dos par 50m (Z1)` }),
  () => ({ distance: 400, text: `-400m au choix, change de nage toutes les 2 longueurs (Z1)` }),
  () => ({ distance: 400, text: `-400m Cr palmes + tuba (Z1)` }),
  () => ({ distance: 450, text: `-450m mixte crawl/dos souple (Z1)` }),
  () => ({ distance: 400, text: `-400m au choix (dernier 25m chq 50m en godille) (Z1)` }),
];

/** Départs avec jambes — uniquement si le focus technique n'est PAS déjà jambes. */
const DEPARTS_AVEC_JAMBES_RAW = [
  () => ({ distance: 400, text: `-400m au choix (3ème 25m chq 100 en jambes) (Z1)` }),
  () => ({ distance: 400, text: `-400m jambes crawl planche (Z1)` }),
  () => ({ distance: 400, text: `-400m jambes dos planche (Z1)` }),
  () => ({ distance: 400, text: `-400m au choix (dernier 25m chq 50m en jambes) (Z1)` }),
];

/** Runtime : départs Z1 (échauffement effectif). */
export const DEPARTS_SEMAINE = DEPARTS_SEMAINE_RAW;
export const DEPARTS_AVEC_JAMBES = DEPARTS_AVEC_JAMBES_RAW;

/** Non utilisé par le runtime actuel (code mort conservé). */
export const ECHAUFFEMENTS = ECHAUFFEMENTS_RAW;

export const WARMUP_ENTRIES = [
  ...DEPARTS_SEMAINE.map((build, index) => ({
    ...bankMeta({ id: `depart_${index}`, sourceSymbol: `DEPARTS_SEMAINE[${index}]`, status: "candidate" }),
    kind: "depart",
    index,
    build,
  })),
  ...DEPARTS_AVEC_JAMBES.map((build, index) => ({
    ...bankMeta({ id: `depart_jambes_${index}`, sourceSymbol: `DEPARTS_AVEC_JAMBES[${index}]`, status: "candidate" }),
    kind: "depart_jambes",
    index,
    build,
  })),
  ...ECHAUFFEMENTS.map((build, index) => ({
    ...bankMeta({ id: `echauffement_${index}`, sourceSymbol: `ECHAUFFEMENTS[${index}]`, status: "legacy" }),
    kind: "echauffement_dead",
    index,
    build,
  })),
];
