/**
 * Client OpenAI (Responses API), serveur uniquement + tool loop.
 */
import OpenAI from "openai";
import { arthurLog } from "./logging.js";
import {
  ARTHUR_RESPONSE_JSON_SCHEMA,
  parseArthurStructuredOutput,
} from "./intent.js";
import type { ArthurStructuredOutput } from "./types.js";
import {
  executeArthurTool,
  getArthurOpenAITools,
  MAX_TOOL_TURNS,
  MAX_TOOLS_PER_TURN,
  type ToolExecutionContext,
} from "./tools/index.js";
import type { AuthContext } from "./types.js";

const DEFAULT_MODEL = "gpt-4.1-mini";

export function getArthurModel(): string {
  return (process.env.OPENAI_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
}

export function createOpenAIClient(): OpenAI {
  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY manquante");
  }
  return new OpenAI({ apiKey });
}

export function isArthurMockMode(): boolean {
  return process.env.ARTHUR_AI_MOCK === "1" || process.env.ARTHUR_AI_MOCK === "true";
}

export interface ArthurOpenAICallInput {
  systemPrompt: string;
  userPayload: string;
  model?: string;
  auth: AuthContext;
  toolCtx?: ToolExecutionContext;
}

export interface ArthurOpenAICallResult {
  structured: ArthurStructuredOutput;
  model: string;
  tokensInput: number | null;
  tokensOutput: number | null;
  costEstimate: number | null;
  rawText: string;
  mock: boolean;
  toolCalls: Array<{ name: string; result: Record<string, unknown> }>;
}

/** Estimation indicative USD (ne pas utiliser pour la facturation). */
export function estimateCostUsd(
  model: string,
  tokensIn: number | null,
  tokensOut: number | null,
): number | null {
  if (tokensIn == null || tokensOut == null) return null;
  const rates: Record<string, { in: number; out: number }> = {
    "gpt-4.1-mini": { in: 0.4, out: 1.6 },
    "gpt-4.1": { in: 2, out: 8 },
    "gpt-4o-mini": { in: 0.15, out: 0.6 },
    "gpt-4o": { in: 2.5, out: 10 },
  };
  const key = Object.keys(rates).find((k) => model.startsWith(k)) || "gpt-4.1-mini";
  const r = rates[key];
  return Number((((tokensIn * r.in) + (tokensOut * r.out)) / 1_000_000).toFixed(6));
}

/**
 * Appel OpenAI Responses API avec structured output + tools.
 */
