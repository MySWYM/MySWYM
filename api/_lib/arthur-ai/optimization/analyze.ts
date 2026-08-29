/**
 * Analyse conversationnelle (F3), drop-risk + recommandations.
 */
import { detectCtaInMessage } from "./quality.js";

export interface ConversationMessageLike {
  role: string;
  content?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ConversationAnalysis {
  message_count: number;
  user_message_count: number;
  assistant_message_count: number;
  drop_risk: "low" | "medium" | "high" | "unknown";
  intents: string[];
  findings: string[];
  recommendations: string[];
  cta_count: number;
  avg_assistant_length: number | null;
}

export function analyzeConversation(
  messages: ConversationMessageLike[],
): ConversationAnalysis {
  const list = messages || [];
  const users = list.filter((m) => m.role === "user");
  const assistants = list.filter((m) => m.role === "assistant");
  const findings: string[] = [];
  const recommendations: string[] = [];
  const intents = new Set<string>();

  let cta_count = 0;
  let asstLen = 0;
  for (const m of assistants) {
    const text = String(m.content || "");
    asstLen += text.length;
    const cta = detectCtaInMessage(text);
    if (cta.detected) cta_count += 1;
    const intent = m.metadata?.intent;
    if (typeof intent === "string" && intent) intents.add(intent);
  }

  const user_message_count = users.length;
  const assistant_message_count = assistants.length;
  const message_count = list.length;

  if (message_count === 0) {
    return {
      message_count: 0,
      user_message_count: 0,
      assistant_message_count: 0,
      drop_risk: "unknown",
      intents: [],
      findings: ["empty_conversation"],
      recommendations: ["wait_for_messages"],
      cta_count: 0,
      avg_assistant_length: null,
    };
  }

  const last = list[list.length - 1];
  if (last?.role === "assistant" && user_message_count >= 1) {
    findings.push("last_turn_assistant");
  }

  if (user_message_count >= 3 && cta_count === 0) {
    findings.push("engaged_no_cta");
    recommendations.push("add_soft_myswym_cta_when_goal_clear");
  }
  if (cta_count >= 3) {
    findings.push("cta_heavy");
    recommendations.push("reduce_cta_frequency");
  }
  if (user_message_count === 1 && assistant_message_count >= 1) {
    findings.push("single_touch");
    recommendations.push("qualify_goal_level_frequency");
  }

  const avg =
    assistant_message_count > 0
      ? asstLen / assistant_message_count
      : null;
  if (avg != null && avg < 60) {
    findings.push("short_answers");
    recommendations.push("add_concrete_coaching_tip");
  }

  const userQuestions = users.filter((m) =>
    /\?/.test(String(m.content || "")),
  ).length;
  if (userQuestions >= 2 && avg != null && avg < 100) {
    findings.push("questions_may_need_deeper_answers");
    recommendations.push("use_knowledge_snippet_for_technique");
  }

  let drop_risk: ConversationAnalysis["drop_risk"] = "low";
  if (findings.includes("single_touch") || findings.includes("short_answers")) {
    drop_risk = "medium";
  }
  if (
    (findings.includes("engaged_no_cta") && user_message_count >= 4) ||
    findings.includes("cta_heavy")
  ) {
    drop_risk = "high";
  }
  if (user_message_count === 0) drop_risk = "unknown";

  if (drop_risk === "high" && !recommendations.includes("review_prompt_tone")) {
    recommendations.push("review_prompt_tone");
  }

  return {
    message_count,
    user_message_count,
    assistant_message_count,
    drop_risk,
    intents: [...intents],
    findings,
    recommendations,
    cta_count,
    avg_assistant_length: avg != null ? Number(avg.toFixed(1)) : null,
  };
}
