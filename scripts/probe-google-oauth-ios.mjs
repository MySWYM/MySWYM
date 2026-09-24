/**
 * Probe Google OAuth allowlist on PROD (iOS redirect).
 * Run: node scripts/probe-google-oauth-ios.mjs
 * Uses .env.ios-prod.local (no secrets printed).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(file) {
  const out = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const s = line.trim();
    if (!s || s.startsWith("#") || !s.includes("=")) continue;
    const i = s.indexOf("=");
    let v = s.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[s.slice(0, i).trim()] = v;
  }
  return out;
}

const env = loadEnv(resolve(process.cwd(), ".env.ios-prod.local"));
const base = env.VITE_SUPABASE_URL;
const anon = env.VITE_SUPABASE_ANON_KEY;
if (!base?.includes("ssdygz") || !anon) {
  console.error("Need .env.ios-prod.local with PROD Supabase URL/anon");
  process.exit(1);
}

async function probe(redirectTo) {
  const u = new URL(`${base}/auth/v1/authorize`);
  u.searchParams.set("provider", "google");
  u.searchParams.set("redirect_to", redirectTo);
  const res = await fetch(u, {
    redirect: "manual",
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  });
  const loc = res.headers.get("location") || "";
  let host = "";
  try {
    host = new URL(loc).hostname;
  } catch {
    /* ignore */
  }
  const ok = res.status >= 300 && res.status < 400 && /google\.com$/i.test(host.replace(/^www\./, "").split(".").slice(-2).join("."))
    || host.includes("accounts.google.com")
    || host.includes("google.com");
  console.log(
    ok ? "OK " : "FAIL ",
    redirectTo,
    "→",
    res.status,
    host || (await res.text().then((t) => t.slice(0, 120))),
  );
  return ok;
}

const results = [];
results.push(await probe("myswym://auth/callback"));
results.push(await probe("https://www.myswym.app/app"));
if (!results.every(Boolean)) process.exit(2);
console.log("google-oauth-ios probe ok");
