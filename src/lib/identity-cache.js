/**
 * Prénom / photo : cache navigateur **par user id** uniquement.
 * Jamais de clé globale (évite de coller le profil d’Arthur sur un compte test).
 */
import { clearCachedAvatar } from "./avatar-url.js";

const FIRSTNAME_GLOBAL_KEY = "myswym_firstname";
const AVATAR_GLOBAL_KEY = "myswym_avatar";

export function firstNameStorageKey(userId) {
  return userId ? `myswym_firstname_${userId}` : null;
}

export function readCachedFirstName(userId) {
  if (!userId) return "";
  try {
    return localStorage.getItem(firstNameStorageKey(userId)) || "";
  } catch {
    return "";
  }
}

export function writeCachedFirstName(userId, name) {
  const v = String(name || "").trim();
  const key = firstNameStorageKey(userId);
  if (!key || !v) return;
  try {
    localStorage.setItem(key, v);
  } catch { /* quota / private mode */ }
}

export function resolveDisplayFirstName(user, fallback = "Nageur") {
  const fromMeta = String(user?.user_metadata?.firstname || "").trim();
  if (fromMeta) return fromMeta;
  const cached = readCachedFirstName(user?.id);
  if (cached) return cached;
  const fromFull = String(user?.user_metadata?.full_name || "").trim().split(" ")[0];
  if (fromFull) return fromFull;
  const fromEmail = String(user?.email || "").split("@")[0];
  if (fromEmail) return fromEmail;
  return fallback;
}

/** Vide le cache du compte + les clés globales héritées. */
export function clearIdentityLocalCache(userId) {
  try {
    const key = firstNameStorageKey(userId);
    if (key) localStorage.removeItem(key);
    localStorage.removeItem(FIRSTNAME_GLOBAL_KEY);
    localStorage.removeItem(AVATAR_GLOBAL_KEY);
  } catch { /* ignore */ }
  clearCachedAvatar(userId);
}
