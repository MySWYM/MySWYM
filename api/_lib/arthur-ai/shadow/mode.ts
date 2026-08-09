/**
 * Shadow Mode H1 — pas d’envoi Instagram automatique.
 *
 * Shadow ON (défaut) : Arthur analyse + propose, zéro send.
 * Live send : uniquement si SHADOW=0 ET ARTHUR_INSTAGRAM_LIVE_SEND=1
 *   (double gate — jamais activé par cette phase).
 * ARTHUR_FOLLOWUPS_SEND : jamais touché ici.
 */

function envFlag(name: string, defaultOn: boolean): boolean {
  const raw = (process.env[name] || "").trim().toLowerCase();
  if (!raw) return defaultOn;
  if (["0", "false", "off", "no"].includes(raw)) return false;
  if (["1", "true", "on", "yes"].includes(raw)) return true;
  return defaultOn;
}

/** Shadow Instagram actif par défaut (sécurité). */
export function isInstagramShadowMode(): boolean {
  return envFlag("ARTHUR_FLAG_SHADOW_INSTAGRAM", true);
}

/**
 * Live DM Instagram — double gate volontairement stricte.
 * H1 ne doit jamais retourner true en config normale.
 */
export function canLiveSendInstagram(): boolean {
  if (isInstagramShadowMode()) return false;
  if (process.env.ARTHUR_FOLLOWUPS_SEND === "1") {
    // Ne pas confondre followups et reply live — toujours refuser si on veut
    // être ultra-safe? Non: followups send ≠ live reply. Mais user dit
    // ne jamais activer followups. On n'active pas live via followups flag.
  }
  return process.env.ARTHUR_INSTAGRAM_LIVE_SEND === "1";
}

export type RecommendedAction =
  | "reply"
  | "qualify"
  | "suggest_myswym"
  | "handoff_human"
  | "ignore"
  | "followup_later";

export function classifyRecommendedAction(input: {
  suggested_action?: string | null;
  intent?: string | null;
  lead_temperature?: string | null;
  lead_status?: string | null;
  message?: string | null;
}): RecommendedAction {
  const action = input.suggested_action || "";
  const intent = input.intent || "";
  const temp = input.lead_temperature || "";
  const status = input.lead_status || "";

  if (action === "handoff_human" || /humain|conseiller/i.test(input.message || "")) {
    return "handoff_human";
  }
  if (status === "premium") return "ignore";
  if (action === "suggest_myswym" || intent === "subscription") {
    return "suggest_myswym";
  }
  if (
    action === "qualify_frequency" ||
    (temp === "cold" && ["goal", "plan_request", "training"].includes(intent))
  ) {
    return "qualify";
  }
  if (temp === "warm" && intent === "other" && (input.message || "").length < 8) {
    return "followup_later";
  }
  if (action === "ask_plan_confirmation" || intent === "plan_request") {
    return "suggest_myswym";
  }
  return "reply";
}
