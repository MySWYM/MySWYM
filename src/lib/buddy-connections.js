import { supabase } from "../supabase.js";
import { normalizeWhatsAppE164, formatWhatsAppDisplay, buildWhatsAppLink } from "./buddy-profiles.js";

export const BUDDY_REPORT_THRESHOLD = 3;

export const BUDDY_REPORT_REASONS = [
  { id: "harassment", label: "Harcèlement / messages inappropriés" },
  { id: "fake", label: "Faux profil / usurpation" },
  { id: "spam", label: "Spam / publicité" },
  { id: "safety", label: "Comportement dangereux" },
  { id: "other", label: "Autre" },
];

export const BUDDY_SAFETY_WARNING =
  "Retrouvez-vous dans un lieu public et informez un proche de votre séance. Ne partagez jamais d’informations bancaires. Vous pouvez bloquer ou signaler un utilisateur à tout moment.";

const SAFETY_ACK_KEY = "myswym_buddy_safety_acked";

export function hasAckedBuddySafetyLocally() {
  try {
    return localStorage.getItem(SAFETY_ACK_KEY) === "1";
  } catch {
    return false;
  }
}

export function markBuddySafetyAckedLocally() {
  try {
    localStorage.setItem(SAFETY_ACK_KEY, "1");
  } catch {
    // ignore
  }
}

export function isEmailVerified(user) {
  return !!(user?.email_confirmed_at || user?.confirmed_at);
}

/** Demande une mise en relation (après ack sécurité + consentement partage n°). */
export async function requestBuddyConnection({
  requesterId,
  recipientId,
  message,
  safetyAck,
  sharePhoneConsent,
}) {
  if (!requesterId || !recipientId) {
    return { data: null, error: { message: "Utilisateurs manquants." } };
  }
  if (!safetyAck) {
    return { data: null, error: { message: "Confirme l’avertissement de sécurité." } };
  }
  if (!sharePhoneConsent) {
    return {
      data: null,
      error: { message: "Le partage du numéro pour cette mise en relation nécessite ton consentement explicite." },
    };
  }

  const { data, error } = await supabase
    .from("buddy_connections")
    .upsert(
      {
        requester_id: requesterId,
        recipient_id: recipientId,
        status: "pending",
        requester_share_phone: true,
        recipient_share_phone: false,
        requester_safety_ack_at: new Date().toISOString(),
        message: (message || "").trim().slice(0, 280) || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "requester_id,recipient_id" },
    )
    .select("*")
    .single();

  return { data, error };
}

