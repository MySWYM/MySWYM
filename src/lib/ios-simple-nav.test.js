import { isIosSimpleNav, iosDockActive, iosResolveTab, iosShowPremiumBar } from "./ios-simple-nav.js";
import { setNativePlatformForTests } from "./native-platform.js";

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
assert(iosDockActive("buddies") === "home", "buddies highlights nager");
assert(iosResolveTab("history") === "analyse", "history routes to analyse");
assert(iosResolveTab("plan") === "plan", "plan drill-in kept");
assert(iosShowPremiumBar({ status: "trial", hasPremiumAccess: true }) === true, "trial shows gold bar");
assert(iosShowPremiumBar({ status: "active", hasPremiumAccess: true }) === false, "paid hides gold bar");
assert(iosShowPremiumBar({ status: "expired", hasPremiumAccess: false }) === true, "expired shows gold bar");

setNativePlatformForTests(false);
assert(isIosSimpleNav() === true, "web browser uses iPhone chrome");
setNativePlatformForTests(null);

console.log("ios-simple-nav ok");
