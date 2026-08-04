import { supabase } from "../supabase.js";
import { COOKIE_CONSENT_KEY } from "./cookie-consent.js";

const SESSION_KEY = "myswym_session_id_v1";

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

function hasAnalyticsConsent() {
  try {
    return localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

export async function trackEvent(eventName, properties = {}, { essential = false } = {}) {
  if (!essential && !hasAnalyticsConsent()) return;
  try {
    const { data } = await supabase.auth.getUser();
    const user = data?.user ?? null;
    await supabase.from("conversion_events").insert({
      user_id: user?.id ?? null,
      event_name: eventName,
      path: typeof window !== "undefined" ? window.location.pathname : null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      properties: {
        session_id: getSessionId(),
        ...properties,
      },
      created_at: new Date().toISOString(),
    });
  } catch {
    // Best effort only.
  }
}
