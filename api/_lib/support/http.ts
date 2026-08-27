/**
 * HTTP support (monté dans api/contact.ts — pas de 13e fonction Hobby).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createArthurUserClient } from "../arthur-ai/supabase.js";
import { asNonEmptyString, isUuid } from "../arthur-ai/security.js";
import {
  closeSupportConversation,
  getSupportAdmin,
  handleOperatorInbound,
  loadSupportForUser,
  sendSupportMessage,
} from "./service.js";
import { allowSupportSend, RATE_LIMIT_MESSAGE } from "./rate-limit.js";
import {
  extractTelegramMessage,
  isOperatorChat,
  isSupportKind,
  isTelegramUpdate,
} from "./parse.js";
import {
  operatorChatId,
  telegramSecretOk,
} from "./telegram.js";

function json(res: VercelResponse, status: number, body: unknown) {
  return res.status(status).json(body);
}

function queryKind(req: VercelRequest): string {
  const q = req.query?.kind;
  return Array.isArray(q) ? q[0] || "" : String(q || "");
}

function requestPath(req: VercelRequest): string {
  try {
    return new URL(req.url || "/", "http://localhost").pathname;
  } catch {
    return String(req.url || "").split("?")[0];
  }
}

export function isSupportRequest(req: VercelRequest, body: Record<string, unknown>): boolean {
  const path = requestPath(req);
  if (path === "/api/support" || path.endsWith("/api/support")) return true;
  if (isSupportKind(queryKind(req)) || isSupportKind(body.kind)) return true;
  const action = String(body.action || "").trim();
  return isSupportKind(queryKind(req)) && (action === "send" || action === "close" || action === "get");
}

export function isTelegramWebhookRequest(
  req: VercelRequest,
  body: unknown,
): boolean {
  if (req.method !== "POST") return false;
  const path = requestPath(req);
  if (path.includes("/api/telegram")) return true;
  return isTelegramUpdate(body);
}

async function resolveUserId(
  req: VercelRequest,
): Promise<{ ok: true; userId: string } | { ok: false; status: number; error: string }> {
  const authHeader = String(req.headers.authorization || "");
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return { ok: false, status: 401, error: "Non authentifié" };
  try {
    const userClient = createArthurUserClient(match[1].trim());
    const { data, error } = await userClient.auth.getUser();
    if (error || !data.user?.id || !isUuid(data.user.id)) {
      return { ok: false, status: 401, error: "Session invalide" };
    }
    return { ok: true, userId: data.user.id };
  } catch {
    return { ok: false, status: 401, error: "Auth impossible" };
  }
}

export async function handleTelegramWebhook(
  req: VercelRequest,
  res: VercelResponse,
  body: unknown,
): Promise<void> {
  const secretHeader = req.headers["x-telegram-bot-api-secret-token"];
  if (!telegramSecretOk(secretHeader)) {
    json(res, 401, { ok: false, error: "unauthorized" });
    return;
  }
  const inbound = extractTelegramMessage(body);
  if (!inbound) {
    json(res, 200, { ok: true, ignored: true });
    return;
  }
  if (!isOperatorChat(inbound.chatId, operatorChatId())) {
    json(res, 200, { ok: true, ignored: true });
    return;
  }
  try {
    const result = await handleOperatorInbound({ inbound });
    json(res, 200, { ok: true, ...result });
  } catch (err) {
    console.error("[support] telegram inbound", err instanceof Error ? err.message : err);
    json(res, 200, { ok: true, error: "processed_with_error" });
  }
}

export async function handleSupportHttp(
  req: VercelRequest,
  res: VercelResponse,
  body: Record<string, unknown>,
): Promise<void> {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    json(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  const auth = await resolveUserId(req);
  if (!auth.ok) {
    json(res, auth.status, { ok: false, error: auth.error });
    return;
  }

  try {
    if (req.method === "GET") {
      const raw = req.query?.conversationId;
      const requested = asNonEmptyString(Array.isArray(raw) ? raw[0] : raw, 64);
      const snap = await loadSupportForUser(
        auth.userId,
        getSupportAdmin(),
        requested && isUuid(requested) ? requested : undefined,
      );
      json(res, 200, { ok: true, ...snap });
      return;
    }

    const action = String(body.action || "send").trim();
    if (action === "close") {
      const conversationId = asNonEmptyString(body.conversationId, 64);
      const snap = await closeSupportConversation({
        userId: auth.userId,
        conversationId: conversationId && isUuid(conversationId) ? conversationId : undefined,
        closedBy: "user",
      });
      json(res, 200, { ok: true, ...snap });
      return;
    }

    if (action === "send") {
      const message = asNonEmptyString(body.message, 2000);
      if (!message) {
        json(res, 400, { ok: false, error: "message requis" });
        return;
      }
      const allowed = await allowSupportSend(auth.userId);
      if (!allowed) {
        json(res, 429, { ok: false, error: RATE_LIMIT_MESSAGE });
        return;
      }
      const snap = await sendSupportMessage({
        userId: auth.userId,
        message,
        priorMessages: body.priorMessages,
        context: body.context,
      });
      if (snap.error === "message_invalide") {
        json(res, 400, { ok: false, error: "message requis" });
        return;
      }
      json(res, 200, { ok: true, ...snap });
      return;
    }

    json(res, 400, { ok: false, error: "action inconnue" });
  } catch (err) {
    console.error("[support] http", err instanceof Error ? err.message : err);
    json(res, 500, { ok: false, error: "Support indisponible pour le moment." });
  }
}
