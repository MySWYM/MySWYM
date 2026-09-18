/** Premier lancement iOS : quiz commencé dans cet onglet. */
export const NATIVE_QUIZ_KEY = "myswym-native-quiz";
export const NATIVE_QUIZ_EVENT = "myswym-native-quiz";

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
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NATIVE_QUIZ_EVENT));
  }
}
