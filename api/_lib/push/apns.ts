/**
 * APNs HTTP/2 (AuthKey .p8).
 * Env : APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID, APNS_P8, APNS_PRODUCTION=1|0
 * Sur Vercel production → toujours api.push.apple.com (jetons TestFlight),
 * sauf APNS_FORCE_SANDBOX=1.
 */
import { createSign } from "node:crypto";
import http2 from "node:http2";

export type PushPayload = {
  title: string;
  body: string;
  /** Pastille rouge sur l’icône. Défaut 1. */
  badge?: number;
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

/** Exposé pour logs / diagnostic Telegram (pas de secrets). */
export function apnsHostLabel(): string {
  const cfg = readConfig();
  if (!cfg) return "unconfigured";
  return cfg.production ? "api.push.apple.com" : "api.sandbox.push.apple.com";
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
  // Vercel colle parfois le PEM sur une ligne : rétablir les retours à la ligne.
  if (p8.includes("BEGIN PRIVATE KEY") && !p8.includes("\n")) {
    p8 = p8
      .replace("-----BEGIN PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----\n")
      .replace("-----END PRIVATE KEY-----", "\n-----END PRIVATE KEY-----");
    const body = p8
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\s+/g, "");
    const chunks = body.match(/.{1,64}/g) || [];
    p8 = `-----BEGIN PRIVATE KEY-----\n${chunks.join("\n")}\n-----END PRIVATE KEY-----\n`;
  } else if (!p8.includes("BEGIN PRIVATE KEY")) {
    const body = p8.replace(/\s+/g, "");
    const chunks = body.match(/.{1,64}/g) || [];
    p8 = `-----BEGIN PRIVATE KEY-----\n${chunks.join("\n")}\n-----END PRIVATE KEY-----\n`;
  }

  // TestFlight / App Store = production. Un APNS_PRODUCTION=0 en prod Vercel
  // cassait tous les envois (BadDeviceToken / InvalidProviderToken).
  const forceSandbox = (process.env.APNS_FORCE_SANDBOX || "").trim() === "1";
  const onVercelProd = process.env.VERCEL_ENV === "production";
  const production = forceSandbox
    ? false
    : onVercelProd
      ? true
      : (process.env.APNS_PRODUCTION || "0").trim() === "1";

  return {
    keyId: process.env.APNS_KEY_ID!.trim(),
    teamId: process.env.APNS_TEAM_ID!.trim(),
    bundleId: (process.env.APNS_BUNDLE_ID || "app.myswym.ios").trim(),
    p8,
    production,
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

function postApnsHttp2(
  host: string,
  path: string,
  headers: Record<string, string>,
  body: string,
): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const client = http2.connect(`https://${host}`);
    client.on("error", (err) => {
      try { client.close(); } catch { /* ignore */ }
      reject(err);
    });

    const req = client.request({
      ":method": "POST",
      ":path": path,
      ...headers,
    });

    let status = 0;
    let data = "";
    req.setEncoding("utf8");
    req.on("response", (h) => {
      status = Number(h[":status"] || 0);
    });
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => {
      try { client.close(); } catch { /* ignore */ }
      resolve({ status, text: data });
    });
    req.on("error", (err) => {
      try { client.close(); } catch { /* ignore */ }
      reject(err);
    });
    req.end(body);
  });
}

export async function sendApnsToDevice(
  deviceToken: string,
  payload: PushPayload,
): Promise<{ ok: boolean; status?: number; reason?: string; host?: string }> {
  const cfg = readConfig();
  if (!cfg) return { ok: false, reason: "apns_not_configured" };
  const token = String(deviceToken || "").replace(/\s+/g, "").toLowerCase();
  if (!token || token.length < 64) return { ok: false, reason: "bad_token" };

  const host = cfg.production ? "api.push.apple.com" : "api.sandbox.push.apple.com";
  let jwt: string;
  try {
    jwt = createApnsJwt(cfg);
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? `jwt:${e.message}` : "jwt_failed",
      host,
    };
  }

  const badgeRaw = payload.badge;
  const badge = Number.isFinite(badgeRaw) ? Math.max(0, Math.floor(Number(badgeRaw))) : 1;
  const body = JSON.stringify({
    aps: {
      alert: {
        title: String(payload.title || "").slice(0, 80),
        body: String(payload.body || "").slice(0, 180),
      },
      sound: "default",
      badge,
    },
    ...(payload.data || {}),
  });

  try {
    const res = await postApnsHttp2(
      host,
      `/3/device/${token}`,
      {
        authorization: `bearer ${jwt}`,
        "apns-topic": cfg.bundleId,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "content-type": "application/json",
      },
      body,
    );
    if (res.status >= 200 && res.status < 300) {
      return { ok: true, status: res.status, host };
    }
    let reason = (res.text || "").slice(0, 200);
    try {
      reason = JSON.parse(res.text)?.reason || reason;
    } catch { /* ignore */ }
    if (!reason) reason = `http_${res.status}`;
    return { ok: false, status: res.status, reason, host };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : "fetch_failed",
      host,
    };
  }
}
