/**
 * Détection Capacitor + réécriture des appels `/api` vers le site live.
 * Dans le .ipa le JS n’est plus servi par Vercel : un fetch relatif
 * irait sur localhost et casserait version-gate, sheet Soft, support.
 */
import { Capacitor } from "@capacitor/core";
import { isAppPath } from "../i18n/locale-path.js";

export const DEFAULT_NATIVE_API_ORIGIN = "https://www.myswym.app";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

let nativeOverride = null;

/** @param {boolean | null} value */
export function setNativePlatformForTests(value) {
  nativeOverride = value;
}

export function nativeApiOrigin() {
  const fromEnv =
    typeof import.meta !== "undefined" && import.meta.env?.VITE_NATIVE_API_ORIGIN;
  const raw = String(fromEnv || DEFAULT_NATIVE_API_ORIGIN).replace(/\/$/, "");
  return raw || DEFAULT_NATIVE_API_ORIGIN;
}

export function isNativeApp() {
  if (nativeOverride != null) return nativeOverride;
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function isNativeIos() {
  if (!isNativeApp()) return false;
  try {
    return Capacitor.getPlatform() === "ios";
  } catch {
    return false;
  }
}

export function isNativeMarketingHome(pathname = "/") {
  const p = String(pathname || "/").replace(/\/+$/, "") || "/";
  return p === "/" || p === "/fr";
}

/** Pages publiques : pas dans le WebView iOS (Safari). */
export function isNativeKeptPublicPath(_pathname = "/") {
  return false;
}

/** Landing, blog, tarifs, légal, contact, FAQ : hors app iOS. */
export function isNativeMarketingPath(pathname = "/") {
  if (isAppPath(pathname)) return false;
  return true;
}

/**
 * @param {string} value
 * @param {string} [origin]
 */
export function rewriteNativeApiUrl(value, origin = nativeApiOrigin()) {
  if (typeof value !== "string" || !value) return value;
  if (value.startsWith("/api/") || value === "/api" || value.startsWith("/api?")) {
    return `${origin}${value}`;
  }
  try {
    const u = new URL(value);
    const local =
      LOCAL_HOSTS.has(u.hostname) ||
      u.protocol === "capacitor:" ||
      u.protocol === "ionic:";
    if (local && (u.pathname === "/api" || u.pathname.startsWith("/api/"))) {
      return `${origin}${u.pathname}${u.search}${u.hash}`;
    }
  } catch {
    return value;
  }
  return value;
}

/**
 * @param {RequestInfo | URL} input
 * @param {string} [origin]
 */
export function rewriteNativeApiInput(input, origin = nativeApiOrigin()) {
  if (typeof input === "string") return rewriteNativeApiUrl(input, origin);
  if (typeof URL !== "undefined" && input instanceof URL) {
    return new URL(rewriteNativeApiUrl(input.href, origin));
  }
  if (typeof Request !== "undefined" && input instanceof Request) {
    const url = rewriteNativeApiUrl(input.url, origin);
    if (url === input.url) return input;
    return new Request(url, input);
  }
  return input;
}

export function installNativeApiFetch() {
  if (typeof window === "undefined") return false;
  if (window.__myswymNativeFetch) return true;
  if (!isNativeApp()) return false;
  window.__myswymNativeFetch = true;
  const orig = window.fetch.bind(window);
  window.fetch = (input, init) => orig(rewriteNativeApiInput(input), init);
  return true;
}

/**
 * Appel HTTP natif (évite CORS WKWebView si CapacitorHttp n’a pas patché fetch).
 * @param {string} url
 * @param {{ method?: string, headers?: Record<string, string>, body?: string }} [init]
 */
export async function nativePluginRequest(url, init = {}) {
  const abs = rewriteNativeApiUrl(url);
  const method = String(init.method || "GET").toUpperCase();
  let data;
  if (init.body != null && init.body !== "") {
    try {
      data = JSON.parse(init.body);
    } catch {
      data = init.body;
    }
  }
  try {
    const { registerPlugin } = await import("@capacitor/core");
    const Http = registerPlugin("CapacitorHttp");
    const res = await Http.request({
      url: abs,
      method,
      headers: init.headers || {},
      data,
    });
    const status = Number(res?.status || 0);
    const payload = res?.data;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => {
        if (typeof payload === "string") {
          try {
            return JSON.parse(payload);
          } catch {
            return {};
          }
        }
        return payload ?? {};
      },
    };
  } catch {
    const res = await fetch(abs, init);
    return {
      ok: res.ok,
      status: res.status,
      json: async () => res.json().catch(() => ({})),
    };
  }
}

/** Ferme le clavier iOS (tap hors champ, Done, fin de saisie). */
export function hideNativeKeyboard() {
  try {
    const el = typeof document !== "undefined" ? document.activeElement : null;
    if (el && typeof el.blur === "function") el.blur();
  } catch {
    /* ignore */
  }
  if (!isNativeApp()) return;
  void import("@capacitor/keyboard")
    .then(({ Keyboard }) => Keyboard.hide())
    .catch(() => {});
}
