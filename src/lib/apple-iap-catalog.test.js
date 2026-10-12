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
assert(appleProductFromId(APPLE_IAP_MONTHLY_ID)?.fallbackPrice === "8,99€", "8,99 monthly");
assert(appleProductFromId(APPLE_IAP_ANNUAL_ID)?.fallbackPrice === "69,99€", "69,99 annual");
assert(appleProductFromId(APPLE_IAP_MONTHLY_ID)?.plan === "monthly_flex", "maps to flex plan");
assert(isAppleIapProductId(APPLE_IAP_ANNUAL_ID), "known annual");
assert(!isAppleIapProductId("com.other.premium"), "unknown rejected");
assert(APPLE_IAP_SUMMARY_FR.includes("8,99"), "summary monthly");
assert(!APPLE_IAP_SUMMARY_FR.includes("4,99"), "no 4,99 on iOS");
assert(!APPLE_IAP_SUMMARY_FR.includes("6,99"), "no old iOS monthly");
assert(isAppleIapCancel({ code: "USER_CANCELLED" }), "cancel code");
assert(!isAppleIapCancel({ message: "réseau" }), "network is not cancel");
assert(displayPriceForProduct({ displayPrice: "8,99 €" }, "x") === "8,99 €", "store price");
assert(displayPriceForProduct(null, APPLE_IAP_MONTHLY_ID) === "8,99€", "fallback monthly");
assert(APPLE_IAP_MONTHLY_YEAR_EQUIV === "107,88 €", "12 × 8,99");
assert(APPLE_IAP_ANNUAL_SAVE_FR.includes("35 %"), "annual cheaper than monthly");
console.log("apple-iap-catalog ok");
