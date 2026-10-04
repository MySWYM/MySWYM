/**
 * Opt-in newsletter compte (user_metadata), prêt pour les envois futurs.
 */

export const NEWSLETTER_META_KEY = "newsletter_opt_in";
export const NEWSLETTER_PENDING_KEY = "myswym_newsletter_opt_in";
/** Ancre locale pour la relance notif (J+14) si refus. */
export const NEWSLETTER_NUDGE_KEY_PREFIX = "myswym_newsletter_nudge_";
/** Intervalle entre deux propositions notif si toujours refusé. */
export const NEWSLETTER_NUDGE_INTERVAL_MS = 14 * 86400000;

function defaultStore() {
  try {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

function defaultLocalStore() {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function isNewsletterOptedIn(user) {
  return user?.user_metadata?.[NEWSLETTER_META_KEY] === true;
}

export function newsletterNudgeKey(userId) {
  return `${NEWSLETTER_NUDGE_KEY_PREFIX}${userId || "anon"}`;
}

/** Ancre (ms) pour la 1ʳᵉ relance : created_at compte, sinon maintenant. */
export function ensureNewsletterNudgeAnchorMs(user, store = defaultLocalStore(), nowMs = Date.now()) {
  const uid = user?.id;
  if (!uid || !store) return nowMs;
  const key = newsletterNudgeKey(uid);
  const existing = Date.parse(store.getItem(key) || "");
  if (Number.isFinite(existing)) return existing;
  const created = Date.parse(user?.created_at || "");
  const anchor = Number.isFinite(created) ? created : nowMs;
  try {
    store.setItem(key, new Date(anchor).toISOString());
  } catch { /* ignore */ }
  return anchor;
}

export function clearNewsletterNudgeAnchor(userId, store = defaultLocalStore()) {
  if (!userId || !store) return;
  try {
    store.removeItem(newsletterNudgeKey(userId));
  } catch { /* ignore */ }
}

/**
 * Prochaine date de relance (ms), ou null si déjà opt-in / pas d’user.
 * Roule par fenêtres de 14 jours tant que l’opt-in reste faux.
 */
export function nextNewsletterNudgeAtMs(user, {
  store = defaultLocalStore(),
  nowMs = Date.now(),
  intervalMs = NEWSLETTER_NUDGE_INTERVAL_MS,
} = {}) {
  if (!user?.id || isNewsletterOptedIn(user)) return null;
  let at = ensureNewsletterNudgeAnchorMs(user, store, nowMs) + intervalMs;
  while (at <= nowMs + 60_000) {
    at += intervalMs;
  }
  return at;
}

export function stashPendingNewsletterOptIn(enabled, store = defaultStore()) {
  store?.setItem(NEWSLETTER_PENDING_KEY, enabled ? "1" : "0");
}

export function hasPendingNewsletterOptIn(store = defaultStore()) {
  const v = store?.getItem(NEWSLETTER_PENDING_KEY);
  return v === "0" || v === "1";
}

export function readPendingNewsletterOptIn(store = defaultStore()) {
  return store?.getItem(NEWSLETTER_PENDING_KEY) === "1";
}

export function clearPendingNewsletterOptIn(store = defaultStore()) {
  store?.removeItem(NEWSLETTER_PENDING_KEY);
}

/**
 * @param {boolean} enabled
 * @returns {Promise<{ user: object|null, error: Error|null }>}
 */
export async function setNewsletterOptIn(enabled) {
  const { supabase } = await import("../supabase.js");
  const on = !!enabled;
  const { data: cur } = await supabase.auth.getUser();
  let prefsPayload = null;
  try {
    const { parseNotificationPrefs, NOTIFICATION_PREFS_KEY } = await import("./notification-prefs.js");
    const prefs = parseNotificationPrefs(cur?.user?.user_metadata);
    prefs.email.news = on;
    prefsPayload = { [NOTIFICATION_PREFS_KEY]: prefs };
  } catch { /* ignore */ }
  const { data, error } = await supabase.auth.updateUser({
    data: { [NEWSLETTER_META_KEY]: on, ...(prefsPayload || {}) },
  });
  if (error) return { user: null, error };
  const user = data?.user || null;
  if (enabled && user?.id) clearNewsletterNudgeAnchor(user.id);
  return { user, error: null };
}

/** Après Apple / Google : appliquer le choix stashé à l’inscription. */
export async function flushPendingNewsletterOptIn(store = defaultStore()) {
  if (!hasPendingNewsletterOptIn(store)) return { applied: false, user: null, error: null };
  const enabled = readPendingNewsletterOptIn(store);
  clearPendingNewsletterOptIn(store);
  const result = await setNewsletterOptIn(enabled);
  return { applied: !result.error, ...result };
}
