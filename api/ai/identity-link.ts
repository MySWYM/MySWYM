/**
 * POST /api/ai/identity-link — rattache un IGSID à un compte MySWYM authentifié.
 * Jamais appelé depuis le webhook Instagram seul.
 *
 * Body: { provider: "instagram", externalUserId: "..." }
 * Auth: Bearer JWT Supabase
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createArthurAdminClient, createArthurUserClient } from "../_lib/arthur-ai/supabase.js";
import { asNonEmptyString, isUuid } from "../_lib/arthur-ai/security.js";
import { verifyIdentityLink } from "../_lib/arthur-ai/instagram/identity.js";
import { trackAiEvent } from "../_lib/arthur-ai/tracking.js";
import { markLeadSignupFromIdentity } from "../_lib/arthur-ai/growth/attribution.js";
import { markFollowupConverted } from "../_lib/arthur-ai/conversion/outcomes.js";
import { attributeCtaConversion } from "../_lib/arthur-ai/optimization/cta.js";
import { arthurLog } from "../_lib/arthur-ai/logging.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const authHeader = String(req.headers.authorization || "");
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ ok: false, error: "Non authentifié" });
  }

  try {
    const userClient = createArthurUserClient(match[1].trim());
    const { data, error } = await userClient.auth.getUser();
    if (error || !data.user?.id || !isUuid(data.user.id)) {
      return res.status(401).json({ ok: false, error: "Session invalide" });
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const provider = asNonEmptyString(body.provider, 32) || "instagram";
    if (provider !== "instagram") {
      return res.status(400).json({ ok: false, error: "provider invalide" });
    }
    const externalUserId = asNonEmptyString(body.externalUserId, 256);
    if (!externalUserId) {
      return res.status(400).json({ ok: false, error: "externalUserId requis" });
    }

    const admin = createArthurAdminClient();
    const result = await verifyIdentityLink(admin, {
      provider: "instagram",
      externalUserId,
      userId: data.user.id,
      metadata: { linked_via: "api_identity_link" },
    });

    if (!result.ok) {
      return res.status(400).json({ ok: false, error: result.error });
    }

    await trackAiEvent(admin, {
      userId: data.user.id,
      eventType: "identity_link_verified",
      metadata: { provider: "instagram" },
    });

    await markLeadSignupFromIdentity(admin, {
      externalUserId,
      userId: data.user.id,
    });

    await markFollowupConverted(admin, {
      externalUserId,
      userId: data.user.id,
      outcome: "signup",
    });

    await attributeCtaConversion(admin, {
      externalUserId,
      userId: data.user.id,
      kind: "attributed_signup",
    });

    return res.status(200).json({ ok: true, linked: true });
  } catch (err) {
    arthurLog("error", "identity_link_endpoint_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
}
