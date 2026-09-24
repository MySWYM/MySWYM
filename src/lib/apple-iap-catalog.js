/**
 * Offres App Store (iOS). Stripe web inchangé :
 * 9,99 € flex, 4,99 €/12 mois, 52,99 €/an.
 */
export const APPLE_BUNDLE_ID = "app.myswym.ios";

export const APPLE_IAP_MONTHLY_ID = "app.myswym.ios.premium.monthly";
export const APPLE_IAP_ANNUAL_ID = "app.myswym.ios.premium.annual";

export const APPLE_IAP_PRODUCTS = {
  monthly: {
    id: APPLE_IAP_MONTHLY_ID,
    plan: "monthly_flex",
    fallbackPrice: "6,99€",
    period: "/mois",
    commitmentFr: "sans engagement",
    label: "Mensuel",
  },
  annual: {
    id: APPLE_IAP_ANNUAL_ID,
    plan: "annual",
    fallbackPrice: "59,99€",
    period: "/an",
    commitmentFr: "paiement en 1 fois",
    label: "Annuel",
  },
};

export const APPLE_IAP_PRODUCT_IDS = [
  APPLE_IAP_PRODUCTS.monthly.id,
  APPLE_IAP_PRODUCTS.annual.id,
];

export const APPLE_IAP_SUMMARY_FR =
  "6,99€/mois sans engagement, ou 59,99€/an";

/** 12 × 6,99 €, pour montrer que l’annuel est moins cher. */
export const APPLE_IAP_MONTHLY_YEAR_EQUIV = "83,88 €";
export const APPLE_IAP_ANNUAL_SAVE_PCT = "30 %";
export const APPLE_IAP_ANNUAL_SAVE_FR = "30 % moins cher que 12 mois au mensuel";
export const APPLE_IAP_ANNUAL_CTA_FR = "Passer à l’abonnement annuel et économiser";

export function appleProductFromId(productId) {
  const id = String(productId || "");
  if (id === APPLE_IAP_PRODUCTS.annual.id) return APPLE_IAP_PRODUCTS.annual;
  if (id === APPLE_IAP_PRODUCTS.monthly.id) return APPLE_IAP_PRODUCTS.monthly;
  return null;
}

export function isAppleIapProductId(productId) {
  return appleProductFromId(productId) != null;
}

export function displayPriceForProduct(storeProduct, productId) {
  if (storeProduct?.displayPrice) return storeProduct.displayPrice;
  return appleProductFromId(productId)?.fallbackPrice || "";
}

export function isAppleIapCancel(err) {
  const code = err?.code;
  if (code === "USER_CANCELLED" || code === "userCancelled") return true;
  return /annul/i.test(String(err?.message || err || ""));
}
