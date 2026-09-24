/**
 * Bridge Capacitor Local Notifications (iOS). No-op sur le web.
 */
import { isNativeIos } from "./native-platform.js";

export const NOTIF_IDS = {
  SESSION: 1001,
  STREAK: 1002,
  COMEBACK: 1003,
  TRIAL_J2: 1004,
  TRIAL_J1: 1005,
  BADGE: 1006,
};

const ALL_IDS = Object.values(NOTIF_IDS);
const PERMISSION_ASKED_KEY = "myswym_local_notif_asked";

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

export async function requestLocalNotificationPermission(userId) {
  markLocalNotificationPermissionAsked(userId);
  const plugin = await getPlugin();
  if (!plugin) return "denied";
  try {
    const { display } = await plugin.requestPermissions();
    return display || "denied";
  } catch {
    return "denied";
  }
}

export async function cancelMySwymLocalNotifications() {
  const plugin = await getPlugin();
  if (!plugin) return;
  try {
    await plugin.cancel({ notifications: ALL_IDS.map((id) => ({ id })) });
  } catch { /* ignore */ }
}

/**
 * @param {Array<{ id: number, title: string, body: string, at: Date, extra?: object }>} items
 */
export async function scheduleLocalNotifications(items = []) {
  const plugin = await getPlugin();
  if (!plugin) return { scheduled: 0 };
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