export async function respondBuddyConnection({
  connectionId,
  userId,
  accept,
  safetyAck,
  sharePhoneConsent,
}) {
  if (!connectionId || !userId) {
    return { data: null, error: { message: "Paramètres manquants." } };
  }
  if (accept) {
    if (!safetyAck) {
      return { data: null, error: { message: "Confirme l’avertissement de sécurité." } };
    }
    if (!sharePhoneConsent) {
      return {
        data: null,
        error: { message: "Accepte explicitement le partage de ton numéro pour finaliser la mise en relation." },
      };
    }
  }

  const patch = accept
    ? {
        status: "accepted",
        recipient_share_phone: true,
        recipient_safety_ack_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    : {
        status: "declined",
        recipient_share_phone: false,
        updated_at: new Date().toISOString(),
      };

  const { data, error } = await supabase
    .from("buddy_connections")
    .update(patch)
    .eq("id", connectionId)
    .eq("recipient_id", userId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (!error && !data) {
    return { data: null, error: { message: "Demande introuvable ou déjà traitée." } };
  }
  return { data, error };
}

/** Quitte / annule une mise en relation (pending ou accepted). */
export async function cancelBuddyConnection(connectionId, userId) {
  const { data, error } = await supabase
    .from("buddy_connections")
    .update({
      status: "cancelled",
      requester_share_phone: false,
      recipient_share_phone: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", connectionId)
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .in("status", ["pending", "accepted"])
    .select("*")
    .maybeSingle();
  return { data, error };
}

/** Retire uniquement le consentement de partage du numéro (masque le n°). */
export async function revokePhoneShare(connectionId, userId) {
  const { data: conn, error: readErr } = await supabase
    .from("buddy_connections")
    .select("*")
    .eq("id", connectionId)
    .maybeSingle();
  if (readErr || !conn) return { data: null, error: readErr || { message: "Introuvable" } };

  const patch = { updated_at: new Date().toISOString() };
  if (conn.requester_id === userId) patch.requester_share_phone = false;
  else if (conn.recipient_id === userId) patch.recipient_share_phone = false;
  else return { data: null, error: { message: "Accès refusé" } };

  const { data, error } = await supabase
    .from("buddy_connections")
    .update(patch)
    .eq("id", connectionId)
    .select("*")
    .maybeSingle();
  return { data, error };
}

/** Réactive le partage du numéro pour une connexion acceptée. */
export async function grantPhoneShare(connectionId, userId) {
  const { data: conn, error: readErr } = await supabase
    .from("buddy_connections")
    .select("*")
    .eq("id", connectionId)
    .eq("status", "accepted")
    .maybeSingle();
  if (readErr || !conn) return { data: null, error: readErr || { message: "Introuvable" } };

  const patch = { updated_at: new Date().toISOString() };
  if (conn.requester_id === userId) patch.requester_share_phone = true;
  else if (conn.recipient_id === userId) patch.recipient_share_phone = true;
  else return { data: null, error: { message: "Accès refusé" } };

  const { data, error } = await supabase
    .from("buddy_connections")
    .update(patch)
    .eq("id", connectionId)
    .select("*")
    .maybeSingle();
  return { data, error };
}

export async function fetchMyBuddyConnections(userId) {
  if (!userId) return { data: [], error: null };

  const { data, error } = await supabase.rpc("get_my_buddy_connections");
  if (!error) return { data: data ?? [], error: null };

  // Fallback sans RPC enrichie
  const fallback = await supabase
    .from("buddy_connections")
    .select("*")
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("updated_at", { ascending: false })
    .limit(40);

  if (fallback.error) return { data: [], error: fallback.error };

  return {
    data: (fallback.data ?? []).map((c) => ({
      ...c,
      peer_user_id: c.requester_id === userId ? c.recipient_id : c.requester_id,
      peer_display_name: "Nageur",
      peer_city: null,
      peer_avatar_url: null,
    })),
    error: null,
  };
}

export async function fetchConnectionPhones(connectionId) {
  const { data, error } = await supabase.rpc("get_connection_phones", {
    p_connection_id: connectionId,
  });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row || null, error: null };
}

export async function blockBuddy(blockerId, blockedId) {
  const { error: blockErr } = await supabase.from("buddy_blocks").upsert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });
  if (blockErr) return { error: blockErr };

  await supabase
    .from("buddy_connections")
    .update({ status: "blocked", updated_at: new Date().toISOString() })
    .or(
      `and(requester_id.eq.${blockerId},recipient_id.eq.${blockedId}),and(requester_id.eq.${blockedId},recipient_id.eq.${blockerId})`,
    )
    .in("status", ["pending", "accepted"]);

  return { error: null };
}

export async function reportBuddy({ reporterId, reportedId, connectionId, reason, details }) {
  const { data, error } = await supabase
    .from("buddy_reports")
    .insert({
      reporter_id: reporterId,
      reported_id: reportedId,
      connection_id: connectionId || null,
      reason: reason || "other",
      details: (details || "").trim().slice(0, 500) || null,
    })
    .select("*")
    .maybeSingle();
  return { data, error };
}

export async function fetchOwnModeration(userId) {
  if (!userId) return { data: null, error: null };
  const { data, error } = await supabase
    .from("buddy_moderation")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return { data, error };
}

export function phonesReady(connection) {
  return !!(
    connection
    && connection.status === "accepted"
    && connection.requester_share_phone
    && connection.recipient_share_phone
  );
}

export function iAmRequester(connection, userId) {
  return connection?.requester_id === userId;
}

export function myPhoneShareFlag(connection, userId) {
  if (!connection || !userId) return false;
  return connection.requester_id === userId
    ? !!connection.requester_share_phone
    : !!connection.recipient_share_phone;
}

export { normalizeWhatsAppE164, formatWhatsAppDisplay, buildWhatsAppLink };
