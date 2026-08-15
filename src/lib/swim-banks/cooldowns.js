/**
 * Retours au calme / fins — runtime = FINS_SEMAINE ; RETOURS_CALME = legacy mort.
 * Extrait mécaniquement de src/lib/swim-session-generator.js.
 */
import { roundTo, bankMeta } from "./_helpers.js";

const RETOURS_CALME_RAW = [
  (d)=>[`· ${d}m dos/crawl très facile`],
  (d)=>[`· ${d}m nage libre facile, respiration relâchée`],
  (d)=>[`· ${d}m souple, respiration relâchée`],
  (d)=>{ const a=roundTo(d*0.8,25); return [`· ${a}m facile + ${d-a}m étirements bras/épaules`]; },
  (d)=>[`· ${d}m mixte crawl/dos, respiration relâchée`],
  (d)=>{ const a=roundTo(d/2,25); return [`· ${a}m crawl très facile + ${d-a}m dos`]; },
  (d)=>[`· ${d}m dos très facile, respiration ample`],
  (d)=>[`· ${d}m godilles très facile, au choix ventral ou dorsal`],
  (d)=>[`· ${d}m facile, une nage différente à chaque longueur`],
  (d)=>{ const a=roundTo(d*0.6,25); return [`· ${a}m crawl très facile + ${d-a}m dos souple`]; },
  (d)=>{ const a=roundTo(d*0.5,25); return [`· ${a}m facile + ${d-a}m étirements épaules dans l'eau`]; },
  (d)=>[`· ${d}m très facile — Z1`],
];
const FINS_SEMAINE_RAW = [
  (d) => `-${d}m au choix — Z1`,
  (d) => `-${d}m libre récup — Z1`,
  (d) => `-${d}m le + lent possible — Z1`,
  (d) => `-${d}m au choix — Z1`,
  (d) => `-${d}m au choix — souple`,
  (d) => `-${d}m dos très facile — Z1`,
  (d) => `-${d}m multi-nages, sans chrono — Z1`,
  (d) => `-${d}m au choix, dernière longueur en godilles — Z1`,
  (d) => `-${d}m relâché, respiration ample — Z1`,
  (d) => `-${d}m souple — Z1`,
];

export const FINS_SEMAINE = FINS_SEMAINE_RAW;
export const RETOURS_CALME = RETOURS_CALME_RAW;

export const COOLDOWN_ENTRIES = [
  ...FINS_SEMAINE.map((build, index) => ({
    ...bankMeta({ id: `fin_${index}`, sourceSymbol: `FINS_SEMAINE[${index}]`, status: "candidate" }),
    kind: "fin",
    index,
    build,
  })),
  ...RETOURS_CALME.map((build, index) => ({
    ...bankMeta({ id: `retour_calme_${index}`, sourceSymbol: `RETOURS_CALME[${index}]`, status: "legacy" }),
    kind: "retour_calme_dead",
    index,
    build,
  })),
];
