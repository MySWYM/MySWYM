/**
 * Aperçus de fils support (liste historique).
 */

export type SupportPreviewMessage = {
  conversation_id: string;
  id: string;
  role: string;
  body: string;
  created_at: string;
};

export type SupportConversationBase = {
  id: string;
  updated_at: string;
};

export function attachLastMessages<T extends SupportConversationBase>(
  conversations: T[],
  messages: SupportPreviewMessage[],
): (T & {
  last_body: string;
  last_role: string | null;
  last_message_id: string;
})[] {
  const lastByConv = new Map<string, SupportPreviewMessage>();
  for (const msg of messages) {
    const prev = lastByConv.get(msg.conversation_id);
    if (!prev || String(msg.created_at) >= String(prev.created_at)) {
      lastByConv.set(msg.conversation_id, msg);
    }
  }
  return conversations.map((conv) => {
    const last = lastByConv.get(conv.id);
    return {
      ...conv,
      last_body: last ? String(last.body || "").trim() : "",
      last_role: last ? String(last.role) : null,
      last_message_id: last ? String(last.id) : "",
    };
  });
}
