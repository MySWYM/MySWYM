/**
 * Strava OAuth hors WebView iOS.
 * Le retour est myswym://localhost : Strava accepte localhost,
 * et seul MySWYM déclare le schéma myswym.
 * Jamais capacitor://localhost (une autre app Capacitor peut s’ouvrir)
 * et jamais le site web (Safari n’a pas la session de l’app).
 */
import { isNativeApp, nativeApiOrigin } from "./native-platform.js";
import { openNativeOAuthUrl } from "./native-links.js";

export const NATIVE_STRAVA_REDIRECT = "myswym://localhost/strava/callback";
export const NATIVE_STRAVA_SCHEME_PATH = NATIVE_STRAVA_REDIRECT;
export const STRAVA_STATE_WEB = "strava_connect";
export const STRAVA_STATE_IOS = "strava_connect_ios";

export function stravaRedirectUri() {
  if (isNativeApp()) return NATIVE_STRAVA_REDIRECT;
  if (typeof window !== "undefined") return `${window.location.origin}/app`;
  return `${nativeApiOrigin()}/app`;
}

export function stravaOAuthState() {
  return isNativeApp() ? STRAVA_STATE_IOS : STRAVA_STATE_WEB;
}

export function isNativeStravaCallback(url) {
  return /^myswym:\/\/(?:localhost\/)?strava\/callback(?:[?#]|$)/i.test(String(url || ""));
}

export function parseNativeStravaCallback(url) {
  const raw = String(url || "");
  const q = raw.indexOf("?");
  const search = q >= 0 ? raw.slice(q + 1) : "";
  const params = new URLSearchParams(search);
  return {
    code: params.get("code"),
    state: params.get("state"),
    error: params.get("error"),
    errorDescription: params.get("error_description"),
  };
}

/** Sur le site HTTPS (Safari) : renvoie le code dans l’app. */
export function handoffStravaIosIfNeeded(
  loc = typeof window !== "undefined" ? window.location : null,
) {
  if (!loc || typeof loc.search !== "string") return false;
  if (isNativeApp()) return false;
  const params = new URLSearchParams(loc.search);
  if (params.get("state") !== STRAVA_STATE_IOS) return false;
  const code = params.get("code");
  const err = params.get("error");
  if (!code && !err) return false;
  const next = new URLSearchParams();
  if (code) next.set("code", code);
  next.set("state", STRAVA_STATE_WEB);
  if (err) next.set("error", err);
  const desc = params.get("error_description");
  if (desc) next.set("error_description", desc);
  try {
    loc.replace(`${NATIVE_STRAVA_SCHEME_PATH}?${next.toString()}`);
    return true;
  } catch {
    return false;
  }
}

export function buildStravaAuthorizeUrl(clientId) {
  const redirectUri = encodeURIComponent(stravaRedirectUri());
  const state = stravaOAuthState();
  return (
    `https://www.strava.com/oauth/authorize?client_id=${clientId}` +
    `&response_type=code&redirect_uri=${redirectUri}` +
    `&approval_prompt=auto&scope=activity%3Aread_all&state=${state}`
  );
}

export async function startStravaOAuth(clientId) {
  const url = buildStravaAuthorizeUrl(clientId);
  if (isNativeApp()) {
    await openNativeOAuthUrl(url);
    return;
  }
  window.location.href = url;
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} url
 */
export async function completeNativeStravaFromUrl(supabase, url) {
  const parsed = parseNativeStravaCallback(url);
  if (parsed.error) {
    throw new Error(parsed.errorDescription || parsed.error);
  }
  if (!parsed.code) throw new Error("Connexion Strava interrompue.");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Session expirée, reconnecte-toi.");
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strava-callback`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        code: parsed.code,
        redirect_uri: stravaRedirectUri(),
      }),
    },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(json.error || "Erreur Strava");
  return json;
}

export function emitNativeStravaCompleted(detail = {}) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("myswym:strava-connected", { detail }));
  } catch {
    /* ignore */
  }
}

export async function closeNativeStravaBrowser() {
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.close();
  } catch {
    /* déjà fermé */
  }
}
