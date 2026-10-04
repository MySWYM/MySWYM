/**
 * Helpers purs appareils (sans supabase).
 */

export const DEVICE_KEY_STORAGE = "myswym_device_key_v1";

export function randomDeviceKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

/** Clé stable par navigateur / WebView (localStorage). */
export function getOrCreateDeviceKey(store = typeof localStorage !== "undefined" ? localStorage : null) {
  if (!store) return randomDeviceKey();
  try {
    let key = String(store.getItem(DEVICE_KEY_STORAGE) || "").trim();
    if (key.length >= 8) return key;
    key = randomDeviceKey();
    store.setItem(DEVICE_KEY_STORAGE, key);
    return key;
  } catch {
    return randomDeviceKey();
  }
}

/**
 * Libellé court pour l’UI (iPhone, Safari, Chrome…).
 * @param {{ platform?: string, userAgent?: string } | null} [opts]
 */
export function detectDeviceLabel(opts = {}) {
  const platform = String(opts.platform || "").toLowerCase();
  if (platform === "ios") return "iPhone";
  if (platform === "android") return "Android";

  const ua = String(opts.userAgent || "").trim();
  if (/Edg\//i.test(ua)) return "Edge";
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return "Chrome";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "Safari";
  return "Web";
}

/** Affichage relatif compact : now | 5m | 3h | 2d */
export function formatDeviceSeenAt(iso, now = Date.now()) {
  const t = Date.parse(String(iso || ""));
  if (!Number.isFinite(t)) return "";
  const diff = Math.max(0, now - t);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
