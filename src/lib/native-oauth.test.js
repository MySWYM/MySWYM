/**
 * Run: node src/lib/native-oauth.test.js
 */
import {
  NATIVE_OAUTH_REDIRECT,
  completeNativeOAuthFromUrl,
  isNativeOAuthCallback,
  parseOAuthCallbackUrl,
} from "./native-oauth.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("  ✓", msg);
}

console.log("native-oauth");

assert(NATIVE_OAUTH_REDIRECT === "myswym://auth/callback", "redirect");
assert(isNativeOAuthCallback("myswym://auth/callback?code=abc"), "callback with code");
assert(isNativeOAuthCallback("myswym://auth/callback#access_token=x"), "callback with hash");
assert(!isNativeOAuthCallback("https://www.myswym.app/app?code=abc"), "https is not native callback");
assert(!isNativeOAuthCallback("myswym://other"), "other path ignored");

{
  const parsed = parseOAuthCallbackUrl("myswym://auth/callback?code=pkce-code");
  assert(parsed.code === "pkce-code", "parse code");
}
{
  const parsed = parseOAuthCallbackUrl(
    "myswym://auth/callback#access_token=tok&refresh_token=ref",
  );
  assert(parsed.accessToken === "tok", "parse access");
  assert(parsed.refreshToken === "ref", "parse refresh");
}
{
  const parsed = parseOAuthCallbackUrl(
    "myswym://auth/callback?error=access_denied&error_description=User%20denied",
  );
  assert(parsed.error === "access_denied", "parse error");
  assert(parsed.errorDescription === "User denied", "parse error description");
}

{
  const supabase = {
    auth: {
      exchangeCodeForSession: async (code) => {
        assert(code === "abc", "exchanges code");
        return { data: { user: { id: "u1" } }, error: null };
      },
    },
  };
  const data = await completeNativeOAuthFromUrl(supabase, "myswym://auth/callback?code=abc");
  assert(data.user.id === "u1", "pkce session");
}

{
  const supabase = {
    auth: {
      setSession: async (session) => {
        assert(session.access_token === "a", "sets access");
        assert(session.refresh_token === "r", "sets refresh");
        return { data: { user: { id: "u2" } }, error: null };
      },
    },
  };
  const data = await completeNativeOAuthFromUrl(
    supabase,
    "myswym://auth/callback#access_token=a&refresh_token=r",
  );
  assert(data.user.id === "u2", "implicit session");
}

{
  let threw = false;
  try {
    await completeNativeOAuthFromUrl({ auth: {} }, "myswym://auth/callback");
  } catch (e) {
    threw = e.message === "NATIVE_OAUTH_NO_CREDENTIALS";
  }
  assert(threw, "missing credentials");
}

console.log("native-oauth ok");
