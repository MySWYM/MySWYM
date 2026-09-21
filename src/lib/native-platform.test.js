/**
 * Run: node src/lib/native-platform.test.js
 */
import {
  DEFAULT_NATIVE_API_ORIGIN,
  ensureNativeAppLocation,
  isNativeKeptPublicPath,
  isNativeMarketingHome,
  isNativeMarketingPath,
  nativeInAppStartUrl,
  rewriteNativeApiInput,
  rewriteNativeApiUrl,
} from "./native-platform.js";
import { languageFromNavigator } from "../i18n/locale-path.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("  ✓", msg);
}

const ORIGIN = DEFAULT_NATIVE_API_ORIGIN;

console.log("native-platform, rewrite /api");
assert(
  rewriteNativeApiUrl("/api/app-version", ORIGIN) === `${ORIGIN}/api/app-version`,
  "relative /api/app-version",
);
assert(
  rewriteNativeApiUrl("/api/contact?kind=app-support", ORIGIN) ===
    `${ORIGIN}/api/contact?kind=app-support`,
  "relative /api with query",
);
assert(rewriteNativeApiUrl("/app", ORIGIN) === "/app", "non-api path untouched");
assert(
  rewriteNativeApiUrl("https://localhost/api/natation-sheet?sheet=01", ORIGIN) ===
    `${ORIGIN}/api/natation-sheet?sheet=01`,
  "localhost /api",
);
assert(
  rewriteNativeApiUrl("capacitor://localhost/api/app-version", ORIGIN) ===
    `${ORIGIN}/api/app-version`,
  "capacitor scheme /api",
);
assert(
  rewriteNativeApiUrl("https://www.myswym.app/api/app-version", ORIGIN) ===
    "https://www.myswym.app/api/app-version",
  "already-absolute production /api untouched",
);

{
  const req = new Request("https://localhost/api/app-version?t=1");
  const out = rewriteNativeApiInput(req, ORIGIN);
  assert(out instanceof Request, "Request stays a Request");
  assert(out.url === `${ORIGIN}/api/app-version?t=1`, "Request.url rewritten");
}

console.log("native-platform, marketing home");
assert(isNativeMarketingHome("/") === true, "/ is marketing home");
assert(isNativeMarketingHome("/fr") === true, "/fr is marketing home");
assert(isNativeMarketingHome("/fr/") === true, "/fr/ is marketing home");
assert(isNativeMarketingHome("/app") === false, "/app is not marketing home");
assert(isNativeMarketingHome("/connexion") === false, "/connexion stays");
assert(isNativeMarketingPath("/tarifs") === true, "/tarifs is marketing");
assert(isNativeMarketingPath("/fr/tarifs") === true, "/fr/tarifs is marketing");
assert(isNativeMarketingPath("/app") === false, "/app is not marketing");
assert(isNativeMarketingPath("/privacy") === true, "legal opens in Safari");
assert(isNativeMarketingPath("/politique-confidentialite") === true, "legal FR opens in Safari");
assert(isNativeMarketingPath("/contact") === true, "contact page is marketing");
assert(isNativeMarketingPath("/faq") === true, "faq is marketing");
assert(isNativeKeptPublicPath("/contact") === false, "contact not kept in WebView");
assert(isNativeKeptPublicPath("/cgu") === false, "cgu not kept in WebView");
assert(isNativeKeptPublicPath("/tarifs") === false, "tarifs not kept");

console.log("native-platform, iOS start path");
assert(nativeInAppStartUrl("/") === "/app", "/ → /app");
assert(nativeInAppStartUrl("/fr") === "/app", "/fr → /app");
assert(nativeInAppStartUrl("/fr", "?ref=1", "#x") === "/app?ref=1#x", "keeps query+hash");
assert(nativeInAppStartUrl("/app") === "", "/app stays");
assert(nativeInAppStartUrl("/connexion") === "", "/connexion stays");
assert(nativeInAppStartUrl("/inscription") === "", "/inscription stays");
{
  let href = "/";
  const loc = { pathname: "/", search: "", hash: "" };
  const hist = {
    state: null,
    replaceState(_s, _t, next) { href = next; },
  };
  assert(ensureNativeAppLocation(loc, hist) === true, "rewrites marketing boot");
  assert(href === "/app", "history is /app");
  loc.pathname = "/app";
  assert(ensureNativeAppLocation(loc, hist) === false, "leaves /app");
}

console.log("native-platform, device language");
assert(languageFromNavigator("fr-FR") === "fr", "fr-FR");
assert(languageFromNavigator("fr") === "fr", "fr");
assert(languageFromNavigator("en-US") === "en", "en-US");
assert(languageFromNavigator("de-DE") === "en", "other → en");

console.log("native-platform ok");
