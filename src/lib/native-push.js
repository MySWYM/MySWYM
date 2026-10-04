/**
 * Push APNs (Capacitor) : enregistrement jeton + invoke buddy/support.
 * No-op hors iOS natif.
 *
 * Le « token » = adresse Apple de cet iPhone. Sans ligne dans device_push_tokens,
 * le serveur ne peut pas envoyer bannière / pastille.
 */
import { registerPlugin } from "@capacitor/core";
import { supabase } from "../supabase.js";
import { isNativeIos, nativeApiOrigin } from "./native-platform.js";
import { ensureIosNotificationPermission, getLocalNotificationPermission } from "./native-local-notifications.js";
import { buddyConnectionId } from "./buddy-connection-id.js";

export { buddyConnectionId };

const BUNDLE_ID = "app.myswym.ios";
const PUSH_PREF_KEY = "myswym_push_enabled";
/** 1ʳᵉ séance validée sur cet iPhone (local) : déclenche le popup Apple. */
const IOS_FIRST_SESSION_KEY_PREFIX = "myswym_ios_first_session_";

export function iosFirstSessionKey(userId) {
  return `${IOS_FIRST_SESSION_KEY_PREFIX}${userId || "anon"}`;
}

/** true si une séance a déjà été validée dans l’app iPhone (pas le web). */
export function hasCompletedFirstIosSession(userId) {
  try {
    return localStorage.getItem(iosFirstSessionKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function markFirstIosSessionCompleted(userId) {
  try {
    localStorage.setItem(iosFirstSessionKey(userId), "1");
  } catch { /* ignore */ }
}

/** false seulement si l’utilisateur a coupé le switch dans MySWYM. */
export function pushNotificationsWanted() {
  try {
    return localStorage.getItem(PUSH_PREF_KEY) !== "0";
  } catch {
    return true;
  }
}

function writePushPref(on) {
  try {
    localStorage.setItem(PUSH_PREF_KEY, on ? "1" : "0");
  } catch { /* ignore */ }
}

function dispatchPushPref() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("myswym:push-pref"));
  }
}

function raceTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

const AppBadge = registerPlugin("AppBadge");

/**
 * Lecture native UNUserNotificationCenter (même vérité que Réglages iPhone).
 * @returns {Promise<"granted"|"denied"|"prompt"|null>}
 */
async function readNativeAuthStatus() {
  if (!isNativeIos()) return null;
  try {
    const res = await raceTimeout(AppBadge.getNotificationAuthStatus(), 2000, null);
    const s = res?.status;
    if (s === "granted" || s === "denied" || s === "prompt") return s;
    return null;
  } catch {
    return null;
  }
}

/**
 * Permission iOS (Réglages → MySWYM → Notifications).
 * Priorité : plugin natif AppBadge, puis Capacitor en secours.
 */
async function readOsPermissionFast() {
  const native = await readNativeAuthStatus();
  if (native === "granted" || native === "denied" || native === "prompt") {
    return native;
  }

  let local = null;
  let pushReceive = null;
  try {
    local = await raceTimeout(getLocalNotificationPermission(), 1200, null);
  } catch {
    local = null;
  }
  try {
    const PushNotifications = await getPushPlugin();
    if (PushNotifications) {
      const perm = await raceTimeout(PushNotifications.checkPermissions(), 1200, null);
      pushReceive = perm?.receive ?? null;
    }
  } catch {
    pushReceive = null;
  }

  if (local === "denied" || pushReceive === "denied") return "denied";
  if (local === "granted" || pushReceive === "granted") return "granted";
  return "prompt";
}

/**
 * État d’activation pour l’UI.
 * Source de vérité : permission iOS d’abord, puis opt-in MySWYM.
 * `active` = alertes réellement livrables (OS granted + opt-in).
 * @returns {Promise<{ os: "granted"|"denied"|"prompt", wanted: boolean, active: boolean }>}
 */
export async function getNotificationActivationState() {
  const os = await raceTimeout(readOsPermissionFast(), 2800, "prompt");
  const wanted = pushNotificationsWanted();
  const osNorm = os === "granted" || os === "denied" ? os : "prompt";
  return {
    os: osNorm,
    wanted,
    active: wanted && osNorm === "granted",
  };
}
let listenersReady = false;
let registerInFlight = null;
/** Jeton reçu avant session auth (boot AppDelegate). */
let pendingToken = null;

function normalizeToken(token) {
  return String(token || "").replace(/\s+/g, "").toLowerCase();
}

async function getPushPlugin() {
  if (!isNativeIos()) return null;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    return PushNotifications;
  } catch {
    return null;
  }
}

