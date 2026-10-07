/**
 * HTTP push APNs (monté dans api/contact.ts, pas de 13e fonction Hobby).
 * Routes : POST /api/push/notify (rewrite) ou ?kind=push-notify
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { pushToUser } from "./notify-user.js";

function supabaseAnon() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  return createClient(url, key, { auth: { persistSession: false } });
}

function supabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createClient(url, key, { auth: { persistSession: false } });
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

export function isPushNotifyRequest(
  req: VercelRequest,
  body: Record<string, unknown>,
): boolean {
  const path = requestPath(req);
  if (path === "/api/push/notify" || path.endsWith("/api/push/notify")) return true;
  const kind = queryKind(req) || String(body.kind || "");
  return kind === "push-notify" || kind === "push_notify";
}

async function userFromAuth(req: VercelRequest) {
  const auth = String(req.headers.authorization || "");
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  // Prefer service role (présent en prod) ; fallback anon.
  try {
    const admin = supabaseAdmin();
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (url && key) {
      const { data, error } = await admin.auth.getUser(token);
      if (!error && data?.user) return data.user;
    }
  } catch { /* fall through */ }
  try {
    const { data, error } = await supabaseAnon().auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

export async function handlePushNotifyHttp(
  req: VercelRequest,
  res: VercelResponse,
  body: Record<string, unknown>,
) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method" });

  const event = String(body.event || "");

  try {
    if (event === "support_reply") {
      const secret = process.env.INTERNAL_EMAIL_SECRET || "";
      if (!secret || req.headers["x-myswym-email-secret"] !== secret) {
        return res.status(401).json({ ok: false, error: "unauthorized" });
      }
      const userId = String(body.userId || "");
      const preview = String(body.body || "").trim().slice(0, 120);
      const result = await pushToUser(userId, {
        title: "Nouvelle réponse MySWYM",
        body: preview || "Arthur t’a répondu dans le chat.",
        badge: 1,
        data: { kind: "support", path: "/app" },
      }, { category: "support" });
      return res.status(200).json({ ok: true, ...result });
    }

    if (event === "register_token") {
      const user = await userFromAuth(req);
      if (!user) return res.status(401).json({ ok: false, error: "unauthorized" });
      const token = String(body.token || "").replace(/\s+/g, "").toLowerCase();
      if (!token || token.length < 64) {
        return res.status(400).json({ ok: false, error: "bad_token" });
      }
      const admin = supabaseAdmin();
      const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
      if (!url || !key) {
        console.error("[api/push/notify] register_token no_admin");
        return res.status(500).json({ ok: false, error: "no_admin" });
      }
      const { error: dropError } = await admin
        .from("device_push_tokens")
        .delete()
        .eq("token", token)
        .neq("user_id", user.id);
      if (dropError) {
        console.error("[api/push/notify] register_token drop", dropError.message);
        return res.status(500).json({ ok: false, error: dropError.message || "drop" });
      }
      const now = new Date().toISOString();
      const { error } = await admin.from("device_push_tokens").upsert(
        {
          user_id: user.id,
          token,
          platform: "ios",
          app_bundle: String(body.appBundle || "app.myswym.ios"),
          updated_at: now,
        },
        { onConflict: "user_id,token" },
      );
      if (error) {
        console.error("[api/push/notify] register_token", error.message);
        return res.status(500).json({ ok: false, error: error.message || "upsert" });
      }
      console.log("[api/push/notify] register_token ok", { userId: user.id, tokenLen: token.length });
      return res.status(200).json({ ok: true });
    }

    if (event === "buddy_request" || event === "buddy_accepted") {
      const user = await userFromAuth(req);
      if (!user) return res.status(401).json({ ok: false, error: "unauthorized" });
      const connectionId = String(body.connectionId || "");
      if (!connectionId) return res.status(400).json({ ok: false, error: "connectionId" });

      const admin = supabaseAdmin();
      const { data: conn, error } = await admin
        .from("buddy_connections")
        .select("id, requester_id, recipient_id, status")
        .eq("id", connectionId)
        .maybeSingle();
      if (error || !conn) return res.status(404).json({ ok: false, error: "not_found" });

      if (event === "buddy_request") {
        if (conn.requester_id !== user.id) {
          return res.status(403).json({ ok: false, error: "forbidden" });
        }
        if (conn.status !== "pending") {
          return res.status(400).json({ ok: false, error: "not_pending" });
        }
        const result = await pushToUser(conn.recipient_id, {
          title: "Demande de binôme",
          body: "Un nageur veut nager avec toi.",
          data: { kind: "buddy", path: "/app" },
        }, { category: "buddy" });
        return res.status(200).json({ ok: true, ...result });
      }

      if (conn.recipient_id !== user.id && conn.requester_id !== user.id) {
        return res.status(403).json({ ok: false, error: "forbidden" });
      }
      if (conn.status !== "accepted") {
        return res.status(400).json({ ok: false, error: "not_accepted" });
      }
      const targetId = conn.recipient_id === user.id ? conn.requester_id : conn.recipient_id;
      const result = await pushToUser(targetId, {
        title: "Binôme accepté",
        body: "Ta mise en relation a été acceptée.",
        data: { kind: "buddy", path: "/app" },
      }, { category: "buddy" });
      return res.status(200).json({ ok: true, ...result });
    }

    return res.status(400).json({ ok: false, error: "unknown_event" });
  } catch (e) {
    console.error("[api/push/notify]", e);
    return res.status(500).json({ ok: false, error: "server" });
  }
}
