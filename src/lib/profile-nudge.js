const STORAGE_PREFIX = "myswym_profile_nudge_dismissed_";

export function profileNudgeStorageKey(userId) {
  return `${STORAGE_PREFIX}${userId || "anon"}`;
}

export function isProfileNudgeDismissed(userId) {
  try {
    return localStorage.getItem(profileNudgeStorageKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function dismissProfileNudge(userId) {
  try {
    localStorage.setItem(profileNudgeStorageKey(userId), "1");
  } catch {
    /* ignore */
  }
}

/**
 * Encadré tant que le nageur n’a pas personnalisé bassin/matos
 * (défauts du questionnaire court : 25 m, aucun matériel).
 */
export function shouldShowProfileNudge(profile, { dismissed = false } = {}) {
  if (dismissed) return false;
  if (!profile || typeof profile !== "object") return true;
  const pool = Number(profile.pool);
  const equipment = Array.isArray(profile.equipment) ? profile.equipment : [];
  const stillDefaultPool = pool !== 50;
  const stillNoGear = equipment.length === 0;
  return stillDefaultPool && stillNoGear;
}
