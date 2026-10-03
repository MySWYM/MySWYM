/**
 * Demande de reset mot de passe via l’API MySWYM (email Resend pro + redirect prod).
 * Ne pas utiliser supabase.auth.resetPasswordForEmail côté client : Site URL / Capacitor
 * peut renvoyer vers staging et le template Supabase par défaut (EN).
 */
import { isNativeApp, nativeApiOrigin } from "./native-platform.js";

export function passwordResetApiUrl() {
  const base = isNativeApp() ? nativeApiOrigin() : "";
  return `${base}/api/auth/reset-password`;
}

/**
 * @param {string} email
 * @returns {Promise<{ ok: true }>}
 */
export async function requestPasswordReset(email) {
  const mail = String(email || "").trim().toLowerCase();
  if (!mail.includes("@")) {
    throw new Error("EMAIL_INVALID");
  }

  const res = await fetch(passwordResetApiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ kind: "reset-password", email: mail }),
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (res.status === 429) {
    throw new Error(json?.error || "RATE_LIMIT");
  }
  if (!res.ok || json?.ok === false) {
    throw new Error(json?.error || "RESET_FAIL");
  }
  return { ok: true };
}
