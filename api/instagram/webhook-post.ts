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

export async function handleInstagramWebhookPost(
  req: VercelRequest,
  res: VercelResponse,
  rawBody?: string,
) {
  try {
    const mockHeader = String(req.headers["x-myswym-instagram-mock"] || "").trim();
    const mockSecret = (process.env.ARTHUR_AI_INTERNAL_SECRET || "").trim();
    const allowMockPost =
      isInstagramMockMode() &&
      mockSecret &&
      mockHeader &&
      mockHeader === mockSecret;

    let body = req.body;

    if (
      allowMockPost &&
      body &&
      typeof body === "object" &&
      (body as { mock?: boolean }).mock === true
    ) {
      const b = body as {
        senderId?: string;
        text?: string;
        referral?: {
          source?: string;
          campaign?: string;
          reel_id?: string;
          ref?: string;
        };
      };
      body = buildMockWebhookPayload({
        senderId: b.senderId || "ig_mock_sender",
        text: b.text || "Bonjour",
        referral: b.referral,
      });
    }

    if (!allowMockPost) {
      if (!hasInstagramCredentials() && !isInstagramMockMode()) {
        arthurLog("error", "instagram_credentials_missing", {});
        // Accepter le POST Meta même sans token d’envoi si secret+verify présents
        // (Shadow H1 n’envoie pas). Exiger au minimum META_APP_SECRET pour signature.
        const hasSecret = Boolean((process.env.META_APP_SECRET || "").trim());
        if (!hasSecret) {
          return res.status(503).json({
            ok: false,
            error: "META_APP_SECRET missing",
          });
        }
      }

      const signature = String(req.headers["x-hub-signature-256"] || "");
      // Prefer bytes Meta a réellement signés (raw stream). Fallback JSON.stringify.
      const raw = rawBodyFromRequest(body, rawBody);
      if (!verifyMetaSignature(raw, signature)) {
        arthurLog("warn", "instagram_bad_signature", {
          has_signature: Boolean(signature),
          raw_len: raw.length,
          used_stream: Boolean(rawBody && rawBody.length),
        });
        return res.status(403).json({ ok: false, error: "Invalid signature" });
      }
    }

    const admin = createArthurAdminClient();
    const result = await handleInstagramWebhookBody(admin, body);

    return res.status(200).json({
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
    return res.status(200).json({ ok: false, error: "processed_with_error" });
  }
}
