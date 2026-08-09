/**
 * GET|POST /api/admin/arthur-growth
 *
 * GET  — funnel + attribution + leads scorés
 * POST — { action: "sync" | "rebuild" } (pas de relances)
 *
 * Auth : x-myswym-arthur-admin ou JWT admin (voir admin-auth.ts)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createArthurAdminClient } from "../_lib/arthur-ai/supabase.js";
import { resolveArthurAdminAuth } from "../_lib/arthur-ai/growth/admin-auth.js";
import {
  buildAttributionReport,
  rebuildGrowthDaily,
  syncLeadLifecycleStatuses,
} from "../_lib/arthur-ai/growth/attribution.js";
import { arthurLog } from "../_lib/arthur-ai/logging.js";

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
      if (action === "sync") {
        const result = await syncLeadLifecycleStatuses(admin);
        return res.status(200).json({ ok: true, action: "sync", ...result });
      }
      if (action === "rebuild") {
        const days = Number(body.days) || 30;
        const result = await rebuildGrowthDaily(admin, days);
        return res.status(200).json({ ok: true, action: "rebuild", ...result });
      }
      return res.status(400).json({
        ok: false,
        error: 'action invalide (sync | rebuild). Pas de relances en F1.',
      });
    }

    if (req.method !== "GET") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const q = req.query || {};
    const days = Number(q.days) || 30;
    const syncFirst = String(q.sync || "") === "1";
    if (syncFirst) {
      await syncLeadLifecycleStatuses(admin);
    }

    const report = await buildAttributionReport(admin, {
      days,
      reel_id: typeof q.reel_id === "string" ? q.reel_id : null,
      campaign: typeof q.campaign === "string" ? q.campaign : null,
      source: typeof q.source === "string" ? q.source : null,
    });

    return res.status(200).json({
      ok: true,
      days,
      auth_via: auth.via,
      funnel: report.funnel,
      by_reel: report.by_reel,
      top_campaigns: report.top_campaigns,
      score_distribution: report.score_distribution,
      recent_leads: report.recent_leads,
      note: "F1 measure-only — aucune relance automatique",
    });
  } catch (err) {
    arthurLog("error", "admin_arthur_growth_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
    return res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
}
