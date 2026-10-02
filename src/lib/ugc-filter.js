/**
 * Filtre minimal avant publication Buddy (guideline App Store 1.2).
 * Mots entiers, après suppression des accents.
 */

const BLOCKED = [
  "nazi",
  "hitler",
  "porn",
  "porno",
  "pute",
  "putain",
  "salope",
  "connard",
  "connasse",
  "encule",
  "enculer",
  "fdp",
  "ntm",
  "bite",
  "couille",
  "pd",
  "negro",
  "negre",
  "bougnoule",
  "youpin",
  "sale race",
];

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function findObjectionable(text) {
  const norm = normalize(text);
  if (!norm.trim()) return null;
  for (const word of BLOCKED) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`);
    if (re.test(norm)) return word;
  }
  return null;
}

export const UGC_BLOCKED_MESSAGE =
  "Ce texte n’est pas autorisé. Reformule sans insulte ni contenu choquant.";
