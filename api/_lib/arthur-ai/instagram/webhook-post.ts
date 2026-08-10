/**
 * POST handler Instagram webhook (import dynamique depuis webhook.ts).
 * Séparé pour que le GET Meta Verify reste un bundle léger.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createArthurAdminClient } from "../supabase.js";
import { arthurLog } from "../logging.js";
import { handleInstagramWebhookBody } from "./handler.js";
import {
  rawBodyFromRequest,
  verifyMetaSignature,
  isMetaSignatureSkipEnabled,
} from "./parse-webhook.js";
import {
  buildMockWebhookPayload,
  isInstagramMockMode,
} from "./mock.js";
import { hasInstagramCredentials } from "./meta-client.js";
import {
  canLiveSendInstagram,
  isInstagramShadowMode,
} from "../shadow/mode.js";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function headerValue(
  headers: Headers | Record<string, string | string[] | undefined>,
  name: string,
): string {
  if (typeof (headers as Headers).get === "function") {
    return String((headers as Headers).get(name) || "").trim();
  }
  const h = headers as Record<string, string | string[] | undefined>;
  const key = Object.keys(h).find((k) => k.toLowerCase() === name.toLowerCase());
  const v = key ? h[key] : undefined;
  return String(Array.isArray(v) ? v[0] : v || "").trim();
}

/**
 * Chemin Web Request (préféré) — rawBody/rawBuf = bytes Meta.
 */
export async function handleInstagramWebhookPostWeb(
  request: Request,
  body: unknown,
  rawBody: string,
  rawBuf?: Buffer,
): Promise<Response> {
  try {
    const mockHeader = headerValue(request.headers, "x-myswym-instagram-mock");
    const mockSecret = (process.env.ARTHUR_AI_INTERNAL_SECRET || "").trim();
    const allowMockPost =
      isInstagramMockMode() &&
      mockSecret &&
      mockHeader &&
      mockHeader === mockSecret;

    let payload = body;

    if (
      allowMockPost &&
      payload &&
      typeof payload === "object" &&
      (payload as { mock?: boolean }).mock === true
    ) {
      const b = payload as {
        senderId?: string;
        text?: string;
        referral?: {
          source?: string;
          campaign?: string;
          reel_id?: string;
          ref?: string;
        };
      };
      payload = buildMockWebhookPayload({
        senderId: b.senderId || "ig_mock_sender",
        text: b.text || "Bonjour",
        referral: b.referral,
      });
    }

    if (!allowMockPost) {
      if (!hasInstagramCredentials() && !isInstagramMockMode()) {
        arthurLog("error", "instagram_credentials_missing", {});
        const hasSecret = Boolean((process.env.META_APP_SECRET || "").trim());
        if (!hasSecret) {
          return jsonResponse(503, {
            ok: false,
            error: "META_APP_SECRET missing",
          });
        }
      }

      const signature = headerValue(request.headers, "x-hub-signature-256");
      const rawForHmac = rawBuf || Buffer.from(rawBody, "utf8");
      const secretLen = (process.env.META_APP_SECRET || "").trim().length;
      const appId = (process.env.META_APP_ID || "").trim();
      const verified = verifyMetaSignature(rawForHmac, signature);
      if (!verified.ok) {
        // H1 Shadow : accepter les DM même si META_APP_SECRET ne matche
        // pas encore (pas d'envoi live). Dès live send ON → HMAC obligatoire.
        const skip =
          isMetaSignatureSkipEnabled() ||
          (isInstagramShadowMode() && !canLiveSendInstagram());
        arthurLog("warn", "instagram_bad_signature", {
          has_signature: Boolean(signature),
          raw_len: rawForHmac.length,
          used_stream: Boolean(rawBody && rawBody.length),
          secret_len: secretLen,
          sig_len: signature.toLowerCase().startsWith("sha256=")
            ? signature.length - "sha256=".length
            : signature.length,
          web_request: true,
          app_id_suffix: appId ? appId.slice(-4) : null,
          expected_prefix: verified.expectedPrefix || null,
          received_prefix: verified.receivedPrefix || null,
          skip_enabled: skip,
          shadow: isInstagramShadowMode(),
          live_send: canLiveSendInstagram(),
        });
        if (!skip) {
          return jsonResponse(403, { ok: false, error: "Invalid signature" });
        }
        arthurLog("warn", "instagram_signature_skipped", {
          reason: isMetaSignatureSkipEnabled()
            ? "ARTHUR_META_SKIP_SIGNATURE"
            : "shadow_mode_soft_verify",
        });
      }
    }

    const admin = createArthurAdminClient();
    const result = await handleInstagramWebhookBody(admin, payload);

    return jsonResponse(200, {
      ok: true,
      handled: result.handled,
      replies: result.replies,
      shadowed: result.shadowed,
      shadow: true,
      mock: isInstagramMockMode(),
      errors: result.errors.length ? result.errors : undefined,
    });
  } catch (err) {
    arthurLog("error", "instagram_webhook_exception", {
      name: err instanceof Error ? err.name : "Error",
    });
    return jsonResponse(200, { ok: false, error: "processed_with_error" });
  }
}

/**
 * Legacy @vercel/node adapter (tests / fallback).
 */
export async function handleInstagramWebhookPost(
  req: VercelRequest,
  res: VercelResponse,
  rawBody?: string,
) {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers || {})) {
    if (v == null) continue;
    headers.set(k, Array.isArray(v) ? String(v[0]) : String(v));
  }
  const fakeReq = {
    headers,
  } as unknown as Request;
  const response = await handleInstagramWebhookPostWeb(
    fakeReq,
    req.body,
    rawBody || rawBodyFromRequest(req.body),
  );
  const text = await response.text();
  res.statusCode = response.status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.end(text);
}
