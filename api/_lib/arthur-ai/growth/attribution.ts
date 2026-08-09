/**
 * Attribution Reel → DM → Lead → Signup → Premium + sync statuts.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { arthurLog } from "../logging.js";
import { isPremiumAccess, rescoreLeadById, scoreLead } from "./scoring.js";
import { trackAiEvent } from "../tracking.js";
import { markFollowupConverted } from "../conversion/outcomes.js";
import { attributeCtaConversion } from "../optimization/cta.js";

export interface AttributionFilters {
  days?: number;
  reel_id?: string | null;
  campaign?: string | null;
  source?: string | null;
}

export interface FunnelCounts {
  dm: number;
  leads: number;
  qualified: number;
  signup: number;
  premium: number;
}

export interface ReelAttributionRow {
  reel_id: string;
  campaign: string;
  source: string;
  dm: number;
  leads: number;
  qualified: number;
  signup: number;
  premium: number;
  avg_score: number | null;
  conversion_dm_to_signup: number | null;
  conversion_signup_to_premium: number | null;
  conversion_dm_to_premium: number | null;
}

/**
 * Marque un lead comme signup après identity link verified.
 */
export async function markLeadSignupFromIdentity(
  admin: SupabaseClient,
  input: { externalUserId: string; userId: string },
): Promise<void> {
  try {
    const { data: leads } = await admin
      .from("ai_leads")
      .select("id, status, signup_at")
      .eq("external_user_id", input.externalUserId)
      .order("updated_at", { ascending: false })
      .limit(5);

    for (const lead of leads || []) {
      const now = new Date().toISOString();
      const nextStatus = lead.status === "premium" ? "premium" : "signup";
      const update: Record<string, unknown> = {
        user_id: input.userId,
        status: nextStatus,
        signup_at: lead.signup_at || now,
        updated_at: now,
        last_event_at: now,
      };
      if (lead.status === "new" || lead.status === "qualified") {
        update.converted_at = now;
      }

      await admin.from("ai_leads").update(update).eq("id", lead.id);

      await trackAiEvent(admin, {
        userId: input.userId,
        eventType: "signup",
        metadata: { lead_id: lead.id, via: "identity_link" },
      });

      await rescoreLeadById(admin, lead.id, {
        has_identity_link: true,
        status: nextStatus,
      });
    }
  } catch (err) {
    arthurLog("warn", "mark_lead_signup_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
  }
}

/**
 * Synchronise signup/premium depuis identity_links + user_access_state.
 */
export async function syncLeadLifecycleStatuses(
  admin: SupabaseClient,
): Promise<{ updated: number }> {
  let updated = 0;
  try {
    const { data: leads } = await admin
      .from("ai_leads")
      .select("id, external_user_id, user_id, status, signup_at, premium_at")
      .not("status", "eq", "inactive")
      .order("updated_at", { ascending: false })
      .limit(500);

    for (const lead of leads || []) {
      let userId = lead.user_id as string | null;
      const now = new Date().toISOString();
      let patch: Record<string, unknown> = {};

      if (!userId && lead.external_user_id) {
        const { data: link } = await admin
          .from("ai_identity_links")
          .select("user_id")
          .eq("provider", "instagram")
          .eq("external_user_id", lead.external_user_id)
          .eq("status", "verified")
          .maybeSingle();
        if (link?.user_id) {
          userId = link.user_id;
          patch.user_id = userId;
          if (lead.status === "new" || lead.status === "qualified") {
            patch.status = "signup";
            patch.signup_at = lead.signup_at || now;
          }
        }
      }

      if (userId) {
        const { data: access } = await admin
          .from("user_access_state")
          .select("access_status, trial_ends_at, subscription_ends_at")
          .eq("user_id", userId)
          .maybeSingle();

        if (isPremiumAccess(access)) {
          if (lead.status !== "premium") {
            patch.status = "premium";
            patch.premium_at = lead.premium_at || now;
            if (!lead.signup_at && !patch.signup_at) patch.signup_at = now;
          }
        } else if (
          (lead.status === "new" || lead.status === "qualified") &&
          userId &&
          !patch.status
        ) {
          patch.status = "signup";
          patch.signup_at = lead.signup_at || now;
        }
      }

      if (Object.keys(patch).length) {
        patch.updated_at = now;
        patch.last_event_at = now;
        await admin.from("ai_leads").update(patch).eq("id", lead.id);
        await rescoreLeadById(admin, lead.id);
        updated += 1;

        if (patch.status === "premium") {
          await markFollowupConverted(admin, {
            externalUserId: lead.external_user_id,
            userId,
            outcome: "premium",
          });
          await attributeCtaConversion(admin, {
            externalUserId: lead.external_user_id,
            userId,
            kind: "attributed_premium",
          });
        } else if (patch.status === "signup") {
          await markFollowupConverted(admin, {
            externalUserId: lead.external_user_id,
            userId,
            outcome: "signup",
          });
          await attributeCtaConversion(admin, {
            externalUserId: lead.external_user_id,
            userId,
            kind: "attributed_signup",
          });
        }
      } else {
        await rescoreLeadById(admin, lead.id);
      }
    }
  } catch (err) {
    arthurLog("error", "sync_lead_lifecycle_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
  }
  return { updated };
}

export async function buildAttributionReport(
  admin: SupabaseClient,
  filters: AttributionFilters = {},
): Promise<{
  funnel: FunnelCounts;
  by_reel: ReelAttributionRow[];
  top_campaigns: ReelAttributionRow[];
  recent_leads: Record<string, unknown>[];
  score_distribution: { cold: number; warm: number; hot: number };
}> {
  const days = Math.min(90, Math.max(1, filters.days || 30));
  const since = new Date(Date.now() - days * 86400000).toISOString();

  let leadsQuery = admin
    .from("ai_leads")
    .select(
      "id, external_user_id, user_id, status, source, campaign, reel_id, keyword, intent, goal, level, score, score_band, created_at, signup_at, premium_at, conversation_id",
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (filters.reel_id) leadsQuery = leadsQuery.eq("reel_id", filters.reel_id);
  if (filters.campaign) leadsQuery = leadsQuery.eq("campaign", filters.campaign);
  if (filters.source) leadsQuery = leadsQuery.eq("source", filters.source);

  const { data: leads, error } = await leadsQuery;
  if (error) {
    arthurLog("error", "attribution_leads_query_failed", { code: error.code });
  }

  const leadRows = leads || [];

  const { count: dmCount } = await admin
    .from("ai_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "dm_received")
    .gte("created_at", since);

  const funnel: FunnelCounts = {
    dm: dmCount ?? 0,
    leads: leadRows.length,
    qualified: leadRows.filter((l) =>
      ["qualified", "signup", "premium"].includes(l.status),
    ).length,
    signup: leadRows.filter((l) =>
      ["signup", "premium"].includes(l.status),
    ).length,
    premium: leadRows.filter((l) => l.status === "premium").length,
  };

  const groups = new Map<string, ReelAttributionRow>();
  for (const l of leadRows) {
    const reel_id = l.reel_id || "(none)";
    const campaign = l.campaign || "(none)";
    const source = l.source || "(none)";
    const key = `${reel_id}|${campaign}|${source}`;
    if (!groups.has(key)) {
      groups.set(key, {
        reel_id,
        campaign,
        source,
        dm: 0,
        leads: 0,
        qualified: 0,
        signup: 0,
        premium: 0,
        avg_score: null,
        conversion_dm_to_signup: null,
        conversion_signup_to_premium: null,
        conversion_dm_to_premium: null,
      });
    }
    const g = groups.get(key)!;
    g.leads += 1;
    if (["qualified", "signup", "premium"].includes(l.status)) g.qualified += 1;
    if (["signup", "premium"].includes(l.status)) g.signup += 1;
    if (l.status === "premium") g.premium += 1;
  }

  // DM par reel depuis metadata events
  const { data: dmEvents } = await admin
    .from("ai_events")
    .select("metadata, created_at")
    .eq("event_type", "dm_received")
    .gte("created_at", since)
    .limit(2000);

  for (const ev of dmEvents || []) {
    const meta = (ev.metadata || {}) as Record<string, unknown>;
    const reel_id = String(meta.reel_id || "(none)");
    const campaign = String(meta.campaign || "(none)");
    const source = String(meta.source || "instagram");
    const key = `${reel_id}|${campaign}|${source}`;
    if (!groups.has(key)) {
      groups.set(key, {
        reel_id,
        campaign,
        source,
        dm: 0,
        leads: 0,
        qualified: 0,
        signup: 0,
        premium: 0,
        avg_score: null,
        conversion_dm_to_signup: null,
        conversion_signup_to_premium: null,
        conversion_dm_to_premium: null,
      });
    }
    groups.get(key)!.dm += 1;
  }

  // avg score per group
  const scoreBuckets = new Map<string, number[]>();
  for (const l of leadRows) {
    const key = `${l.reel_id || "(none)"}|${l.campaign || "(none)"}|${l.source || "(none)"}`;
    if (!scoreBuckets.has(key)) scoreBuckets.set(key, []);
    if (typeof l.score === "number") scoreBuckets.get(key)!.push(l.score);
  }

  const by_reel = [...groups.values()].map((g) => {
    const key = `${g.reel_id}|${g.campaign}|${g.source}`;
    const scores = scoreBuckets.get(key) || [];
    const avg =
      scores.length > 0
        ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
        : null;
    const dm = g.dm || g.leads; // fallback si events DM absents
    return {
      ...g,
      dm,
      avg_score: avg,
      conversion_dm_to_signup: dm > 0 ? Number((g.signup / dm).toFixed(3)) : null,
      conversion_signup_to_premium:
        g.signup > 0 ? Number((g.premium / g.signup).toFixed(3)) : null,
      conversion_dm_to_premium: dm > 0 ? Number((g.premium / dm).toFixed(3)) : null,
    };
  });

  by_reel.sort((a, b) => b.leads - a.leads || b.premium - a.premium);

  const score_distribution = {
    cold: leadRows.filter((l) => l.score_band === "cold" || (l.score != null && l.score < 40)).length,
    warm: leadRows.filter((l) => l.score_band === "warm" || (l.score != null && l.score >= 40 && l.score < 70)).length,
    hot: leadRows.filter((l) => l.score_band === "hot" || (l.score != null && l.score >= 70)).length,
  };

  // Si pas encore scorés, estimer à la volée pour le dashboard
  if (score_distribution.cold + score_distribution.warm + score_distribution.hot === 0) {
    for (const l of leadRows) {
      const s = scoreLead({
        status: l.status,
        intent: l.intent,
        goal: l.goal,
        level: l.level,
        reel_id: l.reel_id,
        campaign: l.campaign,
        keyword: l.keyword,
      });
      if (s.band === "cold") score_distribution.cold += 1;
      else if (s.band === "warm") score_distribution.warm += 1;
      else score_distribution.hot += 1;
    }
  }

  const top_campaigns = [...by_reel].sort(
    (a, b) => (b.conversion_dm_to_premium || 0) - (a.conversion_dm_to_premium || 0),
  );

  return {
    funnel,
    by_reel: by_reel.slice(0, 50),
    top_campaigns: top_campaigns.slice(0, 20),
    recent_leads: leadRows.slice(0, 40).map((l) => ({
      id: l.id,
      status: l.status,
      score: l.score,
      score_band: l.score_band,
      intent: l.intent,
      goal: l.goal,
      reel_id: l.reel_id,
      campaign: l.campaign,
      keyword: l.keyword,
      source: l.source,
      created_at: l.created_at,
      signup_at: l.signup_at,
      premium_at: l.premium_at,
    })),
    score_distribution,
  };
}

/**
 * Rebuild ai_growth_daily pour les N derniers jours (best-effort).
 */
export async function rebuildGrowthDaily(
  admin: SupabaseClient,
  days = 30,
): Promise<{ rows: number }> {
  const report = await buildAttributionReport(admin, { days });
  const day = new Date().toISOString().slice(0, 10);
  let rows = 0;
  for (const g of report.by_reel) {
    const { error } = await admin.from("ai_growth_daily").upsert(
      {
        day,
        reel_id: g.reel_id === "(none)" ? "" : g.reel_id,
        campaign: g.campaign === "(none)" ? "" : g.campaign,
        source: g.source === "(none)" ? "" : g.source,
        dm_count: g.dm,
        lead_count: g.leads,
        qualified_count: g.qualified,
        signup_count: g.signup,
        premium_count: g.premium,
        avg_score: g.avg_score,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "day,reel_id,campaign,source" },
    );
    if (!error) rows += 1;
  }
  return { rows };
}
