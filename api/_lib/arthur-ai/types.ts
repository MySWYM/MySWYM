/**
 * Types partagés Arthur AI (Phase C).
 */

export type ArthurChannel = "web" | "instagram" | "future";

export type ArthurIntent =
  | "swimming_question"
  | "technique"
  | "training"
  | "goal"
  | "plan_request"
  | "myswym_question"
  | "subscription"
  | "support"
  | "other";

export type LeadTemperature = "cold" | "warm" | "hot";

export type ArthurMessageRole = "user" | "assistant" | "system" | "tool";

export type AiEventType =
  | "dm_received"
  | "ai_response"
  | "lead_qualified"
  | "myswym_link_sent"
  | "signup"
  | "plan_created"
  | "checkout_started"
  | "subscription_started"
  | "plan_requested"
  | "plan_creation_blocked"
  | "profile_updated"
  | "instagram_webhook_received"
  | "instagram_message_sent"
  | "instagram_message_failed"
  | "identity_link_verified"
  | "followup_planned"
  | "followup_suppressed"
  | "followup_approved"
  | "followup_sent"
  | "followup_failed"
  | "followup_replied"
  | "followup_converted"
  | "response_scored"
  | "conversation_analyzed"
  | "cta_sent"
  | "cta_clicked"
  | "knowledge_served"
  | "rate_limited"
  | "cost_budget_soft"
  | "cost_budget_hard"
  | "offline_fallback"
  | "human_takeover_started"
  | "human_takeover_released"
  | "feature_flag_blocked"
  | "shadow_proposal_created"
  | "shadow_proposal_approved"
  | "shadow_proposal_rejected"
  | "shadow_send_blocked";

export interface ArthurAttribution {
  source?: string | null;
  campaign?: string | null;
  reel_id?: string | null;
  keyword?: string | null;
}

export interface ProcessArthurMessageInput {
  /** MySWYM auth.users.id, jamais un ID Instagram. */
  userId?: string | null;
  /** Identifiant canal externe (ex. IGPSID). Jamais un substitute de userId. */
  externalUserId?: string | null;
  channel: "web" | "instagram";
  message: string;
  conversationId?: string | null;
  /** JWT utilisateur pour tools qui appellent des Edge Functions (checkout). */
  accessToken?: string | null;
  /** Attribution marketing (Reel, campagne, mot-clé). */
  attribution?: ArthurAttribution | null;
}

export interface ExtractedLeadData {
  intent?: ArthurIntent | null;
  goal?: string | null;
  level?: string | null;
  frequency?: number | null;
  target_date?: string | null;
  distance?: string | number | null;
  pace?: string | null;
  equipment?: string[];
  injury?: string | null;
  needs_plan?: boolean;
  needs_human?: boolean;
  lead_temperature?: LeadTemperature;
  [key: string]: unknown;
}

export interface ArthurStructuredOutput {
  message: string;
  intent: ArthurIntent;
  lead_temperature: LeadTemperature;
  extracted_data: ExtractedLeadData;
  suggested_action: string;
}

export interface ArthurRecentMessage {
  role: ArthurMessageRole;
  content: string;
  created_at?: string;
}

export interface ArthurContextPayload {
  user_profile: Record<string, unknown>;
  subscription: Record<string, unknown>;
  summary: string;
  facts: Record<string, unknown>;
  recent_messages: ArthurRecentMessage[];
  lead_context: Record<string, unknown>;
  /** Snippets coaching (F3), courts, optionnels. */
  knowledge_hints?: Array<{ topic: string; title: string; content: string }>;
}

export interface ProcessArthurMessageResult {
  conversationId: string;
  message: string;
  intent: ArthurIntent;
  lead_temperature: LeadTemperature;
  extracted_data: ExtractedLeadData;
  suggested_action: string;
  model: string;
  mock?: boolean;
  toolCalls?: Array<{ name: string; result: Record<string, unknown> }>;
}

export interface AuthContext {
  /** Compte MySWYM validé (JWT), jamais dérivé d'un ID Instagram. */
  userId: string | null;
  /** Identifiant externe (Instagram, etc.), distinct de userId. */
  externalUserId: string | null;
  channel: ArthurChannel;
}