export async function callArthurOpenAI(
  input: ArthurOpenAICallInput,
): Promise<ArthurOpenAICallResult> {
  const model = input.model || getArthurModel();
  const toolCallsLog: Array<{ name: string; result: Record<string, unknown> }> = [];

  if (isArthurMockMode()) {
    const structured = mockStructuredFromUserPayload(input.userPayload, input.toolCtx);
    // Simuler un tool loop si confirmation plan détectée
    if (
      input.toolCtx &&
      /oui|génère|genere|vas-y|go\b|crée[- ]le|cree[- ]le/i.test(input.userPayload) &&
      /plan|semaines/i.test(input.userPayload)
    ) {
      const result = await executeArthurTool(
        "create_training_plan",
        { confirmed: true, replace_existing: false },
        input.toolCtx,
      );
      toolCallsLog.push({ name: "create_training_plan", result });
      if (result.success) {
        structured.message = `C’est fait, ton plan est généré (${(result.data as { weeks_created?: number })?.weeks_created ?? "?"} semaines). Ouvre MySWYM (/app) pour le suivre.`;
        structured.intent = "plan_request";
        structured.suggested_action = "continue";
        structured.extracted_data.needs_plan = false;
      } else if (result.requires_confirmation || result.error === "confirmation_required") {
        structured.message =
          "Je peux te générer ton plan personnalisé. Tu veux que je le crée ?";
        structured.suggested_action = "ask_plan_confirmation";
      } else if (result.error === "active_plan_exists") {
        structured.message =
          "Tu as déjà un plan actif. Tu confirmes que je génère un nouveau plan (en conservant les semaines déjà réalisées) ?";
        structured.suggested_action = "ask_plan_confirmation";
      } else if (result.error === "premium_required") {
        structured.message =
          "Pour générer le plan complet, il te faut Premium (ou l’essai). Je peux t’envoyer le lien de paiement si tu veux.";
        structured.suggested_action = "suggest_myswym";
      }
    }

    return {
      structured,
      model: "mock",
      tokensInput: 0,
      tokensOutput: 0,
      costEstimate: 0,
      rawText: JSON.stringify(structured),
      mock: true,
      toolCalls: toolCallsLog,
    };
  }

  const client = createOpenAIClient();
  const tools = getArthurOpenAITools(input.auth);

  let tokensInput = 0;
  let tokensOutput = 0;
  let lastModel = model;

  type InputItem = Record<string, unknown>;
  const inputItems: InputItem[] = [
    {
      role: "user",
      content: [{ type: "input_text", text: input.userPayload }],
    },
  ];

  try {
    for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
      const response = await client.responses.create({
        model,
        instructions: input.systemPrompt,
        input: inputItems as never,
        tools: tools as never,
        text: {
          format: {
            type: "json_schema",
            name: "arthur_response",
            strict: true,
            schema: ARTHUR_RESPONSE_JSON_SCHEMA,
          },
        },
        store: false,
      });

      lastModel = response.model || model;
      tokensInput += response.usage?.input_tokens ?? 0;
      tokensOutput += response.usage?.output_tokens ?? 0;

      const fnCalls = (response.output || []).filter(
        (item) => item && (item as { type?: string }).type === "function_call",
      ) as Array<{
        type: "function_call";
        call_id: string;
        name: string;
        arguments: string;
      }>;

      if (!fnCalls.length) {
        const rawText = response.output_text || "";
        return {
          structured: parseArthurStructuredOutput(rawText),
          model: lastModel,
          tokensInput,
          tokensOutput,
          costEstimate: estimateCostUsd(model, tokensInput, tokensOutput),
          rawText,
          mock: false,
          toolCalls: toolCallsLog,
        };
      }

      // Append model output then tool results
      for (const call of fnCalls.slice(0, MAX_TOOLS_PER_TURN)) {
        inputItems.push(call as unknown as InputItem);
        let parsedArgs: unknown = {};
        try {
          parsedArgs = JSON.parse(call.arguments || "{}");
        } catch {
          parsedArgs = {};
        }

        let result: Record<string, unknown> = {
          success: false,
          error: "tool_ctx_missing",
          data: {},
        };
        if (input.toolCtx) {
          result = await executeArthurTool(call.name, parsedArgs, input.toolCtx);
        }
        toolCallsLog.push({ name: call.name, result });

        inputItems.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify(result),
        });
      }
    }

    arthurLog("warn", "openai_tool_loop_exhausted", {
      turns: MAX_TOOL_TURNS,
      tools: toolCallsLog.map((t) => t.name),
    });

    return {
      structured: parseArthurStructuredOutput(
        JSON.stringify({
          message:
            "J’ai bien avancé côté outils, mais je coupe ici pour éviter une boucle. Dis-moi ce que tu veux prioriser.",
          intent: "other",
          lead_temperature: "warm",
          extracted_data: {
            goal: null,
            level: null,
            frequency: null,
            target_date: null,
            distance: null,
            pace: null,
            equipment: [],
            injury: null,
            needs_plan: false,
            needs_human: false,
          },
          suggested_action: "continue",
        }),
      ),
      model: lastModel,
      tokensInput,
      tokensOutput,
      costEstimate: estimateCostUsd(model, tokensInput, tokensOutput),
      rawText: "",
      mock: false,
      toolCalls: toolCallsLog,
    };
  } catch (err) {
    const code =
      err && typeof err === "object" && "status" in err
        ? String((err as { status?: unknown }).status)
        : "unknown";
    arthurLog("error", "openai_call_failed", {
      model,
      status: code,
      name: err instanceof Error ? err.name : "Error",
    });
    throw err;
  }
}

