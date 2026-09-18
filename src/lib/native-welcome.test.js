/**
 * Run: node src/lib/native-welcome.test.js
 */
import { markNativeQuizStarted, nativeQuizStarted, NATIVE_QUIZ_KEY } from "./native-welcome.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("  ✓", msg);
}

const mem = {
  data: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.data, k) ? this.data[k] : null; },
  setItem(k, v) { this.data[k] = String(v); },
};

assert(nativeQuizStarted(mem) === false, "cold");
markNativeQuizStarted(mem);
assert(mem.getItem(NATIVE_QUIZ_KEY) === "1", "writes");
assert(nativeQuizStarted(mem) === true, "started");
console.log("native-welcome ok");
