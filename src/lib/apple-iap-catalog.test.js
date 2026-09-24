/**
 * Run: node src/lib/apple-iap-catalog.test.js
 */
import {
  APPLE_IAP_ANNUAL_ID,
  APPLE_IAP_ANNUAL_SAVE_FR,
  APPLE_IAP_MONTHLY_ID,
  APPLE_IAP_MONTHLY_YEAR_EQUIV,
  APPLE_IAP_SUMMARY_FR,
  appleProductFromId,
  displayPriceForProduct,
  isAppleIapCancel,
  isAppleIapProductId,
} from "./apple-iap-catalog.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
  console.log("  ✓", msg);
}

console.log("apple-iap-catalog");
assert(APPLE_IAP_MONTHLY_ID.endsWith(".monthly"), "monthly id");
assert(APPLE_IAP_ANNUAL_ID.endsWith(".annual"), "annual id");
assert(appleProductFromId(APPLE_IAP_MONTHLY_ID)?.fallbackPrice === "6,99€", "6,99 monthly");
assert(appleProductFromId(APPLE_IAP_ANNUAL_ID)?.fallbackPrice === "59,99€", "59,99 annual");
assert(appleProductFromId(APPLE_IAP_MONTHLY_ID)?.plan === "monthly_flex", "maps to flex plan");
assert(isAppleIapProductId(APPLE_IAP_ANNUAL_ID), "known annual");
assert(!isAppleIapProductId("com.other.premium"), "unknown rejected");
assert(APPLE_IAP_SUMMARY_FR.includes("6,99"), "summary monthly");
assert(!APPLE_IAP_SUMMARY_FR.includes("4,99"), "no 4,99 on iOS");
assert(!APPLE_IAP_SUMMARY_FR.includes("9,99€/mois"), "no web flex price on iOS");
assert(isAppleIapCancel({ code: "USER_CANCELLED" }), "cancel code");
assert(!isAppleIapCancel({ message: "réseau" }), "network is not cancel");
assert(displayPriceForProduct({ displayPrice: "6,99 €" }, "x") === "6,99 €", "store price");
assert(displayPriceForProduct(null, APPLE_IAP_MONTHLY_ID) === "6,99€", "fallback monthly");
assert(APPLE_IAP_MONTHLY_YEAR_EQUIV === "83,88 €", "12 × 6,99");
assert(APPLE_IAP_ANNUAL_SAVE_FR.includes("30 %"), "annual cheaper than monthly");
console.log("apple-iap-catalog ok");
