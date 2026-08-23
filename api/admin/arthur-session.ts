/**
 * GET /api/admin/arthur-session — vérifie l’auth admin (sans charger de dashboard).
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { resolveArthurAdminAuth } from "../_lib/arthur-ai/growth/admin-auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const auth = await resolveArthurAdminAuth(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error });
  }

  return res.status(200).json({
    ok: true,
    via: auth.via,
    userId: auth.userId || null,
  });
}
