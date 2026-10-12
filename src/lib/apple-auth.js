/**
 * Sign in with Apple natif (Capacitor) → session Supabase.
 * Compte anonyme : linkIdentity garde le même user.id (et l’achat Apple).
 * signInWithIdToken seul crée un autre utilisateur. Le plugin est injecté pour les tests.
 */
import { isAnonymousUser } from "./anonymous-auth.js";
export const APPLE_BUNDLE_ID = "app.myswym.ios";
/** Return URL Services ID : www.forswim.app (+ legacy encore autorisé côté Apple). */
export const APPLE_REDIRECT_URI = "https://www.forswim.app/app";

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

/** Apple ID déjà rattaché à un autre compte ForSwim. */
export function isAppleIdentityAlreadyLinked(error) {
  const blob = `${error?.code || ""} ${error?.message || error || ""}`;
  return /identity_already_exists|already linked|already exists|déjà lié/i.test(blob);
}

/** Manual linking désactivé dans Supabase Auth : retomber sur signInWithIdToken. */
export function isManualLinkingDisabled(error) {
  const blob = `${error?.code || ""} ${error?.message || error || ""}`;
  return /manual.?linking/i.test(blob);
}

async function signInAppleIdToken(supabase, identityToken, rawNonce, response, extraMeta) {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;
  await persistAppleProfile(supabase, response, extraMeta);
  return data;
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {(opts: object) => Promise<{ response: object }>} authorize
 * @param {object} [extraMeta]
 * @param {{ linkAnonymous?: boolean, onExistingAppleAccount?: () => Promise<unknown> }} [options]
 */
export async function signInWithAppleNative(supabase, authorize, extraMeta = {}, options = {}) {
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

  let anonymous = false;
  if (options.linkAnonymous) {
    const { data: sessionData } = await supabase.auth.getSession();
    anonymous = isAnonymousUser(sessionData?.session?.user);
  }

  if (anonymous && typeof supabase.auth.linkIdentity === "function") {
    const linked = await supabase.auth.linkIdentity({
      provider: "apple",
      token: identityToken,
      nonce: rawNonce,
    });
    if (!linked?.error) {
      await persistAppleProfile(supabase, result.response, extraMeta);
      return linked.data;
    }
    if (isAppleIdentityAlreadyLinked(linked.error)) {
      const data = await signInAppleIdToken(supabase, identityToken, rawNonce, result.response, extraMeta);
      if (typeof options.onExistingAppleAccount === "function") {
        await options.onExistingAppleAccount();
      }
      return data;
    }
    if (!isManualLinkingDisabled(linked.error)) throw linked.error;
  }

  return signInAppleIdToken(supabase, identityToken, rawNonce, result.response, extraMeta);
}
