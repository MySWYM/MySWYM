/**
 * Run: node src/lib/native-welcome.test.js
 */
import {
  markNativeQuizStarted,
  clearNativeQuizStarted,
  nativeQuizStarted,
  nativeGuestSurface,
  NATIVE_QUIZ_KEY,
} from "./native-welcome.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("  ✓", msg);
}

const mem = {
  data: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.data, k) ? this.data[k] : null; },
  setItem(k, v) { this.data[k] = String(v); },
  removeItem(k) { delete this.data[k]; },
};

assert(nativeQuizStarted(mem) === false, "cold");
markNativeQuizStarted(mem);
assert(mem.getItem(NATIVE_QUIZ_KEY) === "1", "writes");
assert(nativeQuizStarted(mem) === true, "started");
clearNativeQuizStarted(mem);
assert(nativeQuizStarted(mem) === false, "cleared");

assert(nativeGuestSurface({ pathname: "/app" }) === "welcome", "guest /app → welcome");
assert(
  nativeGuestSurface({ pathname: "/app", quizStarted: true }) === "onboarding",
  "quiz already open",
);
assert(
  nativeGuestSurface({ pathname: "/connexion" }) === "auth",
  "/connexion stays auth",
);
assert(
  nativeGuestSurface({ pathname: "/inscription" }) === "auth",
  "/inscription stays auth",
);
assert(
  nativeGuestSurface({ pathname: "/app", loading: true }) === "app",
  "wait for session before overlay",
);
assert(
  nativeGuestSurface({ pathname: "/app", isLoggedIn: true }) === "app",
  "logged in skips guest funnel",
);
assert(
  nativeGuestSurface({ pathname: "/app", quizStarted: false }) === "welcome",
  "dead token is still welcome (no bounce to login)",
);

console.log("native-welcome ok");
