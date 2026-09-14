/**
 * WhatsNew « vu » — 1× / compte (user_metadata) + cache local.
 */

/** Bump pour une future campagne (1 pop + regen 1×). */
export const WHATS_NEW_CAMPAIGN = "v2026_08_30";
/** Comptes créés à partir de cette date : Sheet en direct, plus de pop ni de 2e chargement. */
export const WHATS_NEW_ELIGIBLE_BEFORE = "2026-09-01T00:00:00+02:00";
/** @deprecated legacy global (pre per-user) — encore lu pour migration */
export const WHATS_NEW_STORAGE_KEY = `myswym_whats_new_${WHATS_NEW_CAMPAIGN}`;
export const WHATS_NEW_META_KEY = "whats_new_seen";

export function whatsNewStorageKey(userId) {
  return `${WHATS_NEW_STORAGE_KEY}_${userId || "anon"}`;
}

/** @returns {Record<string, number>} */
export function normalizeWhatsNewSeenMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n) && n > 0) out[String(k)] = n;
    else if (v === true || v === "1") out[String(k)] = Date.now();
  }
  return out;
}

function readLocalSeen(userId) {
  try {
    if (localStorage.getItem(whatsNewStorageKey(userId)) === "1") return true;
    if (localStorage.getItem(WHATS_NEW_STORAGE_KEY) === "1") return true;
  } catch {
    return true;
  }
  return false;
}

/**
 * @param {{ id?: string, user_metadata?: Record<string, unknown> } | null | undefined} user
 */
export function hasSeenWhatsNew(user) {
  if (!user?.id) return true;
  const meta = normalizeWhatsNewSeenMap(user.user_metadata?.[WHATS_NEW_META_KEY]);
  if (meta[WHATS_NEW_CAMPAIGN]) return true;
  return readLocalSeen(user.id);
}

/** Compte d’avant le 1er sept. 2026 : encore éligible au one-shot Sheet. */
export function isWhatsNewEligibleAccount(user) {
  if (!user?.id) return false;
  const cutoffMs = Date.parse(WHATS_NEW_ELIGIBLE_BEFORE);
  const createdMs = Date.parse(user.created_at);
  if (!Number.isFinite(createdMs)) return true;
  return createdMs < cutoffMs;
}

/** Pop + regen semaine : seulement reconnectés d’avant la maj Sheet, pas encore vus. */
export function shouldShowWhatsNew(user) {
  if (!isWhatsNewEligibleAccount(user)) return false;
  return !hasSeenWhatsNew(user);
}

/**
 * @param {{ id?: string, user_metadata?: Record<string, unknown> } | null | undefined} user
 */
export async function markWhatsNewSeen(user) {
  if (!user?.id) return null;
  try {
    localStorage.setItem(whatsNewStorageKey(user.id), "1");
    localStorage.setItem(WHATS_NEW_STORAGE_KEY, "1");
  } catch { /* ignore */ }

  const next = {
    ...normalizeWhatsNewSeenMap(user.user_metadata?.[WHATS_NEW_META_KEY]),
    [WHATS_NEW_CAMPAIGN]: Date.now(),
  };

  try {
    const { supabase } = await import("../supabase.js");
    const { data, error } = await supabase.auth.updateUser({
      data: { [WHATS_NEW_META_KEY]: next },
    });
    if (error) return null;
    return data?.user || null;
  } catch {
    return null;
  }
}

/**
 * Local déjà vu mais pas encore en metadata → sync compte.
 * @param {{ id?: string, user_metadata?: Record<string, unknown> } | null | undefined} user
 */
export async function syncWhatsNewSeenIfNeeded(user) {
  if (!user?.id) return null;
  const meta = normalizeWhatsNewSeenMap(user.user_metadata?.[WHATS_NEW_META_KEY]);
  if (meta[WHATS_NEW_CAMPAIGN]) return null;
  if (!readLocalSeen(user.id)) return null;
  return markWhatsNewSeen(user);
}
