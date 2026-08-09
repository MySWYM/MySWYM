/**
 * Registry + exécuteur tools Arthur AI.
 * userId / accessToken viennent UNIQUEMENT du contexte serveur.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserProfile } from "./get-user-profile.js";
import { getCurrentPlan } from "./get-current-plan.js";
import { getTrainingHistory } from "./get-training-history.js";
import { getSubscriptionStatus } from "./get-subscription-status.js";
import { createTrainingPlan } from "./create-training-plan.js";
import { updateUserProfile } from "./update-user-profile.js";
import { createCheckout } from "./create-checkout.js";
import { toolFail } from "./result.js";
import { arthurLog } from "../logging.js";
import { getArthurFeatureFlags } from "../production/flags.js";
import type { AuthContext } from "../types.js";

export { getUserProfile } from "./get-user-profile.js";
export { getCurrentPlan } from "./get-current-plan.js";
export { getTrainingHistory } from "./get-training-history.js";
export { getSubscriptionStatus } from "./get-subscription-status.js";
export { createTrainingPlan } from "./create-training-plan.js";
export { updateUserProfile } from "./update-user-profile.js";
export { createCheckout } from "./create-checkout.js";

export const MAX_TOOL_TURNS = 4;
export const MAX_TOOLS_PER_TURN = 3;

export type ToolExecutionContext = {
  admin: SupabaseClient;
  auth: AuthContext;
  conversationId: string;
  accessToken?: string | null;
};

/** Définitions OpenAI Responses API (function tools). */
export function getArthurOpenAITools(auth: AuthContext) {
  // Instagram : jamais d’écriture (pas de plan / checkout / update auto depuis DM)
  // Phase G : flag tools_write
  const flags = getArthurFeatureFlags();
  const writeEnabled =
    flags.tools_write && !!auth.userId && auth.channel !== "instagram";

  const readTools = [
    {
      type: "function" as const,
      name: "get_user_profile",
      description: "Profil sportif MySWYM de l’utilisateur authentifié.",
      strict: true,
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {},
        required: [],
      },
    },
    {
      type: "function" as const,
      name: "get_current_plan",
      description: "Aperçu du plan d’entraînement actif.",
      strict: true,
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {},
        required: [],
      },
    },
    {
      type: "function" as const,
      name: "get_training_history",
      description: "Historique récent (feedback, séances, adaptations).",
      strict: true,
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {},
        required: [],
      },
    },
    {
      type: "function" as const,
      name: "get_subscription_status",
      description: "Statut d’accès Premium / essai (user_access_state).",
      strict: true,
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {},
        required: [],
      },
    },
  ];

  if (!writeEnabled) return readTools;

  return [
    ...readTools,
    {
      type: "function" as const,
      name: "create_training_plan",
      description:
        "Génère et persiste un plan via le moteur MySWYM. Exiger confirmed=true après accord explicite de l’utilisateur. Si un plan actif existe, replace_existing=true uniquement après 2e confirmation.",
      strict: true,
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["confirmed", "replace_existing", "weeks", "goal", "frequency", "target_date", "level"],
        properties: {
          confirmed: { type: "boolean" },
          replace_existing: { type: "boolean" },
          weeks: { type: ["number", "null"] },
          goal: { type: ["string", "null"] },
          frequency: { type: ["number", "null"] },
          target_date: { type: ["string", "null"] },
          level: { type: ["string", "null"] },
        },
      },
    },
    {
      type: "function" as const,
      name: "update_user_profile",
      description:
        "Met à jour uniquement des champs coaching whitelistés (goal, level, frequency, target_date, pool_length, equipment, preferred_stroke).",
      strict: true,
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["fields"],
        properties: {
          fields: {
            type: "object",
            additionalProperties: true,
            properties: {
              goal: { type: "string" },
              level: { type: "string" },
              frequency: { type: "number" },
              target_date: { type: "string" },
              pool_length: { type: "number" },
              equipment: { type: "array", items: { type: "string" } },
              preferred_stroke: { type: "string" },
            },
          },
        },
      },
    },
    {
      type: "function" as const,
      name: "create_checkout",
      description:
        "Crée une session Stripe Checkout Premium via l’Edge Function MySWYM existante. Retourne checkout_url.",
      strict: true,
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["plan"],
        properties: {
          plan: { type: "string", enum: ["monthly", "annual"] },
        },
      },
    },
  ];
}

