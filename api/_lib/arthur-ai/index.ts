/**
 * Barrel Arthur AI (Phase C).
 */
export { processArthurMessage, ArthurAIError } from "./service.js";
export { buildArthurContext, serializeContextForModel } from "./context.js";
export { getActiveArthurPrompt, FALLBACK_ARTHUR_PROMPT } from "./prompt.js";
export {
  parseArthurStructuredOutput,
  inferIntentHeuristic,
  ARTHUR_RESPONSE_JSON_SCHEMA,
} from "./intent.js";
export { callArthurOpenAI, isArthurMockMode, mockStructuredFromUserPayload } from "./openai.js";
export { trackAiEvent } from "./tracking.js";
export {
  buildAuthContext,
  assertProcessInput,
  conversationBelongsToAuth,
  isUuid,
} from "./security.js";
export {
  executeArthurTool,
  getArthurOpenAITools,
  createTrainingPlan,
  updateUserProfile,
  createCheckout,
} from "./tools/index.js";
export * from "./tools/index.js";
export {
  scoreLead,
  rescoreLeadById,
  buildAttributionReport,
  syncLeadLifecycleStatuses,
  markLeadSignupFromIdentity,
} from "./growth/index.js";
export {
  decideFollowup,
  planFollowupsForLeads,
  isFollowupSendEnabled,
  resolveFollowupSendMode,
  buildFollowupImpactReport,
} from "./conversion/index.js";
export {
  scoreResponseQuality,
  analyzeConversation,
  buildOptimizationReport,
  batchAnalyzeRecentConversations,
  fetchRelevantKnowledge,
} from "./optimization/index.js";
export {
  getArthurFeatureFlags,
  assertChannelEnabled,
  buildOfflineResponse,
  detectsHumanTakeoverRequest,
  buildReadinessReport,
  checkRateLimit,
  checkCostBudget,
} from "./production/index.js";
export {
  isInstagramShadowMode,
  canLiveSendInstagram,
  classifyRecommendedAction,
  createShadowProposal,
  reviewShadowProposal,
  buildShadowReport,
} from "./shadow/index.js";
