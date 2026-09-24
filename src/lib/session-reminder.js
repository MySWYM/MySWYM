/**
 * Rappels séance : préférence + planification des notifs locales (pures).
 */
import { ACCESS_STATUS } from "./access.js";
import { NOTIF_IDS } from "./native-local-notifications.js";
import { sessionReminderCopy } from "./session-reminder-copy.js";

const PREF_KEY = "myswym_session_reminders";

export { sessionReminderCopy } from "./session-reminder-copy.js";

export function getSessionRemindersEnabled(userId) {
  try {
    const v = localStorage.getItem(`${PREF_KEY}_${userId || "anon"}`);
    if (v === "0") return false;
    if (v === "1") return true;
  } catch { /* ignore */ }
  return true;
}

export function setSessionRemindersEnabled(userId, enabled) {
  try {
    localStorage.setItem(`${PREF_KEY}_${userId || "anon"}`, enabled ? "1" : "0");
  } catch { /* ignore */ }
}

export async function persistSessionRemindersPreference(supabase, enabled) {
  if (!supabase?.auth?.updateUser) return;
  try {
    await supabase.auth.updateUser({ data: { session_reminders: !!enabled } });
  } catch { /* ignore */ }
}

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

/**
 * Construit la liste des notifs locales à planifier (one-shot).
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
          extra: { kind: "comeback" },
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
          extra: { kind: "soft_premium" },
        });
      }
      if (j1.getTime() > nowMs + 60_000) {
        items.push({
          id: NOTIF_IDS.TRIAL_J1,
          title: "Dernier jour d’essai",
          body: "Demain tes séances passent en pause. Abonne-toi pour tout garder.",
          at: j1,
          extra: { kind: "soft_premium" },
        });
      }
    }
  }

  return items;
}
