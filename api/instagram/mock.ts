/**
 * POST /api/instagram/mock — injecte un DM local sans Meta.
 * Header: x-myswym-instagram-mock = ARTHUR_AI_INTERNAL_SECRET
 * Body: { senderId, text, referral? }
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createArthurAdminClient } from "../_lib/arthur-ai/supabase.js";
import { handleInstagramWebhookBody } from "../_lib/arthur-ai/instagram/handler.js";
import {
  buildMockWebhookPayload,
  getMockOutbound,
  isInstagramMockMode,
} from "../_lib/arthur-ai/instagram/mock.js";
import { asNonEmptyString } from "../_lib/arthur-ai/security.js";
import { arthurLog } from "../_lib/arthur-ai/logging.js";

export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const secret = (process.env.ARTHUR_AI_INTERNAL_SECRET || "").trim();
  const header = String(req.headers["x-myswym-instagram-mock"] || "").trim();
  if (!secret || header !== secret) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  if (!isInstagramMockMode()) {
    return res.status(400).json({
      ok: false,
      error: "Set INSTAGRAM_MOCK=1 (or omit Meta credentials) for mock endpoint",
    });
  }

  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const senderId = asNonEmptyString(body.senderId, 128) || "ig_mock_sender";
    const text = asNonEmptyString(body.text, 4000);
    if (!text) {
      return res.status(400).json({ ok: false, error: "text requis" });
    }

    const referral =
      body.referral && typeof body.referral === "object"
        ? (body.referral as {
            source?: string;
            campaign?: string;
            reel_id?: string;
            ref?: string;
          })
        : undefined;

    const payload = buildMockWebhookPayload({ senderId, text, referral });
    const admin = createArthurAdminClient();
    const result = await handleInstagramWebhookBody(admin, payload);

    return res.status(200).json({
      ok: true,
      ...result,
      outbound: getMockOutbound().slice(-3),
    });
  } catch (err) {
    arthurLog("error", "instagram_mock_exception", {
      name: err instanceof Error ? err.name : "Error",
    });
    return res.status(500).json({ ok: false, error: "mock_failed" });
  }
}
