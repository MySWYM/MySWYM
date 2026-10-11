/**
 * Catalogue Stripe MySWYM : source de vérité des offres payantes.
 *
 *   monthly_flex   8,99 € / mois · sans engagement
 *   annual         59,99 € / an  · paiement en 1 fois
 *
 * Essai 7 jours avec carte (Stripe Checkout / App Store), pas à l’inscription.
 *
 * Defaults = Price IDs **Live** (compte acct_1TP5ueAS4mfgF2Tw).
 * Override via `VITE_STRIPE_PRICE_*` (front) / `STRIPE_PRICE_*` (Edge).
 * Pour tester en mode Test Stripe : poser les IDs test + `sk_test_…`.
 */

/** Live, MySWYM Premium Flexible 8,99 €/mois */
const FLEX_ID = "price_1UPMipAS4mfgF2Twd2eNOMyl";
/** Live, MySWYM Premium Annuel 59,99 €/an */
const ANNUAL_ID = "price_1UPMjIAS4mfgF2Tw3VYyFnaV";

/** IDs mode Test (uniquement si clé sk_test), ne pas utiliser en prod. */
export const TEST_STRIPE_PRICE_IDS = {
  monthlyFlex: "price_1U67kYAS4mfgF2Twaw269yaU",
  monthlyCommit: "price_1U67kZAS4mfgF2Twi5Px8ZvG",
  annual: "price_1U67kaAS4mfgF2TwvUsVQ3vE",
};

/** Anciens IDs (autre compte / offres retirées), encore acceptés au checkout.
 *  Inclut le Price ID biennal legacy et l’engagement 12 mois (plus commercialisé). */
export const LEGACY_STRIPE_PRICE_IDS = [
  "price_1U67kYAS4mfgF2Twaw269yaU",
  "price_1U67kZAS4mfgF2Twi5Px8ZvG",
  "price_1U67kaAS4mfgF2TwvUsVQ3vE",
  "price_1TudyVAS4mfgF2TwHiSo3Vrg",
  /** Biennal 24 mois - legacy only, ne plus vendre */
  "price_1Tue7cAS4mfgF2TwP53wZ7qn",
  "price_1TPjyeAS4mfgF2TwmSjSiidD",
  "price_1TP5yOAVxucD4jHaRYk2cbHC",
  "price_1TPKQfAVxucD4jHaUDssY5cs",
  /** Anciens live : 9,99 € / 4,99 € engagé / 52,99 € */
  "price_1U3N2tAS4mfgF2TwyaI2hf22",
  "price_1TPjyPAS4mfgF2Twx3Zh4zrJ",
  "price_1U7E38AS4mfgF2TwpJGYoMpE",
];

/** Price ID biennal (legacy). Ne pas exposer sur Tarifs / UpgradeModal. */
export const LEGACY_BIENNIAL_PRICE_ID = "price_1Tue7cAS4mfgF2TwP53wZ7qn";

/** Price ID engagement 12 mois (legacy). Ne plus vendre. */
export const LEGACY_MONTHLY_COMMIT_PRICE_ID = "price_1TPjyPAS4mfgF2Twx3Zh4zrJ";

function readEnv(name) {
  try {
    const vite = import.meta.env?.[name];
    if (typeof vite === "string" && vite.trim()) return vite.trim();
  } catch {
    /* Deno / CJS */
  }
  if (typeof process !== "undefined" && process.env?.[name]) {
    const v = String(process.env[name]).trim();
    if (v) return v;
  }
  return "";
}

/** Secrets / env qui pointent encore vers d’anciens Price IDs live. */
const SUPERSEDED_ENV_PRICE_IDS = new Set([
  "price_1U3N2tAS4mfgF2TwyaI2hf22",
  "price_1TPjyPAS4mfgF2Twx3Zh4zrJ",
  "price_1U7E38AS4mfgF2TwpJGYoMpE",
  ...Object.values(TEST_STRIPE_PRICE_IDS),
]);

function resolvePriceId(envName, fallback) {
  const fromEnv = readEnv(envName);
  if (fromEnv && !SUPERSEDED_ENV_PRICE_IDS.has(fromEnv)) return fromEnv;
  return fallback;
}

export const PRICE_IDS = {
  monthlyFlex: resolvePriceId("VITE_STRIPE_PRICE_MONTHLY_FLEX", FLEX_ID),
  /** Legacy : plus exposé en UI ; conservé pour abonnés historiques / webhooks. */
  monthlyCommit: resolvePriceId("VITE_STRIPE_PRICE_MONTHLY_COMMIT", LEGACY_MONTHLY_COMMIT_PRICE_ID),
  annual: resolvePriceId("VITE_STRIPE_PRICE_ANNUAL", ANNUAL_ID),
};

export const PRICING = {
  trialDays: 7,
  trialRequiresCard: true,
  currency: "EUR",
  referralCreditLabel: "4,99 €",
  monthlyFlex: {
    key: "monthly_flex",
    label: "8,99€",
    amount: 8.99,
    period: "/mois",
    commitmentFr: "sans engagement",
    commitmentEn: "no commitment",
  },
  /** Legacy : ne plus vendre. */
  monthlyCommit: {
    key: "monthly_commit",
    label: "4,99€",
    amount: 4.99,
    period: "/mois",
    commitmentFr: "engagement 12 mois",
    commitmentEn: "12-month commitment",
  },
  annual: {
    key: "annual",
    label: "59,99€",
    amount: 59.99,
    period: "/an",
    commitmentFr: "paiement en 1 fois",
    commitmentEn: "prepaid once a year",
  },
};

export const PRICING_SUMMARY_FR =
  "8,99€/mois sans engagement, ou 59,99€/an en 1 fois";

export const PRICING_SUMMARY_EN =
  "€8.99/month with no commitment, or €59.99/year prepaid";

export function priceIdForPlan(plan) {
  if (plan === "annual") return PRICE_IDS.annual;
  if (plan === "monthly_commit" || plan === "monthlyCommit") return PRICE_IDS.monthlyCommit;
  return PRICE_IDS.monthlyFlex;
}
