import { supabase } from "../supabase.js";
import { requirePaidBuddies } from "./buddy-access.js";
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

function rpcErrorMessage(error) {
  return error?.message || error?.details || "Erreur inconnue";
}

/** Demande une mise en relation (RPC sécurisée). */
export async function requestBuddyConnection({
  requesterId,
  recipientId,
  message,
  safetyAck,
  sharePhoneConsent,
}) {
  const gate = await requirePaidBuddies();
  if (!gate.ok) return { data: null, error: gate.error };
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

  const { data, error } = await supabase.rpc("request_buddy_connection", {
    p_recipient_id: recipientId,
    p_message: (message || "").trim().slice(0, 280) || null,
    p_safety_ack: true,
    p_share_phone_consent: true,
  });

  if (error) return { data: null, error: { message: rpcErrorMessage(error) } };
  return { data, error: null };
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

  const { data, error } = await supabase.rpc("respond_buddy_connection", {
    p_connection_id: connectionId,
    p_accept: accept,
    p_safety_ack: accept ? true : false,
    p_share_phone_consent: accept ? true : false,
  });

  if (error) return { data: null, error: { message: rpcErrorMessage(error) } };
  if (!data) return { data: null, error: { message: "Demande introuvable ou déjà traitée." } };
  return { data, error: null };
}

/** Quitte / annule une mise en relation (pending ou accepted). */
export async function cancelBuddyConnection(connectionId, userId) {
  if (!connectionId || !userId) {
    return { data: null, error: { message: "Paramètres manquants." } };
  }
  const { data, error } = await supabase.rpc("cancel_buddy_connection", {
    p_connection_id: connectionId,
  });
  if (error) return { data: null, error: { message: rpcErrorMessage(error) } };
  return { data, error: null };
}

/** Retire uniquement le consentement de partage du numéro (masque le n°). */
export async function revokePhoneShare(connectionId, userId) {
  if (!connectionId || !userId) {
    return { data: null, error: { message: "Paramètres manquants." } };
  }
  const { data, error } = await supabase.rpc("set_buddy_phone_share", {
    p_connection_id: connectionId,
    p_share: false,
  });
  if (error) return { data: null, error: { message: rpcErrorMessage(error) } };
  return { data, error: null };
}

/** Réactive le partage du numéro pour une connexion acceptée. */
export async function grantPhoneShare(connectionId, userId) {
  if (!connectionId || !userId) {
    return { data: null, error: { message: "Paramètres manquants." } };
  }
  const gate = await requirePaidBuddies();
  if (!gate.ok) return { data: null, error: gate.error };
  const { data, error } = await supabase.rpc("set_buddy_phone_share", {
    p_connection_id: connectionId,
    p_share: true,
  });
  if (error) return { data: null, error: { message: rpcErrorMessage(error) } };
  return { data, error: null };
}

export async function fetchMyBuddyConnections(userId) {
  if (!userId) return { data: [], error: null };
  const gate = await requirePaidBuddies();
  if (!gate.ok) return { data: [], error: gate.error };

  const { data, error } = await supabase.rpc("get_my_buddy_connections");
  if (!error) return { data: Array.isArray(data) ? data : [], error: null };

  // Fallback sans RPC enrichie
  const fallback = await supabase
    .from("buddy_connections")
    .select("*")
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("updated_at", { ascending: false })
    .limit(40);

  if (fallback.error) return { data: [], error: fallback.error };

  return {
    data: (Array.isArray(fallback.data) ? fallback.data : []).map((c) => ({
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
  const gate = await requirePaidBuddies();
  if (!gate.ok) return { data: null, error: gate.error };
  const { data, error } = await supabase.rpc("get_connection_phones", {
    p_connection_id: connectionId,
  });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row || null, error: null };
}

export async function blockBuddy(blockerId, blockedId) {
  const { error } = await supabase.rpc("block_buddy_user", {
    p_blocked_id: blockedId,
  });
  return { error: error ? { message: rpcErrorMessage(error) } : null };
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
