/**
 * Lien « mot de passe oublié » : https://www.myswym.app/app?reset=1&token_hash=…&type=recovery
 * (construit par api/contact.ts, plus de lien *.supabase.co dans le mail).
 * `native=1` : la page web renvoie vers l’app iOS, qui consomme le jeton elle-même.
 */
import { NATIVE_OAUTH_REDIRECT } from "./native-oauth.js";

const STRIP_PARAMS = ["token_hash", "type", "native"];

/**
 * @param {{ search?: string } | null | undefined} loc
 * @returns {{ tokenHash: string, native: boolean } | null}
 */
export function readRecoveryTokenHash(loc) {
  try {
    const params = new URLSearchParams(String(loc?.search || ""));
    const tokenHash = params.get("token_hash");
    if (!tokenHash || params.get("type") !== "recovery") return null;
    return { tokenHash, native: params.get("native") === "1" };
  } catch {
    return null;
  }
}

export function nativeRecoveryUrl(tokenHash) {
  const params = new URLSearchParams({ reset: "1", token_hash: tokenHash, type: "recovery" });
  return `${NATIVE_OAUTH_REDIRECT}?${params.toString()}`;
}

/**
 * Lien ouvert dans Safari pour un compte iOS : relance l’app sans consommer le jeton
 * (il est à usage unique, c’est l’app qui appelle verifyOtp).
 * @returns {boolean} true si la page a été redirigée vers l’app.
 */
export function bounceRecoveryToNativeApp(win = typeof window !== "undefined" ? window : null) {
  const info = readRecoveryTokenHash(win?.location);
  if (!info?.native) return false;
  try {
    win.location.replace(nativeRecoveryUrl(info.tokenHash));
    return true;
  } catch {
    return false;
  }
}

function stripRecoveryParamsFromUrl(win) {
  try {
    const url = new URL(win.location.href);
    STRIP_PARAMS.forEach((k) => url.searchParams.delete(k));
    win.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  } catch { /* ignore */ }
}

/**
 * Web : ouvre la session recovery depuis `token_hash` (verifyOtp), puis nettoie l’URL.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 */
export async function consumeRecoveryTokenHash(supabase, win = typeof window !== "undefined" ? window : null) {
  const info = readRecoveryTokenHash(win?.location);
  if (!info || info.native) return { consumed: false };
  stripRecoveryParamsFromUrl(win);
  const { error } = await supabase.auth.verifyOtp({ token_hash: info.tokenHash, type: "recovery" });
  if (error) return { consumed: false, error };
  return { consumed: true };
}
