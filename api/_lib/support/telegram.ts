/**
 * Envoi Telegram Bot API.
 *
 * Support nageur : TELEGRAM_BOT_TOKEN + webhook
 *   `https://www.myswym.app/api/telegram/webhook`
 *   (l’apex myswym.app renvoie un 307 ; Telegram ne suit pas ce POST).
 *
 * Contact landing : TELEGRAM_CONTACT_BOT_TOKEN, envoi seul, pas de webhook.
 */

export type TelegramSendResult = { messageId: number } | null;

export type TelegramPort = {
  sendMessage: (
    chatId: string | number,
    text: string,
    replyToMessageId?: number | null,
  ) => Promise<TelegramSendResult>;
};

function botToken(): string {
  return (process.env.TELEGRAM_BOT_TOKEN || "").trim();
}

function contactBotToken(): string {
  return (process.env.TELEGRAM_CONTACT_BOT_TOKEN || "").trim();
}

export function operatorChatId(): string {
  return (process.env.TELEGRAM_OPERATOR_CHAT_ID || "").trim();
}

/** Chat du bot contact. Même id Telegram perso qu’opérateur, sauf override. */
export function contactChatId(): string {
  return (process.env.TELEGRAM_CONTACT_CHAT_ID || "").trim() || operatorChatId();
}

export function telegramWebhookSecret(): string {
  return (process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();
}

export function isTelegramConfigured(): boolean {
  return Boolean(botToken() && operatorChatId());
}

export function isContactTelegramConfigured(): boolean {
  return Boolean(contactBotToken() && contactChatId());
}

export function isTelegramMock(): boolean {
  return (process.env.TELEGRAM_MOCK || "").trim() === "1";
}

/** Si un secret est configuré, l’en-tête Telegram doit matcher. Sans secret : accepté (dev). */
export function telegramSecretOk(headerValue: unknown): boolean {
  const expected = telegramWebhookSecret();
  if (!expected) return true;
  return String(headerValue || "").trim() === expected;
}

async function sendTelegramMessageWithToken(
  token: string,
  chatId: string | number,
  text: string,
  replyToMessageId?: number | null,
): Promise<TelegramSendResult> {
  if (!token) return null;
  if (isTelegramMock()) {
    return { messageId: Date.now() };
  }
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: String(text || "").slice(0, 4000),
    disable_web_page_preview: true,
  };
  if (replyToMessageId && Number.isFinite(replyToMessageId)) {
    body.reply_to_message_id = replyToMessageId;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      result?: { message_id?: number };
    };
    const messageId = json?.result?.message_id;
    if (!res.ok || !json.ok || !messageId) return null;
    return { messageId };
  } catch {
    return null;
  }
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  replyToMessageId?: number | null,
): Promise<TelegramSendResult> {
  return sendTelegramMessageWithToken(botToken(), chatId, text, replyToMessageId);
}

export async function sendContactTelegramMessage(text: string): Promise<TelegramSendResult> {
  if (!isContactTelegramConfigured()) return null;
  return sendTelegramMessageWithToken(contactBotToken(), contactChatId(), text);
}

export const liveTelegramPort: TelegramPort = {
  sendMessage: sendTelegramMessage,
};
