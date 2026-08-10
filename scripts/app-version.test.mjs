/**
 * Smoke test du contrat /api/app-version (sans importer le handler TS).
 * Évite tsx + évite que Vercel typechecke un fichier sous /api.
 *
 * Usage : node scripts/app-version.test.mjs
 */

function asSemverish(value, fallback) {
  if (typeof value !== "string") return fallback;
  const v = value.trim();
  return /^\d+\.\d+(\.\d+)?/.test(v) ? v : fallback;
}

function buildBody(env) {
  return {
    minSupportedAppVersion: asSemverish(env.MIN_SUPPORTED_APP_VERSION, "1.0.0"),
    latestAppVersion: asSemverish(
      env.LATEST_APP_VERSION || env.VITE_APP_VERSION,
      "1.0.0",
    ),
    message:
      env.FORCE_UPDATE_MESSAGE ||
      "Une nouvelle version de MySWYM est disponible.",
  };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const body = buildBody({
  MIN_SUPPORTED_APP_VERSION: "1.1.0",
  LATEST_APP_VERSION: "1.1.0",
  FORCE_UPDATE_MESSAGE: "Update now",
});
assert(body.minSupportedAppVersion === "1.1.0", "min from env");
assert(body.latestAppVersion === "1.1.0", "latest from env");
assert(body.message === "Update now", "message");

const fallback = buildBody({});
assert(fallback.minSupportedAppVersion === "1.0.0", "default min");
assert(fallback.latestAppVersion === "1.0.0", "default latest");

console.log("✅ scripts/app-version.test.mjs OK");
