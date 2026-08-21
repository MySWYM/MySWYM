/**
 * Version Gate runtime — fetch serveur + hard reload sans toucher aux données.
 */
import {
  CURRENT_APP_VERSION,
  evaluateVersionGate,
} from "./app-version.js";

export const APP_VERSION_ENDPOINT = "/api/app-version";

/** Clé session uniquement pour éviter un spam de reloads (pas une source de vérité). */
const RELOAD_GUARD_KEY = "myswym_vg_reload_at";

/**
 * @param {{ fetchImpl?: typeof fetch, endpoint?: string }} [opts]
 */
export async function fetchMinSupportedVersion(opts = {}) {
  const fetchImpl = opts.fetchImpl || fetch;
  const endpoint = opts.endpoint || APP_VERSION_ENDPOINT;
  const url = `${endpoint}?t=${Date.now()}`;
  const res = await fetchImpl(url, {
    method: "GET",
    cache: "no-store",
    signal: opts.signal || AbortSignal.timeout(4000),
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
  if (!res.ok) {
    throw new Error(`app-version HTTP ${res.status}`);
  }
  const data = await res.json();
  return {
    minSupportedAppVersion: data.minSupportedAppVersion,
    latestAppVersion: data.latestAppVersion ?? null,
    message: data.message ?? null,
  };
}

/**
 * Vérifie la compatibilité. Fail-open si le réseau / API échoue.
 */
export async function checkVersionGate(opts = {}) {
  const clientVersion = opts.clientVersion || CURRENT_APP_VERSION;
  try {
    const remote = await fetchMinSupportedVersion(opts);
    return {
      ...evaluateVersionGate({
        clientVersion,
        minSupportedAppVersion: remote.minSupportedAppVersion,
        latestAppVersion: remote.latestAppVersion,
      }),
      message: remote.message,
      source: "server",
    };
  } catch (err) {
    // Fail-open : panne API ≠ bloquer tous les utilisateurs.
    return {
      status: "ok",
      reason: "network_fail_open",
      clientVersion,
      minSupportedAppVersion: null,
      latestAppVersion: null,
      mustUpdate: false,
      message: null,
      source: "fail_open",
      error: String(err?.message || err),
    };
  }
}

/**
 * Hard reload vers le nouveau bundle.
 * - Ne touche PAS localStorage (plans, auth, préférences).
 * - Ne déconnecte PAS.
 * - Bust cache navigateur via query + caches API si présente.
 */
export async function forceAppUpdateReload(opts = {}) {
  const loc = opts.location || (typeof window !== "undefined" ? window.location : null);
  if (!loc) return { ok: false, reason: "no_location" };

  // Garde anti-boucle (session only)
  try {
    const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
    if (Date.now() - last < 4000) {
      return { ok: false, reason: "reload_throttle" };
    }
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }

  if (typeof caches !== "undefined" && caches?.keys) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {
      /* pas de SW / caches — OK */
    }
  }

  const url = new URL(loc.href);
  url.searchParams.set("__myswym_update", String(Date.now()));
  // Remplace l’historique pour éviter un back vers l’ancien shell
  if (typeof loc.replace === "function") {
    loc.replace(url.toString());
  } else {
    loc.href = url.toString();
  }
  return { ok: true, reason: "reloading" };
}

/**
 * Après reload : si le query param update est présent et qu’on est OK, nettoyer l’URL
 * sans recharger (replaceState). Ne touche pas aux données.
 */
export function cleanupUpdateQueryParam(opts = {}) {
  const win = opts.window || (typeof window !== "undefined" ? window : null);
  if (!win?.location || !win.history?.replaceState) return false;
  const url = new URL(win.location.href);
  if (!url.searchParams.has("__myswym_update")) return false;
  url.searchParams.delete("__myswym_update");
  const next = url.pathname + (url.search || "") + url.hash;
  win.history.replaceState(win.history.state, "", next);
  return true;
}
