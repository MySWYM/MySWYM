/**
 * POST /api/ai/chat, endpoint de test interne Arthur AI (sans Instagram).
 *
 * Auth :
 * - Bearer JWT Supabase (recommandé) → userId depuis le token uniquement
 * - ou header x-myswym-arthur-secret === ARTHUR_AI_INTERNAL_SECRET (tests internes)
 *
 * Body : { message, conversationId?, channel? }
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  ArthurAIError,
  processArthurMessage,
} from "../_lib/arthur-ai/service.js";
import { createArthurUserClient } from "../_lib/arthur-ai/supabase.js";
import { asNonEmptyString, isUuid } from "../_lib/arthur-ai/security.js";
import { arthurLog } from "../_lib/arthur-ai/logging.js";

export const config = {
  maxDuration: 60,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const auth = await resolveChatAuth(req);
    if (!auth.ok) {
      return res.status(auth.status).json({ ok: false, error: auth.error });
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const message = asNonEmptyString(body.message, 4000);
    if (!message) {
      return res.status(400).json({ ok: false, error: "message requis" });
    }

    // Jamais faire confiance à un userId du body
    if (body.userId != null || body.user_id != null) {
      arthurLog("warn", "chat_ignored_body_user_id", {});
    }

    const conversationId =
      typeof body.conversationId === "string" && isUuid(body.conversationId)
        ? body.conversationId
        : undefined;

    const result = await processArthurMessage({
      userId: auth.userId,
      externalUserId: auth.externalUserId,
      channel: "web",
      message,
      conversationId,
      accessToken: auth.accessToken,
    });

    return res.status(200).json({
      ok: true,
      conversationId: result.conversationId,
      message: result.message,
      intent: result.intent,
      lead_temperature: result.lead_temperature,
      extracted_data: result.extracted_data,
      suggested_action: result.suggested_action,
      model: result.model,
      mock: result.mock === true,
      tools: (result.toolCalls || []).map((t) => t.name),
    });
  } catch (err) {
    if (err instanceof ArthurAIError) {
      return res.status(err.status).json({ ok: false, error: err.message });
    }
    arthurLog("error", "chat_handler_exception", {
      name: err instanceof Error ? err.name : "Error",
    });
    return res.status(500).json({
      ok: false,
      error: "Erreur Arthur AI",
    });
  }
}

async function resolveChatAuth(req: VercelRequest): Promise<
  | { ok: true; userId: string; externalUserId?: string; accessToken?: string }
  | { ok: false; status: number; error: string }
> {
  const internal = (process.env.ARTHUR_AI_INTERNAL_SECRET || "").trim();
  const headerSecret = String(
    req.headers["x-myswym-arthur-secret"] || "",
  ).trim();

  if (internal && headerSecret && headerSecret === internal) {
    // Mode test interne (secret serveur) : UUID MySWYM de test uniquement, jamais un ID Instagram.
    const body = (req.body ?? {}) as Record<string, unknown>;
    const testUserId = asNonEmptyString(body.testUserId, 64);
    if (testUserId && isUuid(testUserId)) {
      return { ok: true, userId: testUserId, accessToken: undefined };
    }
    return {
      ok: false,
      status: 400,
      error: "testUserId UUID requis avec x-myswym-arthur-secret",
    };
  }

  const authHeader = String(req.headers.authorization || "");
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { ok: false, status: 401, error: "Non authentifié" };
  }

  const token = match[1].trim();
  try {
    const userClient = createArthurUserClient(token);
    const { data, error } = await userClient.auth.getUser();
    if (error || !data.user?.id) {
      return { ok: false, status: 401, error: "Session invalide" };
    }
    return { ok: true, userId: data.user.id, accessToken: token };
  } catch {
    return { ok: false, status: 401, error: "Auth impossible" };
  }
}
