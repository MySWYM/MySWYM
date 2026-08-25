/**
 * Helpers URL avatar (sans dépendance Supabase — testables en Node).
 */

export function avatarCacheKey(userId) {
  return userId ? `myswym_avatar_${userId}` : "myswym_avatar";
}

/** Ignore data: URLs (aperçu local) et chaînes vides. */
export function normalizeAvatarUrl(url) {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("data:")) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed;
}

export function withAvatarCacheBust(url) {
  const base = normalizeAvatarUrl(url);
  if (!base) return null;
  const clean = base.split("?")[0];
  return `${clean}?t=${Date.now()}`;
}

export function readCachedAvatar(userId) {
  try {
    const keyed = userId ? localStorage.getItem(avatarCacheKey(userId)) : null;
    const legacy = localStorage.getItem("myswym_avatar");
    return normalizeAvatarUrl(keyed) || normalizeAvatarUrl(legacy);
  } catch {
    return null;
  }
}

export function writeCachedAvatar(userId, url) {
  const clean = normalizeAvatarUrl(url);
  if (!clean) return;
  try {
    localStorage.setItem(avatarCacheKey(userId), clean);
    localStorage.setItem("myswym_avatar", clean);
  } catch { /* quota / private mode */ }
}

export function clearCachedAvatar(userId) {
  try {
    if (userId) localStorage.removeItem(avatarCacheKey(userId));
    localStorage.removeItem("myswym_avatar");
  } catch { /* ignore */ }
}

/** Résolution synchrone : metadata → cache local (même navigateur). */
export function resolveAvatarUrl(user) {
  const fromMeta = normalizeAvatarUrl(user?.user_metadata?.avatar_url);
  if (fromMeta) return fromMeta;
  return readCachedAvatar(user?.id);
}
