/**
 * OAuth Google (et autres) hors WebView iOS.
 * Google bloque l’OAuth dans WKWebView : on ouvre Safari système
 * puis on revient via myswym://auth/callback.
 */
export const NATIVE_OAUTH_SCHEME = "myswym";
export const NATIVE_OAUTH_REDIRECT = "myswym://auth/callback";

export function isNativeOAuthCallback(url) {
  const raw = String(url || "");
  return /^myswym:\/\/auth\/callback(?:[?#]|$)/i.test(raw);
}

export function parseOAuthCallbackUrl(url) {
  const raw = String(url || "");
  const q = raw.indexOf("?");
  const h = raw.indexOf("#");
  let search = "";
  let hash = "";
  if (q >= 0 && (h < 0 || q < h)) {
    search = h >= 0 ? raw.slice(q + 1, h) : raw.slice(q + 1);
  }
  if (h >= 0) hash = raw.slice(h + 1);
  const params = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash);
  const pick = (key) => params.get(key) || hashParams.get(key);
  return {
    code: pick("code"),
    accessToken: pick("access_token"),
    refreshToken: pick("refresh_token"),
    error: pick("error"),
    errorDescription: pick("error_description"),
  };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} url
 */
export async function completeNativeOAuthFromUrl(supabase, url) {
  const parsed = parseOAuthCallbackUrl(url);
  if (parsed.error) {
    throw new Error(parsed.errorDescription || parsed.error);
  }
  if (parsed.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(parsed.code);
    if (error) throw error;
    return data;
  }
  if (parsed.accessToken && parsed.refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: parsed.accessToken,
      refresh_token: parsed.refreshToken,
    });
    if (error) throw error;
    return data;
  }
  throw new Error("NATIVE_OAUTH_NO_CREDENTIALS");
}

/** Notifie l’UI auth après retour Safari (cold start ou app déjà ouverte). */
export function emitNativeOAuthCompleted(detail = {}) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("myswym:native-oauth-done", { detail }));
  } catch {
    /* ignore */
  }
}
