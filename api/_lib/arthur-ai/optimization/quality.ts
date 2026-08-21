/**
 * Scoring qualité des réponses Arthur (déterministe, F3).
 */
export interface QualityScoreInput {
  message: string;
  intent?: string | null;
  suggested_action?: string | null;
  lead_temperature?: string | null;
  channel?: string | null;
  knowledge_topics?: string[];
}

export interface QualityScoreResult {
  quality_score: number;
  quality_band: "weak" | "ok" | "strong";
  reasons: string[];
  cta_detected: boolean;
  cta_type: string | null;
  knowledge_topic_hit: string | null;
  message_length: number;
}

const CTA_PATTERNS: Array<{ type: string; re: RegExp }> = [
  { type: "inscription", re: /myswym\.app\/inscription/i },
  { type: "tarifs", re: /myswym\.app\/(?:fr\/)?tarifs|myswym\.app\/pricing/i },
  { type: "accueil", re: /myswym\.app(\/accueil|\/\s|$|\?)/i },
  { type: "generic_link", re: /myswym\.app/i },
  { type: "suggest_action", re: /suggested_action_placeholder_never/i },
];

const SPAMMY = [
  /urgence/i,
  /dernière chance/i,
  /clique maintenant/i,
  /offre limitée/i,
  /100%\s*garanti/i,
];

const COACHING_HINTS = [
  /coulée/i,
  /respiration/i,
  /crawl/i,
  /séance/i,
  /fréquence/i,
  /allure/i,
  /technique/i,
  /récupération/i,
  /bassin/i,
  /eau libre/i,
  /triathlon/i,
];

export function detectCtaInMessage(message: string): {
  detected: boolean;
  cta_type: string | null;
} {
  const text = message || "";
  for (const p of CTA_PATTERNS) {
    if (p.type === "suggest_action") continue;
    if (p.re.test(text)) return { detected: true, cta_type: p.type };
  }
  return { detected: false, cta_type: null };
}

export function scoreResponseQuality(input: QualityScoreInput): QualityScoreResult {
  const message = String(input.message || "").trim();
  const len = message.length;
  let score = 40;
  const reasons: string[] = ["base"];

  // Longueur utile
  if (len >= 80 && len <= 600) {
    score += 15;
    reasons.push("length_good");
  } else if (len < 40) {
    score -= 15;
    reasons.push("too_short");
  } else if (len > 900) {
    score -= 10;
    reasons.push("too_long");
  }

  // Question de qualification
  if (/\?/.test(message)) {
    score += 8;
    reasons.push("asks_question");
  }

  // Valeur coaching
  const coachingHits = COACHING_HINTS.filter((re) => re.test(message)).length;
  if (coachingHits >= 2) {
    score += 12;
    reasons.push("coaching_rich");
  } else if (coachingHits === 1) {
    score += 6;
    reasons.push("coaching_light");
  } else {
    score -= 4;
    reasons.push("low_coaching_signal");
  }

  // Spam commercial
  if (SPAMMY.some((re) => re.test(message))) {
    score -= 25;
    reasons.push("spammy_tone");
  }

  // IA disclaimer
  if (/en tant qu['’]ia|intelligence artificielle/i.test(message)) {
    score -= 20;
    reasons.push("ai_disclaimer");
  }

  // CTA pertinent
  const cta = detectCtaInMessage(message);
  const action = input.suggested_action || "";
  const temp = input.lead_temperature || "";
  if (cta.detected) {
    if (temp === "hot" || action === "suggest_myswym" || input.intent === "plan_request") {
      score += 12;
      reasons.push("cta_timely");
    } else if (temp === "cold") {
      score -= 8;
      reasons.push("cta_too_early");
    } else {
      score += 4;
      reasons.push("cta_present");
    }
  } else if (
    (temp === "hot" || action === "suggest_myswym") &&
    input.channel === "instagram"
  ) {
    score -= 6;
    reasons.push("missing_cta_when_hot");
  }

  // Knowledge alignment
  let knowledge_topic_hit: string | null = null;
  for (const topic of input.knowledge_topics || []) {
    const token = topic.replace(/_/g, " ").split(" ")[0];
    if (token && message.toLowerCase().includes(token.toLowerCase())) {
      knowledge_topic_hit = topic;
      score += 8;
      reasons.push(`knowledge_hit_${topic}`);
      break;
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const quality_band =
    score >= 70 ? "strong" : score >= 45 ? "ok" : "weak";

  return {
    quality_score: score,
    quality_band,
    reasons,
    cta_detected: cta.detected,
    cta_type: cta.cta_type,
    knowledge_topic_hit,
    message_length: len,
  };
}
