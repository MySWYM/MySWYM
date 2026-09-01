/**
 * GET|POST /api/admin/arthur-readiness, Production Readiness Phase G
 *
 * GET , flags, coûts, rate limits, takeovers, checklist scaling
 * POST, release_takeover | (refuse enable_auto_sends)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createArthurAdminClient } from "../_lib/arthur-ai/supabase.js";
import { resolveArthurAdminAuth } from "../_lib/arthur-ai/growth/admin-auth.js";
import {
  buildReadinessReport,
  releaseHumanTakeover,
  listActiveTakeovers,
  startHumanTakeover,
  getArthurFeatureFlags,
} from "../_lib/arthur-ai/production/index.js";
import { isFollowupSendEnabled } from "../_lib/arthur-ai/conversion/send.js";
import { arthurLog } from "../_lib/arthur-ai/logging.js";
import { asNonEmptyString, isUuid } from "../_lib/arthur-ai/security.js";
import { buildAuthContext } from "../_lib/arthur-ai/security.js";
import { buildNageursReport, clampDays } from "../_lib/arthur-ai/product/nageurs-report.js";
import { buildNageurFiche } from "../_lib/arthur-ai/product/nageur-fiche.js";
import { searchNageurDirectory } from "../_lib/arthur-ai/product/nageur-search.js";
import { buildAdminOpsReport, moderateLandingReview } from "../_lib/arthur-ai/product/admin-ops.js";

export const config = {
  maxDuration: 60,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await resolveArthurAdminAuth(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error });
  }

  // Ping léger (login /admin), pas de 13e fonction Hobby.
  if (req.method === "GET" && String(req.query.ping || "") === "1") {
    return res.status(200).json({
      ok: true,
      via: auth.via,
      userId: auth.userId || null,
    });
  }

  try {
    const admin = createArthurAdminClient();

    if (req.method === "POST") {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const action = String(body.action || "");

      if (
        action === "enable_auto_sends" ||
        action === "send" ||
        action === "activate_followups"
      ) {
        return res.status(403).json({
          ok: false,
          error:
            "Activation des envois auto refusée ici. Validation explicite requise via ARTHUR_FOLLOWUPS_SEND après métriques F2.",
          followups_send: isFollowupSendEnabled(),
        });
      }

      if (action === "release_takeover") {
        const id = asNonEmptyString(body.conversationId, 64);
        if (!id || !isUuid(id)) {
          return res.status(400).json({ ok: false, error: "conversationId uuid requis" });
        }
        const result = await releaseHumanTakeover(
          admin,
          id,
          asNonEmptyString(body.notes, 500) || undefined,
        );
        if (!result.ok) {
          return res.status(400).json({ ok: false, error: result.error });
        }
        return res.status(200).json({ ok: true, action, conversationId: id });
      }

      if (action === "start_takeover") {
        const id = asNonEmptyString(body.conversationId, 64);
        if (!id || !isUuid(id)) {
          return res.status(400).json({ ok: false, error: "conversationId uuid requis" });
        }
        await startHumanTakeover(admin, {
          conversationId: id,
          auth: buildAuthContext({
            userId: null,
            externalUserId: asNonEmptyString(body.externalUserId, 256),
            channel: "instagram",
          }),
          reason: asNonEmptyString(body.reason, 200) || "admin",
          requestedBy: "admin",
          notes: asNonEmptyString(body.notes, 500) || undefined,
        });
        return res.status(200).json({ ok: true, action, conversationId: id });
      }

      if (action === "list_takeovers") {
        const rows = await listActiveTakeovers(admin, 50);
        return res.status(200).json({ ok: true, action, takeovers: rows });
      }

      if (action === "moderate_review") {
        const reviewId = asNonEmptyString(body.reviewId, 64);
        const status = String(body.status || "");
        if (!reviewId) {
          return res.status(400).json({ ok: false, error: "reviewId requis" });
        }
        const result = await moderateLandingReview(admin, {
          reviewId,
          status: status === "rejected" ? "rejected" : "published",
        });
        if (!result.ok) {
          return res.status(400).json({ ok: false, error: result.error });
        }
        return res.status(200).json({ ok: true, action });
      }

      return res.status(400).json({
        ok: false,
        error: "action invalide (release_takeover | start_takeover | list_takeovers | moderate_review)",
      });
    }

    if (req.method !== "GET") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    if (String(req.query.nageur_search || "").trim()) {
      const result = await searchNageurDirectory(admin, String(req.query.nageur_search));
      return res.status(200).json({ ok: true, nageur_search: true, ...result });
    }

    if (String(req.query.nageur || "").trim()) {
      const fiche = await buildNageurFiche(admin, {
        query: String(req.query.nageur),
      });
      return res.status(200).json({ ok: true, nageur: true, ...fiche });
    }

    if (String(req.query.ops || "") === "1") {
      const ops = await buildAdminOpsReport(admin);
      return res.status(200).json({ ok: true, ops: true, ...ops });
    }

    if (String(req.query.nageurs || "") === "1" || String(req.query.cockpit || "") === "1") {
      const report = await buildNageursReport(admin, {
        days: clampDays(req.query.days),
      });
      return res.status(200).json({ ok: true, nageurs: true, ...report });
    }

    const report = await buildReadinessReport(admin);
    return res.status(200).json({
      ok: true,
      auth_via: auth.via,
      flags_snapshot: getArthurFeatureFlags(),
      ...report,
    });
  } catch (err) {
    arthurLog("error", "admin_arthur_readiness_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
}
