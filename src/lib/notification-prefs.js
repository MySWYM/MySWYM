/**
 * Préférences notifications (Push / Email) dans user_metadata.
 * Sécurité & facturation : toujours actives (non stockées).
 */
import { NEWSLETTER_META_KEY } from "./newsletter-opt-in.js";

export const NOTIFICATION_PREFS_KEY = "notification_prefs";

export const DEFAULT_PUSH_PREFS = Object.freeze({
  session: true,
  streak: true,
  badges: true,
  buddy: true,
  support: true,
  news: true,
  product_tips: true,
});

export const DEFAULT_EMAIL_PREFS = Object.freeze({
  news: false,
});

const PUSH_KEYS = Object.keys(DEFAULT_PUSH_PREFS);
const EMAIL_KEYS = Object.keys(DEFAULT_EMAIL_PREFS);

/** Kinds locaux / push → clé push (null = toujours autorisé si master on). */
const KIND_TO_PUSH_KEY = Object.freeze({
  session_reminder: "session",
  streak_protect: "streak",
  comeback: "streak",
  comeback_long: "streak",
  badge: "badges",
  buddy: "buddy",
  support: "support",
  newsletter_nudge: "news",
  review_ask: "product_tips",
  soft_premium: null,
  checkout_abandon: null,
});

function asBool(v, fallback) {
  if (v === true || v === false) return v;
  return fallback;
}

/**
 * @param {Record<string, unknown>|null|undefined} meta
 * @returns {{ push: Record<string, boolean>, email: Record<string, boolean> }}
 */
export function parseNotificationPrefs(meta) {
  const raw = meta && typeof meta === "object" ? meta[NOTIFICATION_PREFS_KEY] : null;
  const pushRaw = raw && typeof raw === "object" ? raw.push : null;
  const emailRaw = raw && typeof raw === "object" ? raw.email : null;

  const push = { ...DEFAULT_PUSH_PREFS };
  for (const key of PUSH_KEYS) {
    if (pushRaw && typeof pushRaw === "object" && key in pushRaw) {
      push[key] = asBool(pushRaw[key], DEFAULT_PUSH_PREFS[key]);
    }
  }

  const email = { ...DEFAULT_EMAIL_PREFS };
  for (const key of EMAIL_KEYS) {
    if (emailRaw && typeof emailRaw === "object" && key in emailRaw) {
      email[key] = asBool(emailRaw[key], DEFAULT_EMAIL_PREFS[key]);
    }
  }

  // Source de vérité historique newsletter → email.news si jamais écrit dans prefs.
  if (!(emailRaw && typeof emailRaw === "object" && "news" in emailRaw)) {
    email.news = meta?.[NEWSLETTER_META_KEY] === true;
  }

  return { push, email };
}

export function notificationPrefsFromUser(user) {
  return parseNotificationPrefs(user?.user_metadata || null);
}

export function isPushPrefOn(prefs, key) {
  if (!key || !(key in DEFAULT_PUSH_PREFS)) return true;
  return prefs?.push?.[key] !== false;
}

export function isEmailPrefOn(prefs, key) {
  if (!key || !(key in DEFAULT_EMAIL_PREFS)) return false;
  return prefs?.email?.[key] === true;
}

/** Filtre une notif locale planifiée selon les prefs. */
export function localNotifAllowed(item, prefs) {
  const kind = String(item?.extra?.kind || "").toLowerCase();
  if (!kind) return true;
  if (!(kind in KIND_TO_PUSH_KEY)) return true;
  const key = KIND_TO_PUSH_KEY[kind];
  if (key == null) return true;
  return isPushPrefOn(prefs, key);
}

export function filterLocalNotificationsByPrefs(items, prefs) {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => localNotifAllowed(item, prefs));
}

/**
 * Merge partiel et persist.
 * @param {{ push?: Record<string, boolean>, email?: Record<string, boolean> }} patch
 */
export async function updateNotificationPrefs(patch = {}) {
  const { supabase } = await import("../supabase.js");
  const { data: sessionData, error: sessionErr } = await supabase.auth.getUser();
  if (sessionErr || !sessionData?.user) {
    return { user: null, prefs: null, error: sessionErr || new Error("SESSION") };
  }
  const user = sessionData.user;
  const current = parseNotificationPrefs(user.user_metadata);
  const next = {
    push: { ...current.push, ...(patch.push || {}) },
    email: { ...current.email, ...(patch.email || {}) },
  };
  for (const key of PUSH_KEYS) next.push[key] = !!next.push[key];
  for (const key of EMAIL_KEYS) next.email[key] = !!next.email[key];

  const dataPayload = {
    [NOTIFICATION_PREFS_KEY]: next,
  };
  if (patch.email && Object.prototype.hasOwnProperty.call(patch.email, "news")) {
    dataPayload[NEWSLETTER_META_KEY] = !!next.email.news;
  }

  const { data, error } = await supabase.auth.updateUser({ data: dataPayload });
  if (error) return { user: null, prefs: next, error };

  const updated = data?.user || null;
  if (patch.email && Object.prototype.hasOwnProperty.call(patch.email, "news") && next.email.news && updated?.id) {
    // Aligné setNewsletterOptIn : clear nudge locale.
    try {
      const { clearNewsletterNudgeAnchor } = await import("./newsletter-opt-in.js");
      clearNewsletterNudgeAnchor(updated.id);
    } catch { /* ignore */ }
  }
  return { user: updated, prefs: parseNotificationPrefs(updated?.user_metadata), error: null };
}

/** Toggle une clé push. */
export async function setPushPref(key, enabled) {
  if (!PUSH_KEYS.includes(key)) {
    return { user: null, prefs: null, error: new Error("bad_key") };
  }
  return updateNotificationPrefs({ push: { [key]: !!enabled } });
}

/**
 * Toggle email.news via le même chemin que l’ancien switch Mes données
 * (newsletter_opt_in + sync notification_prefs).
 */
export async function setEmailNewsPref(enabled) {
  const on = !!enabled;
  const { setNewsletterOptIn } = await import("./newsletter-opt-in.js");
  const result = await setNewsletterOptIn(on);
  if (result.error) return { user: null, prefs: null, error: result.error };
  return {
    user: result.user,
    prefs: parseNotificationPrefs(result.user?.user_metadata),
    error: null,
  };
}
