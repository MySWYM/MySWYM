/**
 * Auth admin Arthur Growth (F1).
 *
 * Accepté :
 * - header x-myswym-arthur-admin === ARTHUR_ADMIN_SECRET
 * - ou Bearer JWT dont l’email est dans ARTHUR_ADMIN_EMAILS
 *   (admin@myswym.app est toujours autorisé)
 * - ou JWT avec app_metadata.arthur_admin === true
 */
import type { VercelRequest } from "@vercel/node";
import { createArthurUserClient } from "../supabase.js";
import { isUuid } from "../security.js";

export type AdminAuthResult =
  | { ok: true; via: "secret" | "email" | "metadata"; userId?: string }
  | { ok: false; status: number; error: string };

/** Compte opérateur MySWYM : toujours admin, même si ARTHUR_ADMIN_EMAILS est vide. */
export const BUILTIN_ARTHUR_ADMIN_EMAILS = ["admin@myswym.app"];

function adminEmails(): Set<string> {
  const raw = process.env.ARTHUR_ADMIN_EMAILS || "";
  const fromEnv = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...BUILTIN_ARTHUR_ADMIN_EMAILS, ...fromEnv]);
}

export async function resolveArthurAdminAuth(
  req: VercelRequest,
): Promise<AdminAuthResult> {
  const secret = process.env.ARTHUR_ADMIN_SECRET || "";
  const headerSecret = String(
    req.headers["x-myswym-arthur-admin"] || "",
  ).trim();
  if (secret && headerSecret && headerSecret === secret) {
    return { ok: true, via: "secret" };
  }

  const authHeader = String(req.headers.authorization || "");
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return {
      ok: false,
      status: 401,
      error: "Auth admin requise (secret ou JWT admin)",
    };
  }

  try {
    const userClient = createArthurUserClient(match[1].trim());
    const { data, error } = await userClient.auth.getUser();
    if (error || !data.user?.id || !isUuid(data.user.id)) {
      return { ok: false, status: 401, error: "Session invalide" };
    }

    const email = (data.user.email || "").toLowerCase();
    if (email && adminEmails().has(email)) {
      return { ok: true, via: "email", userId: data.user.id };
    }

    const meta = (data.user.app_metadata || {}) as Record<string, unknown>;
    if (meta.arthur_admin === true) {
      return { ok: true, via: "metadata", userId: data.user.id };
    }

    return { ok: false, status: 403, error: "Compte non admin. Utilise admin@myswym.app." };
  } catch {
    return { ok: false, status: 401, error: "Auth admin échouée" };
  }
}
