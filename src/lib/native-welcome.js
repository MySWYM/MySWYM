/** Premier lancement iOS : quiz commencé dans cet onglet. */
export const NATIVE_QUIZ_KEY = "myswym-native-quiz";
export const NATIVE_QUIZ_EVENT = "myswym-native-quiz";

function emitQuizEvent() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NATIVE_QUIZ_EVENT));
  }
}

export function nativeQuizStarted(store = typeof sessionStorage !== "undefined" ? sessionStorage : null) {
  try {
    return store?.getItem(NATIVE_QUIZ_KEY) === "1";
  } catch {
    return false;
  }
}

export function markNativeQuizStarted(store = typeof sessionStorage !== "undefined" ? sessionStorage : null) {
  try {
    store?.setItem(NATIVE_QUIZ_KEY, "1");
  } catch {
    /* Safari privé */
  }
  emitQuizEvent();
}

/** Reset du flag quiz (tests / relance funnel). */
export function clearNativeQuizStarted(store = typeof sessionStorage !== "undefined" ? sessionStorage : null) {
  try {
    store?.removeItem(NATIVE_QUIZ_KEY);
  } catch {
    /* Safari privé */
  }
  emitQuizEvent();
}

/** Plan déjà en cache local pour ce user (évite de masquer la welcome). */
export function anonymousHasLocalPlan(
  userId,
  store = typeof localStorage !== "undefined" ? localStorage : null,
) {
  if (!userId || !store) return false;
  try {
    const raw = store.getItem(`myswym_plans_${userId}`);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

/**
 * Visiteur iOS. Une clé auth-token morte n’envoie pas vers /connexion :
 * session hydratée + pas connecté = welcome (ou quiz si déjà lancé).
 *
 * La welcome reste le 1er écran (même avec session anonyme sans plan).
 * Anonyme + quiz → DA bleue. Anonyme + plan → app.
 *
 * @returns {"auth" | "welcome" | "onboarding" | "app"}
 */
export function nativeGuestSurface({
  pathname = "/",
  loading = false,
  isLoggedIn = false,
  isAnonymous = false,
  hasPlan = false,
  quizStarted = false,
} = {}) {
  const p = String(pathname || "/");
  if (p === "/connexion" || p === "/inscription") return "auth";
  const app = p === "/app" || p.startsWith("/app/");
  if (!app || loading) return "app";
  // Compte réel → app soft mist
  if (isLoggedIn && !isAnonymous) return "app";
  // Anonyme avec plan → app ; sinon welcome jusqu’à Commencer, puis onboarding
  if (isLoggedIn && isAnonymous) {
    if (hasPlan) return "app";
    return quizStarted ? "onboarding" : "welcome";
  }
  return quizStarted ? "onboarding" : "welcome";
}
