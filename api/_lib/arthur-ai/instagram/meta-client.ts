/**
 * Client Meta / Instagram Messaging — envoi de DM.
 * Secret : INSTAGRAM_ACCESS_TOKEN (jamais exposé client).
 */
import { arthurLog } from "../logging.js";
import { isInstagramMockMode, recordMockOutbound } from "./mock.js";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";

export function getInstagramAccessToken(): string | null {
  const t = (process.env.INSTAGRAM_ACCESS_TOKEN || "").trim();
  return t || null;
}

export function hasInstagramCredentials(): boolean {
  return Boolean(
    (process.env.META_VERIFY_TOKEN || "").trim() &&
      (process.env.META_APP_SECRET || "").trim() &&
      getInstagramAccessToken(),
  );
}

export interface SendInstagramTextInput {
  recipientId: string;
  text: string;
  /** Optionnel : IG business / page id ; défaut "me" */
  igOrPageId?: string;
}

export interface SendInstagramResult {
  ok: boolean;
  mock?: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envoie un message texte Instagram via Graph API.
 * En mode mock : n’appelle pas Meta, journalise localement.
 */
export async function sendInstagramTextMessage(
  input: SendInstagramTextInput,
): Promise<SendInstagramResult> {
  const recipientId = String(input.recipientId || "").trim();
  const text = String(input.text || "").trim().slice(0, 1000);
  if (!recipientId || !text) {
    return { ok: false, error: "invalid_payload" };
  }

  if (isInstagramMockMode()) {
    recordMockOutbound({ recipientId, text });
    arthurLog("info", "instagram_send_mock", {
      recipient: recipientId.slice(0, 6),
      length: text.length,
    });
    return { ok: true, mock: true, messageId: `mock_${Date.now()}` };
  }

  const token = getInstagramAccessToken();
  if (!token) {
    arthurLog("error", "instagram_token_missing", {});
    return { ok: false, error: "missing_access_token" };
  }

  const actor = (input.igOrPageId || process.env.INSTAGRAM_BUSINESS_ID || "me").trim();
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(actor)}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
        messaging_type: "RESPONSE",
      }),
    });

    const json = (await res.json().catch(() => ({}))) as {
      message_id?: string;
      error?: { message?: string; code?: number };
    };

    if (!res.ok || json.error) {
      arthurLog("error", "instagram_send_failed", {
        status: res.status,
        code: json.error?.code,
      });
      return {
        ok: false,
        error: json.error?.message || `http_${res.status}`,
      };
    }

    return { ok: true, messageId: json.message_id };
  } catch (err) {
    arthurLog("error", "instagram_send_exception", {
      name: err instanceof Error ? err.name : "Error",
    });
    return { ok: false, error: "network_error" };
  }
}
