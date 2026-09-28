/**
 * POST /api/push/notify
 * - buddy_request / buddy_accepted : JWT nageur + connectionId
 * - support_reply : secret interne + userId (Telegram → nageur)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { pushToUser } from "../_lib/push/notify-user.js";

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

async function userFromAuth(req: VercelRequest) {
  const auth = String(req.headers.authorization || "");
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const { data, error } = await supabaseAnon().auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
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
        data: { kind: "support", path: "/app" },
      });
      return res.status(200).json({ ok: true, ...result });
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
        const result = await pushToUser(conn.recipient_id, {
          title: "Demande de binôme",
          body: "Un nageur veut nager avec toi.",
          data: { kind: "buddy", path: "/app" },
        });
        return res.status(200).json({ ok: true, ...result });
      }

      // buddy_accepted : le destinataire accepte → notifie le demandeur
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
      });
      return res.status(200).json({ ok: true, ...result });
    }

    return res.status(400).json({ ok: false, error: "unknown_event" });
  } catch (e) {
    console.error("[api/push/notify]", e);
    return res.status(500).json({ ok: false, error: "server" });
  }
}
