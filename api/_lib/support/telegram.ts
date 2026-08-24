/**
 * Envoi Telegram Bot API (opérateur MySWYM uniquement).
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

export function operatorChatId(): string {
  return (process.env.TELEGRAM_OPERATOR_CHAT_ID || "").trim();
}

export function telegramWebhookSecret(): string {
  return (process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();
}

export function isTelegramConfigured(): boolean {
  return Boolean(botToken() && operatorChatId());
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

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  replyToMessageId?: number | null,
): Promise<TelegramSendResult> {
  const token = botToken();
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

export const liveTelegramPort: TelegramPort = {
  sendMessage: sendTelegramMessage,
};
