/**
 * Monitoring coûts Arthur (Phase G).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { arthurLog } from "../logging.js";
import { trackAiEvent } from "../tracking.js";

export interface CostBudgetConfig {
  dayUsd: number;
  monthUsd: number;
  softRatio: number;
}

export function getCostBudgetConfig(): CostBudgetConfig {
  return {
    dayUsd: Math.max(0, Number(process.env.ARTHUR_COST_BUDGET_DAY_USD) || 25),
    monthUsd: Math.max(0, Number(process.env.ARTHUR_COST_BUDGET_MONTH_USD) || 400),
    softRatio: Math.min(
      1,
      Math.max(0.5, Number(process.env.ARTHUR_COST_SOFT_RATIO) || 0.8),
    ),
  };
}

export type CostBudgetStatus =
  | { level: "ok"; dayCost: number; monthCost: number }
  | { level: "soft"; dayCost: number; monthCost: number; reason: string }
  | { level: "hard"; dayCost: number; monthCost: number; reason: string };

export async function getSpentUsd(
  admin: SupabaseClient,
  sinceIso: string,
): Promise<number> {
  try {
    const { data } = await admin
      .from("ai_events")
      .select("cost_estimate")
      .eq("event_type", "ai_response")
      .gte("created_at", sinceIso)
      .limit(5000);
    return Number(
      (data || [])
        .reduce((a, r) => a + (Number(r.cost_estimate) || 0), 0)
        .toFixed(6),
    );
  } catch {
    return 0;
  }
}

export async function checkCostBudget(
  admin: SupabaseClient,
): Promise<CostBudgetStatus> {
  const cfg = getCostBudgetConfig();
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );

  const dayCost = await getSpentUsd(admin, dayStart.toISOString());
  const monthCost = await getSpentUsd(admin, monthStart.toISOString());

  if (dayCost >= cfg.dayUsd || monthCost >= cfg.monthUsd) {
    return {
      level: "hard",
      dayCost,
      monthCost,
      reason: dayCost >= cfg.dayUsd ? "day_budget" : "month_budget",
    };
  }
  if (
    dayCost >= cfg.dayUsd * cfg.softRatio ||
    monthCost >= cfg.monthUsd * cfg.softRatio
  ) {
    return {
      level: "soft",
      dayCost,
      monthCost,
      reason:
        dayCost >= cfg.dayUsd * cfg.softRatio
          ? "day_soft"
          : "month_soft",
    };
  }
  return { level: "ok", dayCost, monthCost };
}

export async function bumpCostDaily(
  admin: SupabaseClient,
  patch: {
    requests?: number;
    tokensIn?: number;
    tokensOut?: number;
    costUsd?: number;
    offline?: boolean;
    rateLimited?: boolean;
    takeover?: boolean;
  },
): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  try {
    const { data: row } = await admin
      .from("ai_cost_daily")
      .select("*")
      .eq("day", day)
      .maybeSingle();

    const next = {
      day,
      requests: (row?.requests || 0) + (patch.requests || 0),
      tokens_in: (row?.tokens_in || 0) + (patch.tokensIn || 0),
      tokens_out: (row?.tokens_out || 0) + (patch.tokensOut || 0),
      cost_usd: Number(row?.cost_usd || 0) + (patch.costUsd || 0),
      offline_count: (row?.offline_count || 0) + (patch.offline ? 1 : 0),
      rate_limited_count:
        (row?.rate_limited_count || 0) + (patch.rateLimited ? 1 : 0),
      takeover_count: (row?.takeover_count || 0) + (patch.takeover ? 1 : 0),
      updated_at: new Date().toISOString(),
    };

    await admin.from("ai_cost_daily").upsert(next, { onConflict: "day" });
  } catch (err) {
    arthurLog("warn", "cost_daily_bump_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
  }
}

export async function emitCostBudgetEvent(
  admin: SupabaseClient,
  status: CostBudgetStatus,
): Promise<void> {
  if (status.level === "ok") return;
  await trackAiEvent(admin, {
    eventType: status.level === "hard" ? "cost_budget_hard" : "cost_budget_soft",
    metadata: {
      day_cost: status.dayCost,
      month_cost: status.monthCost,
      reason: status.reason,
    },
  });
}

export async function buildCostReport(
  admin: SupabaseClient,
  days = 14,
): Promise<{
  budget: CostBudgetConfig;
  status: CostBudgetStatus;
  daily: Record<string, unknown>[];
}> {
  const budget = getCostBudgetConfig();
  const status = await checkCostBudget(admin);
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const { data: daily } = await admin
    .from("ai_cost_daily")
    .select("*")
    .gte("day", since)
    .order("day", { ascending: false })
    .limit(days);
  return { budget, status, daily: daily || [] };
}
