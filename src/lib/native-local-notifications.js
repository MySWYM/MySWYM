/**
 * Bridge Capacitor Local Notifications (iOS). No-op sur le web.
 * L’autorisation système (Réglages → Notifications) est la source de vérité.
 * Chaque notif pose la pastille rouge (badge: 1) sur l’icône.
 */
import { isNativeIos } from "./native-platform.js";

export const NOTIF_IDS = {
  SESSION: 1001,
  STREAK: 1002,
  COMEBACK: 1003,
  TRIAL_J2: 1004,
  TRIAL_J1: 1005,
  BADGE: 1006,
  CHECKOUT_ABANDON: 1007,
  COMEBACK_LONG: 1008,
  REVIEW_ASK: 1009,
  NEWSLETTER: 1010,
};

const ALL_IDS = Object.values(NOTIF_IDS);
const PERMISSION_ASKED_KEY = "myswym_local_notif_asked";
let ensureInFlight = null;
let actionListenersReady = false;

export function permissionAskedKey(userId) {
  return `${PERMISSION_ASKED_KEY}_${userId || "anon"}`;
}

export function hasAskedLocalNotificationPermission(userId) {
  try {
    return localStorage.getItem(permissionAskedKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function markLocalNotificationPermissionAsked(userId) {
  try {
    localStorage.setItem(permissionAskedKey(userId), "1");
  } catch { /* ignore */ }
}

async function getPlugin() {
  if (!isNativeIos()) return null;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    return LocalNotifications;
  } catch {
    return null;
  }
}

function dispatchFromLocalExtra(extra) {
  const data = extra && typeof extra === "object" ? extra : {};
  const kind = String(data.kind || "").toLowerCase();
  if (kind === "buddy") {
    window.dispatchEvent(new CustomEvent("myswym:open-tab", { detail: { tab: "buddies" } }));
    return;
  }
  if (kind === "support") {
    window.dispatchEvent(new CustomEvent("myswym:open-support", {
      detail: { tab: "messages", view: "thread" },
    }));
    return;
  }
  if (kind === "soft_premium" || kind === "checkout_abandon") {
    window.dispatchEvent(new CustomEvent("myswym:open-upgrade", {
      detail: { reason: "trial_required" },
    }));
    return;
  }
  if (kind === "review_ask") {
    window.dispatchEvent(new CustomEvent("myswym:open-app-store-review"));
    return;
  }
  if (kind === "newsletter_nudge") {
    window.dispatchEvent(new CustomEvent("myswym:open-tab", {
      detail: { tab: "profile", panel: "data" },
    }));
    return;
  }
  if (kind === "session_reminder" || kind === "streak_protect" || kind === "comeback" || kind === "comeback_long") {
    window.dispatchEvent(new CustomEvent("myswym:open-tab", { detail: { tab: "plan" } }));
  }
}

async function ensureActionListeners(plugin) {
  if (actionListenersReady || !plugin) return;
  actionListenersReady = true;
  try {
    await plugin.addListener("localNotificationActionPerformed", (ev) => {
      dispatchFromLocalExtra(ev?.notification?.extra);
    });
  } catch { /* ignore */ }
}

export async function getLocalNotificationPermission() {
  const plugin = await getPlugin();
  if (!plugin) return "denied";
  try {
    const { display } = await plugin.checkPermissions();
    return display || "prompt";
  } catch {
    return "denied";
  }
}

/**
 * Demande l’autorisation iOS si pas encore tranchée.
 * Après Autoriser ou Refuser, MySWYM apparaît dans Réglages → Notifications.
 * @returns {Promise<"granted"|"denied"|"prompt">}
 */
export async function ensureIosNotificationPermission(userId) {
  if (!isNativeIos()) return "denied";
  if (ensureInFlight) return ensureInFlight;

  ensureInFlight = (async () => {
    const plugin = await getPlugin();
    if (!plugin) return "denied";

    let status = "prompt";
    try {
      const { display } = await plugin.checkPermissions();
      status = display || "prompt";
    } catch {
      status = "prompt";
    }

    if (status === "granted" || status === "denied") {
      markLocalNotificationPermissionAsked(userId);
      return status;
    }

    try {
      const { display } = await plugin.requestPermissions();
      const next = display || "denied";
      markLocalNotificationPermissionAsked(userId);
      return next;
    } catch {
      return "denied";
    }
  })();

  try {
    return await ensureInFlight;
  } finally {
    ensureInFlight = null;
  }
}

/** @deprecated Prefer ensureIosNotificationPermission */
export async function requestLocalNotificationPermission(userId) {
  return ensureIosNotificationPermission(userId);
}

export async function cancelMySwymLocalNotifications() {
  const plugin = await getPlugin();
  if (!plugin) return;
  try {
    await plugin.cancel({ notifications: ALL_IDS.map((id) => ({ id })) });
  } catch { /* ignore */ }
}

/**
 * @param {Array<{ id: number, title: string, body: string, at: Date, extra?: object, badge?: number }>} items
 */
export async function scheduleLocalNotifications(items = []) {
  const plugin = await getPlugin();
  if (!plugin) return { scheduled: 0 };
  await ensureActionListeners(plugin);
  const now = Date.now();
  const notifications = (items || [])
    .filter((n) => n?.id && n?.title && n?.body && n?.at instanceof Date)
    .filter((n) => n.at.getTime() > now + 5000)
    .map((n) => ({
      id: n.id,
      title: String(n.title).slice(0, 80),
      body: String(n.body).slice(0, 180),
      schedule: { at: n.at, allowWhileIdle: true },
      extra: n.extra || { myswym: true },
      sound: "default",
      badge: Number.isFinite(n.badge) ? Math.max(0, Math.floor(n.badge)) : 1,
    }));
  if (!notifications.length) return { scheduled: 0 };
  try {
    await plugin.schedule({ notifications });
    return { scheduled: notifications.length };
  } catch {
    return { scheduled: 0 };
  }
}

/** Notif immédiate (badge gagné). Min +6s pour passer le filtre schedule. */
export async function notifyBadgeEarned({ title, body }) {
  const plugin = await getPlugin();
  if (!plugin || !title || !body) return;
  const perm = await getLocalNotificationPermission();
  if (perm !== "granted") return;
  await ensureActionListeners(plugin);
  const at = new Date(Date.now() + 6000);
  try {
    await plugin.schedule({
      notifications: [{
        id: NOTIF_IDS.BADGE,
        title: String(title).slice(0, 80),
        body: String(body).slice(0, 180),
        schedule: { at, allowWhileIdle: true },
        extra: { kind: "badge" },
        sound: "default",
        badge: 1,
      }],
    });
  } catch { /* ignore */ }
}

/**
 * Annule puis replanifie. No-op si pas iOS ou permission refusée.
 */
export async function rescheduleMySwymLocalNotifications(planned = []) {
  if (!isNativeIos()) return { scheduled: 0 };
  await cancelMySwymLocalNotifications();
  const perm = await getLocalNotificationPermission();
  if (perm !== "granted") return { scheduled: 0 };
  return scheduleLocalNotifications(planned);
}
