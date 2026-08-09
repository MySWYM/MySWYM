/**
 * Sécurité Arthur AI — séparation stricte userId MySWYM / externalUserId.
 */
import type { AuthContext, ArthurChannel, ProcessArthurMessageInput } from "./types.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function asNonEmptyString(value: unknown, max = 500): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

/**
 * Construit un AuthContext sûr.
 * - userId : uniquement un UUID MySWYM (jamais un ID Instagram).
 * - externalUserId : identifiant canal externe, distinct.
 */
export function buildAuthContext(input: {
  userId?: string | null;
  externalUserId?: string | null;
  channel: ArthurChannel;
}): AuthContext {
  const userId = input.userId && isUuid(input.userId) ? input.userId : null;
  const externalRaw = asNonEmptyString(input.externalUserId, 256);

  // Refus explicite : ne jamais traiter un UUID Instagram-like comme userId si seul external est fourni
  let externalUserId = externalRaw;
  if (externalUserId && userId && externalUserId === userId) {
    // Même valeur des deux côtés = erreur de mapping → on garde userId, on drop l'external ambigu
    externalUserId = null;
  }

  return {
    userId,
    externalUserId,
    channel: input.channel,
  };
}

export function assertProcessInput(input: ProcessArthurMessageInput): {
  ok: true;
  message: string;
  auth: AuthContext;
  conversationId: string | null;
} | { ok: false; error: string } {
  const message = asNonEmptyString(input.message, 4000);
  if (!message) {
    return { ok: false, error: "Message invalide" };
  }

  if (input.channel !== "web" && input.channel !== "instagram") {
    return { ok: false, error: "Channel invalide" };
  }

  const auth = buildAuthContext({
    userId: input.userId,
    externalUserId: input.externalUserId,
    channel: input.channel,
  });

  if (!auth.userId && !auth.externalUserId) {
    return {
      ok: false,
      error: "Identité requise (userId MySWYM ou externalUserId canal)",
    };
  }

  // Sur web, on exige un userId MySWYM (pas d'identité Instagram seule)
  if (input.channel === "web" && !auth.userId) {
    return { ok: false, error: "Authentification MySWYM requise" };
  }

  const conversationId =
    input.conversationId && isUuid(input.conversationId)
      ? input.conversationId
      : null;

  return { ok: true, message, auth, conversationId };
}

/** Vérifie qu'une conversation appartient au contexte (anti cross-user). */
export function conversationBelongsToAuth(
  conversation: {
    user_id?: string | null;
    external_user_id?: string | null;
  },
  auth: AuthContext,
): boolean {
  // Match externe (Instagram) — même si un user_id a été rattaché plus tard
  if (
    auth.externalUserId &&
    conversation.external_user_id === auth.externalUserId
  ) {
    // Si la conversation est liée à un autre user MySWYM, exiger le même userId
    if (conversation.user_id && auth.userId && conversation.user_id !== auth.userId) {
      return false;
    }
    return true;
  }
  if (auth.userId && conversation.user_id === auth.userId) return true;
  return false;
}

export function redactForLogs(value: string, keep = 8): string {
  if (!value) return "";
  if (value.length <= keep) return "***";
  return `${value.slice(0, 4)}…${value.slice(-2)}`;
}