async function readCachedNativeToken() {
  if (!isNativeIos()) return null;
  try {
    await AppBadge.replayApnsToken?.();
  } catch { /* ignore */ }
  try {
    const res = await AppBadge.getApnsToken();
    const t = normalizeToken(res?.token);
    return t.length >= 64 ? t : null;
  } catch {
    return null;
  }
}

/** Upsert via API (service role serveur) : ne dépend pas du RLS client. */
async function upsertTokenViaApi(token) {
  const clean = normalizeToken(token);
  if (!clean || clean.length < 64) return { ok: false, reason: "bad_token" };
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    pendingToken = clean;
    return { ok: false, reason: "no_session" };
  }
  try {
    const origin = nativeApiOrigin();
    const res = await fetch(`${origin}/api/push/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        event: "register_token",
        token: clean,
        appBundle: BUNDLE_ID,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.ok) {
      console.warn("[push] register_token api", res.status, json?.error);
      pendingToken = clean;
      return { ok: false, reason: json?.error || `http_${res.status}` };
    }
    pendingToken = null;
    return { ok: true };
  } catch (e) {
    console.warn("[push] register_token fetch", e);
    pendingToken = clean;
    return { ok: false, reason: e?.message || "fetch_failed" };
  }
}

async function upsertDeviceToken(token) {
  const clean = normalizeToken(token);
  if (!clean || clean.length < 64) return { ok: false, reason: "bad_token" };

  // 1) API serveur (fiable)
  const viaApi = await upsertTokenViaApi(clean);
  if (viaApi.ok) return viaApi;

  // 2) Fallback direct Supabase (RLS user)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    pendingToken = clean;
    return { ok: false, reason: "no_session" };
  }
  const now = new Date().toISOString();
  const { error } = await supabase.from("device_push_tokens").upsert(
    {
      user_id: session.user.id,
      token: clean,
      platform: "ios",
      app_bundle: BUNDLE_ID,
      updated_at: now,
    },
    { onConflict: "user_id,token" },
  );
  if (error) {
    console.warn("[push] upsert device_push_tokens", error.message || error);
    pendingToken = clean;
    return { ok: false, reason: error.message || "upsert_failed" };
  }
  pendingToken = null;
  return { ok: true };
}

/** Si un jeton était en attente (boot avant login), l’écrit maintenant. */
export async function flushPendingPushToken() {
  if (!isNativeIos()) return { ok: false, reason: "none" };
  const cached = await readCachedNativeToken();
  if (cached) pendingToken = cached;
  if (!pendingToken) return { ok: false, reason: "none" };
  return upsertDeviceToken(pendingToken);
}

function dispatchFromPushData(raw) {
  const data = raw && typeof raw === "object" ? raw : {};
  const kind = String(data.kind || data.Kind || "").toLowerCase();
  if (kind === "buddy") {
    window.dispatchEvent(new CustomEvent("myswym:open-tab", { detail: { tab: "buddies" } }));
    return;
  }
  if (kind === "support") {
    window.dispatchEvent(new CustomEvent("myswym:open-support", {
      detail: { tab: "messages", view: "thread" },
    }));
  }
}

async function ensureListeners(PushNotifications) {
  if (listenersReady) return;
  listenersReady = true;
  await PushNotifications.addListener("registration", (ev) => {
    void upsertDeviceToken(ev?.value);
  });
  await PushNotifications.addListener("registrationError", (err) => {
    console.warn("[push] registrationError", err);
  });
  await PushNotifications.addListener("pushNotificationActionPerformed", (ev) => {
    void import("./native-app-badge.js").then((m) => m.clearAppIconBadge()).catch(() => {});
    dispatchFromPushData(ev?.notification?.data);
  });
  await PushNotifications.addListener("pushNotificationReceived", () => {
    void import("./native-app-badge.js").then((m) => m.clearAppIconBadge()).catch(() => {});
  });
}

/** true si iOS a autorisé et que MySWYM n’a pas opt-out. */
export async function notificationsSwitchOn() {
  const state = await getNotificationActivationState();
  return state.active;
}

/** Retire ce téléphone de la liste d’envoi (push global + rappels locaux). */
export async function disableNativeNotifications() {
  writePushPref(false);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (uid) {
      await supabase.from("device_push_tokens").delete().eq("user_id", uid);
    }
  } catch (e) {
    console.warn("[push] disable", e);
  }
  try {
    const { cancelMySwymLocalNotifications } = await import("./native-local-notifications.js");
    await cancelMySwymLocalNotifications();
  } catch { /* ignore */ }
  dispatchPushPref();
  return { ok: true, enabled: false };
}

/**
 * Active les notifs MySWYM.
 * Ne revendique jamais "activé" si iOS n’a pas granted (aligné Réglages).
 * Si iOS = Non : retourne denied tout de suite (pas de hang requestPermissions).
 */
export async function enableNativeNotifications() {
  const osBefore = await raceTimeout(readOsPermissionFast(), 2200, "prompt");

  if (osBefore === "denied") {
    writePushPref(false);
    dispatchPushPref();
    return { ok: false, enabled: false, reason: "denied", os: "denied" };
  }

  if (osBefore === "granted") {
    writePushPref(true);
    dispatchPushPref();
    void registerNativePush({ request: false }).catch((e) => {
      console.warn("[push] register after os-granted", e);
    });
    return { ok: true, enabled: true, os: "granted" };
  }

  // notDetermined seulement : popup système (court timeout, pas 12s).
  const asked = await raceTimeout(ensureIosNotificationPermission(), 4500, null);
  const osAfter = await raceTimeout(readOsPermissionFast(), 2000, null);
  const os = osAfter === "granted" || osAfter === "denied"
    ? osAfter
    : (asked === "granted" || asked === "denied" ? asked : "denied");

  // Après une tentative, "prompt" opaque = souvent déjà refusé côté iOS.
  if (os !== "granted") {
    writePushPref(false);
    dispatchPushPref();
    return { ok: false, enabled: false, reason: "denied", os: "denied" };
  }

  writePushPref(true);
  dispatchPushPref();
  void registerNativePush({ request: false }).catch(() => {});
  return { ok: true, enabled: true, os: "granted" };
}

/** Ouvre Réglages iPhone → page MySWYM (après un refus de notifications). */
export async function openNativeAppSettings() {
  if (!isNativeIos()) return { ok: false, reason: "not_ios" };
  try {
    await AppBadge.openAppSettings();
    return { ok: true };
  } catch (e) {
    console.warn("[push] openAppSettings", e);
    return { ok: false, reason: e?.message || "open_failed" };
  }
}

export async function registerNativePush({ request = false } = {}) {
  if (!isNativeIos()) return { ok: false, reason: "not_ios" };
  if (!request && !pushNotificationsWanted()) return { ok: false, reason: "opt_out" };
  if (registerInFlight) return registerInFlight;

  registerInFlight = (async () => {
    const PushNotifications = await getPushPlugin();
    if (!PushNotifications) return { ok: false, reason: "no_plugin" };

    try {
      const local = request
        ? await ensureIosNotificationPermission()
        : await getLocalNotificationPermission();
      if (local !== "granted") {
        return { ok: false, reason: local === "prompt" ? "not_asked" : "denied" };
      }
      await ensureListeners(PushNotifications);
      let perm = await PushNotifications.checkPermissions();
      const receive = perm?.receive;
      if (receive !== "granted") {
        if (!request) return { ok: false, reason: "not_asked" };
        if (receive === "prompt" || receive === "prompt-with-rationale" || !receive) {
          perm = await PushNotifications.requestPermissions();
        }
      }
      if (perm?.receive !== "granted") {
        return { ok: false, reason: "denied" };
      }
      await PushNotifications.register();
      // Rejoue le cache natif (jeton souvent arrivé au boot avant les listeners JS).
      try { await AppBadge.replayApnsToken(); } catch { /* ignore */ }

      // Boucle courte : le CTA UI ne doit jamais dépendre d’un jeton long à venir.
      for (const waitMs of [0, 600, 1500]) {
        if (waitMs) await new Promise((r) => setTimeout(r, waitMs));
        const cached = await readCachedNativeToken();
        if (cached) {
          const saved = await upsertDeviceToken(cached);
          if (saved.ok) return { ok: true, via: "cache" };
        }
        try { await PushNotifications.register(); } catch { /* ignore */ }
      }
      void flushPendingPushToken();
      return { ok: true, soft: true };
    } catch (e) {
      console.warn("[push] register", e);
      return { ok: false, reason: e?.message || "register_failed" };
    } finally {
      registerInFlight = null;
    }
  })();

  return registerInFlight;
}

/**
 * Fire-and-forget vers POST /api/push/notify (buddy_request / buddy_accepted).
 */
export async function notifyBuddyPushEvent({ event, connectionId }) {
  const id = buddyConnectionId(connectionId);
  if (!id || (event !== "buddy_request" && event !== "buddy_accepted")) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const origin = isNativeIos() ? nativeApiOrigin() : "";
    const url = `${origin}/api/push/notify`;
    void fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ event, connectionId: id }),
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
