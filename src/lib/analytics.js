/**
 * MySWYM Product Analytics V1 (PostHog).
 * Abstraction unique, ne jamais appeler posthog-js hors de ce module.
 *
 * Conserve aussi `trackEvent` → table Supabase `conversion_events` (legacy funnel).
 */
import posthog from "posthog-js";
import { supabase } from "../supabase.js";
import { hasAnalyticsConsent } from "./cookie-consent.js";
import { buildSessionProvenance } from "./session-provenance.js";

const SESSION_KEY = "myswym_session_id_v1";
const ONCE_PREFIX = "myswym_ph_once_";
const APP_OPENED_KEY = "myswym_ph_app_opened";

const ALLOWED_PROPS = new Set([
  "level",
  "objective",
  "frequency",
  "sessionDuration",
  "duration",
  "poolLength",
  "premium",
  "planWeek",
  "sessionIndex",
  "sessionIntent",
  "intent",
  "sessionVolume",
  "volume",
  "plannedVolume",
  "actualDistance",
  "phase",
  "totalWeeks",
  "difficulty",
  "completed",
  "action",
  "primaryLever",
  "magnitude",
  "confidence",
  "source",
  "context",
  "access_status",
  "price_id",
  "plan_type",
  "goal",
  "sessions_per_week",
  "swim_style",
  "preferred_stroke",
  "preview",
  "reason",
  "trial_ends_at",
  "equipmentCount",
  "hasEquipment",
  "equipmentUsedCount",
  "composedBy",
  "sheetFamily",
  "sheetN",
  "error_kind",
  "pathname",
]);

/** Props jamais envoyées (défense en profondeur), inclut données de santé art. 9. */
const BLOCKED_PROPS = new Set([
  "email",
  "name",
  "firstname",
  "lastname",
  "full_name",
  "address",
  "phone",
  "comment",
  "notes",
  "note",
  "injuryNote",
  "injury_note",
  "injuryStatus",
  "injury_status",
  "injuryZone",
  "injury_zone",
  "injurySeverity",
  "injury_severity",
  "injuries",
  "injury_zones",
  "has_injury",
  "healthConsent",
  "health_consent",
  "pain",
  "heart_rate",
  "heartrate",
  "average_heartrate",
  "hr",
  "bpm",
  "age",
  "birthMonth",
  "birthDay",
  "birthYear",
  "birth_month",
  "birth_day",
  "birth_year",
  "gender",
  "sexe",
  "sex",
  "details",
  "blocks",
  "rationale",
  "devExplain",
  "_engineHistory",
  "capacityDimensions",
  "password",
  "token",
  "user_id",
  "userId",
  "uuid",
]);

let initialized = false;
let identifyCacheKey = "";

function getSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `sess_memory_${Date.now()}`;
  }
}

export { hasAnalyticsConsent };

function envKey() {
  return import.meta.env.VITE_PUBLIC_POSTHOG_KEY || "";
}

function envHost() {
  return import.meta.env.VITE_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
}

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  const key = envKey();
  if (!key) return;
  try {
    posthog.init(key, {
      api_host: envHost(),
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: true,
      persistence: "localStorage+cookie",
      opt_out_capturing_by_default: !hasAnalyticsConsent(),
      loaded: (ph) => {
        if (!hasAnalyticsConsent()) ph.opt_out_capturing();
        else ph.opt_in_capturing();
      },
    });
    initialized = true;
  } catch {
    // Best effort.
  }
}

/** Appeler au boot + quand le consentement cookies change. */
export function initAnalytics() {
  ensureInit();
  if (typeof window === "undefined") return;
  installGlobalErrorHandlers();
  window.addEventListener("myswym:cookie-consent-changed", onConsentChanged);
}

function onConsentChanged() {
  ensureInit();
  if (!initialized) return;
  try {
    if (hasAnalyticsConsent()) posthog.opt_in_capturing();
    else posthog.opt_out_capturing();
  } catch { /* ignore */ }
}

export function setAnalyticsConsent(accepted) {
  onConsentChanged();
  if (accepted) {
    // no-op beyond opt-in, events will flow after consent
  }
}

function sanitizeProperties(properties = {}) {
  if (!properties || typeof properties !== "object") return {};
  const out = {};
  for (const [rawKey, value] of Object.entries(properties)) {
    if (value == null || value === "") continue;
    const key = String(rawKey);
    if (BLOCKED_PROPS.has(key)) continue;
    if (key.startsWith("_")) continue;
    if (typeof value === "object" && !Array.isArray(value)) continue;
    if (Array.isArray(value)) continue;
    if (typeof value === "string" && value.length > 120) continue;
    if (ALLOWED_PROPS.size && !ALLOWED_PROPS.has(key)) {
      // Allow unknown scalar keys only if clearly non-sensitive (short snake/camel)
      if (!/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(key)) continue;
    }
    if (typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
      out[key] = value;
    }
  }
  return out;
}

/** Normalize onboarding level labels → cohort keys. */
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
  return sanitizeProperties(props);
}

