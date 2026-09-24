export const APPLE_BUNDLE_ID = "app.myswym.ios";
export const APPLE_IAP_MONTHLY_ID = "app.myswym.ios.premium.monthly";
export const APPLE_IAP_ANNUAL_ID = "app.myswym.ios.premium.annual";

export const APPLE_IAP_PRODUCT_IDS = new Set([
  APPLE_IAP_MONTHLY_ID,
  APPLE_IAP_ANNUAL_ID,
]);

export function isAllowedAppleProductId(productId: string) {
  if (APPLE_IAP_PRODUCT_IDS.has(productId)) return true;
  try {
    const extra = typeof Deno !== "undefined" ? Deno.env.get("APPLE_IAP_PRODUCT_IDS") : "";
    if (!extra) return false;
    return extra.split(",").map((s) => s.trim()).filter(Boolean).includes(productId);
  } catch {
    return false;
  }
}

export function expectedAppleBundleId() {
  try {
    const fromEnv = typeof Deno !== "undefined" ? Deno.env.get("APPLE_BUNDLE_ID") : "";
    if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  } catch {
    /* ignore */
  }
  return APPLE_BUNDLE_ID;
}

export function allowXcodeIap() {
  try {
    return (typeof Deno !== "undefined" ? Deno.env.get("APPLE_IAP_ALLOW_XCODE") : "") === "1";
  } catch {
    return false;
  }
}
