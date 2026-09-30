/**
 * APNs HTTP/2 (AuthKey .p8).
 * Env : APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID, APNS_P8, APNS_PRODUCTION=1|0
 * Sans APNS_PRODUCTION, Vercel production parle à api.push.apple.com (jetons TestFlight).
 */
import { createSign } from "node:crypto";

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

type ApnsConfig = {
  keyId: string;
  teamId: string;
  bundleId: string;
  p8: string;
  production: boolean;
};

let cachedJwt: { token: string; exp: number } | null = null;

export function isApnsConfigured(): boolean {
  return Boolean(
    process.env.APNS_KEY_ID?.trim()
    && process.env.APNS_TEAM_ID?.trim()
    && (process.env.APNS_P8 || process.env.APNS_P8_BASE64)?.trim(),
  );
}

function readConfig(): ApnsConfig | null {
  if (!isApnsConfigured()) return null;
  let p8 = (process.env.APNS_P8 || "").trim();
  if (!p8 && process.env.APNS_P8_BASE64) {
    try {
      p8 = Buffer.from(process.env.APNS_P8_BASE64.trim(), "base64").toString("utf8");
    } catch {
      return null;
    }
  }
  if (!p8.includes("BEGIN PRIVATE KEY")) {
    p8 = `-----BEGIN PRIVATE KEY-----\n${p8.replace(/\s+/g, "\n")}\n-----END PRIVATE KEY-----`;
  }
  return {
    keyId: process.env.APNS_KEY_ID!.trim(),
    teamId: process.env.APNS_TEAM_ID!.trim(),
    bundleId: (process.env.APNS_BUNDLE_ID || "app.myswym.ios").trim(),
    p8,
    production: (process.env.APNS_PRODUCTION ?? (process.env.VERCEL_ENV === "production" ? "1" : "0")).trim() === "1",
  };
}

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function createApnsJwt(cfg: ApnsConfig): string {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && cachedJwt.exp > now + 60) return cachedJwt.token;

  const header = b64url(JSON.stringify({ alg: "ES256", kid: cfg.keyId }));
  const claims = b64url(JSON.stringify({ iss: cfg.teamId, iat: now }));
  const unsigned = `${header}.${claims}`;
  const sign = createSign("SHA256");
  sign.update(unsigned);
  sign.end();
  const sig = sign.sign({ key: cfg.p8, dsaEncoding: "ieee-p1363" });
  const token = `${unsigned}.${b64url(sig)}`;
  cachedJwt = { token, exp: now + 50 * 60 };
  return token;
}

export async function sendApnsToDevice(
  deviceToken: string,
  payload: PushPayload,
): Promise<{ ok: boolean; status?: number; reason?: string }> {
  const cfg = readConfig();
  if (!cfg) return { ok: false, reason: "apns_not_configured" };
  const token = String(deviceToken || "").replace(/\s+/g, "");
  if (!token || token.length < 64) return { ok: false, reason: "bad_token" };

  const host = cfg.production ? "api.push.apple.com" : "api.sandbox.push.apple.com";
  const url = `https://${host}/3/device/${token}`;
  const jwt = createApnsJwt(cfg);
  const body = {
    aps: {
      alert: {
        title: String(payload.title || "").slice(0, 80),
        body: String(payload.body || "").slice(0, 180),
      },
      sound: "default",
    },
    ...(payload.data || {}),
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `bearer ${jwt}`,
        "apns-topic": cfg.bundleId,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true, status: res.status };
    const errText = await res.text().catch(() => "");
    let reason = errText.slice(0, 200);
    try {
      reason = JSON.parse(errText)?.reason || reason;
    } catch { /* ignore */ }
    return { ok: false, status: res.status, reason };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "fetch_failed" };
  }
}
