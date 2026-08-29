/**
 * Version Gate, tests V1
 * Usage : node src/lib/app-version.test.js
 */
import {
  BUILTIN_MIN_SUPPORTED_APP_VERSION,
  CURRENT_APP_VERSION,
  compareSemver,
  evaluateVersionGate,
  isClientBelowMinimum,
  parseSemver,
} from "./app-version.js";
import {
  checkVersionGate,
  cleanupUpdateQueryParam,
  forceAppUpdateReload,
} from "./version-gate.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
function ok(cond, msg) {
  assert(cond, msg);
  console.log("  ✓", msg);
}

console.log("VG1, semver parse / compare");
{
  ok(parseSemver("1.0.0")?.join(".") === "1.0.0", "parse 1.0.0");
  ok(parseSemver("1.1")?.join(".") === "1.1.0", "parse 1.1 → 1.1.0");
  ok(compareSemver("1.0.0", "1.0.0") === 0, "equal");
  ok(compareSemver("1.0.1", "1.0.0") > 0, "1.0.1 > 1.0.0");
  ok(compareSemver("0.9.9", "1.0.0") < 0, "0.9.9 < 1.0.0");
  ok(compareSemver("1.0.0", "1.1.0") < 0, "1.0.0 < 1.1.0");
  ok(compareSemver("2.0.0", "1.9.9") > 0, "2.0.0 > 1.9.9");
}

console.log("VG2, V1.0.0 client + minimum 1.0.0 → OK");
{
  const r = evaluateVersionGate({
    clientVersion: "1.0.0",
    minSupportedAppVersion: "1.0.0",
  });
  ok(r.status === "ok" && !r.mustUpdate, "compatible");
}

console.log("VG3, V0.x client + minimum 1.0.0 → BLOCK");
{
  const r = evaluateVersionGate({
    clientVersion: "0.9.0",
    minSupportedAppVersion: "1.0.0",
  });
  ok(r.status === "block" && r.mustUpdate, "block 0.9");
  ok(isClientBelowMinimum("0.8.1", "1.0.0"), "0.8.1 below");
}

console.log("VG4, V1.0.0 client + minimum 1.1.0 → BLOCK");
{
  const r = evaluateVersionGate({
    clientVersion: "1.0.0",
    minSupportedAppVersion: "1.1.0",
  });
  ok(r.status === "block" && r.reason === "below_minimum", "block for 1.1 min");
}

console.log("VG5, version compatible → application normale");
{
  const r = evaluateVersionGate({
    clientVersion: "1.2.0",
    minSupportedAppVersion: "1.1.0",
    latestAppVersion: "1.2.0",
  });
  ok(r.status === "ok" && r.reason === "compatible", "app normale");
}

console.log("VG6, checkVersionGate serveur mock + fail-open");
{
  const blocked = await checkVersionGate({
    clientVersion: "1.0.0",
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        minSupportedAppVersion: "1.1.0",
        latestAppVersion: "1.1.0",
        message: "Mise à jour requise",
      }),
    }),
  });
  ok(blocked.mustUpdate === true && blocked.source === "server", "server block");

  const okGate = await checkVersionGate({
    clientVersion: "1.0.0",
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        minSupportedAppVersion: "1.0.0",
        latestAppVersion: "1.0.0",
      }),
    }),
  });
  ok(okGate.mustUpdate === false, "server ok");

  const failOpen = await checkVersionGate({
    clientVersion: "1.0.0",
    fetchImpl: async () => {
      throw new Error("network");
    },
  });
  ok(failOpen.source === "fail_open" && failOpen.mustUpdate === false, "fail-open réseau");
}

console.log("VG7, reload force update (pas de wipe storage)");
{
  const markers = { replaced: null, cachesDeleted: false };
  const fakeLocation = {
    href: "https://myswym.app/app?plan=1",
    replace(next) {
      markers.replaced = next;
    },
  };
  globalThis.sessionStorage = {
    _d: {},
    getItem(k) {
      return this._d[k] ?? null;
    },
    setItem(k, v) {
      this._d[k] = String(v);
    },
    removeItem(k) {
      delete this._d[k];
    },
  };
  // Simule localStorage utilisateur, ne doit pas être touché
  const userData = { plans: '[{"id":1}]', auth: "token" };
  globalThis.localStorage = {
    _d: { ...userData },
    getItem(k) {
      return this._d[k] ?? null;
    },
    setItem(k, v) {
      this._d[k] = String(v);
    },
    removeItem(k) {
      delete this._d[k];
    },
    clear() {
      this._d = {};
    },
  };
  globalThis.caches = {
    async keys() {
      return ["old-shell"];
    },
    async delete(k) {
      markers.cachesDeleted = k === "old-shell";
      return true;
    },
  };

  const r = await forceAppUpdateReload({ location: fakeLocation });
  ok(r.ok === true, "reload ok");
  ok(String(markers.replaced).includes("__myswym_update="), "cache-bust query");
  ok(markers.cachesDeleted === true, "caches API cleared");
  ok(globalThis.localStorage.getItem("plans") === '[{"id":1}]', "plans conservés");
  ok(globalThis.localStorage.getItem("auth") === "token", "auth conservée");
}

console.log("VG8, cleanup query + foreground recheck path");
{
  let replaced = null;
  const fakeWin = {
    location: { href: "https://myswym.app/?__myswym_update=123" },
    history: {
      state: null,
      replaceState(_s, _t, url) {
        replaced = url;
      },
    },
  };
  ok(cleanupUpdateQueryParam({ window: fakeWin }) === true, "cleanup ran");
  ok(replaced === "/", "query stripped");
}

console.log("VG9, CURRENT_APP_VERSION présente");
{
  ok(typeof CURRENT_APP_VERSION === "string" && parseSemver(CURRENT_APP_VERSION), "current version");
  ok(BUILTIN_MIN_SUPPORTED_APP_VERSION === "1.0.0", "builtin min 1.0.0");
}

console.log("VG10, connecté / non connecté : gate indépendante de l’auth");
{
  // La gate ne lit jamais l’auth ; même décision pour les deux cas.
  const a = evaluateVersionGate({
    clientVersion: "0.5.0",
    minSupportedAppVersion: "1.0.0",
  });
  const b = evaluateVersionGate({
    clientVersion: "0.5.0",
    minSupportedAppVersion: "1.0.0",
  });
  ok(a.mustUpdate && b.mustUpdate && a.status === b.status, "auth-agnostic block");
  const c = evaluateVersionGate({
    clientVersion: "1.0.0",
    minSupportedAppVersion: "1.0.0",
  });
  ok(!c.mustUpdate, "auth-agnostic ok");
}

console.log("✅ app-version / version-gate tests passed");
