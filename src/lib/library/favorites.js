/**
 * Favoris + pin « prochaine séance » (profil local / sport_profiles).
 */

/** @param {object|null|undefined} profile */
export function libraryFavoriteIds(profile) {
  const raw = profile?.libraryFavorites;
  return Array.isArray(raw) ? raw.map(String).filter(Boolean) : [];
}

/** @param {object|null|undefined} profile */
export function libraryFavoriteSet(profile) {
  return new Set(libraryFavoriteIds(profile));
}

/**
 * @param {object} profile
 * @param {string} itemId
 * @param {boolean} on
 */
export function withLibraryFavorite(profile, itemId, on) {
  const id = String(itemId || "");
  if (!id) return profile || {};
  const prev = libraryFavoriteIds(profile);
  const next = on ? [...new Set([...prev, id])] : prev.filter((x) => x !== id);
  return { ...(profile || {}), libraryFavorites: next };
}

/** @param {object|null|undefined} profile */
export function libraryPinnedEducatif(profile) {
  const pin = profile?.libraryPinnedEducatif;
  if (!pin || typeof pin !== "object") return null;
  const name = String(pin.name || "").trim();
  if (!name) return null;
  return {
    id: String(pin.id || ""),
    name,
    nage: pin.nage ? String(pin.nage) : null,
    source: pin.source ? String(pin.source) : null,
  };
}

/**
 * @param {object} profile
 * @param {{ id: string, name: string, nage?: string|null, source?: string|null }|null} pin
 */
export function withLibraryPinnedEducatif(profile, pin) {
  if (!pin?.name) {
    const next = { ...(profile || {}) };
    delete next.libraryPinnedEducatif;
    return next;
  }
  return {
    ...(profile || {}),
    libraryPinnedEducatif: {
      id: String(pin.id || ""),
      name: String(pin.name).trim(),
      nage: pin.nage ? String(pin.nage) : null,
      source: pin.source ? String(pin.source) : null,
      at: new Date().toISOString(),
    },
  };
}