export async function executeArthurTool(
  name: string,
  rawArgs: unknown,
  ctx: ToolExecutionContext,
): Promise<Record<string, unknown>> {
  const args =
    rawArgs && typeof rawArgs === "object" ? (rawArgs as Record<string, unknown>) : {};

  // Jamais accepter un userId venant du modèle
  if ("userId" in args || "user_id" in args) {
    arthurLog("warn", "tool_ignored_model_user_id", { tool: name });
    delete args.userId;
    delete args.user_id;
  }

  try {
    switch (name) {
      case "get_user_profile":
        return {
          success: true,
          data: await getUserProfile(ctx.admin, ctx.auth.userId),
          error: null,
        };
      case "get_current_plan":
        return {
          success: true,
          data: await getCurrentPlan(ctx.admin, ctx.auth.userId),
          error: null,
        };
      case "get_training_history":
        return {
          success: true,
          data: await getTrainingHistory(ctx.admin, ctx.auth.userId),
          error: null,
        };
      case "get_subscription_status":
        return {
          success: true,
          data: await getSubscriptionStatus(ctx.admin, ctx.auth.userId),
          error: null,
        };
      case "create_training_plan":
        if (!getArthurFeatureFlags().tools_write) {
          return toolFail("tools_write_disabled", {
            message: "Écritures Arthur temporairement désactivées.",
          }) as Record<string, unknown>;
        }
        if (ctx.auth.channel === "instagram") {
          return toolFail("instagram_writes_disabled", {
            message:
              "La création de plan se fait dans l’app MySWYM après inscription — pas depuis Instagram.",
          }) as Record<string, unknown>;
        }
        return (await createTrainingPlan(
          ctx.admin,
          {
            userId: ctx.auth.userId,
            conversationId: ctx.conversationId,
            accessToken: ctx.accessToken,
          },
          {
            confirmed: args.confirmed === true,
            replace_existing: args.replace_existing === true,
            weeks: args.weeks as number | null,
            goal: args.goal as string | null,
            frequency: args.frequency as number | null,
            target_date: args.target_date as string | null,
            level: args.level as string | null,
          },
        )) as Record<string, unknown>;
      case "update_user_profile":
        if (!getArthurFeatureFlags().tools_write) {
          return toolFail("tools_write_disabled", {
            message: "Écritures Arthur temporairement désactivées.",
          }) as Record<string, unknown>;
        }
        if (ctx.auth.channel === "instagram") {
          return toolFail("instagram_writes_disabled", {
            message: "Mise à jour profil depuis Instagram désactivée (V1).",
          }) as Record<string, unknown>;
        }
        return (await updateUserProfile(
          ctx.admin,
          { userId: ctx.auth.userId, conversationId: ctx.conversationId },
          { fields: (args.fields as Record<string, unknown>) || {} },
        )) as Record<string, unknown>;
      case "create_checkout":
        if (!getArthurFeatureFlags().tools_write) {
          return toolFail("tools_write_disabled", {
            message: "Écritures Arthur temporairement désactivées.",
          }) as Record<string, unknown>;
        }
        if (ctx.auth.channel === "instagram") {
          return toolFail("instagram_writes_disabled", {
            message:
              "Le paiement se fait dans MySWYM. Je peux t’envoyer le lien myswym.app.",
          }) as Record<string, unknown>;
        }
        return (await createCheckout(
          ctx.admin,
          {
            userId: ctx.auth.userId,
            conversationId: ctx.conversationId,
            accessToken: ctx.accessToken,
          },
          {
            plan: args.plan === "annual" ? "annual" : "monthly",
          },
        )) as Record<string, unknown>;
      default:
        return toolFail("unknown_tool", { name }) as Record<string, unknown>;
    }
  } catch (err) {
    arthurLog("error", "tool_execution_exception", {
      tool: name,
      name: err instanceof Error ? err.name : "Error",
    });
    return toolFail("tool_exception") as Record<string, unknown>;
  }
}
