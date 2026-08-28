/**
 * Rappels séance — préférence locale + signal « rappeler aujourd’hui ».
 * L’envoi e-mail cron peut s’appuyer sur user_metadata.session_reminders.
 */

const PREF_KEY = "myswym_session_reminders";

export function getSessionRemindersEnabled(userId) {
  try {
    const v = localStorage.getItem(`${PREF_KEY}_${userId || "anon"}`);
    if (v === "0") return false;
    if (v === "1") return true;
  } catch { /* ignore */ }
  return true; // opt-in soft par défaut
}

export function setSessionRemindersEnabled(userId, enabled) {
  try {
    localStorage.setItem(`${PREF_KEY}_${userId || "anon"}`, enabled ? "1" : "0");
  } catch { /* ignore */ }
}

/** Sync soft vers user_metadata (best effort). */
export async function persistSessionRemindersPreference(supabase, enabled) {
  if (!supabase?.auth?.updateUser) return;
  try {
    await supabase.auth.updateUser({ data: { session_reminders: !!enabled } });
  } catch { /* ignore */ }
}

/**
 * Faut-il rappeler maintenant ? (séance du jour pas encore faite, rappels ON)
 */
export function shouldShowSessionReminderBanner({
  enabled = true,
  nextResolved = false,
  hasPlan = false,
  hour = new Date().getHours(),
} = {}) {
  if (!enabled || !hasPlan || nextResolved) return false;
  // Fenêtre douce 7h–21h
  return hour >= 7 && hour <= 21;
}

export function sessionReminderCopy({ sessionTitle, streak = 0 } = {}) {
  // Libellé fixe : pas de « Séance n°16 » (compteur global) sur l’accueil
  void sessionTitle;
  if (streak >= 3) {
    return {
      title: "Rappel séance",
      body: `Ta prochaine séance t’attend — garde ta série de ${streak}.`,
    };
  }
  return {
    title: "L’eau t’attend",
    body: "Ta prochaine séance est prête. Une session et tu coches la case.",
  };
}
