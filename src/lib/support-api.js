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

export async function fetchSupportThread() {
  const headers = await authHeaders();
  if (!headers) return { ok: false, error: "auth", conversation: null, messages: [] };
  const res = await fetch(PATH, { headers, cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: json.error || `HTTP ${res.status}`, conversation: null, messages: [] };
  return json;
}

export async function sendSupportLive(message, priorMessages) {
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
