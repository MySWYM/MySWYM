/**
 * Niveaux produit depuis le libellé Excel « niveau Arthur ».
 * Source de vérité pour la sélection d’éducatifs dans le composeur.
 *
 * Important : « régulier — adaptable à tous niveaux » ≠ « Tous niveaux ».
 * La découverte n’est ajoutée que si elle (ou « débutant ») est nommée,
 * ou via une note Excel explicite « pour les découvertes » (ex. grand chien).
 */

export const PRODUCT_LEVELS = ["decouverte", "regulier", "sportif", "performance"];

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * @param {string} levelLabel
 * @param {{ notes?: string, id?: string }} [opts]
 * @returns {string[]}
 */
export function parseArthurEducatifLevels(levelLabel, opts = {}) {
  const { notes = "", id = "" } = opts;
  const raw = String(levelLabel || "").trim();
  const t = normalize(raw);
  const notesT = normalize(notes);

  if (!t) return [];

  // « Tous » / « Tous niveaux » en tête de disponibilité — pas « adaptable à tous niveaux »
  const adaptableTous = /adaptable\s+a\s+tous/.test(t);
  const isUniversal =
    !adaptableTous &&
    (/^tous\b/.test(t) ||
      /\btous\s+les\s+niveaux\b/.test(t) ||
      /\btous\s+niveaux\b/.test(t) ||
      /\btous\s*\(/.test(t) ||
      /\btous\s+mais\b/.test(t));

  if (isUniversal) return [...PRODUCT_LEVELS];

  const out = new Set();
  if (/decouvert/.test(t)) out.add("decouverte");
  if (/debutant/.test(t)) out.add("decouverte");
  if (/regulier/.test(t)) out.add("regulier");
  if (/sportif/.test(t)) out.add("sportif");
  if (/perform/.test(t)) out.add("performance");
  if (/au\s+delas|au-dela/.test(t)) {
    out.add("sportif");
    out.add("performance");
  }

  // « régulier — adaptable à tous » : prescrit aussi sportif/perf, pas découverte
  if (adaptableTous) {
    out.add("regulier");
    out.add("sportif");
    out.add("performance");
  }

  if (!out.size && /adaptable\s+selon/.test(t)) {
    return ["regulier", "sportif", "performance"];
  }

  // Notes Excel : tuba / cadre pour les découvertes (grand chien uniquement —
  // le petit chien reste hors Découverte, règle active 8).
  if (
    (id === "educatif_grand_chien" || /grand\s+chien/.test(normalize(id))) &&
    /pour\s+les\s+decouvertes/.test(notesT)
  ) {
    out.add("decouverte");
  }

  return PRODUCT_LEVELS.filter((lv) => out.has(lv));
}
