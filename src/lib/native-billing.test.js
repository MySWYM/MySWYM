/**
 * Run: node src/lib/native-billing.test.js
 */
import { isStripeBillingUrl, isStripeCheckoutUrl } from "./native-billing.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("  ✓", msg);
}

console.log("native-billing");
assert(
  isStripeCheckoutUrl("https://xx.supabase.co/functions/v1/create-checkout"),
  "checkout url",
);
assert(
  isStripeBillingUrl("https://xx.supabase.co/functions/v1/create-checkout"),
  "billing alias = checkout",
);
assert(
  !isStripeCheckoutUrl("https://xx.supabase.co/functions/v1/create-portal"),
  "portal not blocked",
);
assert(!isStripeBillingUrl("https://xx.supabase.co/functions/v1/create-portal"), "portal allowed");
assert(!isStripeBillingUrl("https://xx.supabase.co/functions/v1/create-portal-x"), "not portal-x");
assert(!isStripeBillingUrl("/api/contact"), "non-billing");
console.log("native-billing ok");
