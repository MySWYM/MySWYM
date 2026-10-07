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

/** Sandbox et Production sont tous les deux valides (TestFlight + App Store), sauf si APPLE_IAP_ENVIRONMENT fixe l'attendu. */
export function assertAppleNotificationEnvironment(
  notificationEnv: string,
  transactionEnv: string | null,
  expected = "",
) {
  const note = String(notificationEnv || "");
  const tx = transactionEnv ? String(transactionEnv) : "";
  const want = String(expected || "").trim();
  if (note === "Xcode") {
    if (!allowXcodeIap()) throw new Error("Environnement Apple inattendu");
    if (want && want !== "Xcode") throw new Error("Environnement Apple inattendu");
    return;
  }
  if (note !== "Sandbox" && note !== "Production") {
    throw new Error("Environnement Apple inattendu");
  }
  if (tx && tx !== note) throw new Error("Environnement Apple incohérent");
  if (want && note !== want) throw new Error("Environnement Apple inattendu");
}

export function expectedAppleIapEnvironment() {
  try {
    const raw = typeof Deno !== "undefined" ? Deno.env.get("APPLE_IAP_ENVIRONMENT") : "";
    return String(raw || "").trim();
  } catch {
    return "";
  }
}

export function allowXcodeIap() {
  try {
    return (typeof Deno !== "undefined" ? Deno.env.get("APPLE_IAP_ALLOW_XCODE") : "") === "1";
  } catch {
    return false;
  }
}
