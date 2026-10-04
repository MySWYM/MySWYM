/**
 * Demande de reset mot de passe via l’API MySWYM (email Resend pro + redirect prod).
 * Fallback Supabase si l’API n’est pas encore déployée (ex. iOS → www avant merge main).
 */
import { supabase } from "../supabase.js";
import { isNativeApp, nativeApiOrigin } from "./native-platform.js";
import {
  PASSWORD_RESET_QUERY,
  PASSWORD_RESET_QUERY_VALUE,
} from "./password-recovery-intent.js";

const PROD_APP = `https://www.myswym.app/app?${PASSWORD_RESET_QUERY}=${PASSWORD_RESET_QUERY_VALUE}`;

export function passwordResetApiUrl() {
  const base = isNativeApp() ? nativeApiOrigin() : "";
  return `${base}/api/auth/reset-password`;
}

/** Redirect après clic mail : /app?reset=1 (query survit quand supabase consomme le hash). */
export function withPasswordResetQuery(appUrl) {
  try {
    const u = new URL(String(appUrl || ""), "https://www.myswym.app");
    u.searchParams.set(PASSWORD_RESET_QUERY, PASSWORD_RESET_QUERY_VALUE);
    return u.toString();
  } catch {
    return PROD_APP;
  }
}

function asErrorText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value?.message === "string" && value.message) return value.message;
  if (typeof value?.error === "string" && value.error) return value.error;
  if (typeof value?.error?.message === "string" && value.error.message) return value.error.message;
  try {
    return JSON.stringify(value);
  } catch {
    return "RESET_FAIL";
  }
}

function resetRedirectTo() {
  if (isNativeApp()) {
    const base = nativeApiOrigin();
    return withPasswordResetQuery(base ? `${base}/app` : PROD_APP);
  }
  try {
    const host = String(window.location?.hostname || "");
    if (host === "localhost" || host === "127.0.0.1") {
      return withPasswordResetQuery(`${window.location.origin}/app`);
    }
  } catch { /* ignore */ }
  return PROD_APP;
}

async function resetViaSupabase(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: resetRedirectTo(),
  });
  if (error) throw new Error(asErrorText(error) || "RESET_FAIL");
  return { ok: true, via: "supabase" };
}

/**
 * @param {string} email
 * @returns {Promise<{ ok: true, via?: string }>}
 */
export async function requestPasswordReset(email) {
  const mail = String(email || "").trim().toLowerCase();
  if (!mail.includes("@")) {
    throw new Error("EMAIL_INVALID");
  }

  let res;
  try {
    res = await fetch(passwordResetApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ kind: "reset-password", email: mail }),
    });
  } catch {
    return resetViaSupabase(mail);
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (res.status === 429) {
    throw new Error(asErrorText(json?.error) || "RATE_LIMIT");
  }

  // API absente (prod pas encore mergée) ou HTML 404 → fallback Supabase, redirect www.
  if (res.status === 404 || res.status === 405 || res.status === 501) {
    return resetViaSupabase(mail);
  }

  if (!res.ok || json?.ok === false) {
    const detail = asErrorText(json?.error);
    // Vercel NOT_FOUND object, etc.
    if (/not[_ ]found|404/i.test(detail) || (json?.error && typeof json.error === "object")) {
      return resetViaSupabase(mail);
    }
    throw new Error(detail || "RESET_FAIL");
  }

  return { ok: true, via: "api" };
}
