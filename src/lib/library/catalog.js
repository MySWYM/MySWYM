/**
 * Catalogue Bibliothèque éducatifs : Sheet + livres (savoir).
 */

import { loadNatationCatalogue } from "../natation-sheet/client.js";
import { educatifRowToUiFiche, normalizeNageKey } from "../natation-sheet/parse.js";
import { parseBookMarkdown } from "./book-parse.js";
import { resolveLibraryMotionUrl } from "./motion.js";

import crawlAdcMd from "../../../docs/natation-savoir/crawl-performant-adc.md?raw";
import crawlAvcMd from "../../../docs/natation-savoir/crawl-performant-avc.md?raw";

/**
 * @typedef {{
 *  id: string,
 *  name: string,
 *  code?: string|null,
 *  nage: string,
 *  nages: string[],
 *  levels: string[],
 *  levelLabel: string|null,
 *  stimulus: string,
 *  cue: string,
 *  objective: string,
 *  shortDescription: string,
 *  successCriteria?: string|null,
 *  watchPoints?: string[],
 *  equipment: string|null,
 *  equipmentTags: string[],
 *  zones: string[],
 *  mistakes: string[],
 *  source: 'sheet'|'livre',
 *  sourceLabel: string,
 *  ficheSource: string,
 *  thumbUrl: string|null,
 *  motionUrl: string|null,
 *  videoUrl: string|null,
 *  isNew: boolean,
 *  sheetName: string|null,
 * }} LibraryItem
 */

/** Tags matos bibliothèque (ids stables). */
export const LIBRARY_EQUIPMENT = [
  { id: "none", labelKey: "library.equipNone" },
  { id: "palmes", labelKey: "library.equipPalmes" },
  { id: "tuba", labelKey: "library.equipTuba" },
  { id: "pull", labelKey: "library.equipPull" },
  { id: "planche", labelKey: "library.equipPlanche" },
  { id: "plaquettes", labelKey: "library.equipPlaquettes" },
];

/** Zones pédagogiques (équivalent « Zone » GOWOD, adapté natation). */
export const LIBRARY_ZONES = [
  { id: "respiration", labelKey: "library.zoneBreath" },
  { id: "arms", labelKey: "library.zoneArms" },
  { id: "jambes", labelKey: "library.zoneLegs" },
  { id: "equilibre", labelKey: "library.zoneBalance" },
  { id: "virage", labelKey: "library.zoneTurn" },
  { id: "depart", labelKey: "library.zoneStart" },
  { id: "swim", labelKey: "library.zoneSwim" },
];

export const LIBRARY_TYPES = [
  { id: "sheet", labelKey: "library.typeSheet" },
  { id: "livre", labelKey: "library.typeBook" },
];

/**
 * @param {Pick<LibraryItem, 'name'|'stimulus'|'cue'|'code'>} item
 * @returns {string[]}
 */
