/**
 * Structured output Arthur AI — schéma + parsing.
 */
import type {
  ArthurIntent,
  ArthurStructuredOutput,
  ExtractedLeadData,
  LeadTemperature,
} from "./types.js";

export const ARTHUR_INTENTS: readonly ArthurIntent[] = [
  "swimming_question",
  "technique",
  "training",
  "goal",
  "plan_request",
  "myswym_question",
  "subscription",
  "support",
  "other",
] as const;

export const LEAD_TEMPERATURES: readonly LeadTemperature[] = [
  "cold",
  "warm",
  "hot",
] as const;

/** JSON Schema strict pour Responses API. */
export const ARTHUR_RESPONSE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "message",
    "intent",
    "lead_temperature",
    "extracted_data",
    "suggested_action",
  ],
  properties: {
    message: {
      type: "string",
      description: "Réponse utilisateur en français, courte et naturelle",
    },
    intent: {
      type: "string",
      enum: [...ARTHUR_INTENTS],
    },
    lead_temperature: {
      type: "string",
      enum: [...LEAD_TEMPERATURES],
    },
    extracted_data: {
      type: "object",
      additionalProperties: false,
      required: [
        "goal",
        "level",
        "frequency",
        "target_date",
        "distance",
        "pace",
        "equipment",
        "injury",
        "needs_plan",
        "needs_human",
      ],
      properties: {
        goal: { type: ["string", "null"] },
        level: { type: ["string", "null"] },
        frequency: { type: ["number", "null"] },
        target_date: { type: ["string", "null"] },
        distance: { type: ["string", "null"] },
        pace: { type: ["string", "null"] },
        equipment: {
          type: "array",
          items: { type: "string" },
        },
        injury: { type: ["string", "null"] },
        needs_plan: { type: "boolean" },
        needs_human: { type: "boolean" },
      },
    },
    suggested_action: {
      type: "string",
      description:
        "Action interne courte : continue | qualify_frequency | ask_plan_confirmation | suggest_myswym | handoff_human | no_reply",
    },
  },
} as const;

function asIntent(value: unknown): ArthurIntent {
  return typeof value === "string" &&
    (ARTHUR_INTENTS as readonly string[]).includes(value)
    ? (value as ArthurIntent)
    : "other";
}

function asTemperature(value: unknown): LeadTemperature {
  return typeof value === "string" &&
    (LEAD_TEMPERATURES as readonly string[]).includes(value)
    ? (value as LeadTemperature)
    : "cold";
}

function asNullableString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") {
    const t = value.trim();
    return t || null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function asNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim())
    .slice(0, 20);
}

export function normalizeExtractedData(raw: unknown): ExtractedLeadData {
  const obj =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    goal: asNullableString(obj.goal),
    level: asNullableString(obj.level),
    frequency: asNullableNumber(obj.frequency),
    target_date: asNullableString(obj.target_date),
    distance: asNullableString(obj.distance),
    pace: asNullableString(obj.pace),
    equipment: asStringArray(obj.equipment),
    injury: asNullableString(obj.injury),
    needs_plan: obj.needs_plan === true,
    needs_human: obj.needs_human === true,
  };
}

export function parseArthurStructuredOutput(raw: string): ArthurStructuredOutput {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fallbackStructured(
      "Je n’ai pas bien saisi. Tu peux reformuler en une phrase ton objectif ou ta question ?",
    );
  }

  if (!parsed || typeof parsed !== "object") {
    return fallbackStructured(
      "Je n’ai pas bien saisi. Reformule ta question natation, j’adapte.",
    );
  }

  const obj = parsed as Record<string, unknown>;
  const message =
    typeof obj.message === "string" && obj.message.trim()
      ? obj.message.trim()
      : "OK — dis-moi ton objectif et ton niveau, je te guide.";

  return {
    message,
    intent: asIntent(obj.intent),
    lead_temperature: asTemperature(obj.lead_temperature),
    extracted_data: normalizeExtractedData(obj.extracted_data),
    suggested_action:
      typeof obj.suggested_action === "string" && obj.suggested_action.trim()
        ? obj.suggested_action.trim()
        : "continue",
  };
}

export function fallbackStructured(message: string): ArthurStructuredOutput {
  return {
    message,
    intent: "other",
    lead_temperature: "cold",
    extracted_data: normalizeExtractedData({}),
    suggested_action: "continue",
  };
}

/** Heuristique locale (tests / mock) — n’appelle pas OpenAI. */
export function inferIntentHeuristic(message: string): ArthurIntent {
  const lower = message.toLowerCase();
  if (/crawl|technique|respiration|virage|coulée|godille|coude|catch|progresser/.test(lower)) {
    return "technique";
  }
  if (/triathlon|ironman|objectif|prépare|compétition|course cible/.test(lower)) {
    return "goal";
  }
  if (/plan|programme personnalisé|génère.*plan|créer.*plan/.test(lower)) {
    return "plan_request";
  }
  if (
    /abonnement|premium|essai|stripe|tarif|prix|résil|annul|combien.*(co[uû]te|co[uû]t)/.test(
      lower,
    )
  ) {
    return "subscription";
  }
  if (
    /myswym|comment ça marche|comment ca marche|l['']app|appli|application|fonctionne|fonctionnement|c['']est quoi|a quoi sert|à quoi sert|inscription|inscrire|utiliser/.test(
      lower,
    )
  ) {
    return "myswym_question";
  }
  if (/aide|bug|compte|connexion|support|rembours|plainte/.test(lower)) {
    return "support";
  }
  if (/séance|volume|allure|z1|z2|entraînement|entrainement/.test(lower)) {
    return "training";
  }
  if (/nage|nager|piscine|bassin|eau libre/.test(lower)) {
    return "swimming_question";
  }
  return "other";
}
