/**
 * Motion Bibliothèque : uniquement si le geste est exact.
 * 1. Fiche Sheet avec Lottie dédié (public/library-motion/, voir store/library-motion/README.md).
 * 2. Sinon correspondance exacte avec une scène École (code livre ADC/AVC… ou titre identique).
 * Pas de fallback zone/nage (évite un mauvais geste sur la fiche).
 */

import { getMotionScene } from "../swim-school/motion-scenes.js";
import { ANC_STEPS } from "../swim-school/anc-track.js";
import { DOS_STEPS } from "../swim-school/dos-track.js";
import { VIRAGE_STEPS } from "../swim-school/virage-track.js";
import { DEPART_STEPS } from "../swim-school/depart-track.js";
import { PAP_STEPS } from "../swim-school/pap-track.js";
import { BRASSE_STEPS } from "../swim-school/brasse-track.js";
import { LIBRARY_MOTION_FILES } from "./library-motion-map.js";

/** @type {{ id: string, titleKey: string }[]} */
const SCHOOL_TITLES = [
  ...ANC_STEPS,
  ...DOS_STEPS,
  ...VIRAGE_STEPS,
  ...DEPART_STEPS,
  ...PAP_STEPS,
  ...BRASSE_STEPS,
].map((s) => ({
  id: s.id,
  titleKey: normalizeKey(s.title),
}));

/**
 * @param {string} text
 */
function normalizeKey(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * @param {string|null|undefined} code
 * @returns {string|null}
 */
export function stepIdFromLibraryCode(code) {
  const c = String(code || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!c) return null;
  if (/^(ADC|AVC|ANC|DOS|PAP|BRA)\d{1,2}$/.test(c)) return c;
  return null;
}

/**
 * Titre fiche ≈ titre étape École (après normalisation).
 * @param {string|null|undefined} name
 * @returns {string|null}
 */
function stepIdFromExactTitle(name) {
  const key = normalizeKey(name);
  if (!key) return null;
  const hit = SCHOOL_TITLES.find((s) => s.titleKey === key);
  if (hit && getMotionScene(hit.id)) return hit.id;

  // Alias courants livre ↔ école (même geste, libellé un peu différent).
  /** @type {Record<string, string>} */
  const aliases = {
    "chute avant du bord": "ADC1",
    "impulsion du bord": "ADC2",
    "desequilibre puis poussee": "ADC2",
    "action des bras a l impulsion": "ADC3",
    "action des bras": "ADC3",
    "cerceau puis coulee": "ADC4",
    "cerceau coulee": "ADC4",
    "depart complet sans agrippe reprise": "ADC5",
    "depart entier reprise": "ADC5",
    "agrippe traction pour basculer": "ADC6",
    "agrippe tirer pour basculer": "ADC6",
    "agrippe releve de tete": "ADC7",
    "agrippe tete qui se releve": "ADC7",
    "depart complet pieds decales": "ADC8",
    "pieds decales": "ADC8",
    "cerceau coulee reprise": "ADC9",
    "cerceau reprise": "ADC9",
    signal: "ADC10",
    "au signal": "ADC10",
    "arrivee 2 mains bascule et coulee dos": "AVC1",
    "2 mains bascule coulee dos": "AVC1",
    "arrivee 1 main demi translation coulee ventre": "AVC2",
    "1 main demi tour ventre": "AVC2",
    "retour de bras aerien": "AVC3",
    "un bras en l air": "AVC3",
    "coulee ventrale reprise de nage": "AVC4",
    "coulee reprise": "AVC4",
    "roulade avant": "AVC5",
    "roulade sans mur": "AVC5",
    "crawl rattrape arriere arret roulade": "AVC6",
    "crawl arret roulade": "AVC6",
    "battements vers le mur demi roulade pieds au mur": "AVC7",
    "battements pieds au mur": "AVC7",
    "crawl rattrape arriere pieds au mur": "AVC8",
    "crawl pieds au mur": "AVC8",
    "poussee dorsale reprise jambes": "AVC9",
    "poussee dos jambes": "AVC9",
    "quart de rotation poussee costale reprise complete": "AVC10",
    "virage entier nage": "AVC10",
  };
  const aliasId = aliases[key];
  if (aliasId && getMotionScene(aliasId)) return aliasId;
  return null;
}

/**
 * @param {Pick<{name?:string,code?:string}, string>} item
 * @returns {string|null} step id ou null si pas de motion fiable
 */
export function resolveLibraryMotionStepId(item) {
  const fromCode = stepIdFromLibraryCode(item?.code);
  if (fromCode && getMotionScene(fromCode)) return fromCode;

  return stepIdFromExactTitle(item?.name);
}

/** Nom de fiche normalisé → fichier (tolère casse / accents / apostrophes du Sheet). */
const LIBRARY_MOTION_BY_NAME = Object.fromEntries(
  Object.entries(LIBRARY_MOTION_FILES).map(([id, file]) => [normalizeKey(id.replace(/^sheet:/, "")), file]),
);

/**
 * Lottie dédié d'une fiche Sheet (jamais pour une fiche livre).
 * @param {{ id?: string, name?: string, source?: string }|null|undefined} item
 * @returns {string|null} nom de fichier dans public/library-motion/
 */
export function libraryMotionFileForItem(item) {
  if (item?.source && item.source !== "sheet") return null;
  const id = String(item?.id || "").trim().toLowerCase();
  if (id && LIBRARY_MOTION_FILES[id]) return LIBRARY_MOTION_FILES[id];
  const key = normalizeKey(item?.name);
  return (key && LIBRARY_MOTION_BY_NAME[key]) || null;
}

/**
 * @param {Parameters<typeof resolveLibraryMotionStepId>[0] & { id?: string, source?: string }} item
 * @returns {string|null}
 */
export function resolveLibraryMotionUrl(item) {
  const own = libraryMotionFileForItem(item);
  if (own) return `/library-motion/${own}`;
  const stepId = resolveLibraryMotionStepId(item);
  if (!stepId) return null;
  return getMotionScene(stepId)?.path || null;
}
