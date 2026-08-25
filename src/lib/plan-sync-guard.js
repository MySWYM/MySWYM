/**
 * Garde anti-effacement séance / plan au re-sync visibility.
 * Ne jamais appliquer un remote plus pauvre ou plus vieux que le local.
 *
 * @param {{ localTime?: number, remoteTime?: number, currentProgress?: number, mergedProgress?: number }} p
 * @returns {boolean} true = on peut appliquer le merge remote en mémoire
 */
export function shouldApplyRemotePlanSync({
  localTime = 0,
  remoteTime = 0,
  currentProgress = 0,
  mergedProgress = 0,
} = {}) {
  if (currentProgress > mergedProgress) return false;
  if ((localTime || 0) > (remoteTime || 0)) return false;
  return true;
}
