/**
 * Version Gate, comparaison semver (MAJOR.MINOR.PATCH).
 * CURRENT_APP_VERSION est injectée au build (Vite). La version minimale
 * requise vient du serveur (`/api/app-version`), pas du localStorage.
 */

/** Version du bundle actuellement exécuté (Sports Engine V1 = 1.0.0). */
export const CURRENT_APP_VERSION =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_APP_VERSION) ||
  "1.0.0";

/** Fallback local si l’API est injoignable, ne force jamais au-dessus du client. */
export const BUILTIN_MIN_SUPPORTED_APP_VERSION = "1.0.0";

/**
 * Parse "1.2.3" / "1.2.3-beta" → [1,2,3] (suffixe pré-release ignoré pour la gate).
 * @returns {[number, number, number] | null}
 */
export function parseSemver(version) {
  if (version == null) return null;
  const raw = String(version).trim();
  if (!raw) return null;
  const core = raw.split("-")[0].split("+")[0];
  const parts = core.split(".");
  if (parts.length < 2 || parts.length > 3) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0)) return null;
  while (nums.length < 3) nums.push(0);
  return /** @type {[number, number, number]} */ (nums);
}

/**
 * @returns {number} negative if a < b, 0 if equal, positive if a > b
 */
export function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) {
    throw new Error(`Invalid semver: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
  }
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

/**
 * true si le client est trop ancien pour la version minimale requise.
 */
export function isClientBelowMinimum(clientVersion, minSupportedVersion) {
  try {
    return compareSemver(clientVersion, minSupportedVersion) < 0;
  } catch {
    // Version client illisible → traiter comme incompatible (sécurité).
    return true;
  }
}

/**
 * Décision de gate à partir des payloads serveur + version client.
 * Fail-open si min manquante / invalide côté serveur (ne bloque pas toute l’app).
 */
export function evaluateVersionGate({
  clientVersion = CURRENT_APP_VERSION,
  minSupportedAppVersion,
  latestAppVersion = null,
} = {}) {
  const min = minSupportedAppVersion || BUILTIN_MIN_SUPPORTED_APP_VERSION;
  if (!parseSemver(min)) {
    return {
      status: "ok",
      reason: "invalid_min_fail_open",
      clientVersion,
      minSupportedAppVersion: min,
      latestAppVersion,
      mustUpdate: false,
    };
  }
  if (!parseSemver(clientVersion)) {
    return {
      status: "block",
      reason: "invalid_client",
      clientVersion,
      minSupportedAppVersion: min,
      latestAppVersion,
      mustUpdate: true,
    };
  }
  if (isClientBelowMinimum(clientVersion, min)) {
    return {
      status: "block",
      reason: "below_minimum",
      clientVersion,
      minSupportedAppVersion: min,
      latestAppVersion,
      mustUpdate: true,
    };
  }
  return {
    status: "ok",
    reason: "compatible",
    clientVersion,
    minSupportedAppVersion: min,
    latestAppVersion,
    mustUpdate: false,
  };
}
