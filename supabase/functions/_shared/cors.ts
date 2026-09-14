/**
 * CORS navigateur pour les Edge Functions appelées depuis l’app.
 * Pas de wildcard `*`, pas de `*.vercel.app` générique (n’importe quel projet Vercel).
 */
export const FALLBACK_ORIGIN = "https://www.myswym.app";

const STATIC_ORIGINS = [
  "https://myswym.app",
  "https://www.myswym.app",
  "https://staging.myswym.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5175",
  "http://127.0.0.1:5175",
  "http://localhost:4173",
];

const DEFAULT_ALLOW_HEADERS = "authorization, x-client-info, apikey, content-type";

function extraOrigins(): string[] {
  let fromEnv = "";
  try {
    fromEnv = typeof Deno !== "undefined" ? (Deno.env.get("APP_URL") ?? "") : "";
  } catch {
    fromEnv = "";
  }
  return [fromEnv]
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function isLocalHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1";
}

function isMyswymHost(host: string): boolean {
  return host === "myswym.app" || host.endsWith(".myswym.app");
}

export function isAllowedOrigin(origin: string, extra: readonly string[] = extraOrigins()): boolean {
  if (!origin) return false;
  if (STATIC_ORIGINS.includes(origin) || extra.includes(origin)) return true;
  try {
    const url = new URL(origin);
    if (url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (isLocalHost(host)) return url.protocol === "http:";
    if (isMyswymHost(host)) return url.protocol === "https:";
    return false;
  } catch {
    return false;
  }
}

export function corsHeaders(
  reqOrigin: string | null,
  extraAllowHeaders = DEFAULT_ALLOW_HEADERS,
): Record<string, string> {
  const origin = reqOrigin && isAllowedOrigin(reqOrigin) ? reqOrigin : FALLBACK_ORIGIN;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": extraAllowHeaders,
    Vary: "Origin",
  };
}
