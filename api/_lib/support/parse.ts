/**
 * Parsing support in-app + Telegram opérateur (fonctions pures).
 */

export const SUPPORT_KIND = "app-support";
export const MAX_MESSAGE_CHARS = 2000;
export const MAX_PRIOR_MESSAGES = 8;

const HUMAN_RE =
  /\b(parler\s+(à|a)\s+(l['’]?équipe|un\s+humain|arthur)|contacter\s+(l['’]?équipe|arthur)|quelqu['’]un\s+de\s+l['’]?équipe|aide\s+humaine)\b/i;

export function newShortCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

export function isShortCode(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{8}$/i.test(value.trim());
}

export function normalizeShortCode(value: string): string {
  return value.trim().toLowerCase();
}

export function asMessageBody(value: unknown, max = MAX_MESSAGE_CHARS): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

export function wantsHumanHandoff(text: string): boolean {
  return HUMAN_RE.test(String(text || "").trim());
}

export function formatOperatorNotify(input: {
  shortCode: string;
  displayName: string;
  email?: string | null;
  body: string;
  isNew: boolean;
}): string {
  const who = [input.displayName, input.email].filter(Boolean).join(" · ");
  const flag = input.isNew ? "nouvelle conversation" : "suite";
  return [
    `💬 Support · ${input.shortCode}`,
    `${who || "Nageur"} (${flag})`,
    "",
    input.body,
    "",
    "↩ Réponds à ce message pour écrire dans l’app.",
    "/close — clôturer cette conversation",
  ].join("\n");
}

export function formatOperatorClosed(input: {
  shortCode: string;
  displayName: string;
  email?: string | null;
}): string {
  const who = [input.displayName, input.email].filter(Boolean).join(" · ");
  return [
    `✅ Support · ${input.shortCode}`,
    `${who || "Nageur"} a clôturé la conversation dans l’app.`,
  ].join("\n");
}

export function formatLandingContactNotify(input: {
  name: string;
  email: string;
  subject: string;
  body: string;
}): string {
  const who = [input.name, input.email].filter(Boolean).join(" · ");
  const body = String(input.body || "").trim().slice(0, 3200);
  return [
    "✉️ Contact landing",
    who || "Visiteur",
    `Objet : ${String(input.subject || "").trim() || "—"}`,
    "",
    body,
    "",
    `↪ Réponds par e-mail à ${input.email} — ce n’est pas un fil in-app.`,
  ].join("\n");
}

export function isLandingContactNotify(text: string): boolean {
  return /^\s*✉️?\s*Contact landing\b/im.test(String(text || ""));
}

export function parseSupportCodeFromText(text: string): string | null {
  const raw = String(text || "");
  const tagged = raw.match(/Support[^\n]{0,80}?([a-f0-9]{8})(?![a-f0-9])/i);
  if (tagged) return tagged[1].toLowerCase();
  return null;
}

export type OperatorCommand =
  | { type: "close"; shortCode?: string }
  | { type: "reply"; text: string }
  | { type: "ignore" };

export function parseOperatorText(text: string): OperatorCommand {
  const t = String(text || "").trim();
  if (!t) return { type: "ignore" };
  const close = t.match(/^\/close(?:\s+([a-f0-9]{8}))?$/i);
  if (close) {
    return {
      type: "close",
      shortCode: close[1] ? close[1].toLowerCase() : undefined,
    };
  }
  if (t.startsWith("/")) return { type: "ignore" };
  return { type: "reply", text: t.slice(0, MAX_MESSAGE_CHARS) };
}

export function isTelegramUpdate(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const id = (body as { update_id?: unknown }).update_id;
  return typeof id === "number" && Number.isFinite(id);
}

export type TelegramInbound = {
  updateId: number;
  chatId: number;
  fromId: number;
  text: string;
  replyToMessageId: number | null;
  replyToText: string;
};

function telegramFieldText(obj: Record<string, unknown> | undefined): string {
  if (!obj || typeof obj !== "object") return "";
  return [obj.text, obj.caption]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join("\n");
}

function quotedSnippet(obj: Record<string, unknown> | undefined): string {
  if (!obj || typeof obj !== "object") return "";
  const quote = obj.quote as { text?: unknown } | undefined;
  const params = obj.reply_parameters as { quote?: { text?: unknown } } | undefined;
  return String(quote?.text || params?.quote?.text || "").trim();
}

export function extractTelegramMessage(body: unknown): TelegramInbound | null {
  if (!isTelegramUpdate(body)) return null;
  const root = body as Record<string, unknown>;
  const msg = (
    root.message ||
    root.edited_message ||
    root.business_message ||
    root.edited_business_message
  ) as Record<string, unknown> | undefined;
  if (!msg || typeof msg !== "object") return null;
  const chat = msg.chat as Record<string, unknown> | undefined;
  const from = msg.from as Record<string, unknown> | undefined;
  const chatId = Number(chat?.id);
  const fromId = Number(from?.id);
  const updateId = Number(root.update_id);
  if (!Number.isFinite(chatId) || !Number.isFinite(fromId) || !Number.isFinite(updateId)) {
    return null;
  }
  const text = telegramFieldText(msg);
  const reply = msg.reply_to_message as Record<string, unknown> | undefined;
  const replyParams = msg.reply_parameters as { message_id?: unknown } | undefined;
  const rawReplyId = reply?.message_id ?? replyParams?.message_id;
  const replyToMessageId = Number.isFinite(Number(rawReplyId)) ? Number(rawReplyId) : null;
  const replyToText = [telegramFieldText(reply), quotedSnippet(msg)].filter(Boolean).join("\n");
  return {
    updateId,
    chatId,
    fromId,
    text,
    replyToMessageId,
    replyToText,
  };
}

export function isOperatorChat(
  chatId: number,
  configuredChatId: string | null | undefined,
): boolean {
  const expected = String(configuredChatId || "").trim();
  if (!expected) return false;
  return String(chatId) === expected;
}

export function isSupportKind(value: unknown): boolean {
  const v = String(value || "").trim().toLowerCase();
  return v === SUPPORT_KIND || v === "support";
}
