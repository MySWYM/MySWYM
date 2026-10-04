/**
 * Appareils connectés (web / iOS) : heartbeat, liste, révocation.
 */
import { supabase } from "../supabase.js";
import { isNativeIos } from "./native-platform.js";
import {
  DEVICE_KEY_STORAGE,
  detectDeviceLabel,
  formatDeviceSeenAt,
  getOrCreateDeviceKey,
} from "./user-devices-meta.js";

export {
  DEVICE_KEY_STORAGE,
  detectDeviceLabel,
  formatDeviceSeenAt,
  getOrCreateDeviceKey,
};

export function detectDevicePlatform() {
  if (isNativeIos()) return "ios";
  return "web";
}

async function callManageDevices(body) {
  const { data: refreshData } = await supabase.auth.refreshSession();
  const session = refreshData?.session;
  if (!session?.access_token) throw new Error("SESSION");

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-devices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "DEVICES_FAIL");
  return json;
}

/** Enregistre / rafraîchit l’appareil courant. */
export async function heartbeatUserDevice() {
  const device_key = getOrCreateDeviceKey();
  const platform = detectDevicePlatform();
  const label = detectDeviceLabel({
    platform,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  });
  const user_agent = typeof navigator !== "undefined" ? String(navigator.userAgent || "").slice(0, 400) : "";
  return callManageDevices({
    action: "heartbeat",
    device_key,
    platform,
    label,
    user_agent,
  });
}

/** Liste des appareils actifs. */
export async function listUserDevices() {
  const device_key = getOrCreateDeviceKey();
  return callManageDevices({ action: "list", device_key });
}

export async function revokeUserDevice(targetDeviceKey) {
  const device_key = getOrCreateDeviceKey();
  return callManageDevices({
    action: "revoke",
    device_key,
    target_device_key: targetDeviceKey,
  });
}

export async function revokeOtherUserDevices() {
  const device_key = getOrCreateDeviceKey();
  return callManageDevices({ action: "revoke_others", device_key });
}

export async function revokeAllUserDevices() {
  const device_key = getOrCreateDeviceKey();
  return callManageDevices({ action: "revoke_all", device_key });
}
