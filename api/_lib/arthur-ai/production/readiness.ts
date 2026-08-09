/**
 * Rapport readiness production (Phase G).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getArthurFeatureFlags } from "./flags.js";
import { getRateLimitConfig } from "./rate-limit.js";
import { buildCostReport, getCostBudgetConfig } from "./cost-monitor.js";
import { listActiveTakeovers } from "./takeover.js";
import { hasOpenAiApiKey } from "./offline.js";
import { isFollowupSendEnabled, resolveFollowupSendMode } from "../conversion/send.js";
import { hasInstagramCredentials } from "../instagram/meta-client.js";
import {
  isInstagramShadowMode,
  canLiveSendInstagram,
} from "../shadow/mode.js";

export async function buildReadinessReport(
  admin: SupabaseClient,
): Promise<Record<string, unknown>> {
  const flags = getArthurFeatureFlags();
  const rate = getRateLimitConfig();
  const cost = await buildCostReport(admin, 14);
  const takeovers = await listActiveTakeovers(admin, 30);

  const checks = [
    {
      id: "openai_key",
      ok: hasOpenAiApiKey() || process.env.ARTHUR_AI_MOCK === "1",
      detail: hasOpenAiApiKey() ? "present" : "missing (mock ok)",
    },
    {
      id: "supabase_service",
      ok: Boolean(
        (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim() &&
          (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim(),
      ),
      detail: "service_role + url",
    },
    {
      id: "followups_send_gated",
      ok: !isFollowupSendEnabled(),
      detail: isFollowupSendEnabled()
        ? "WARNING: ARTHUR_FOLLOWUPS_SEND=1"
        : "blocked (expected until validation)",
    },
    {
      id: "instagram_shadow_mode",
      ok: isInstagramShadowMode() || !canLiveSendInstagram(),
      detail: isInstagramShadowMode()
        ? "shadow ON (no auto DM)"
        : canLiveSendInstagram()
          ? "WARNING: live send enabled"
          : "shadow off but live gate closed",
    },
    {
      id: "instagram_live_send_off",
      ok: !canLiveSendInstagram(),
      detail: canLiveSendInstagram()
        ? "WARNING: ARTHUR_INSTAGRAM_LIVE_SEND active"
        : "live send blocked (H1)",
    },
    {
      id: "instagram_credentials",
      ok: hasInstagramCredentials() || process.env.INSTAGRAM_MOCK === "1",
      detail: hasInstagramCredentials() ? "present" : "mock/missing",
    },
    {
      id: "admin_secret",
      ok: Boolean((process.env.ARTHUR_ADMIN_SECRET || "").trim()),
      detail: "ARTHUR_ADMIN_SECRET",
    },
    {
      id: "cost_budget_ok",
      ok: cost.status.level !== "hard",
      detail: `${cost.status.level} day=$${cost.status.dayCost}`,
    },
  ];

  const ready_for_scale =
    checks.filter((c) => c.id !== "followups_send_gated").every((c) => c.ok) &&
    !flags.offline_force &&
    flags.enabled;

  return {
    phase: "G",
    note: "Production readiness — envois auto non activés sans validation",
    flags,
    rate_limits: rate,
    cost_budget: getCostBudgetConfig(),
    cost,
    followups_send_mode: resolveFollowupSendMode(),
    instagram_shadow: isInstagramShadowMode(),
    instagram_live_send: canLiveSendInstagram(),
    active_takeovers: takeovers,
    active_takeover_count: takeovers.length,
    checks,
    ready_for_scale,
    scaling_checklist: [
      "Surveiller ai_cost_daily et soft/hard budget",
      "Ajuster ARTHUR_RATE_PER_HOUR / DAY selon charge",
      "Tester offline (ARTHUR_FLAG_OFFLINE=1) avant incident",
      "Process human takeover documenté (admin release)",
      "Ne pas activer ARTHUR_FOLLOWUPS_SEND avant validation F2 métriques",
      "Ne pas activer ARTHUR_INSTAGRAM_LIVE_SEND — garder Shadow Mode H1",
      "Valider propositions shadow sur /admin/arthur-shadow",
      "Vercel maxDuration api/ai/* déjà 60s — surveiller timeouts",
      "Séparer mock Instagram en staging",
    ],
  };
}
