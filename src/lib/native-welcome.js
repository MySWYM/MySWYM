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

/**
 * Visiteur iOS. Une clé auth-token morte n’envoie pas vers /connexion :
 * session hydratée + pas connecté = welcome (ou quiz si déjà lancé).
 *
 * @returns {"auth" | "welcome" | "onboarding" | "app"}
 */
export function nativeGuestSurface({
  pathname = "/",
  loading = false,
  isLoggedIn = false,
  quizStarted = false,
} = {}) {
  const p = String(pathname || "/");
  if (p === "/connexion" || p === "/inscription") return "auth";
  const app = p === "/app" || p.startsWith("/app/");
  if (!app || loading || isLoggedIn) return "app";
  return quizStarted ? "onboarding" : "welcome";
}
