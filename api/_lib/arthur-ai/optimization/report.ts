/**
 * Rapport dashboard Optimization Loop F3.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { isFollowupSendEnabled } from "../conversion/send.js";

export async function buildOptimizationReport(
  admin: SupabaseClient,
  days = 30,
): Promise<Record<string, unknown>> {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data: scores } = await admin
    .from("ai_response_scores")
    .select(
      "quality_score, quality_band, cta_detected, cta_type, intent, channel, reasons, created_at",
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1000);

  const scoreRows = scores || [];
  const band = { weak: 0, ok: 0, strong: 0 };
  let sum = 0;
  let ctaInScores = 0;
  for (const s of scoreRows) {
    band[s.quality_band as keyof typeof band] =
      (band[s.quality_band as keyof typeof band] || 0) + 1;
    sum += s.quality_score || 0;
    if (s.cta_detected) ctaInScores += 1;
  }

  const { data: ctas } = await admin
    .from("ai_cta_events")
    .select("event_kind, cta_type, created_at")
    .gte("created_at", since)
    .limit(1000);

  const ctaCounts: Record<string, number> = {};
  const ctaByType: Record<string, number> = {};
  for (const c of ctas || []) {
    ctaCounts[c.event_kind] = (ctaCounts[c.event_kind] || 0) + 1;
    if (c.event_kind === "sent") {
      ctaByType[c.cta_type] = (ctaByType[c.cta_type] || 0) + 1;
    }
  }

  const { data: insights } = await admin
    .from("ai_conversation_insights")
    .select(
      "conversation_id, drop_risk, findings, recommendations, cta_count, avg_quality, message_count, analyzed_at",
    )
    .gte("analyzed_at", since)
    .order("analyzed_at", { ascending: false })
    .limit(100);

  const drop = { low: 0, medium: 0, high: 0, unknown: 0 };
  const findingFreq: Record<string, number> = {};
  const recoFreq: Record<string, number> = {};
  for (const i of insights || []) {
    drop[i.drop_risk as keyof typeof drop] =
      (drop[i.drop_risk as keyof typeof drop] || 0) + 1;
    for (const f of (i.findings || []) as string[]) {
      findingFreq[f] = (findingFreq[f] || 0) + 1;
    }
    for (const r of (i.recommendations || []) as string[]) {
      recoFreq[r] = (recoFreq[r] || 0) + 1;
    }
  }

  const { count: knowledgeCount } = await admin
    .from("ai_knowledge_snippets")
    .select("id", { count: "exact", head: true })
    .eq("active", true);

  const { count: dmCountExact } = await admin
    .from("ai_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "dm_received")
    .gte("created_at", since);

  const { count: premiumLeads } = await admin
    .from("ai_leads")
    .select("id", { count: "exact", head: true })
    .eq("status", "premium")
    .gte("updated_at", since);

  const { count: signupLeads } = await admin
    .from("ai_leads")
    .select("id", { count: "exact", head: true })
    .in("status", ["signup", "premium"])
    .gte("updated_at", since);

  const dm = dmCountExact ?? 0;
  const signup = signupLeads ?? 0;
  const premium = premiumLeads ?? 0;

  return {
    auto_sends_enabled: isFollowupSendEnabled(),
    note: "F3 Optimization Loop, envois auto non activés",
    quality: {
      responses_scored: scoreRows.length,
      avg_score:
        scoreRows.length > 0
          ? Number((sum / scoreRows.length).toFixed(1))
          : null,
      band,
      cta_in_responses: ctaInScores,
      cta_rate:
        scoreRows.length > 0
          ? Number((ctaInScores / scoreRows.length).toFixed(3))
          : null,
      recent: scoreRows.slice(0, 30).map((s) => ({
        score: s.quality_score,
        band: s.quality_band,
        intent: s.intent,
        cta: s.cta_detected,
        cta_type: s.cta_type,
        channel: s.channel,
        at: s.created_at,
      })),
    },
    cta: {
      counts: ctaCounts,
      by_type: ctaByType,
      sent: ctaCounts.sent || 0,
      attributed_signup: ctaCounts.attributed_signup || 0,
      attributed_premium: ctaCounts.attributed_premium || 0,
    },
    conversations: {
      analyzed: (insights || []).length,
      drop_risk: drop,
      top_findings: Object.entries(findingFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([k, v]) => ({ finding: k, count: v })),
      top_recommendations: Object.entries(recoFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([k, v]) => ({ recommendation: k, count: v })),
      recent: (insights || []).slice(0, 20),
    },
    knowledge: {
      active_snippets: knowledgeCount ?? 0,
    },
    funnel_proxy: {
      dm,
      signup,
      premium,
      dm_to_signup: dm > 0 ? Number((signup / dm).toFixed(3)) : null,
      dm_to_premium: dm > 0 ? Number((premium / dm).toFixed(3)) : null,
    },
  };
}
