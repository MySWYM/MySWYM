/**
 * Réf. de la dernière séance regardée, jointe aux messages support.
 *
 * Permet de retrouver l'onglet + la ligne du Sheet quand un nageur écrit
 * « ma séance est bizarre » sans dire laquelle.
 */

const KEY = "myswym:support:session-ref";
const MAX = 300;

let memory = null;

function clean(line) {
  const s = String(line || "").replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  return s ? s.slice(0, MAX) : null;
}

export function setSupportSessionRef(line) {
  memory = clean(line);
  try {
    if (memory) sessionStorage.setItem(KEY, memory);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* sessionStorage indisponible (Safari privé), la mémoire suffit */
  }
}

export function getSupportSessionRef() {
  if (memory) return memory;
  try {
    return sessionStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
}

export function clearSupportSessionRef() {
  setSupportSessionRef(null);
}
