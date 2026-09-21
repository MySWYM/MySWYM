import { iosDockActive, iosResolveTab } from "./ios-simple-nav.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("  ✓", msg);
}

console.log("ios-simple-nav");
assert(iosDockActive("home") === "home", "home stays");
assert(iosDockActive("plan") === "home", "plan highlights nager");
assert(iosDockActive("analyse") === "analyse", "analyse stays");
assert(iosDockActive("history") === "analyse", "history highlights analyse");
assert(iosDockActive("profile") === "profile", "profile stays");
assert(iosDockActive("buddies") === "profile", "buddies highlights profile");
assert(iosResolveTab("history") === "analyse", "history routes to analyse");
assert(iosResolveTab("plan") === "plan", "plan drill-in kept");
console.log("ios-simple-nav ok");
