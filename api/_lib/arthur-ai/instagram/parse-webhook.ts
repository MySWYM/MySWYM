/**
 * Parsing webhook Meta Instagram + attribution marketing.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { arthurLog } from "../logging.js";
import { isInstagramMockMode } from "./mock.js";

export interface InstagramAttribution {
  source: string | null;
  campaign: string | null;
  reel_id: string | null;
  keyword: string | null;
  ref: string | null;
}

export interface ParsedInstagramMessage {
  senderId: string;
  recipientId: string;
  text: string;
  mid: string | null;
  timestamp: number | null;
  isEcho: boolean;
  attribution: InstagramAttribution;
}

export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | undefined,
): boolean {
  if (isInstagramMockMode()) return true;

  const secret = (process.env.META_APP_SECRET || "").trim();
  if (!secret) {
    arthurLog("error", "meta_app_secret_missing", {});
    return false;
  }
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const received = signatureHeader.slice("sha256=".length);
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(received, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function verifyWebhookChallenge(query: Record<string, string | string[] | undefined>): {
  ok: boolean;
  challenge?: string;
  status: number;
} {
  const mode = String(query["hub.mode"] || "");
  const token = String(query["hub.verify_token"] || "");
  const challenge = String(query["hub.challenge"] || "");
  const expected = (process.env.META_VERIFY_TOKEN || "").trim();

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return { ok: true, challenge, status: 200 };
  }

  // Mock local : accepter si INSTAGRAM_MOCK et token "mock"
  if (
    isInstagramMockMode() &&
    mode === "subscribe" &&
    (token === expected || token === "mock") &&
    challenge
  ) {
    return { ok: true, challenge, status: 200 };
  }

  return { ok: false, status: 403 };
}

export function parseInstagramWebhook(body: unknown): ParsedInstagramMessage[] {
  if (!body || typeof body !== "object") return [];
  const root = body as { object?: string; entry?: unknown[] };
  if (root.object !== "instagram" && root.object !== "page") {
    // Certains setups Instagram passent object=instagram ; Messenger page
    if (root.object && root.object !== "instagram") return [];
  }

  const out: ParsedInstagramMessage[] = [];
  const entries = Array.isArray(root.entry) ? root.entry : [];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const messaging = (entry as { messaging?: unknown[] }).messaging;
    if (!Array.isArray(messaging)) continue;

    for (const event of messaging) {
      if (!event || typeof event !== "object") continue;
      const ev = event as Record<string, unknown>;
      const sender = ev.sender as { id?: string } | undefined;
      const recipient = ev.recipient as { id?: string } | undefined;
      const message = ev.message as Record<string, unknown> | undefined;
      if (!sender?.id || !message) continue;

      const isEcho = message.is_echo === true;
      const text = typeof message.text === "string" ? message.text.trim() : "";
      if (!text) continue;

      out.push({
        senderId: String(sender.id),
        recipientId: String(recipient?.id || ""),
        text: text.slice(0, 4000),
        mid: typeof message.mid === "string" ? message.mid : null,
        timestamp: typeof ev.timestamp === "number" ? ev.timestamp : null,
        isEcho,
        attribution: extractAttribution(ev, text),
      });
    }
  }

  return out;
}

function extractAttribution(
  event: Record<string, unknown>,
  text: string,
): InstagramAttribution {
  const message = (event.message || {}) as Record<string, unknown>;
  const referral = (message.referral || event.referral || {}) as Record<string, unknown>;
  const postback = (event.postback || {}) as Record<string, unknown>;
  const ads = (referral.ads_context_data || {}) as Record<string, unknown>;

  const ref =
    (typeof referral.ref === "string" && referral.ref) ||
    (typeof postback.payload === "string" && postback.payload) ||
    null;

  let campaign: string | null = null;
  let reel_id: string | null = null;
  let source: string | null = null;

  if (typeof referral.source === "string") source = referral.source;
  if (typeof ads.post_id === "string") reel_id = ads.post_id;
  if (typeof ads.ad_title === "string") campaign = ads.ad_title;

  // ref format libre : campaign:summer|reel:123|kw:PLAN
  if (ref) {
    const parts = Object.fromEntries(
      ref.split("|").map((p) => {
        const [k, ...rest] = p.split(":");
        return [k.trim().toLowerCase(), rest.join(":").trim()];
      }),
    );
    if (parts.campaign) campaign = parts.campaign;
    if (parts.reel || parts.reel_id) reel_id = parts.reel || parts.reel_id;
    if (parts.source) source = parts.source;
  }

  const keyword = detectKeyword(text);

  if (!source) source = "instagram";
  if (!campaign && keyword) campaign = `keyword_${keyword.toLowerCase()}`;

  return {
    source,
    campaign,
    reel_id,
    keyword,
    ref,
  };
}

const KEYWORD_RE = /\b(PLAN|COACH|MYSWYM|PREMIUM|ESSAI|TRIATHLON)\b/i;

export function detectKeyword(text: string): string | null {
  const m = text.match(KEYWORD_RE);
  return m ? m[1].toUpperCase() : null;
}

/** Corps brut pour signature — best-effort sur Vercel (body déjà parsé). */
export function rawBodyFromRequest(body: unknown, rawFallback?: string): string {
  if (typeof rawFallback === "string" && rawFallback.length) return rawFallback;
  if (typeof body === "string") return body;
  try {
    return JSON.stringify(body ?? {});
  } catch {
    return "";
  }
}
