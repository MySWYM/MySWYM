/**
 * Helpers exportés pour tests Node (évite d'instancier posthog-js en CI).
 * Miroir des fonctions pures de analytics.js.
 */
const BLOCKED_PROPS = new Set([
  "email", "name", "firstname", "lastname", "full_name", "address", "phone",
  "comment", "notes", "note", "injuryNote", "injury_note", "injuryStatus", "injury_status",
  "injuryZone", "injury_zone", "injurySeverity", "injury_severity", "has_injury",
  "healthConsent", "health_consent", "pain", "heart_rate", "heartrate", "average_heartrate",
  "hr", "bpm", "age", "details", "blocks",
  "rationale", "devExplain", "_engineHistory", "capacityDimensions", "password", "token",
]);

export function sanitizeForTest(properties = {}) {
  const out = {};
  for (const [rawKey, value] of Object.entries(properties || {})) {
    if (value == null || value === "") continue;
    const key = String(rawKey);
    if (BLOCKED_PROPS.has(key) || key.startsWith("_")) continue;
    if (typeof value === "object") continue;
    if (typeof value === "string" && value.length > 120) continue;
    if (typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
      out[key] = value;
    }
  }
  return out;
}

export function normalizeAnalyticsLevel(level) {
  const l = String(level || "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (!l) return null;
  if (l.includes("decouv") || l === "beginner" || l === "debutant") return "decouverte";
  if (l.includes("regul")) return "regulier";
  if (l.includes("sport")) return "sportif";
  if (l.includes("perf")) return "performance";
  return l.slice(0, 40);
}

export function normalizeAnalyticsObjective(profileOrGoal) {
  if (!profileOrGoal) return null;
  if (typeof profileOrGoal === "string") return profileOrGoal.slice(0, 60);
  return (profileOrGoal.goal || profileOrGoal.category || null)?.toString().slice(0, 60) || null;
}

export function personPropertiesFromProfile(profile, { premium } = {}) {
  const props = {
    level: normalizeAnalyticsLevel(profile?.level),
    objective: normalizeAnalyticsObjective(profile),
    frequency: profile?.sessionsPerWeek ?? null,
    sessionDuration: profile?.sessionDuration ?? profile?.duration ?? null,
    poolLength: profile?.poolLength ?? profile?.pool ?? null,
  };
  if (typeof premium === "boolean") props.premium = premium;
  return sanitizeForTest(props);
}

export function sessionAnalyticsProps(profile, session, { planWeek, sessionIndex, phase } = {}) {
  const volume = Number.parseInt(String(session?.distance ?? "").replace(/[^\d]/g, ""), 10);
  return sanitizeForTest({
    level: normalizeAnalyticsLevel(profile?.level),
    objective: normalizeAnalyticsObjective(profile),
    planWeek: planWeek ?? null,
    sessionIndex: sessionIndex ?? null,
    intent: session?.intent || session?.sessionIntent || session?.type || null,
    sessionIntent: session?.intent || session?.sessionIntent || session?.type || null,
    volume: Number.isFinite(volume) ? volume : null,
    sessionVolume: Number.isFinite(volume) ? volume : null,
    sessionDuration: session?.duration ?? null,
    phase: phase || session?.phase || null,
    poolLength: profile?.poolLength ?? profile?.pool ?? null,
  });
}

const ONCE_PREFIX = "myswym_ph_once_";
const mem = new Set();

export function claimOnce(onceKey) {
  if (!onceKey) return true;
  const key = `${ONCE_PREFIX}${onceKey}`;
  if (typeof sessionStorage !== "undefined") {
    try {
      if (sessionStorage.getItem(key)) return false;
      sessionStorage.setItem(key, "1");
      return true;
    } catch { /* fall through */ }
  }
  if (mem.has(key)) return false;
  mem.add(key);
  return true;
}

export function clearOnce(onceKey) {
  const key = `${ONCE_PREFIX}${onceKey}`;
  try { sessionStorage?.removeItem?.(key); } catch { /* ignore */ }
  mem.delete(key);
}
