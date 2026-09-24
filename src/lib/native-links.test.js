/**
 * Run: node src/lib/native-links.test.js
 */
import { absoluteSiteUrl, inAppPathFromHref, isNativeExternalSitePath } from "./native-links.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("  ✓", msg);
}

console.log("native-links");
assert(inAppPathFromHref("/cgu") === "/cgu", "relative");
assert(inAppPathFromHref("https://www.myswym.app/mentions-legales") === "/mentions-legales", "absolute legal");
assert(inAppPathFromHref("https://www.myswym.app/contact") === "/contact", "absolute contact");
assert(inAppPathFromHref("mailto:a@b.c") === null, "mailto skipped");
assert(inAppPathFromHref("https://instagram.com/x") === null, "external skipped");
assert(
  absoluteSiteUrl("/faq") === "https://www.myswym.app/faq",
  "relative faq → https site",
);
assert(
  absoluteSiteUrl("https://www.myswym.app/cgu") === "https://www.myswym.app/cgu",
  "absolute cgu stays https",
);
assert(isNativeExternalSitePath("/cgu") === true, "cgu leaves app");
assert(isNativeExternalSitePath("/faq") === true, "faq leaves app");
assert(isNativeExternalSitePath("/") === true, "home site leaves app");
assert(isNativeExternalSitePath("/app") === false, "app stays");
assert(isNativeExternalSitePath("/connexion") === false, "auth stays");
console.log("native-links ok");
