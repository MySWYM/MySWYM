/**
 * Notifications in-app (header), extrait App.jsx vague 2.
 */
import { CreditCard, Shield, Star, BookOpen, Users, Trophy, Bell } from "lucide-react";
import { supabase } from "../supabase.js";
import { ACCESS_STATUS, getAccessState } from "./access.js";
import { G } from "../theme/palette.js";
import { BADGE_DEFS, computeStats, checkBadges } from "./plan-stats.js";

export const DAY_MS = 86400000;
export const NOTIFICATION_KIND_META = {
  billing:    { Icon: CreditCard, color: G.blue,   bg: G.blueLight },
  security:   { Icon: Shield,     color: G.coral,  bg: G.coralLight },
  promo:      { Icon: Star,       color: G.gold,   bg: G.goldLight },
  newsletter: { Icon: BookOpen,   color: G.purple, bg: G.purpleLight },
  buddy:      { Icon: Users,      color: G.water,  bg: G.waterLight },
  badge:      { Icon: Trophy,     color: G.gold,   bg: G.goldLight },
  update:     { Icon: Bell,       color: G.blue,   bg: G.blueLight },
};

// Feed manuel pour grandes actus / promos / newsletters. Il suffit d'ajouter une entrée.
export const GLOBAL_NOTIFICATION_FEED = [];

export const notificationsStorageKey = (userId) => `myswym_notifications_seen_${userId || "anon"}`;
export const normalizeSeenNotificationMap = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .map(([key, seenAt]) => [String(key), parseNotificationTime(seenAt, 0)])
      .filter(([, seenAt]) => Number.isFinite(seenAt) && seenAt > 0)
  );
};

export const parseNotificationTime = (value, fallback = Date.now()) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && value.trim() !== "") return numeric > 1e12 ? numeric : numeric * 1000;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

export const readSeenNotifications = (userOrId) => {
  const userId = typeof userOrId === "string" || userOrId == null ? userOrId : userOrId.id;
  const serverSeen = typeof userOrId === "object" && userOrId ? normalizeSeenNotificationMap(userOrId.user_metadata?.notifications_seen) : {};
  try {
    const raw = localStorage.getItem(notificationsStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...serverSeen, ...normalizeSeenNotificationMap(parsed) };
  } catch {
    return serverSeen;
  }
};

export const writeSeenNotifications = (userOrId, seenMap) => {
  const userId = typeof userOrId === "string" || userOrId == null ? userOrId : userOrId.id;
  const normalized = normalizeSeenNotificationMap(seenMap);
  try {
    localStorage.setItem(notificationsStorageKey(userId), JSON.stringify(normalized));
  } catch {}
  if (typeof userOrId === "object" && userOrId?.id) {
    supabase.auth.updateUser({ data: { notifications_seen: normalized } }).catch(() => {});
  }
};

export const formatNotificationDate = (value) => {
  const time = parseNotificationTime(value, 0);
  if (!time) return "";
  return new Date(time).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

export const notificationAudienceMatches = (audience, accessState) => {
  switch (audience) {
    case "trial": return accessState.status === ACCESS_STATUS.TRIAL;
    case "premium": return accessState.hasPremiumAccess;
    case "expired": return accessState.status === ACCESS_STATUS.EXPIRED;
    default: return true;
  }
};

export const buildAccessNotifications = (user, accessState) => {
  if (!user) return [];
  const items = [];
  if (accessState.status === ACCESS_STATUS.TRIAL && accessState.trialDaysLeft > 0 && accessState.trialDaysLeft <= 3) {
    items.push({
      id: `trial-ending:${accessState.trialEndsAt || accessState.trialDaysLeft}`,
      type: "billing",
      title: accessState.trialDaysLeft === 1 ? "Dernier jour d'essai" : `Essai Premium : ${accessState.trialDaysLeft} jours restants`,
      body: accessState.trialDaysLeft === 1
        ? "Ton essai se termine aujourd'hui. Sans abonnement, tes séances se mettent en pause, tu ne pourras plus rien voir."
        : "Ton essai Premium arrive a sa fin. Abonne-toi pour garder tes plans, sinon tes séances se mettent en pause.",
      createdAt: (accessState.accessEndsMs || Date.now()) - (accessState.trialDaysLeft * DAY_MS),
    });
  }
  if (accessState.cancelAtPeriodEnd && accessState.subscriptionEndsAt) {
    items.push({
      id: `subscription-cancel:${accessState.subscriptionEndsAt}`,
      type: "billing",
      title: "Abonnement bientot coupe",
      body: `Ton Premium restera actif jusqu'au ${formatNotificationDate(accessState.subscriptionEndsAt)} puis sera coupe sauf reactivation.`,
      createdAt: parseNotificationTime(accessState.subscriptionEndsAt),
    });
  }
  if (accessState.status === ACCESS_STATUS.EXPIRED) {
    items.push({
      id: `subscription-expired:${accessState.subscriptionEndsAt || accessState.trialEndsAt || "expired"}`,
      type: "security",
      title: "Essai terminé, séances en pause",
      body: "Ton essai de 7 jours est fini. Tes séances sont en pause. Abonne-toi pour les retrouver.",
      createdAt: parseNotificationTime(accessState.subscriptionEndsAt || accessState.trialEndsAt, Date.now()),
    });
  }

  const rawInbox = user?.app_metadata?.notifications || user?.app_metadata?.notification_inbox || [];
  const external = Array.isArray(rawInbox) ? rawInbox : [];
  external.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    if (!entry.title || !entry.body) return;
    items.push({
      id: String(entry.id || `server:${index}:${entry.title}`),
      type: Object.prototype.hasOwnProperty.call(NOTIFICATION_KIND_META, entry.type) ? entry.type : "update",
      title: String(entry.title),
      body: String(entry.body),
      createdAt: parseNotificationTime(entry.createdAt || entry.created_at || entry.publishedAt || entry.published_at, Date.now() - index),
    });
  });

  GLOBAL_NOTIFICATION_FEED.forEach((entry, index) => {
    if (!entry?.id || !entry?.title || !entry?.body) return;
    if (!notificationAudienceMatches(entry.audience, accessState)) return;
    const startsAt = parseNotificationTime(entry.startsAt || entry.starts_at, 0);
    const endsAt = parseNotificationTime(entry.endsAt || entry.ends_at, Number.MAX_SAFE_INTEGER);
    const now = Date.now();
    if (startsAt && startsAt > now) return;
    if (endsAt && endsAt < now) return;
    items.push({
      id: `global:${entry.id}`,
      type: Object.prototype.hasOwnProperty.call(NOTIFICATION_KIND_META, entry.type) ? entry.type : "update",
      title: String(entry.title),
      body: String(entry.body),
      createdAt: startsAt || (now - index),
    });
  });

  return items;
};

