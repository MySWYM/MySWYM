const STORAGE_PREFIX = "myswym_allure_unlock_tip_";

export function allureUnlockTipStorageKey(userId) {
  return `${STORAGE_PREFIX}${userId || "anon"}`;
}

export function hasSeenAllureUnlockTip(userId) {
  try {
    return localStorage.getItem(allureUnlockTipStorageKey(userId)) === "1";
  } catch {
    return true;
  }
}

export function markAllureUnlockTipSeen(userId) {
  try {
    localStorage.setItem(allureUnlockTipStorageKey(userId), "1");
  } catch {
    /* ignore */
  }
}

/**
 * Après la 1re séance faite : tip T100 une fois, si plan + tip pas vu.
 * On montre même si un T100 existe déjà (éduquer sur la valeur Premium).
 */
export function shouldShowAllureUnlockTip(profile, {
  dismissed = false,
  hasSwum = false,
  hasPlan = false,
} = {}) {
  if (dismissed) return false;
  if (!hasSwum || !hasPlan) return false;
  void profile;
  return true;
}
