/**
 * Run: node src/lib/native-strava.test.js
 */
import {
  NATIVE_STRAVA_SCHEME_PATH,
  STRAVA_STATE_IOS,
  buildStravaAuthorizeUrl,
  handoffStravaIosIfNeeded,
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
  assert(url.includes("state=strava_connect_ios"), "ios state");
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
  let replaced = "";
  const loc = {
    search: "?code=abc&state=strava_connect_ios",
    replace(next) { replaced = next; },
  };
  assert(handoffStravaIosIfNeeded(loc) === true, "handoff runs");
  assert(replaced.startsWith(`${NATIVE_STRAVA_SCHEME_PATH}?`), "handoff opens myswym");
  const q = new URLSearchParams(replaced.split("?")[1]);
  assert(q.get("code") === "abc", "handoff keeps code");
  assert(q.get("state") === "strava_connect", "handoff state for the app");
  assert(STRAVA_STATE_IOS === "strava_connect_ios", "ios state constant");
}

{
  const loc = { search: "?code=abc&state=strava_connect", replace() { throw new Error("no"); } };
  assert(handoffStravaIosIfNeeded(loc) === false, "web state stays on the site");
}

console.log("ok");
