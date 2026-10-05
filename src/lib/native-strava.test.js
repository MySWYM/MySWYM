/**
 * Run: node src/lib/native-strava.test.js
 */
import {
  NATIVE_STRAVA_SCHEME_PATH,
  STRAVA_STATE_IOS,
  buildStravaAuthorizeUrl,
  consumeIosStravaState,
  createIosStravaState,
  handoffStravaIosIfNeeded,
  isIosStravaOAuthState,
  isNativeStravaCallback,
  parseNativeStravaCallback,
  stravaRedirectUri,
} from "./native-strava.js";
import { setNativePlatformForTests } from "./native-platform.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("  ✓", msg);
}

console.log("native-strava");

setNativePlatformForTests(false);
assert(stravaRedirectUri().endsWith("/app"), "web redirect ends with /app");
assert(!stravaRedirectUri().startsWith("capacitor:"), "web redirect is not capacitor");

setNativePlatformForTests(true);
assert(stravaRedirectUri() === "myswym://localhost/strava/callback", "ios redirect opens MySWYM");
{
  const url = buildStravaAuthorizeUrl("233278");
  assert(url.includes("redirect_uri=" + encodeURIComponent("myswym://localhost/strava/callback")), "authorize uses myswym");
  assert(!url.includes("www.myswym.app"), "ios authorize skips the website");
  assert(url.includes("state=strava_connect_ios."), "ios state has a nonce");
  assert(!url.includes("state=strava_connect_ios&"), "ios state is not the fixed prefix");
  assert(!url.includes("capacitor"), "authorize never uses capacitor");
}
setNativePlatformForTests(null);

assert(isNativeStravaCallback("myswym://localhost/strava/callback?code=abc"), "localhost callback");
assert(isNativeStravaCallback("myswym://strava/callback?code=abc"), "callback with code");
assert(!isNativeStravaCallback("capacitor://localhost/app?code=abc"), "capacitor url ignored");
assert(!isNativeStravaCallback("myswym://auth/callback?code=abc"), "auth callback ignored");
{
  const parsed = parseNativeStravaCallback("myswym://strava/callback?code=abc&state=strava_connect");
  assert(parsed.code === "abc", "parse code");
  assert(parsed.state === "strava_connect", "parse state");
}

{
  const nonceState = "strava_connect_ios.abc123";
  let replaced = "";
  const loc = {
    search: `?code=abc&state=${nonceState}`,
    replace(next) { replaced = next; },
  };
  assert(handoffStravaIosIfNeeded(loc) === true, "handoff runs");
  assert(replaced.startsWith(`${NATIVE_STRAVA_SCHEME_PATH}?`), "handoff opens myswym");
  const q = new URLSearchParams(replaced.split("?")[1]);
  assert(q.get("code") === "abc", "handoff keeps code");
  assert(q.get("state") === nonceState, "handoff keeps ios state");
  assert(STRAVA_STATE_IOS === "strava_connect_ios", "ios state constant");
  assert(isIosStravaOAuthState(nonceState) === true, "prefix detects ios");
  assert(isIosStravaOAuthState(STRAVA_STATE_IOS) === false, "bare prefix is not a state");
}

{
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  };
  const state = createIosStravaState();
  assert(isIosStravaOAuthState(state), "created state has prefix");
  consumeIosStravaState(state);
  let refused = false;
  try {
    consumeIosStravaState(state);
  } catch (e) {
    refused = e.message === "Connexion Strava refusée.";
  }
  assert(refused, "state cannot be reused");
}

{
  const loc = { search: "?code=abc&state=strava_connect", replace() { throw new Error("no"); } };
  assert(handoffStravaIosIfNeeded(loc) === false, "web state stays on the site");
}

console.log("ok");
