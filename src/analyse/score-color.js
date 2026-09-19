/**
 * Courbe de score Analyse : coral → gold → blue → mint (tokens DESIGN.md).
 * t = 0..1, couleur du remplissage en cours (comme GOWOD, sans le dark).
 */

export const SCORE_STOPS = [
  { t: 0, hex: "#E85A68" },
  { t: 0.32, hex: "#D4A017" },
  { t: 0.62, hex: "#3D8FFF" },
  { t: 1, hex: "#1FAE86" },
];

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex([r, g, b]) {
  const to = (n) => Math.round(n).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

export function scoreColor(t) {
  const p = clamp01(t);
  let i = 0;
  while (i < SCORE_STOPS.length - 2 && p > SCORE_STOPS[i + 1].t) i += 1;
  const a = SCORE_STOPS[i];
  const b = SCORE_STOPS[i + 1];
  const span = b.t - a.t || 1;
  const local = (p - a.t) / span;
  const ra = hexToRgb(a.hex);
  const rb = hexToRgb(b.hex);
  return rgbToHex([
    lerp(ra[0], rb[0], local),
    lerp(ra[1], rb[1], local),
    lerp(ra[2], rb[2], local),
  ]);
}

export function periodCompletionRatio(stats) {
  if (!stats) return 0;
  const plannedMeters = Number(stats.plannedMeters) || 0;
  const doneMeters = Number(stats.doneMeters) || 0;
  if (plannedMeters > 0) return clamp01(doneMeters / plannedMeters);
  const plannedSessions = Number(stats.plannedSessions) || 0;
  const doneSessions = Number(stats.doneSessions) || 0;
  if (plannedSessions > 0) return clamp01(doneSessions / plannedSessions);
  return 0;
}