export const buildBadgeNotifications = (plan) => {
  const earnedIds = checkBadges(computeStats(plan));
  return BADGE_DEFS
    .filter((badge) => earnedIds.includes(badge.id))
    .map((badge, index) => ({
      id: `badge:${badge.id}`,
      type: "badge",
      title: `Badge obtenu : ${badge.label}`,
      body: badge.desc,
      createdAt: index + 1,
      accentColor: badge.color,
      accentIcon: badge.icon,
    }));
};

/** Demandes / acceptations binômes pour la cloche. */
export const buildBuddyNotifications = (connections = [], userId = null, nowMs = Date.now()) => {
  if (!userId || !Array.isArray(connections)) return [];
  const weekAgo = nowMs - 7 * DAY_MS;
  const items = [];
  connections.forEach((c) => {
    if (!c?.id) return;
    const peer = c.peer_display_name || "Un nageur";
    const updated = parseNotificationTime(c.updated_at || c.created_at, Date.now());
    if (c.status === "pending" && c.recipient_id === userId) {
      items.push({
        id: `buddy-request:${c.id}`,
        type: "buddy",
        title: "Demande de binôme",
        body: `${peer} veut nager avec toi.`,
        createdAt: updated,
      });
    } else if (c.status === "accepted" && updated >= weekAgo) {
      items.push({
        id: `buddy-accepted:${c.id}`,
        type: "buddy",
        title: "Binôme accepté",
        body: `Tu es en relation avec ${peer}.`,
        createdAt: updated,
      });
    }
  });
  return items;
};

/** Réponse Arthur / support non lue. */
export const buildSupportNotifications = (conversations = [], seenAgentMessageId = "") => {
  if (!Array.isArray(conversations)) return [];
  const withAgent = conversations.find((c) => c?.last_role === "agent" && c?.last_message_id);
  if (!withAgent) return [];
  if (seenAgentMessageId && seenAgentMessageId === withAgent.last_message_id) return [];
  const preview = String(withAgent.last_body || "").trim().slice(0, 120);
  return [{
    id: `support:${withAgent.last_message_id}`,
    type: "update",
    title: "Nouvelle réponse MySWYM",
    body: preview || "Arthur t’a répondu dans le chat.",
    createdAt: parseNotificationTime(withAgent.updated_at || withAgent.created_at, Date.now()),
    action: "support",
  }];
};

export const buildInAppNotifications = ({
  user,
  plan,
  buddyConnections = [],
  supportConversations = [],
  supportSeenAgentId = "",
} = {}) => {
  const accessState = getAccessState(user);
  const byId = new Map();
  [
    ...buildAccessNotifications(user, accessState),
    ...buildBadgeNotifications(plan),
    ...buildBuddyNotifications(buddyConnections, user?.id),
    ...buildSupportNotifications(supportConversations, supportSeenAgentId),
  ].forEach((item) => {
    if (!item?.id) return;
    byId.set(item.id, item);
  });
  return [...byId.values()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
};
