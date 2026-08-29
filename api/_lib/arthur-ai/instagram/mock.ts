/**
 * Mode mock Instagram, tests locaux sans credentials Meta.
 */
export type MockOutbound = {
  recipientId: string;
  text: string;
  at: string;
};

const outbound: MockOutbound[] = [];

export function isInstagramMockMode(): boolean {
  const v = (process.env.INSTAGRAM_MOCK || process.env.META_MOCK || "").trim();
  if (v === "1" || v === "true") return true;
  // Sans credentials → mock automatique (dev-safe)
  const hasToken = Boolean((process.env.INSTAGRAM_ACCESS_TOKEN || "").trim());
  const hasSecret = Boolean((process.env.META_APP_SECRET || "").trim());
  const hasVerify = Boolean((process.env.META_VERIFY_TOKEN || "").trim());
  if (!hasToken || !hasSecret || !hasVerify) return true;
  return false;
}

export function recordMockOutbound(entry: { recipientId: string; text: string }): void {
  outbound.push({
    recipientId: entry.recipientId,
    text: entry.text,
    at: new Date().toISOString(),
  });
  // Cap mémoire
  if (outbound.length > 100) outbound.shift();
}

export function getMockOutbound(): MockOutbound[] {
  return [...outbound];
}

export function clearMockOutbound(): void {
  outbound.length = 0;
}

/** Payload mock pour POST /api/instagram/webhook */
export function buildMockWebhookPayload(input: {
  senderId: string;
  text: string;
  mid?: string;
  referral?: { source?: string; campaign?: string; reel_id?: string; ref?: string };
}): Record<string, unknown> {
  const message: Record<string, unknown> = {
    mid: input.mid || `mock_mid_${Date.now()}`,
    text: input.text,
  };
  if (input.referral) {
    message.referral = {
      ref: input.referral.ref || input.referral.campaign || "",
      source: input.referral.source || "ADS",
      type: "OPEN_THREAD",
      ads_context_data: input.referral.reel_id
        ? { ad_title: input.referral.campaign, post_id: input.referral.reel_id }
        : undefined,
    };
  }

  return {
    object: "instagram",
    entry: [
      {
        id: "mock_ig_business",
        time: Date.now(),
        messaging: [
          {
            sender: { id: input.senderId },
            recipient: { id: "mock_page" },
            timestamp: Date.now(),
            message,
          },
        ],
      },
    ],
  };
}
