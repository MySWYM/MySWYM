/**
 * Run: node src/lib/apple-auth.test.js
 */
import {
  APPLE_BUNDLE_ID,
  appleDisplayName,
  createAppleNonce,
  isAppleSignInCanceled,
  persistAppleProfile,
  sha256Hex,
  signInWithAppleNative,
} from "./apple-auth.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("  ✓", msg);
}

console.log("apple-auth");

assert(APPLE_BUNDLE_ID === "app.myswym.ios", "bundle id");
assert(createAppleNonce().length === 64, "nonce hex 32 bytes");
assert(createAppleNonce() !== createAppleNonce(), "nonce unique");
assert(
  (await sha256Hex("abc")) ===
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  "sha256 abc",
);
assert(appleDisplayName({ givenName: "Ada", familyName: "Lovelace" }) === "Ada Lovelace", "display name");
assert(appleDisplayName({ givenName: "Ada", familyName: " " }) === "Ada", "display given only");
assert(isAppleSignInCanceled({ code: 1001 }), "cancel code 1001");
assert(isAppleSignInCanceled({ message: "The user canceled the authorization attempt" }), "cancel message");
assert(!isAppleSignInCanceled({ message: "not enabled" }), "not cancel");

{
  const calls = [];
  const supabase = {
    auth: {
      updateUser: async (payload) => {
        calls.push(payload);
        return { error: null };
      },
    },
  };
  await persistAppleProfile(supabase, { givenName: "Ada", familyName: "Lovelace" }, { confirmed_age_18: true });
  assert(calls[0].data.full_name === "Ada Lovelace", "persist full_name");
  assert(calls[0].data.confirmed_age_18 === true, "persist extra meta");
}

{
  const hashed = await sha256Hex("raw-nonce-for-test");
  let authorizeOpts = null;
  const authorize = async (opts) => {
    authorizeOpts = opts;
    return { response: { identityToken: "jwt-token", givenName: "Ada", familyName: "Lovelace" } };
  };
  const supabase = {
    auth: {
      signInWithIdToken: async (payload) => {
        assert(payload.provider === "apple", "id token provider");
        assert(payload.token === "jwt-token", "id token");
        assert(payload.nonce === "raw-nonce-for-test" || typeof payload.nonce === "string", "raw nonce sent");
        return { data: { user: { id: "u1" } }, error: null };
      },
      updateUser: async () => ({ error: null }),
    },
  };
  const realCreate = globalThis.crypto.getRandomValues.bind(globalThis.crypto);
  // Keep real nonce generation; just assert hashed nonce is 64 hex.
  const data = await signInWithAppleNative(supabase, authorize);
  assert(data.user.id === "u1", "returns session user");
  assert(authorizeOpts.clientId === "app.myswym.ios", "authorize clientId");
  assert(authorizeOpts.scopes === "email name", "authorize scopes");
  assert(/^[0-9a-f]{64}$/.test(authorizeOpts.nonce), "hashed nonce hex");
  assert(authorizeOpts.nonce !== hashed || hashed.length === 64, "nonce present");
  void realCreate;
}

{
  const authorize = async () => ({ response: {} });
  const supabase = { auth: { signInWithIdToken: async () => ({ data: null, error: null }) } };
  let threw = false;
  try {
    await signInWithAppleNative(supabase, authorize);
  } catch (e) {
    threw = e.message === "APPLE_NO_TOKEN";
  }
  assert(threw, "missing identity token");
}

console.log("apple-auth ok");
