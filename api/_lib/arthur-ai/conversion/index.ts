export { FOLLOWUP_POLICY } from "./policy.js";
export { decideFollowup, bumpOutOfQuietHours } from "./decide.js";
export { renderFollowupMessage } from "./templates.js";
export { planFollowupsForLeads } from "./planner.js";
export {
  isFollowupSendEnabled,
  resolveFollowupSendMode,
  approveFollowup,
  sendApprovedFollowup,
} from "./send.js";
export { markFollowupReplied, markFollowupConverted } from "./outcomes.js";
export { buildFollowupImpactReport } from "./report.js";
