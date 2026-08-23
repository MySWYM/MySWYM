import { supabase } from "../supabase.js";

export const ARTHUR_ADMIN_SECRET_KEY = "myswym_arthur_admin_secret";
export const PRIMARY_ADMIN_EMAIL = "admin@myswym.app";

export function readStoredAdminSecret() {
  try {
    const local = localStorage.getItem(ARTHUR_ADMIN_SECRET_KEY);
    if (local) return local;
    const fromTab = sessionStorage.getItem(ARTHUR_ADMIN_SECRET_KEY);
    if (fromTab) {
      localStorage.setItem(ARTHUR_ADMIN_SECRET_KEY, fromTab);
      sessionStorage.removeItem(ARTHUR_ADMIN_SECRET_KEY);
      return fromTab;
    }
    return "";
  } catch {
    return "";
  }
}

export function writeStoredAdminSecret(secret) {
  try {
    if (secret) localStorage.setItem(ARTHUR_ADMIN_SECRET_KEY, secret);
    else localStorage.removeItem(ARTHUR_ADMIN_SECRET_KEY);
  } catch {
    /* ignore */
  }
}

export function isPrimaryAdminEmail(email) {
  return (email || "").trim().toLowerCase() === PRIMARY_ADMIN_EMAIL;
}

export async function arthurAdminHeaders(secret = "", { json = false } = {}) {
  const headers = { Accept: "application/json" };
  if (json) headers["Content-Type"] = "application/json";
  const useSecret = (secret || "").trim();
  if (useSecret) {
    headers["x-myswym-arthur-admin"] = useSecret;
    return headers;
  }
  const { data: sess } = await supabase.auth.getSession();
  const token = sess?.session?.access_token;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function probeArthurAdmin(secret = "") {
  const headers = await arthurAdminHeaders(secret);
  const res = await fetch("/api/admin/arthur-readiness?ping=1", { headers });
  const contentType = res.headers.get("content-type") || "";
  const body = await res.text();
  const looksJson = contentType.includes("application/json") || /^\s*\{/.test(body);
  let json = {};
  if (looksJson) {
    try {
      json = JSON.parse(body || "{}");
    } catch {
      json = {};
    }
  }
  if (json && json.ok === true) return json;

  const apiMissing =
    !looksJson ||
    contentType.includes("text/html") ||
    contentType.includes("text/javascript") ||
    contentType.includes("application/javascript");
  const err = new Error(
    json.error || (apiMissing ? "API_ADMIN_ABSENTE" : `HTTP ${res.status}`),
  );
  err.status = res.status;
  throw err;
}

export function isLocalDev() {
  return Boolean(import.meta.env.DEV);
}

export function isStagingHost() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname || "";
  return host.startsWith("staging.") || host === "localhost" || host === "127.0.0.1";
}

/** En local, n’importe quelle session MySWYM ouvre l’admin (Vite ne sert pas /api). */
export function canBypassAdminProbe(sessionEmail) {
  return isLocalDev() && Boolean(sessionEmail);
}
