/**
 * Sign in with Apple natif (Capacitor) → session Supabase.
 * Même user.id que le site si l’email Apple correspond au compte existant
 * (liaison auto Supabase). Le plugin Capacitor est injecté pour rester testable.
 */
export const APPLE_BUNDLE_ID = "app.myswym.ios";
export const APPLE_REDIRECT_URI = "https://www.myswym.app/app";

export function createAppleNonce(byteLength = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

export async function sha256Hex(plain) {
  const data = new TextEncoder().encode(String(plain));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function isAppleSignInCanceled(err) {
  const code = err?.code;
  if (code === 1001 || code === "1001") return true;
  return /cancel/i.test(String(err?.message || err || ""));
}

export function appleDisplayName(response) {
  const given = String(response?.givenName || "").trim();
  const family = String(response?.familyName || "").trim();
  return [given, family].filter(Boolean).join(" ");
}

export async function persistAppleProfile(supabase, response, extra = {}) {
  const fullName = appleDisplayName(response);
  const data = { ...extra };
  if (fullName) {
    data.full_name = fullName;
    data.name = fullName;
  }
  if (response?.givenName) data.given_name = String(response.givenName).trim();
  if (response?.familyName) data.family_name = String(response.familyName).trim();
  if (Object.keys(data).length === 0) return;
  const { error } = await supabase.auth.updateUser({ data });
  if (error && import.meta.env?.DEV) {
    console.warn("[apple-auth] updateUser", error.message);
  }
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {(opts: object) => Promise<{ response: object }>} authorize
 * @param {object} [extraMeta]
 */
export async function signInWithAppleNative(supabase, authorize, extraMeta = {}) {
  const rawNonce = createAppleNonce();
  const hashedNonce = await sha256Hex(rawNonce);
  const result = await authorize({
    clientId: APPLE_BUNDLE_ID,
    redirectURI: APPLE_REDIRECT_URI,
    scopes: "email name",
    nonce: hashedNonce,
  });
  const identityToken = result?.response?.identityToken;
  if (!identityToken) {
    const err = new Error("APPLE_NO_TOKEN");
    throw err;
  }
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;
  await persistAppleProfile(supabase, result.response, extraMeta);
  return data;
}
