/**
 * Support in-app : persistance + relais Telegram opérateur.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createArthurAdminClient } from "../arthur-ai/supabase.js";
import {
  asMessageBody,
  formatOperatorClosed,
  formatOperatorNotify,
  MAX_PRIOR_MESSAGES,
  newShortCode,
  normalizeShortCode,
  parseOperatorText,
  parseSupportCodeFromText,
} from "./parse.js";
import {
  isTelegramConfigured,
  liveTelegramPort,
  operatorChatId,
  type TelegramPort,
} from "./telegram.js";
import type { TelegramInbound } from "./parse.js";
import { attachLastMessages } from "./preview.js";

const HOLD_MESSAGE =
  "L’équipe a bien reçu ton message. Arthur te répond ici dès qu’il peut.";
const CLOSED_MESSAGE = "Conversation clôturée.";

export type SupportRole = "user" | "agent" | "bot" | "system";

export type SupportMessage = {
  id: string;
  role: SupportRole;
  body: string;
  source: string;
  created_at: string;
};

export type SupportConversation = {
  id: string;
  short_code: string;
  status: "open" | "closed";
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SupportConversationPreview = SupportConversation & {
  last_body: string;
  last_role: string | null;
  last_message_id: string;
};

export type SupportSnapshot = {
  conversation: SupportConversation | null;
  messages: SupportMessage[];
  conversations: SupportConversationPreview[];
  telegram_configured: boolean;
};

type PriorMessage = { role?: unknown; text?: unknown; body?: unknown };

function mapConversation(row: Record<string, unknown>): SupportConversation {
  return {
    id: String(row.id),
    short_code: String(row.short_code),
    status: row.status === "closed" ? "closed" : "open",
    closed_at: row.closed_at ? String(row.closed_at) : null,
    closed_by: row.closed_by ? String(row.closed_by) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapMessage(row: Record<string, unknown>): SupportMessage {
  return {
    id: String(row.id),
    role: row.role as SupportRole,
    body: String(row.body || ""),
    source: String(row.source || "app"),
    created_at: String(row.created_at),
  };
}

export function getSupportAdmin(): SupabaseClient {
  return createArthurAdminClient();
}

async function findOpenConversation(
  admin: SupabaseClient,
  userId: string,
): Promise<SupportConversation | null> {
  const { data } = await admin
    .from("support_conversations")
    .select("id, short_code, status, closed_at, closed_by, created_at, updated_at")
    .eq("user_id", userId)
    .eq("status", "open")
    .maybeSingle();
  return data ? mapConversation(data) : null;
}

async function findUserConversation(
  admin: SupabaseClient,
  userId: string,
  conversationId: string,
): Promise<SupportConversation | null> {
  const { data } = await admin
    .from("support_conversations")
    .select("id, short_code, status, closed_at, closed_by, created_at, updated_at")
    .eq("user_id", userId)
    .eq("id", conversationId)
    .maybeSingle();
  return data ? mapConversation(data) : null;
}

async function listConversationPreviews(
  admin: SupabaseClient,
  userId: string,
  limit = 40,
): Promise<SupportConversationPreview[]> {
  const { data: convos } = await admin
    .from("support_conversations")
    .select("id, short_code, status, closed_at, closed_by, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  const list = (convos || []).map((row) => mapConversation(row));
  if (!list.length) return [];
  const { data: msgs } = await admin
    .from("support_messages")
    .select("id, conversation_id, role, body, created_at")
    .in(
      "conversation_id",
      list.map((c) => c.id),
    )
    .order("created_at", { ascending: true });
  return attachLastMessages(list, (msgs || []) as {
    conversation_id: string;
    id: string;
    role: string;
    body: string;
    created_at: string;
  }[]);
}

async function listMessages(
  admin: SupabaseClient,
  conversationId: string,
  limit = 80,
): Promise<SupportMessage[]> {
  const { data } = await admin
    .from("support_messages")
    .select("id, role, body, source, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);
  return (data || []).map((row) => mapMessage(row));
}

async function insertMessage(
  admin: SupabaseClient,
  input: {
    conversationId: string;
    role: SupportRole;
    body: string;
    source: "app" | "faq" | "telegram" | "system";
    telegramUpdateId?: number | null;
  },
): Promise<SupportMessage | null> {
  const { data, error } = await admin
    .from("support_messages")
    .insert({
      conversation_id: input.conversationId,
      role: input.role,
      body: input.body,
      source: input.source,
      telegram_update_id: input.telegramUpdateId ?? null,
    })
    .select("id, role, body, source, created_at")
    .single();
  if (error || !data) return null;
  return mapMessage(data);
}

async function touchConversation(admin: SupabaseClient, conversationId: string) {
  await admin
    .from("support_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

async function createOpenConversation(
  admin: SupabaseClient,
  userId: string,
): Promise<SupportConversation> {
  for (let i = 0; i < 5; i += 1) {
    const short_code = newShortCode();
    const { data, error } = await admin
      .from("support_conversations")
      .insert({ user_id: userId, short_code, status: "open" })
      .select("id, short_code, status, closed_at, closed_by, created_at, updated_at")
      .single();
    if (!error && data) return mapConversation(data);
  }
  const existing = await findOpenConversation(admin, userId);
  if (existing) return existing;
  throw new Error("Impossible de créer la conversation");
}

async function resolveUserLabel(
  admin: SupabaseClient,
  userId: string,
): Promise<{ displayName: string; email: string | null }> {
  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    const user = data?.user;
    const meta = (user?.user_metadata || {}) as Record<string, unknown>;
    const displayName =
      String(meta.firstname || meta.first_name || meta.full_name || "").trim() ||
      (user?.email ? String(user.email).split("@")[0] : "") ||
      "Nageur";
    return { displayName, email: user?.email || null };
  } catch {
    return { displayName: "Nageur", email: null };
  }
}

async function notifyOperator(
  admin: SupabaseClient,
  input: {
    conversation: SupportConversation;
    userId: string;
    body: string;
    isNew: boolean;
    telegram?: TelegramPort;
  },
): Promise<void> {
  if (!isTelegramConfigured()) return;
  const port = input.telegram || liveTelegramPort;
  const chatId = operatorChatId();
  const who = await resolveUserLabel(admin, input.userId);
  const text = formatOperatorNotify({
    shortCode: input.conversation.short_code,
    displayName: who.displayName,
    email: who.email,
    body: input.body,
    isNew: input.isNew,
  });
  const sent = await port.sendMessage(chatId, text);
  if (!sent?.messageId) return;
  const { error } = await admin.from("support_telegram_outbound").insert({
    telegram_chat_id: Number(chatId),
    telegram_message_id: sent.messageId,
    conversation_id: input.conversation.id,
  });
  if (error) {
    console.error("[support] outbound map", error.message);
  }
}

export async function loadSupportForUser(
  userId: string,
  admin: SupabaseClient = getSupportAdmin(),
  conversationId?: string | null,
): Promise<SupportSnapshot> {
  const conversations = await listConversationPreviews(admin, userId);
  let conversation: SupportConversation | null = null;
  if (conversationId) {
    conversation = conversations.find((c) => c.id === conversationId) || null;
    if (!conversation) conversation = await findUserConversation(admin, userId, conversationId);
  }
  if (!conversation) {
    conversation = conversations.find((c) => c.status === "open") || conversations[0] || null;
  }
  const messages = conversation ? await listMessages(admin, conversation.id) : [];
  return {
    conversation,
    messages,
    conversations,
    telegram_configured: isTelegramConfigured(),
  };
}

function sanitizePrior(prior: unknown): { role: "user" | "bot"; body: string }[] {
  if (!Array.isArray(prior)) return [];
  const out: { role: "user" | "bot"; body: string }[] = [];
  for (const item of prior as PriorMessage[]) {
    const role = item?.role === "bot" || item?.role === "assistant" ? "bot" : "user";
    const body = asMessageBody(item?.body ?? item?.text, 500);
    if (!body) continue;
    out.push({ role, body });
    if (out.length >= MAX_PRIOR_MESSAGES) break;
  }
  return out;
}

export async function sendSupportMessage(input: {
  userId: string;
  message: string;
  priorMessages?: unknown;
  admin?: SupabaseClient;
  telegram?: TelegramPort;
}): Promise<SupportSnapshot & { error?: string }> {
  const body = asMessageBody(input.message);
  if (!body) {
    return {
      conversation: null,
      messages: [],
      conversations: [],
      telegram_configured: isTelegramConfigured(),
      error: "message_invalide",
    };
  }

  const admin = input.admin || getSupportAdmin();
  let conversation = await findOpenConversation(admin, input.userId);
  const isNew = !conversation;
  if (!conversation) {
    conversation = await createOpenConversation(admin, input.userId);
    const prior = sanitizePrior(input.priorMessages);
    for (const p of prior) {
      await insertMessage(admin, {
        conversationId: conversation.id,
        role: p.role,
        body: p.body,
        source: p.role === "bot" ? "faq" : "app",
      });
    }
  }

  await insertMessage(admin, {
    conversationId: conversation.id,
    role: "user",
    body,
    source: "app",
  });

  if (isNew) {
    await insertMessage(admin, {
      conversationId: conversation.id,
      role: "system",
      body: HOLD_MESSAGE,
      source: "system",
    });
  }

  await touchConversation(admin, conversation.id);
  await notifyOperator(admin, {
    conversation,
    userId: input.userId,
    body,
    isNew,
    telegram: input.telegram,
  });

  return loadSupportForUser(input.userId, admin, conversation.id);
}

async function lastOutboundMessageId(
  admin: SupabaseClient,
  conversationId: string,
): Promise<number | null> {
  const { data } = await admin
    .from("support_telegram_outbound")
    .select("telegram_message_id")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const id = data?.telegram_message_id;
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function notifyOperatorClosed(
  admin: SupabaseClient,
  input: {
    conversation: SupportConversation;
    userId: string;
    telegram?: TelegramPort;
  },
): Promise<void> {
  if (!isTelegramConfigured()) return;
  const port = input.telegram || liveTelegramPort;
  const chatId = operatorChatId();
  const who = await resolveUserLabel(admin, input.userId);
  const text = formatOperatorClosed({
    shortCode: input.conversation.short_code,
    displayName: who.displayName,
    email: who.email,
  });
  const replyTo = await lastOutboundMessageId(admin, input.conversation.id);
  await port.sendMessage(chatId, text, replyTo);
}

export async function closeSupportConversation(input: {
  userId: string;
  conversationId?: string;
  closedBy: "user" | "agent" | "system";
  admin?: SupabaseClient;
  telegram?: TelegramPort;
}): Promise<SupportSnapshot & { error?: string }> {
  const admin = input.admin || getSupportAdmin();
  const open = await findOpenConversation(admin, input.userId);
  if (!open) {
    return loadSupportForUser(input.userId, admin);
  }
  if (input.conversationId && input.conversationId !== open.id) {
    return { ...(await loadSupportForUser(input.userId, admin)), error: "conversation_mismatch" };
  }
  const now = new Date().toISOString();
  await admin
    .from("support_conversations")
    .update({
      status: "closed",
      closed_at: now,
      closed_by: input.closedBy,
      updated_at: now,
    })
    .eq("id", open.id);
  await insertMessage(admin, {
    conversationId: open.id,
    role: "system",
    body: CLOSED_MESSAGE,
    source: "system",
  });
  if (input.closedBy === "user") {
    await notifyOperatorClosed(admin, {
      conversation: open,
      userId: input.userId,
      telegram: input.telegram,
    });
  }
  return loadSupportForUser(input.userId, admin);
}

async function findConversationByShortCode(
  admin: SupabaseClient,
  shortCode: string,
): Promise<(SupportConversation & { user_id: string }) | null> {
  const { data } = await admin
    .from("support_conversations")
    .select("id, user_id, short_code, status, closed_at, closed_by, created_at, updated_at")
    .eq("short_code", normalizeShortCode(shortCode))
    .maybeSingle();
  if (!data) return null;
  return { ...mapConversation(data), user_id: String(data.user_id) };
}

async function loadConversationById(
  admin: SupabaseClient,
  conversationId: string,
): Promise<(SupportConversation & { user_id: string }) | null> {
  const { data: conv } = await admin
    .from("support_conversations")
    .select("id, user_id, short_code, status, closed_at, closed_by, created_at, updated_at")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv) return null;
  return { ...mapConversation(conv), user_id: String(conv.user_id) };
}

async function findConversationByOutbound(
  admin: SupabaseClient,
  chatId: number,
  messageId: number,
): Promise<(SupportConversation & { user_id: string }) | null> {
  const { data: withChat } = await admin
    .from("support_telegram_outbound")
    .select("conversation_id")
    .eq("telegram_chat_id", chatId)
    .eq("telegram_message_id", messageId)
    .maybeSingle();
  if (withChat?.conversation_id) {
    return loadConversationById(admin, String(withChat.conversation_id));
  }
  const { data: byMessage } = await admin
    .from("support_telegram_outbound")
    .select("conversation_id")
    .eq("telegram_message_id", messageId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!byMessage?.conversation_id) return null;
  return loadConversationById(admin, String(byMessage.conversation_id));
}

async function findLatestOutboundConversation(
  admin: SupabaseClient,
  chatId: number,
): Promise<(SupportConversation & { user_id: string }) | null> {
  const { data } = await admin
    .from("support_telegram_outbound")
    .select("conversation_id")
    .eq("telegram_chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.conversation_id) return null;
  return loadConversationById(admin, String(data.conversation_id));
}

async function findLatestOpenConversation(
  admin: SupabaseClient,
): Promise<(SupportConversation & { user_id: string }) | null> {
  const { data } = await admin
    .from("support_conversations")
    .select("id, user_id, short_code, status, closed_at, closed_by, created_at, updated_at")
    .eq("status", "open")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { ...mapConversation(data), user_id: String(data.user_id) };
}

async function resolveInboundConversation(
  admin: SupabaseClient,
  inbound: TelegramInbound,
  shortCode?: string,
  allowFallback = true,
): Promise<(SupportConversation & { user_id: string }) | null> {
  if (shortCode) {
    const tagged = await findConversationByShortCode(admin, shortCode);
    if (tagged) return tagged;
  }
  if (inbound.replyToMessageId) {
    const fromReply = await findConversationByOutbound(
      admin,
      inbound.chatId,
      inbound.replyToMessageId,
    );
    if (fromReply) return fromReply;
  }
  const fromReplyText = parseSupportCodeFromText(inbound.replyToText);
  if (fromReplyText) {
    const tagged = await findConversationByShortCode(admin, fromReplyText);
    if (tagged) return tagged;
  }
  const fromBody = parseSupportCodeFromText(inbound.text);
  if (fromBody) {
    const tagged = await findConversationByShortCode(admin, fromBody);
    if (tagged) return tagged;
  }
  if (!allowFallback) return null;
  const latestOutbound = await findLatestOutboundConversation(admin, inbound.chatId);
  if (latestOutbound) return latestOutbound;
  return findLatestOpenConversation(admin);
}

export async function handleOperatorInbound(input: {
  inbound: TelegramInbound;
  admin?: SupabaseClient;
  telegram?: TelegramPort;
}): Promise<{ ok: boolean; action: string }> {
  const admin = input.admin || getSupportAdmin();
  const port = input.telegram || liveTelegramPort;
  const inbound = input.inbound;
  const cmd = parseOperatorText(inbound.text);

  if (cmd.type === "ignore") {
    return { ok: true, action: "ignored" };
  }

  const conversation = await resolveInboundConversation(
    admin,
    inbound,
    cmd.type === "close"
      ? cmd.shortCode
      : parseSupportCodeFromText(inbound.replyToText) ||
          parseSupportCodeFromText(inbound.text) ||
          undefined,
    cmd.type !== "close",
  );

  if (!conversation) {
    await port.sendMessage(
      inbound.chatId,
      "Je n’ai pas trouvé la conversation. Réponds au message Support · xxxxxxxx.",
      inbound.replyToMessageId,
    );
    return { ok: true, action: "unresolved" };
  }

  if (cmd.type === "close") {
    if (conversation.status === "closed") {
      await port.sendMessage(inbound.chatId, `Déjà clôturée (${conversation.short_code}).`, inbound.replyToMessageId);
      return { ok: true, action: "already_closed" };
    }
    await closeSupportConversation({
      userId: conversation.user_id,
      conversationId: conversation.id,
      closedBy: "agent",
      admin,
    });
    await port.sendMessage(
      inbound.chatId,
      `Clôturée · ${conversation.short_code}`,
      inbound.replyToMessageId,
    );
    return { ok: true, action: "closed" };
  }

  if (conversation.status === "closed") {
    await port.sendMessage(
      inbound.chatId,
      `Cette conversation (${conversation.short_code}) est clôturée. Le nageur doit en ouvrir une nouvelle.`,
      inbound.replyToMessageId,
    );
    return { ok: true, action: "closed_noreply" };
  }

  const inserted = await insertMessage(admin, {
    conversationId: conversation.id,
    role: "agent",
    body: cmd.text,
    source: "telegram",
    telegramUpdateId: inbound.updateId,
  });
  if (!inserted) {
    // duplicate telegram_update_id
    return { ok: true, action: "duplicate" };
  }
  await touchConversation(admin, conversation.id);
  return { ok: true, action: "replied" };
}
