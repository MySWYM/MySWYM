/**
 * Run: node src/lib/recovery-token.test.js
 */
import {
  bounceRecoveryToNativeApp,
  consumeRecoveryTokenHash,
  nativeRecoveryUrl,
  readRecoveryTokenHash,
} from "./recovery-token.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("  ✓", msg);
}

function fakeWindow(href) {
  const u = new URL(href);
  const win = {
    replaced: null,
    pushed: null,
    location: {
      href: u.toString(),
      search: u.search,
      replace(next) { win.replaced = next; },
    },
    history: { replaceState(_s, _t, next) { win.pushed = next; } },
  };
  return win;
}

console.log("recovery-token");

assert(readRecoveryTokenHash({ search: "?reset=1" }) === null, "no token_hash");
assert(readRecoveryTokenHash({ search: "?token_hash=a&type=signup" }) === null, "other type ignored");
{
  const info = readRecoveryTokenHash({ search: "?reset=1&token_hash=abc&type=recovery&native=1" });
  assert(info.tokenHash === "abc" && info.native === true, "reads native token");
}
assert(
  nativeRecoveryUrl("abc") === "myswym://auth/callback?reset=1&token_hash=abc&type=recovery",
  "native callback url",
);

{
  const win = fakeWindow("https://www.myswym.app/app?reset=1&token_hash=abc&type=recovery&native=1");
  assert(bounceRecoveryToNativeApp(win) === true, "bounces native link");
  assert(win.replaced === "myswym://auth/callback?reset=1&token_hash=abc&type=recovery", "bounce target");
  let called = false;
  const res = await consumeRecoveryTokenHash({ auth: { verifyOtp: async () => { called = true; } } }, win);
  assert(!called && res.consumed === false, "native link not consumed on web");
}

{
  const win = fakeWindow("https://www.myswym.app/app?reset=1&token_hash=abc&type=recovery");
  assert(bounceRecoveryToNativeApp(win) === false, "web link not bounced");
  let payload = null;
  const res = await consumeRecoveryTokenHash(
    { auth: { verifyOtp: async (p) => { payload = p; return { data: {}, error: null }; } } },
    win,
  );
  assert(res.consumed === true, "web consumes token");
  assert(payload.token_hash === "abc" && payload.type === "recovery", "verifyOtp payload");
  assert(win.pushed === "/app?reset=1", "strips token from url, keeps reset=1");
}

console.log("recovery-token ok");
