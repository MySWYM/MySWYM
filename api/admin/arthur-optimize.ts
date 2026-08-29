/**
 * GET|POST /api/admin/arthur-optimize, Optimization Loop F3
 *
 * GET , dashboard qualité / CTA / insights / funnel proxy
 * POST, analyze_batch | (refuse send / auto followups)
 *
 * Les envois automatiques restent désactivés.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createArthurAdminClient } from "../_lib/arthur-ai/supabase.js";
import { resolveArthurAdminAuth } from "../_lib/arthur-ai/growth/admin-auth.js";
import {
  buildOptimizationReport,
  batchAnalyzeRecentConversations,
  analyzeAndPersistConversation,
} from "../_lib/arthur-ai/optimization/index.js";
import { isFollowupSendEnabled } from "../_lib/arthur-ai/conversion/send.js";
import { arthurLog } from "../_lib/arthur-ai/logging.js";
import { asNonEmptyString, isUuid } from "../_lib/arthur-ai/security.js";

export const config = {
  maxDuration: 60,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await resolveArthurAdminAuth(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error });
  }

  try {
    const admin = createArthurAdminClient();

    if (req.method === "POST") {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const action = String(body.action || "");

      if (action === "send" || action === "enable_auto_sends" || action === "followup_send") {
        return res.status(403).json({
          ok: false,
          error:
            "F3 n’active pas les envois automatiques. Utiliser /admin/arthur-followups après validation F2.",
          auto_sends_enabled: isFollowupSendEnabled(),
        });
      }

      if (action === "analyze_batch") {
        const result = await batchAnalyzeRecentConversations(admin, {
          limit: Number(body.limit) || 30,
          days: Number(body.days) || 14,
        });
        return res.status(200).json({ action, ...result, ok: true });
      }

      if (action === "analyze_one") {
        const id = asNonEmptyString(body.conversationId, 64);
        if (!id || !isUuid(id)) {
          return res.status(400).json({ ok: false, error: "conversationId uuid requis" });
        }
        const result = await analyzeAndPersistConversation(admin, id);
        return res.status(200).json({ action, conversationId: id, ...result, ok: true });
      }

      return res.status(400).json({
        ok: false,
        error: "action invalide (analyze_batch | analyze_one)",
      });
    }

    if (req.method !== "GET") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const days = Number(req.query?.days) || 30;
    const report = await buildOptimizationReport(admin, days);
    return res.status(200).json({
      days,
      auth_via: auth.via,
      ...report,
      ok: true,
    });
  } catch (err) {
    arthurLog("error", "admin_arthur_optimize_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
}