export function sessionAnalyticsProps(profile, session, { planWeek, sessionIndex, phase } = {}) {
  const volume = Number.parseInt(String(session?.distance ?? "").replace(/[^\d]/g, ""), 10);
  const provenance = buildSessionProvenance(session);
  return sanitizeProperties({
    composedBy: provenance?.source || null,
    sheetFamily: provenance?.familyId || null,
    sheetN: provenance?.sheetN ?? null,
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

/**
 * Dedup déterministe (sessionStorage). Retourne true si l'événement peut être envoyé.
 */
export function claimOnce(onceKey) {
  if (!onceKey) return true;
  const key = `${ONCE_PREFIX}${onceKey}`;
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
    return true;
  } catch {
    if (typeof window !== "undefined") {
      window.__myswymOnce = window.__myswymOnce || new Set();
      if (window.__myswymOnce.has(key)) return false;
      window.__myswymOnce.add(key);
      return true;
    }
    return true;
  }
}

/** Test helper, clear a once key. */
export function clearOnce(onceKey) {
  const key = `${ONCE_PREFIX}${onceKey}`;
  try { sessionStorage.removeItem(key); } catch { /* ignore */ }
  if (typeof window !== "undefined" && window.__myswymOnce) window.__myswymOnce.delete(key);
}

/**
 * Track PostHog (consent requis sauf essential).
 * @param {string} event
 * @param {object} [properties]
 * @param {{ essential?: boolean, onceKey?: string }} [opts]
 */
export function track(event, properties = {}, { onceKey = null } = {}) {
  if (!event || typeof event !== "string") return;
  // PostHog = mesure d'audience non essentielle → consentement cookies requis.
  if (!hasAnalyticsConsent()) return;
  if (onceKey && !claimOnce(onceKey)) return;

  ensureInit();
  const props = sanitizeProperties(properties);
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info(`[analytics] ${event}`, props);
  }
  if (!initialized || !envKey()) return;
  try {
    posthog.capture(event, props);
  } catch { /* ignore */ }
}

export function identify(userId, properties = {}) {
  if (!userId) return;
  ensureInit();
  if (!initialized || !envKey()) return;
  if (!hasAnalyticsConsent()) return;
  const props = sanitizeProperties(properties);
  const cacheKey = `${userId}:${JSON.stringify(props)}`;
  if (cacheKey === identifyCacheKey) return;
  identifyCacheKey = cacheKey;
  try {
    posthog.identify(String(userId), props);
  } catch { /* ignore */ }
}

export function reset() {
  identifyCacheKey = "";
  ensureInit();
  if (!initialized) return;
  try {
    posthog.reset();
  } catch { /* ignore */ }
}

/** Une fois par onglet / session navigateur. */
export function trackAppOpened(properties = {}) {
  try {
    if (sessionStorage.getItem(APP_OPENED_KEY)) return;
    sessionStorage.setItem(APP_OPENED_KEY, "1");
  } catch { /* continue */ }
  track("app_opened", properties, { onceKey: "app_opened" });
}

/**
 * Erreurs UI / runtime → PostHog only (pas de Sentry).
 * Consentement analytics requis (comme `track`).
 * @param {{ reason?: string, context?: string, source?: string, error_kind?: string }} [opts]
 */
export function trackUiError(opts = {}) {
  const pathname =
    typeof window !== "undefined" ? String(window.location?.pathname || "").slice(0, 80) : undefined;
  track("ui_error", {
    reason: String(opts.reason || "unknown").slice(0, 160),
    context: String(opts.context || "unknown").slice(0, 80),
    source: opts.source ? String(opts.source).slice(0, 120) : undefined,
    error_kind: opts.error_kind || "runtime",
    pathname,
  });
}

/** Filet global window / promesses, 1× par page. */
export function installGlobalErrorHandlers() {
  if (typeof window === "undefined") return;
  if (window.__myswymErrorHandlersInstalled) return;
  window.__myswymErrorHandlersInstalled = true;

  window.addEventListener("error", (ev) => {
    try {
      trackUiError({
        reason: ev?.message || ev?.error?.message || "window_error",
        context: "window_error",
        source: ev?.filename ? `${String(ev.filename).slice(-60)}:${ev.lineno || 0}` : undefined,
        error_kind: "uncaught",
      });
    } catch { /* ignore */ }
  });

  window.addEventListener("unhandledrejection", (ev) => {
    try {
      const r = ev?.reason;
      const msg =
        (r && typeof r === "object" && (r.message || r.error))
          ? String(r.message || r.error)
          : String(r || "unhandledrejection");
      trackUiError({
        reason: msg.slice(0, 160),
        context: "unhandledrejection",
        error_kind: "promise",
      });
    } catch { /* ignore */ }
  });
}

/**
 * Legacy conversion funnel → Supabase `conversion_events`.
 * Ne remplace pas PostHog ; dual-write optionnel via `alsoTrack`.
 */
export async function trackEvent(eventName, properties = {}, { essential = false, alsoTrack = null } = {}) {
  if (alsoTrack) {
    const { onceKey, ...rest } = properties || {};
    track(alsoTrack, rest, { onceKey: onceKey || null });
  }
  if (!essential && !hasAnalyticsConsent()) return;
  try {
    const { data } = await supabase.auth.getUser();
    const user = data?.user ?? null;
    const { onceKey: _omit, ...rest } = properties || {};
    await supabase.from("conversion_events").insert({
      user_id: user?.id ?? null,
      event_name: eventName,
      path: typeof window !== "undefined" ? window.location.pathname : null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      properties: {
        session_id: getSessionId(),
        ...sanitizeProperties(rest),
      },
      created_at: new Date().toISOString(),
    });
  } catch {
    // Best effort only.
  }
}

// Boot listener for consent changes (safe if called multiple times)
if (typeof window !== "undefined") {
  initAnalytics();
}
