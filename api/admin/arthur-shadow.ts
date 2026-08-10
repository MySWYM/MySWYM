/**
 * GET|POST /api/admin/arthur-shadow — Shadow Mode H1
 *
 * GET  — liste propositions + stats
 * POST — approve | reject | edit_approve | cancel
 *        (jamais send / enable live / followups)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createArthurAdminClient } from "../_lib/arthur-ai/supabase.js";
import { resolveArthurAdminAuth } from "../_lib/arthur-ai/growth/admin-auth.js";
import {
  listShadowProposals,
  reviewShadowProposal,
  buildShadowReport,
  listRecentInstagramEvents,
  isInstagramShadowMode,
  canLiveSendInstagram,
} from "../_lib/arthur-ai/shadow/index.js";
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

      if (
        action === "send" ||
        action === "enable_auto_sends" ||
        action === "activate_followups" ||
        action === "enable_live_send" ||
        action === "approve_and_send"
      ) {
        return res.status(403).json({
          ok: false,
          error:
            "H1 Shadow : envoi interdit. Validation ≠ send. Ne pas activer ARTHUR_FOLLOWUPS_SEND ni ARTHUR_INSTAGRAM_LIVE_SEND.",
          followups_send: isFollowupSendEnabled(),
          shadow: isInstagramShadowMode(),
          live_send: canLiveSendInstagram(),
        });
      }

      if (
        action === "approve" ||
        action === "reject" ||
        action === "edit_approve" ||
        action === "cancel"
      ) {
        const id = asNonEmptyString(body.proposalId, 64);
        if (!id || !isUuid(id)) {
          return res.status(400).json({ ok: false, error: "proposalId uuid requis" });
        }
        const result = await reviewShadowProposal(admin, {
          proposalId: id,
          action,
          notes: asNonEmptyString(body.notes, 1000),
          finalMessage: asNonEmptyString(body.finalMessage, 4000),
          reviewedBy: asNonEmptyString(body.reviewedBy, 120) || auth.via || "admin",
        });
        if (!result.ok) {
          return res.status(400).json({ ok: false, error: result.error });
        }
        return res.status(200).json({
          ok: true,
          action,
          proposalId: id,
          status: result.status,
          sent: false,
          note: "Validé sans envoi (Shadow H1)",
        });
      }

      return res.status(400).json({
        ok: false,
        error: "action invalide (approve | reject | edit_approve | cancel)",
      });
    }

    if (req.method !== "GET") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const days = Number(req.query?.days) || 14;
    const status =
      typeof req.query?.status === "string" ? req.query.status : "pending";
    const report = await buildShadowReport(admin, days);
    const proposals = await listShadowProposals(admin, {
      status: status === "all" ? undefined : status,
      days,
      limit: Number(req.query?.limit) || 50,
    });
    const recent_events = await listRecentInstagramEvents(admin, {
      days,
      limit: 30,
    });

    return res.status(200).json({
      ok: true,
      auth_via: auth.via,
      shadow_mode: isInstagramShadowMode(),
      live_send: canLiveSendInstagram(),
      followups_send: isFollowupSendEnabled(),
      note: "Shadow H1 — propositions sans envoi automatique",
      report,
      proposals,
      recent_events,
    });
  } catch (err) {
    arthurLog("error", "admin_arthur_shadow_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
}
