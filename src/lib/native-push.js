/**
 * Push APNs (Capacitor) : enregistrement jeton + invoke buddy/support.
 * No-op hors iOS natif.
 *
 * Le « token » = adresse Apple de cet iPhone. Sans ligne dans device_push_tokens,
 * le serveur ne peut pas envoyer bannière / pastille.
 */
import { AppBadge } from "./native-app-badge.js";
import { supabase } from "../supabase.js";
import { isNativeIos, nativeApiOrigin } from "./native-platform.js";
import { ensureIosNotificationPermission, getLocalNotificationPermission } from "./native-local-notifications.js";
import { buddyConnectionId } from "./buddy-connection-id.js";

export { buddyConnectionId };

const BUNDLE_ID = "app.myswym.ios";
const PUSH_PREF_KEY = "myswym_push_enabled";

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

/**
 * État d’activation pour l’UI (source de vérité = permission iOS + opt-in MySWYM).
 * @returns {Promise<{ os: "granted"|"denied"|"prompt", wanted: boolean, active: boolean }>}
 */
export async function getNotificationActivationState() {
  const os = await getLocalNotificationPermission();
  const wanted = pushNotificationsWanted();
  return {
    os: os === "granted" || os === "denied" ? os : "prompt",
    wanted,
    active: os === "granted" && wanted,
  };
}
let listenersReady = false;
let registerInFlight = null;
/** Jeton reçu avant session auth (boot AppDelegate). */
let pendingToken = null;
/** true entre prepareNativeSignOut et la prochaine session : aucun réenregistrement. */
let suppressTokenUpsert = false;

function normalizeToken(token) {
  return String(token || "").replace(/\s+/g, "").toLowerCase();
}

/**
 * ⚠️ Ne jamais `return` un plugin Capacitor depuis une fonction async : le proxy
 * répond à `.then` → await appelle `Plugin.then()` (« not implemented on ios ») et la
 * promesse reste bloquée pour toujours. On l’emballe dans un objet `{ plugin }`.
 */
async function getPushPlugin() {
  if (!isNativeIos()) return null;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    return { plugin: PushNotifications };
  } catch {
    return null;
  }
}

async function readCachedNativeToken({ replay = true } = {}) {
  if (!isNativeIos()) return null;
  if (replay) {
    try {
      await AppBadge.replayApnsToken?.();
    } catch { /* ignore */ }
  }
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
  // Déconnexion en cours ou switch MySWYM coupé : AppDelegate rejoue le jeton à
  // chaque retour au premier plan, il ne doit pas réinscrire ce téléphone.
  if (suppressTokenUpsert || !pushNotificationsWanted()) {
    return { ok: false, reason: suppressTokenUpsert ? "signing_out" : "opt_out" };
  }
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
  suppressTokenUpsert = false;
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

/** Retire ce téléphone seulement (pas les autres appareils du compte). */
async function deleteThisDevicePushToken() {
  // Pas de replay ici : le replay relance le listener « registration » qui réinscrit le jeton.
  const token = await readCachedNativeToken({ replay: false });
  if (!token) return;
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return;
  const { error } = await supabase
    .from("device_push_tokens")
    .delete()
    .eq("user_id", uid)
    .eq("token", token);
  if (error) console.warn("[push] delete device token", error.message || error);
}

/** Avant signOut : jeton de cet iPhone + rappels locaux. La session doit encore exister. */
export async function prepareNativeSignOut() {
  if (!isNativeIos()) return;
  suppressTokenUpsert = true;
  pendingToken = null;
  // La table peut être absente du cache PostgREST (PGRST205). Ne jamais bloquer la déconnexion.
  await Promise.race([
    deleteThisDevicePushToken().catch((e) => {
      console.warn("[push] sign-out token", e);
    }),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);
  void import("./native-local-notifications.js")
    .then((m) => m.cancelMySwymLocalNotifications())
    .catch(() => {});
}

/** Retire ce téléphone de la liste d’envoi (push global + rappels locaux). */
export async function disableNativeNotifications() {
  writePushPref(false);
  try {
    await deleteThisDevicePushToken();
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
 * Si iOS a déjà autorisé (Réglages), réactive sans popup et sans échouer sur le jeton.
 */
export async function enableNativeNotifications() {
  const osBefore = await getLocalNotificationPermission();
  if (osBefore === "denied") {
    writePushPref(false);
    return { ok: false, enabled: false, reason: "denied" };
  }

  writePushPref(true);

  if (osBefore === "granted") {
    try {
      await registerNativePush({ request: false });
    } catch (e) {
      console.warn("[push] register after os-granted", e);
    }
    dispatchPushPref();
    return { ok: true, enabled: true };
  }

  const res = await registerNativePush({ request: true });
  const osAfter = await getLocalNotificationPermission();
  if (osAfter === "granted") {
    writePushPref(true);
    dispatchPushPref();
    return { ok: true, enabled: true, soft: !res?.ok };
  }

  writePushPref(false);
  dispatchPushPref();
  return {
    ok: false,
    enabled: false,
    reason: osAfter === "denied" ? "denied" : (res?.reason || "denied"),
  };
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
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) suppressTokenUpsert = false;
  if (!request && !pushNotificationsWanted()) return { ok: false, reason: "opt_out" };
  if (registerInFlight) return registerInFlight;

  registerInFlight = (async () => {
    const PushNotifications = (await getPushPlugin())?.plugin;
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

      for (const waitMs of [0, 800, 2000, 4000]) {
        if (waitMs) await new Promise((r) => setTimeout(r, waitMs));
        const cached = await readCachedNativeToken();
        if (cached) {
          const saved = await upsertDeviceToken(cached);
          if (saved.ok) return { ok: true, via: "cache" };
        }
        await PushNotifications.register();
      }
      await flushPendingPushToken();
      return { ok: true };
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
