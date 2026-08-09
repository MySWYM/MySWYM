/**
 * GET|POST /api/admin/arthur-followups — Conversion Engine F2
 *
 * GET  — impact report + liste
 * POST actions :
 *   plan | plan_dry_run | approve | send | cancel
 *
 * Envoi Instagram : bloqué sauf ARTHUR_FOLLOWUPS_SEND=1
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createArthurAdminClient } from "../_lib/arthur-ai/supabase.js";
import { resolveArthurAdminAuth } from "../_lib/arthur-ai/growth/admin-auth.js";
import {
  planFollowupsForLeads,
  approveFollowup,
  sendApprovedFollowup,
  buildFollowupImpactReport,
  resolveFollowupSendMode,
  isFollowupSendEnabled,
} from "../_lib/arthur-ai/conversion/index.js";
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

      if (action === "plan" || action === "plan_dry_run") {
        const result = await planFollowupsForLeads(admin, {
          limit: Number(body.limit) || 50,
          dryRun: action === "plan_dry_run",
        });
        return res.status(200).json({
          ok: true,
          action,
          send_gate: resolveFollowupSendMode(),
          ...result,
        });
      }

      if (action === "approve") {
        const id = asNonEmptyString(body.followupId, 64);
        if (!id || !isUuid(id)) {
          return res.status(400).json({ ok: false, error: "followupId uuid requis" });
        }
        const result = await approveFollowup(admin, id);
        if (!result.ok) {
          return res.status(400).json({ ok: false, error: result.error });
        }
        return res.status(200).json({ ok: true, action: "approve", followupId: id });
      }

      if (action === "send") {
        const id = asNonEmptyString(body.followupId, 64);
        if (!id || !isUuid(id)) {
          return res.status(400).json({ ok: false, error: "followupId uuid requis" });
        }
        if (!isFollowupSendEnabled()) {
          return res.status(403).json({
            ok: false,
            error:
              "Envois désactivés. Valider puis définir ARTHUR_FOLLOWUPS_SEND=1 (optionnel ARTHUR_FOLLOWUPS_SEND_MOCK=1).",
            send_gate: "blocked",
          });
        }
        const result = await sendApprovedFollowup(admin, id);
        if (!result.ok) {
          return res.status(400).json({
            ok: false,
            error: result.error,
            send_mode: result.send_mode,
          });
        }
        return res.status(200).json({
          ok: true,
          action: "send",
          followupId: id,
          send_mode: result.send_mode,
          messageId: result.messageId,
        });
      }

      if (action === "cancel") {
        const id = asNonEmptyString(body.followupId, 64);
        if (!id || !isUuid(id)) {
          return res.status(400).json({ ok: false, error: "followupId uuid requis" });
        }
        const now = new Date().toISOString();
        const { error } = await admin
          .from("ai_followups")
          .update({ status: "cancelled", updated_at: now })
          .eq("id", id)
          .in("status", ["planned", "approved", "queued"]);
        if (error) {
          return res.status(400).json({ ok: false, error: error.message });
        }
        return res.status(200).json({ ok: true, action: "cancel", followupId: id });
      }

      return res.status(400).json({
        ok: false,
        error: "action invalide (plan | plan_dry_run | approve | send | cancel)",
      });
    }

    if (req.method !== "GET") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const days = Number(req.query?.days) || 30;
    const report = await buildFollowupImpactReport(admin, days);
    return res.status(200).json({
      ok: true,
      days,
      auth_via: auth.via,
      note: "F2 — mesure d’impact ; envois Instagram gated (ARTHUR_FOLLOWUPS_SEND)",
      ...report,
    });
  } catch (err) {
    arthurLog("error", "admin_arthur_followups_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
}
