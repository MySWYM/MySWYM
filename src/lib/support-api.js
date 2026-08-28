import { supabase } from "../supabase.js";

const PATH = "/api/contact?kind=app-support";

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

const emptySnap = { ok: false, conversation: null, messages: [], conversations: [] };

async function loadHistoryFromDb(conversationId) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) return null;
  const { data: convos } = await supabase
    .from("support_conversations")
    .select("id, short_code, status, closed_at, closed_by, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(40);
  const list = convos || [];
  if (!list.length) return { conversations: [], conversation: null, messages: [] };

  const { data: lastMsgs } = await supabase
    .from("support_messages")
    .select("id, conversation_id, role, body, created_at")
    .in(
      "conversation_id",
      list.map((c) => c.id),
    )
    .order("created_at", { ascending: true });
  const lastBy = new Map();
  for (const msg of lastMsgs || []) lastBy.set(msg.conversation_id, msg);
  const conversations = list.map((c) => {
    const last = lastBy.get(c.id);
    return {
      ...c,
      last_body: last?.body || "",
      last_role: last?.role || null,
      last_message_id: last?.id || "",
    };
  });

  const wanted =
    (conversationId && conversations.find((c) => c.id === conversationId)) ||
    conversations.find((c) => c.status === "open") ||
    conversations[0];

  const { data: messages } = wanted
    ? await supabase
        .from("support_messages")
        .select("id, role, body, source, created_at")
        .eq("conversation_id", wanted.id)
        .order("created_at", { ascending: true })
        .limit(80)
    : { data: [] };

  return { conversations, conversation: wanted || null, messages: messages || [] };
}

function mergeSnap(apiJson, dbSnap, conversationId) {
  const conversations =
    Array.isArray(apiJson.conversations) && apiJson.conversations.length
      ? apiJson.conversations
      : dbSnap?.conversations || [];
  const apiMissedRequested =
    Boolean(conversationId) && apiJson.conversation?.id && apiJson.conversation.id !== conversationId;
  return {
    ...apiJson,
    conversations,
    conversation: apiMissedRequested ? dbSnap?.conversation || apiJson.conversation : apiJson.conversation,
    messages: apiMissedRequested ? dbSnap?.messages || apiJson.messages : apiJson.messages,
  };
}

export async function fetchSupportThread(conversationId) {
  const headers = await authHeaders();
  if (!headers) return { ...emptySnap, error: "auth" };
  const url = conversationId
    ? `${PATH}&conversationId=${encodeURIComponent(conversationId)}`
    : PATH;
  const res = await fetch(url, { headers, cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  const dbSnap = await loadHistoryFromDb(conversationId).catch(() => null);
  if (!res.ok) {
    if (dbSnap?.conversations?.length) {
      return { ok: true, ...dbSnap, telegram_configured: false };
    }
    return {
      ...emptySnap,
      error: json.error || `HTTP ${res.status}`,
      conversations: dbSnap?.conversations || [],
    };
  }
  return mergeSnap({ ok: true, ...json }, dbSnap, conversationId);
}

export async function sendSupportLive(message, priorMessages, context) {
  const headers = await authHeaders();
  if (!headers) return { ok: false, error: "auth", conversation: null, messages: [] };
  const res = await fetch(PATH, {
    method: "POST",
    headers,
    body: JSON.stringify({
      kind: "app-support",
      action: "send",
      message,
      priorMessages: priorMessages || undefined,
      context: context || undefined,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: json.error || `HTTP ${res.status}`, conversation: null, messages: [] };
  return json;
}

export async function closeSupportLive(conversationId) {
  const headers = await authHeaders();
  if (!headers) return { ok: false, error: "auth", conversation: null, messages: [] };
  const res = await fetch(PATH, {
    method: "POST",
    headers,
    body: JSON.stringify({
      kind: "app-support",
      action: "close",
      conversationId,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: json.error || `HTTP ${res.status}`, conversation: null, messages: [] };
  return json;
}
