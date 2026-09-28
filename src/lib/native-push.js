/**
 * Push APNs (Capacitor) : enregistrement jeton + invoke buddy/support.
 * No-op hors iOS natif.
 */
import { supabase } from "../supabase.js";
import { isNativeIos, nativeApiOrigin } from "./native-platform.js";
import { buddyConnectionId } from "./buddy-connection-id.js";

export { buddyConnectionId };

const BUNDLE_ID = "app.myswym.ios";
let listenersReady = false;
let registerInFlight = null;

async function getPushPlugin() {
  if (!isNativeIos()) return null;
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    return PushNotifications;
  } catch {
    return null;
  }
}

async function upsertDeviceToken(token) {
  const clean = String(token || "").replace(/\s+/g, "");
  if (!clean || clean.length < 32) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return;
  const now = new Date().toISOString();
  await supabase.from("device_push_tokens").upsert(
    {
      user_id: session.user.id,
      token: clean,
      platform: "ios",
      app_bundle: BUNDLE_ID,
      updated_at: now,
    },
    { onConflict: "user_id,token" },
  );
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
    if (import.meta.env?.DEV) console.warn("[push] registrationError", err);
  });
  await PushNotifications.addListener("pushNotificationActionPerformed", (ev) => {
    dispatchFromPushData(ev?.notification?.data);
  });
  await PushNotifications.addListener("pushNotificationReceived", () => {
    /* foreground : la cloche in-app suffit ; pas de double toast */
  });
}

/**
 * Demande permission + enregistre le device auprès d’APNs, upsert le jeton.
 */
export async function registerNativePush() {
  if (!isNativeIos()) return { ok: false, reason: "not_ios" };
  if (registerInFlight) return registerInFlight;

  registerInFlight = (async () => {
    const PushNotifications = await getPushPlugin();
    if (!PushNotifications) return { ok: false, reason: "no_plugin" };

    try {
      await ensureListeners(PushNotifications);
      let perm = await PushNotifications.checkPermissions();
      if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
        perm = await PushNotifications.requestPermissions();
      }
      if (perm.receive !== "granted") {
        return { ok: false, reason: "denied" };
      }
      await PushNotifications.register();
      return { ok: true };
    } catch (e) {
      if (import.meta.env?.DEV) console.warn("[push] register", e);
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
