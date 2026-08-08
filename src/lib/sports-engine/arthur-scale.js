/**
 * Scaling Arthur réel — adapte les séries (reps ou distance), pas seulement le total annoncé.
 */
import { calcDetailsDistance } from "../swim-session-generator.js";

/**
 * Scale une ligne type `8x200m` / `8 × 200m` / `· 8x200m …`.
 * @param {'reps'|'distance'} lever
 */
export function scaleDetailLine(line, ratio, lever = "reps") {
  const text = String(line ?? "");
  if (!text || Math.abs(ratio - 1) < 0.05) return text;

  return text.replace(/(\d+)\s*[x×]\s*(\d+)\s*m/gi, (_m, repsStr, distStr) => {
    const reps = parseInt(repsStr, 10);
    const dist = parseInt(distStr, 10);
    if (!reps || !dist) return _m;
    if (lever === "distance") {
      const step = dist >= 100 ? 50 : 25;
      let newDist = Math.round((dist * ratio) / step) * step;
      newDist = Math.max(step, newDist);
      // Ne pas détruire une intention seuil longue → trop courte
      if (dist >= 200 && newDist < 100) newDist = 100;
      return `${reps}×${newDist}m`;
    }
    let newReps = Math.max(2, Math.round(reps * ratio));
    // Éviter monolithes absurdes
    if (newReps > reps * 1.5) newReps = Math.round(reps * 1.4);
    return `${newReps}×${dist}m`;
  });
}

/**
 * Choisit le levier de scale selon le ratio et le type de séance.
 */
export function chooseScaleLever(ratio, sessionLike = {}) {
  const text = (sessionLike.details || []).join(" ");
  const intent = String(sessionLike.type || sessionLike.intensity || "").toUpperCase();
  // Vitesse / courts : plutôt reps
  if (/Z4|VITESSE|SPRINT/i.test(text + intent)) return "reps";
  // Gros écart vers le bas sur longues distances : distance parfois mieux
  if (ratio < 0.75 && /400|500|600|800/i.test(text)) return "distance";
  if (ratio > 1.25) return "reps";
  return "reps";
}

/**
 * Scale volume Arthur : modifie les lignes, recalcule distance.
 * @returns {object} session
 */
export function scaleSessionLinesToVolume(session, baseDist, targetDist, opts = {}) {
  const base = Number(baseDist) || 0;
  const target = Number(targetDist) || 0;
  if (!session || !base || !target || base <= 0) return session;

  const ratio = target / base;
  if (ratio >= 0.92 && ratio <= 1.08) {
    return { ...session, scaleRatio: 1, volumeScaled: false };
  }

  const lever = opts.lever || chooseScaleLever(ratio, session);
  const details = (session.details || []).map((line) => scaleDetailLine(line, ratio, lever));
  const fromDetails = calcDetailsDistance(details);
  const newDist =
    fromDetails > 200
      ? Math.round(fromDetails / 50) * 50
      : Math.max(400, Math.round(target / 50) * 50);

  return {
    ...session,
    details,
    distance: `${newDist}m`,
    duration: Math.max(35, Math.min(95, Math.round(newDist / 35))),
    volumeScaled: true,
    scaleRatio: Math.round(ratio * 100) / 100,
    scaleLever: lever,
    volumeFromDetails: fromDetails,
  };
}
