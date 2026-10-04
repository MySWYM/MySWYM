/**
 * Intent « reset MDP » capturé avant que supabase-js ne consomme le hash.
 * Ne pas importer supabase ici (ordre de boot).
 */

export const PASSWORD_RESET_QUERY = "reset";
export const PASSWORD_RESET_QUERY_VALUE = "1";
export const PASSWORD_RECOVERY_STORAGE_KEY = "myswym_password_recovery";

/** @param {string} [search] */
export function searchHasPasswordResetFlag(search = "") {
  try {
    const q = String(search || "").replace(/^\?/, "");
    return new URLSearchParams(q).get(PASSWORD_RESET_QUERY) === PASSWORD_RESET_QUERY_VALUE;
  } catch {
    return false;
  }
}

/** @param {string} [hash] */
export function hashHasRecoveryType(hash = "") {
  try {
    const raw = String(hash || "").replace(/^#/, "");
    if (!raw) return false;
    return new URLSearchParams(raw).get("type") === "recovery";
  } catch {
    return false;
  }
}

/**
 * @param {{ search?: string, hash?: string } | null | undefined} loc
 */
export function locationSignalsPasswordRecovery(loc) {
  if (!loc) return false;
  return searchHasPasswordResetFlag(loc.search) || hashHasRecoveryType(loc.hash);
}

export function markPasswordRecoveryIntent() {
  try {
    sessionStorage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, "1");
  } catch { /* private mode */ }
}

export function hasPasswordRecoveryIntent() {
  try {
    return sessionStorage.getItem(PASSWORD_RECOVERY_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearPasswordRecoveryIntent() {
  try {
    sessionStorage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY);
  } catch { /* ignore */ }
}

/**
 * Lit l’URL courante, persiste l’intent si recovery / ?reset=1.
 * @param {{ search?: string, hash?: string } | null | undefined} [loc]
 * @returns {boolean}
 */
export function capturePasswordRecoveryIntent(loc) {
  const target = loc || (typeof window !== "undefined" ? window.location : null);
  if (!locationSignalsPasswordRecovery(target)) {
    return hasPasswordRecoveryIntent();
  }
  markPasswordRecoveryIntent();
  return true;
}

/** Retire ?reset=1 de l’URL sans recharger. */
export function stripPasswordResetQueryFromUrl() {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(PASSWORD_RESET_QUERY)) return;
    url.searchParams.delete(PASSWORD_RESET_QUERY);
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", next);
  } catch { /* ignore */ }
}

// Side-effect : avant createClient / AppTree (import en premier dans main.jsx).
if (typeof window !== "undefined") {
  capturePasswordRecoveryIntent();
}
