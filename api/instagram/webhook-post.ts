/**
 * POST handler Instagram webhook (import dynamique depuis webhook.ts).
 * Séparé pour que le GET Meta Verify reste un bundle léger.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createArthurAdminClient } from "../_lib/arthur-ai/supabase.js";
import { arthurLog } from "../_lib/arthur-ai/logging.js";
import { handleInstagramWebhookBody } from "../_lib/arthur-ai/instagram/handler.js";
import {
  rawBodyFromRequest,
  verifyMetaSignature,
} from "../_lib/arthur-ai/instagram/parse-webhook.js";
import {
  buildMockWebhookPayload,
  isInstagramMockMode,
} from "../_lib/arthur-ai/instagram/mock.js";
import { hasInstagramCredentials } from "../_lib/arthur-ai/instagram/meta-client.js";

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
 * Chemin Web Request (préféré) — rawBody = await request.text().
 */
export async function handleInstagramWebhookPostWeb(
  request: Request,
  body: unknown,
  rawBody: string,
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
      const raw = rawBodyFromRequest(payload, rawBody);
      const secretLen = (process.env.META_APP_SECRET || "").trim().length;
      if (!verifyMetaSignature(raw, signature)) {
        arthurLog("warn", "instagram_bad_signature", {
          has_signature: Boolean(signature),
          raw_len: raw.length,
          used_stream: Boolean(rawBody && rawBody.length),
          secret_len: secretLen,
          sig_len: signature.startsWith("sha256=")
            ? signature.length - "sha256=".length
            : signature.length,
          web_request: true,
        });
        return jsonResponse(403, { ok: false, error: "Invalid signature" });
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
