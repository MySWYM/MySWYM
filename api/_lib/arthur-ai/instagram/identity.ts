/**
 * Résolution d’identité Instagram → MySWYM (mapping validé uniquement).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { isUuid } from "../security.js";
import { arthurLog } from "../logging.js";

export type IdentityProvider = "instagram";

/**
 * Retourne user_id MySWYM seulement si un lien verified existe.
 * Ne crée jamais de compte. Ne mappe jamais un IGSID arbitraire.
 */
export async function resolveVerifiedUserId(
  admin: SupabaseClient,
  provider: IdentityProvider,
  externalUserId: string,
): Promise<string | null> {
  const ext = String(externalUserId || "").trim();
  if (!ext) return null;

  try {
    const { data, error } = await admin
      .from("ai_identity_links")
      .select("user_id, status")
      .eq("provider", provider)
      .eq("external_user_id", ext)
      .eq("status", "verified")
      .maybeSingle();

    if (error) {
      arthurLog("warn", "identity_resolve_error", { code: error.code, provider });
      return null;
    }
    if (!data?.user_id || !isUuid(data.user_id)) return null;
    return data.user_id;
  } catch (err) {
    arthurLog("warn", "identity_resolve_exception", {
      name: err instanceof Error ? err.name : "Error",
    });
    return null;
  }
}

/**
 * Crée / met à jour un lien pending (pas de vérification auto).
 * Utile pour tracer un IGSID vu en DM avant signup.
 */
export async function ensurePendingIdentityLink(
  admin: SupabaseClient,
  provider: IdentityProvider,
  externalUserId: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const ext = String(externalUserId || "").trim();
  if (!ext) return;

  try {
    const { data: existing } = await admin
      .from("ai_identity_links")
      .select("id, status")
      .eq("provider", provider)
      .eq("external_user_id", ext)
      .in("status", ["pending", "verified"])
      .maybeSingle();

    if (existing?.status === "verified") return;

    if (existing?.id) {
      await admin
        .from("ai_identity_links")
        .update({
          metadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      return;
    }

    await admin.from("ai_identity_links").insert({
      provider,
      external_user_id: ext,
      user_id: null,
      status: "pending",
      metadata,
    });
  } catch (err) {
    arthurLog("warn", "identity_pending_failed", {
      name: err instanceof Error ? err.name : "Error",
    });
  }
}

/**
 * Vérifie un lien après preuve forte côté app (ex. user connecté + code / deep link).
 * À appeler depuis un endpoint authentifié MySWYM — PAS depuis le webhook Instagram seul.
 */
export async function verifyIdentityLink(
  admin: SupabaseClient,
  input: {
    provider: IdentityProvider;
    externalUserId: string;
    userId: string;
    metadata?: Record<string, unknown>;
  },
): Promise<{ ok: boolean; error?: string }> {
  if (!isUuid(input.userId)) return { ok: false, error: "invalid_user_id" };
  const ext = String(input.externalUserId || "").trim();
  if (!ext) return { ok: false, error: "invalid_external_user_id" };

  // Refus : external UUID == userId (confusion)
  if (ext === input.userId) {
    return { ok: false, error: "identity_collision" };
  }

  try {
    const now = new Date().toISOString();
    const { data: existing } = await admin
      .from("ai_identity_links")
      .select("id, status, user_id")
      .eq("provider", input.provider)
      .eq("external_user_id", ext)
      .in("status", ["pending", "verified"])
      .maybeSingle();

    if (existing?.status === "verified" && existing.user_id !== input.userId) {
      return { ok: false, error: "external_already_linked" };
    }

    if (existing?.id) {
      const { error } = await admin
        .from("ai_identity_links")
        .update({
          user_id: input.userId,
          status: "verified",
          verified_at: now,
          updated_at: now,
          metadata: input.metadata || {},
        })
        .eq("id", existing.id);
      if (error) return { ok: false, error: "persist_failed" };
    } else {
      const { error } = await admin.from("ai_identity_links").insert({
        provider: input.provider,
        external_user_id: ext,
        user_id: input.userId,
        status: "verified",
        verified_at: now,
        metadata: input.metadata || {},
      });
      if (error) return { ok: false, error: "persist_failed" };
    }

    return { ok: true };
  } catch (err) {
    arthurLog("error", "identity_verify_exception", {
      name: err instanceof Error ? err.name : "Error",
    });
    return { ok: false, error: "exception" };
  }
}