/** Mock local pour tests sans clé OpenAI. */
export function mockStructuredFromUserPayload(
  userPayload: string,
  _toolCtx?: ToolExecutionContext,
): ArthurStructuredOutput {
  const lower = userPayload.toLowerCase();
  let intent: ArthurStructuredOutput["intent"] = "other";
  const extracted: ArthurStructuredOutput["extracted_data"] = {};

  if (/crawl|technique|respiration|virage|coulée|godille|progress/.test(lower)) {
    intent = "technique";
  } else if (/triathlon|ironman|compétition|course|objectif|prépare/.test(lower)) {
    intent = "goal";
    if (/triathlon/.test(lower)) extracted.goal = "triathlon";
    const weeks = lower.match(/(\d+)\s*semaines?/);
    const months = lower.match(/(\d+)\s*mois/);
    if (weeks) {
      const n = Number(weeks[1]);
      if (Number.isFinite(n)) {
        const d = new Date();
        d.setDate(d.getDate() + n * 7);
        extracted.target_date = d.toISOString().slice(0, 10);
      }
    } else if (months) {
      const n = Number(months[1]);
      if (Number.isFinite(n)) {
        const d = new Date();
        d.setMonth(d.getMonth() + n);
        extracted.target_date = d.toISOString().slice(0, 10);
      }
    }
  } else if (/plan|programme|entraîne|génère|genere/.test(lower)) {
    intent = "plan_request";
    extracted.needs_plan = true;
  } else if (/abonnement|premium|essai|prix|tarif|paiement/.test(lower)) {
    intent = "subscription";
  } else if (/myswym|application|app/.test(lower)) {
    intent = "myswym_question";
  } else if (/séance|volume|allure|entraînement|nager/.test(lower)) {
    intent = "training";
  } else if (/nage|bassin|piscine|eau/.test(lower)) {
    intent = "swimming_question";
  }

  const lead_temperature =
    intent === "plan_request" || intent === "subscription"
      ? "hot"
      : intent === "goal" || intent === "myswym_question"
        ? "warm"
        : "cold";

  let message =
    "Dis-moi un peu plus sur ton niveau et ta fréquence de nage, je pourrai t’orienter précisément.";
  let suggested_action = "continue";

  if (intent === "technique") {
    message =
      "Pour progresser en crawl : respiration bilatérale et alignement tête-bassin stable. Tu nages combien de fois par semaine ?";
    suggested_action = "qualify_frequency";
  } else if (intent === "goal" && extracted.goal === "triathlon") {
    message =
      "Triathlon avec une échéance : on construit une progression réaliste. Tu nages déjà combien de fois par semaine, bassin ou eau libre ?";
    suggested_action = "qualify_frequency";
  } else if (intent === "plan_request") {
    message =
      "Je peux te générer ton plan personnalisé sur 8 semaines. Tu veux que je le crée ?";
    suggested_action = "ask_plan_confirmation";
  } else if (intent === "subscription") {
    message =
      "Premium : essai 7 jours sans carte à l’inscription, puis 9,99€/mois sans engagement, 4,99€/mois avec engagement 12 mois, ou 52,99€/an en 1 fois. Après l’essai, tes séances se mettent en pause. Détails : https://myswym.app/fr/tarifs";
    suggested_action = "continue";
  } else if (intent === "other") {
    message = "";
    suggested_action = "no_reply";
  }

  return {
    message,
    intent,
    lead_temperature,
    extracted_data: extracted,
    suggested_action:
      suggested_action ||
      (intent === "plan_request" || (intent === "goal" && extracted.needs_plan)
        ? "ask_plan_confirmation"
        : intent === "goal"
          ? "qualify_frequency"
          : "continue"),
  };
}
