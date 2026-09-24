/**
 * Opt-in newsletter compte (user_metadata), prêt pour les envois futurs.
 */

export const NEWSLETTER_META_KEY = "newsletter_opt_in";
export const NEWSLETTER_PENDING_KEY = "myswym_newsletter_opt_in";

function defaultStore() {
  try {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

export function isNewsletterOptedIn(user) {
  return user?.user_metadata?.[NEWSLETTER_META_KEY] === true;
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
  const { data, error } = await supabase.auth.updateUser({
    data: { [NEWSLETTER_META_KEY]: !!enabled },
  });
  if (error) return { user: null, error };
  return { user: data?.user || null, error: null };
}

/** Après Apple / Google : appliquer le choix stashé à l’inscription. */
export async function flushPendingNewsletterOptIn(store = defaultStore()) {
  if (!hasPendingNewsletterOptIn(store)) return { applied: false, user: null, error: null };
  const enabled = readPendingNewsletterOptIn(store);
  clearPendingNewsletterOptIn(store);
  const result = await setNewsletterOptIn(enabled);
  return { applied: !result.error, ...result };
}
