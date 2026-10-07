/**
 * Rappels séance + relances commercial : préférence + planification (pures).
 */
import { ACCESS_STATUS } from "./access.js";
import { NOTIF_IDS } from "./native-local-notifications.js";
import { sessionReminderCopy } from "./session-reminder-copy.js";

export { sessionReminderCopy } from "./session-reminder-copy.js";

/**
 * Préférence in-app retirée : le choix est Réglages iPhone → Notifications.
 * Toujours true côté app ; le plugin no-op si permission iOS refusée.
 */
export function getSessionRemindersEnabled(_userId) {
  return true;
}

/** @deprecated no-op (contrôle système iOS) */
export function setSessionRemindersEnabled(_userId, _enabled) {}

/** @deprecated no-op (contrôle système iOS) */
export async function persistSessionRemindersPreference(_supabase, _enabled) {}

export function shouldShowSessionReminderBanner({
  enabled = true,
  nextResolved = false,
  hasPlan = false,
  hour = new Date().getHours(),
} = {}) {
  if (!enabled || !hasPlan || nextResolved) return false;
  return hour >= 7 && hour <= 21;
}

function atHourOnDay(baseDate, hour, minute = 0) {
  const d = new Date(baseDate);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfDay(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Prochaine fenetre utile : au moins +minMs, sinon le lendemain a `hour`. */
export function nextCommercialAt(nowMs, { minMs = 2 * 3600_000, hour = 10 } = {}) {
  const soon = new Date(nowMs + minMs);
  const sameDay = atHourOnDay(new Date(nowMs), hour);
  if (sameDay.getTime() > soon.getTime()) return sameDay;
  const nextMorning = atHourOnDay(addDays(new Date(nowMs), 1), hour);
  if (nextMorning.getTime() > soon.getTime()) return nextMorning;
  return soon;
}

/**
 * Construit la liste des notifs locales a planifier (one-shot).
 * Chaque item pose la pastille (badge) cote plugin.
 */
export function buildLocalNotificationPlan({
  enabled = true,
  hasPremiumAccess = false,
  accessStatus = null,
  trialEndsAt = null,
  trialDaysLeft = 0,
  hasPlan = false,
  nextResolved = false,
  currentStreak = 0,
  lastCompletedAt = null,
  checkoutAbandonedAt = null,
  reviewEligible = false,
  reviewAlreadyAsked = false,
  /** Si funnel love = oui : horodatage Store (prioritaire sur reviewEligible). */
  loveStoreAskAtMs = null,
  newsletterNudgeAtMs = null,
  nowMs = Date.now(),
  sessionHour = 18,
  streakHour = 20,
} = {}) {
  const items = [];
  if (!enabled) return items;

  const frozen = !hasPremiumAccess && accessStatus !== ACCESS_STATUS.TRIAL;
  const copy = sessionReminderCopy({ streak: currentStreak });

  if (!frozen && hasPlan && !nextResolved) {
    let sessionAt = atHourOnDay(new Date(nowMs), sessionHour);
    if (sessionAt.getTime() <= nowMs + 60_000) {
      sessionAt = atHourOnDay(addDays(new Date(nowMs), 1), sessionHour);
    }
    items.push({
      id: NOTIF_IDS.SESSION,
      title: copy.title,
      body: copy.body,
      at: sessionAt,
      badge: 1,
      extra: { kind: "session_reminder" },
    });

    if (currentStreak >= 3) {
      let streakAt = atHourOnDay(new Date(nowMs), streakHour);
      if (streakAt.getTime() <= nowMs + 60_000) {
        streakAt = atHourOnDay(addDays(new Date(nowMs), 1), streakHour);
      }
      items.push({
        id: NOTIF_IDS.STREAK,
        title: `Ta série de ${currentStreak} jours`,
        body: "Encore une séance aujourd’hui pour la garder. Tu es si près.",
        at: streakAt,
        badge: 1,
        extra: { kind: "streak_protect" },
      });
    }
  }

  if (!frozen && lastCompletedAt) {
    const last = Date.parse(lastCompletedAt);
    if (Number.isFinite(last)) {
      let comebackAt = atHourOnDay(addDays(startOfDay(last), 3), 18);
      if (comebackAt.getTime() <= nowMs + 60_000 && nowMs - last >= 3 * 86400000) {
        comebackAt = atHourOnDay(new Date(nowMs), 18);
        if (comebackAt.getTime() <= nowMs + 60_000) {
          comebackAt = atHourOnDay(addDays(new Date(nowMs), 1), 18);
        }
      }
      if (comebackAt.getTime() > nowMs + 60_000) {
        items.push({
          id: NOTIF_IDS.COMEBACK,
          title: "On reprend ensemble ?",
          body: "Quelques jours sans nage : ta semaine t’attend, sans jugement.",
          at: comebackAt,
          badge: 1,
          extra: { kind: "comeback" },
        });
      }

      let longAt = atHourOnDay(addDays(startOfDay(last), 7), 11);
      if (longAt.getTime() <= nowMs + 60_000 && nowMs - last >= 7 * 86400000) {
        longAt = nextCommercialAt(nowMs, { minMs: 3600_000, hour: 11 });
      }
      if (longAt.getTime() > nowMs + 60_000) {
        items.push({
          id: NOTIF_IDS.COMEBACK_LONG,
          title: "Ton plan t’attend",
          body: "Ça fait une semaine : une séance courte suffit pour reprendre le rythme.",
          at: longAt,
          badge: 1,
          extra: { kind: "comeback_long" },
        });
      }
    }
  }

  if (accessStatus === ACCESS_STATUS.TRIAL && trialEndsAt && trialDaysLeft > 0) {
    const endsMs = Date.parse(trialEndsAt);
    if (Number.isFinite(endsMs)) {
      const j2 = atHourOnDay(new Date(endsMs - 2 * 86400000), 10);
      const j1 = atHourOnDay(new Date(endsMs - 1 * 86400000), 10);
      if (j2.getTime() > nowMs + 60_000) {
        items.push({
          id: NOTIF_IDS.TRIAL_J2,
          title: "Plus que 2 jours d’essai",
          body: "Sans abonnement, tes séances se mettent en pause. Garde ton plan sur l’App Store.",
          at: j2,
          badge: 1,
          extra: { kind: "soft_premium" },
        });
      }
      if (j1.getTime() > nowMs + 60_000) {
        items.push({
          id: NOTIF_IDS.TRIAL_J1,
          title: "Dernier jour d’essai",
          body: "Demain tes séances passent en pause. Abonne-toi pour tout garder.",
          at: j1,
          badge: 1,
          extra: { kind: "soft_premium" },
        });
      }
    }
  }

  if (!hasPremiumAccess && checkoutAbandonedAt) {
    const abandonedMs = Date.parse(checkoutAbandonedAt);
    if (Number.isFinite(abandonedMs)) {
      const at = nextCommercialAt(Math.max(abandonedMs, nowMs), {
        minMs: 2 * 3600_000,
        hour: 10,
      });
      if (at.getTime() > nowMs + 60_000) {
        items.push({
          id: NOTIF_IDS.CHECKOUT_ABANDON,
          title: "Ton essai t’attend",
          body: "Tu as quitté le paiement : réactive Premium quand tu veux, sans pression.",
          at,
          badge: 1,
          extra: { kind: "checkout_abandon" },
        });
      }
    }
  }

  if (!reviewAlreadyAsked && (Number(loveStoreAskAtMs) > 0 || reviewEligible)) {
    const at = Number(loveStoreAskAtMs) > nowMs + 60_000
      ? new Date(Number(loveStoreAskAtMs))
      : nextCommercialAt(nowMs, { minMs: 24 * 3600_000, hour: 11 });
    if (at.getTime() > nowMs + 60_000) {
      items.push({
        id: NOTIF_IDS.REVIEW_ASK,
        title: "Un avis aide MySWYM",
        body: "Si l’app te convient, un mot sur l’App Store aide d’autres nageurs à nous trouver.",
        at,
        badge: 1,
        extra: { kind: "review_ask" },
      });
    }
  }

  if (Number.isFinite(newsletterNudgeAtMs) && newsletterNudgeAtMs > nowMs + 60_000) {
    items.push({
      id: NOTIF_IDS.NEWSLETTER,
      title: "Actus MySWYM",
      body: "Conseils et nouveautés par e-mail : tu peux activer ça dans Mes données personnelles.",
      at: new Date(newsletterNudgeAtMs),
      badge: 1,
      extra: { kind: "newsletter_nudge" },
    });
  }

  return spaceOutNotifications(items);
}

/** Écart minimal entre deux notifs MySWYM. */
export const NOTIF_MIN_GAP_MS = 3 * 3600_000;
const NOTIF_LATEST_HOUR = 21;

/** Plus petit = plus important (garde sa place quand deux notifs se chevauchent). */
const NOTIF_PRIORITY = {
  soft_premium: 0,
  comeback: 1,
  comeback_long: 1,
  session_reminder: 2,
  streak_protect: 3,
  checkout_abandon: 4,
  review_ask: 6,
  newsletter_nudge: 7,
};

function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Un jour de relance « On reprend ensemble ? », le rappel et la série n'ont plus de sens.
 * Puis au moins 3 h entre deux notifs : la moins importante est décalée (avant 21 h) ou retirée.
 */
export function spaceOutNotifications(items) {
  const comebackDays = new Set(
    items.filter((it) => it.extra?.kind === "comeback" || it.extra?.kind === "comeback_long").map((it) => dayKey(it.at)),
  );
  const pool = items.filter((it) => {
    const kind = it.extra?.kind;
    if (kind !== "session_reminder" && kind !== "streak_protect") return true;
    return !comebackDays.has(dayKey(it.at));
  });

  const rank = (it) => NOTIF_PRIORITY[it.extra?.kind] ?? 9;
  const ordered = [...pool].sort((a, b) => rank(a) - rank(b) || a.at - b.at);
  const kept = [];
  for (const it of ordered) {
    let at = new Date(it.at);
    for (let guard = 0; guard < kept.length + 1; guard++) {
      const clash = kept.find((k) => Math.abs(k.at - at) < NOTIF_MIN_GAP_MS);
      if (!clash) break;
      at = new Date(clash.at.getTime() + NOTIF_MIN_GAP_MS);
    }
    const clash = kept.find((k) => Math.abs(k.at - at) < NOTIF_MIN_GAP_MS);
    const sameDay = dayKey(at) === dayKey(it.at);
    if (clash || !sameDay || at.getHours() > NOTIF_LATEST_HOUR) continue;
    kept.push(at.getTime() === it.at.getTime() ? it : { ...it, at });
  }
  return kept.sort((a, b) => a.at - b.at);
}