export function inferLibraryZones(item) {
  const hay = `${item.name || ""} ${item.stimulus || ""} ${item.cue || ""} ${item.code || ""}`.toLowerCase();
  /** @type {string[]} */
  const zones = [];
  if (/respir|expir|inspir|apnée|apnee|\b3t\b|\b5t\b|\b1t\b/.test(hay)) zones.push("respiration");
  if (/bras|rattrap|godille|appui|traction|coude|prise d'eau|moulin/.test(hay)) zones.push("arms");
  if (/jambe|battement|ciseau|fouett|pied|talon|kick/.test(hay)) zones.push("jambes");
  if (/équilibre|equilibre|flèche|fleche|coulée|coulee|position|gainage|glisse|corps/.test(hay)) {
    zones.push("equilibre");
  }
  if (/virage|roulade|culbute/.test(hay)) zones.push("virage");
  if (/départ|depart|plot|chute|impulsion|adc|agripp/.test(hay)) zones.push("depart");
  if (!zones.length) zones.push("swim");
  return zones;
}

/**
 * @param {string[]|null|undefined} materiel
 * @param {string|null|undefined} materielRaw
 */
export function equipmentTagsFromSheet(materiel, materielRaw) {
  const tags = new Set();
  const list = Array.isArray(materiel) ? materiel : [];
  for (const m of list) {
    const id = String(m || "").toLowerCase();
    if (id === "palmes" || id === "fins") tags.add("palmes");
    else if (id === "tuba" || id.includes("snorkel")) tags.add("tuba");
    else if (id === "pull" || id.includes("pull")) tags.add("pull");
    else if (id.includes("planche") || id === "board") tags.add("planche");
    else if (id.includes("plaquette") || id.includes("paddle")) tags.add("plaquettes");
  }
  const raw = String(materielRaw || "").toLowerCase();
  if (/palme/.test(raw)) tags.add("palmes");
  if (/tuba|snorkel/.test(raw)) tags.add("tuba");
  if (/pull/.test(raw)) tags.add("pull");
  if (/planche/.test(raw)) tags.add("planche");
  if (/plaquette|paddle/.test(raw)) tags.add("plaquettes");
  if (!tags.size) tags.add("none");
  return [...tags];
}

const BOOK_STATIC = [
  ...parseBookMarkdown(crawlAdcMd, { source: "Crawl performant · ADC", nage: "crawl" }),
  ...parseBookMarkdown(crawlAvcMd, { source: "Crawl performant · AVC", nage: "crawl" }),
];

/**
 * @param {import("../natation-sheet/parse.js").EducatifRow} row
 * @returns {LibraryItem|null}
 */
export function sheetRowToLibraryItem(row) {
  const fiche = educatifRowToUiFiche(row);
  if (!fiche) return null;
  const nages = String(row.nage || "crawl")
    .split(/[,/]+/)
    .map((x) => normalizeNageKey(x.trim()) || "crawl")
    .filter(Boolean);
  const nage = nages[0] || "crawl";
  const levels = [];
  if (row.debutant) levels.push("Débutant");
  if (row.intermediaire) levels.push("Intermédiaire");
  if (row.avance) levels.push("Avancé");
  const base = {
    id: fiche.id,
    name: fiche.name,
    code: null,
    nage,
    nages: nages.length ? nages : [nage],
    levels,
    levelLabel: fiche.level,
    stimulus: fiche.shortDescription || fiche.objective || "",
    cue: fiche.cue || "",
    objective: fiche.objective || "",
    shortDescription: fiche.shortDescription || "",
    successCriteria: null,
    watchPoints: Array.isArray(fiche.mistakes) ? fiche.mistakes : [],
    equipment: fiche.equipment || null,
    equipmentTags: equipmentTagsFromSheet(row.materiel, row.materielRaw),
    zones: /** @type {string[]} */ ([]),
    mistakes: Array.isArray(fiche.mistakes) ? fiche.mistakes : [],
    source: "sheet",
    sourceLabel: "Sheet",
    ficheSource: "sheet",
    thumbUrl: null,
    motionUrl: null,
    videoUrl: null,
    isNew: false,
    sheetName: fiche.name,
  };
  base.zones = inferLibraryZones(base);
  base.motionUrl = resolveLibraryMotionUrl(base);
  return base;
}

/** @returns {LibraryItem[]} */
export function bookLibraryItems() {
  return BOOK_STATIC.slice();
}

/**
 * @returns {Promise<LibraryItem[]>}
 */
export async function loadLibraryCatalog() {
  /** @type {LibraryItem[]} */
  const items = [];
  const seen = new Set();

  try {
    const cat = await loadNatationCatalogue([]);
    for (const row of cat?.educatifs || []) {
      if (row?.garder === false) continue;
      const item = sheetRowToLibraryItem(row);
      if (!item || seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  } catch (err) {
    console.warn("[library] sheet", err?.message || err);
  }

  for (const item of BOOK_STATIC) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const enriched = {
      ...item,
      successCriteria: item.successCriteria || null,
      watchPoints: Array.isArray(item.watchPoints) ? item.watchPoints : [],
      equipmentTags: item.equipmentTags?.length ? item.equipmentTags : ["none"],
      zones: item.zones?.length ? item.zones : inferLibraryZones(item),
    };
    enriched.motionUrl = resolveLibraryMotionUrl(enriched);
    items.push(enriched);
  }

  items.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return items;
}

/**
 * @param {LibraryItem[]} items
 * @param {{
 *   q?: string,
 *   nages?: string[],
 *   nage?: string,
 *   level?: string,
 *   levels?: string[],
 *   sources?: string[],
 *   equipment?: string[],
 *   zones?: string[],
 *   favoritesOnly?: boolean,
 *   favoriteIds?: Set<string>|string[],
 * }} filters
 */
export function filterLibraryItems(items, filters = {}) {
  const q = String(filters.q || "")
    .trim()
    .toLowerCase();
  const nagesSel = Array.isArray(filters.nages)
    ? filters.nages.map(normalizeNageKey).filter((n) => n && n !== "all" && n !== "toutes")
    : filters.nage && filters.nage !== "all" && filters.nage !== "toutes"
      ? [normalizeNageKey(filters.nage)]
      : [];
  const levelsSel = Array.isArray(filters.levels)
    ? filters.levels.filter(Boolean)
    : filters.level
      ? [String(filters.level).trim()].filter(Boolean)
      : [];
  const sources = Array.isArray(filters.sources) ? filters.sources.filter(Boolean) : [];
  const equipment = Array.isArray(filters.equipment) ? filters.equipment.filter(Boolean) : [];
  const zones = Array.isArray(filters.zones) ? filters.zones.filter(Boolean) : [];
  const favSet =
    filters.favoriteIds instanceof Set
      ? filters.favoriteIds
      : new Set(Array.isArray(filters.favoriteIds) ? filters.favoriteIds : []);

  return (items || []).filter((it) => {
    if (filters.favoritesOnly && !favSet.has(it.id)) return false;
    if (sources.length && !sources.includes(it.source)) return false;
    if (nagesSel.length) {
      const ok = nagesSel.some(
        (n) => (it.nages || []).includes(n) || it.nage === n || it.nage === "all" || it.nage === "toutes",
      );
      if (!ok) return false;
    }
    if (levelsSel.length) {
      const lv = it.levels || [];
      const ok = levelsSel.some((l) => lv.includes(l));
      if (!ok) return false;
    }
    if (equipment.length) {
      const tags = it.equipmentTags || [];
      const ok = equipment.some((e) => tags.includes(e));
      if (!ok) return false;
    }
    if (zones.length) {
      const z = it.zones || [];
      const ok = zones.some((id) => z.includes(id));
      if (!ok) return false;
    }
    if (!q) return true;
    const hay = `${it.name} ${it.stimulus} ${it.cue} ${it.sourceLabel}`.toLowerCase();
    return hay.includes(q);
  });
}

/** Compte prévisualisation filtres (pour le sheet). */
export function countLibraryFiltered(items, filters) {
  return filterLibraryItems(items, filters).length;
}

export const LIBRARY_NAGE_FILTERS = [
  { id: "all", labelKey: "library.filterAll" },
  { id: "crawl", labelKey: "library.filterCrawl" },
  { id: "dos", labelKey: "library.filterDos" },
  { id: "brasse", labelKey: "library.filterBrasse" },
  { id: "papillon", labelKey: "library.filterPap" },
];

/** id = libellé Sheet (déjà dans fr-dict) ; label UI via i18n. */
export const LIBRARY_LEVEL_FILTERS = [
  { id: "", labelKey: "library.filterLevelAll" },
  { id: "Débutant", labelKey: "library.filterBeginner" },
  { id: "Intermédiaire", labelKey: "library.filterIntermediate" },
  { id: "Avancé", labelKey: "library.filterAdvanced" },
];
