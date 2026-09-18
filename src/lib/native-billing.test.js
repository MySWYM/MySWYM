/**
 * Run: node src/lib/native-billing.test.js
 */
import { isStripeBillingUrl } from "./native-billing.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("  ✓", msg);
}

console.log("native-billing");
assert(
  isStripeBillingUrl("https://xx.supabase.co/functions/v1/create-checkout"),
  "checkout url",
);
assert(
  isStripeBillingUrl("https://xx.supabase.co/functions/v1/create-portal"),
  "portal url",
);
assert(!isStripeBillingUrl("https://xx.supabase.co/functions/v1/create-portal-x"), "not portal-x");
assert(!isStripeBillingUrl("/api/contact"), "non-billing");
console.log("native-billing ok");
