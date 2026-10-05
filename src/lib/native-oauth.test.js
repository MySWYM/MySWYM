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
      exchangeCodeForSession: async (code) => {
        assert(code === "recovery-code", "recovery uses code");
        return { data: { user: { id: "u2" } }, error: null };
      },
      setSession: async () => {
        throw new Error("setSession should not run");
      },
    },
  };
  const data = await completeNativeOAuthFromUrl(
    supabase,
    "myswym://auth/callback?reset=1&code=recovery-code",
  );
  assert(data.user.id === "u2", "recovery session");
  assert(data.isPasswordRecovery === true, "marks password recovery");
}

{
  let threw = false;
  const supabase = {
    auth: {
      setSession: async () => {
        throw new Error("setSession should not run");
      },
    },
  };
  try {
    await completeNativeOAuthFromUrl(
      supabase,
      "myswym://auth/callback#access_token=a&refresh_token=r",
    );
  } catch (e) {
    threw = e.message === "NATIVE_OAUTH_NO_CREDENTIALS";
  }
  assert(threw, "implicit tokens refused");
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


{
  let set = null;
  const supabase = {
    auth: {
      setSession: async (args) => {
        set = args;
        return { data: { user: { id: "u3" } }, error: null };
      },
    },
  };
  const data = await completeNativeOAuthFromUrl(
    supabase,
    "myswym://auth/callback?reset=1#access_token=a&refresh_token=r&type=recovery",
  );
  assert(set?.access_token === "a" && data.user.id === "u3", "recovery link from generateLink (implicit) works");
  assert(data.isPasswordRecovery === true, "implicit recovery marks reset");
}

{
  let otp = null;
  const supabase = {
    auth: {
      verifyOtp: async (args) => {
        otp = args;
        return { data: { user: { id: "u4" } }, error: null };
      },
    },
  };
  const data = await completeNativeOAuthFromUrl(
    supabase,
    "myswym://auth/callback?reset=1&token_hash=h1&type=recovery",
  );
  assert(otp?.token_hash === "h1" && otp?.type === "recovery", "token_hash recovery uses verifyOtp");
  assert(data.isPasswordRecovery === true, "token_hash marks reset");
}

console.log("native-oauth ok");
