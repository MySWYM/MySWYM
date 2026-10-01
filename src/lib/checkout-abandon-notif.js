/**
 * Persistances légères pour relances commercial (device local).
 */
const CHECKOUT_ABANDONED_KEY = "myswym_checkout_abandoned_at";

export function readCheckoutAbandonedAt(userId) {
  try {
    return localStorage.getItem(`${CHECKOUT_ABANDONED_KEY}_${userId || "anon"}`) || null;
  } catch {
    return null;
  }
}

export function markCheckoutAbandoned(userId, atIso = new Date().toISOString()) {
  try {
    localStorage.setItem(`${CHECKOUT_ABANDONED_KEY}_${userId || "anon"}`, atIso);
  } catch { /* ignore */ }
}

export function clearCheckoutAbandoned(userId) {
  try {
    localStorage.removeItem(`${CHECKOUT_ABANDONED_KEY}_${userId || "anon"}`);
  } catch { /* ignore */ }
}
