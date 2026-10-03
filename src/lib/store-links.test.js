/**
 * Run: node src/lib/store-links.test.js
 */
import {
  APP_STORE_URL,
  APP_STORE_ID,
  IOS_BUNDLE_ID,
  appStoreHref,
  detectClientPlatform,
  prefersAppStorePrimary,
  shouldShowWebStoreUi,
} from "./store-links.js";
import { setNativePlatformForTests } from "./native-platform.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("  ✓", msg);
}

console.log("store-links");

assert(
  APP_STORE_URL === "https://apps.apple.com/fr/app/myswym/id6812897499",
  "App Store URL live",
);
assert(APP_STORE_ID === "6812897499", "App Store id");
assert(IOS_BUNDLE_ID === "app.myswym.ios", "bundle id");
assert(appStoreHref() === APP_STORE_URL, "href helper");

assert(detectClientPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)") === "ios", "iPhone");
assert(detectClientPlatform("Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)") === "ios", "iPad");
assert(
  detectClientPlatform("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36") === "android",
  "Android",
);
assert(
  detectClientPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36") === "other",
  "desktop Mac",
);

setNativePlatformForTests(false);
assert(shouldShowWebStoreUi() === true, "web shows store UI");
assert(prefersAppStorePrimary("ios") === true, "iOS web prefers App Store CTA");
assert(prefersAppStorePrimary("android") === false, "Android keeps web CTA");
assert(prefersAppStorePrimary("other") === false, "desktop keeps web CTA");

setNativePlatformForTests(true);
assert(shouldShowWebStoreUi() === false, "Capacitor hides store UI");
assert(prefersAppStorePrimary("ios") === false, "native iOS no store CTA");
setNativePlatformForTests(null);

console.log("store-links ok");
