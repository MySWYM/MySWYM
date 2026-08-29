/**
 * Helpers de lecture / construction des banques legacy.
 * Déplacés mécaniquement depuis src/lib/swim-session-generator.js, ne pas reformuler.
 */

export const LEGACY_SOURCE_FILE = "src/lib/swim-session-generator.js";

export function roundTo(n, step) {
  return Math.round(n / step) * step;
}

/** Distance approximative d'un bloc (lignes · NxXm / Ax(BxCm) / NxXm sans espace). */
export function estimateLinesDistance(lines) {
  let total = 0;
  for (const raw of lines) {
    let t = String(raw);
    t = t.replace(/(\d+)\s*x\s*\(\s*(\d+)\s*x\s*(\d+)\s*m/gi, (_m, a, b, d) => {
      total += parseInt(a, 10) * parseInt(b, 10) * parseInt(d, 10);
      return "";
    });
    t = t.replace(/(\d+)\s*[x×]\s*(\d+)\s*m/gi, (_m, n, d) => {
      total += parseInt(n, 10) * parseInt(d, 10);
      return "";
    });
    t.replace(/(\d+)\s*[x×]\s*(\d+)(?!\s*m)\s*:/gi, (_m, n, d) => {
      total += parseInt(n, 10) * parseInt(d, 10);
      return "";
    });
  }
  return total;
}

/** Bloc technique : distance = somme des lignes, toujours multiple de 25 m (bassin). */
export function block(distance, lines) {
  const arr = Array.isArray(lines) ? lines : [lines];
  const fromLines = estimateLinesDistance(arr);
  const raw = fromLines > 0 ? fromLines : distance || 0;
  const dist = Math.max(25, roundTo(raw, 25));
  return { distance: dist, lines: arr };
}

/** Métadonnée banque (étape 1). */
export function bankMeta({ id, sourceSymbol, status }) {
  return {
    id,
    source: `${LEGACY_SOURCE_FILE}:${sourceSymbol}`,
    status,
  };
}
