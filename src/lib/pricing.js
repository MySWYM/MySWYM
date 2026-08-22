/**
 * Catalogue Stripe MySWYM — source de vérité des offres payantes.
 *
 *   monthly_flex   9,99 € / mois · sans engagement
 *   monthly_commit 4,99 € / mois · engagement 12 mois
 *   annual         52,99 € / an  · paiement en 1 fois
 *
 * Price IDs : `VITE_STRIPE_PRICE_*` (front) / `STRIPE_PRICE_*` (Edge).
 * Les anciens IDs restent acceptés au checkout (abonnés / cache).
 */

const FLEX_ID = "price_1U67kYAS4mfgF2Twaw269yaU";
const COMMIT_ID = "price_1U67kZAS4mfgF2Twi5Px8ZvG";
const ANNUAL_ID = "price_1U67kaAS4mfgF2TwvUsVQ3vE";

export const LEGACY_STRIPE_PRICE_IDS = [
  "price_1TPjyPAS4mfgF2Twx3Zh4zrJ",
  "price_1TudyVAS4mfgF2TwHiSo3Vrg",
  "price_1Tue7cAS4mfgF2TwP53wZ7qn",
  "price_1TPjyeAS4mfgF2TwmSjSiidD",
  "price_1TP5yOAVxucD4jHaRYk2cbHC",
  "price_1TPKQfAVxucD4jHaUDssY5cs",
];

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

export const PRICE_IDS = {
  monthlyFlex: readEnv("VITE_STRIPE_PRICE_MONTHLY_FLEX") || FLEX_ID,
  monthlyCommit: readEnv("VITE_STRIPE_PRICE_MONTHLY_COMMIT") || COMMIT_ID,
  annual: readEnv("VITE_STRIPE_PRICE_ANNUAL") || ANNUAL_ID,
};

export const PRICING = {
  trialDays: 7,
  currency: "EUR",
  referralCreditLabel: "4,99 €",
  monthlyFlex: {
    key: "monthly_flex",
    label: "9,99€",
    amount: 9.99,
    period: "/mois",
    commitmentFr: "sans engagement",
    commitmentEn: "no commitment",
  },
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
    label: "52,99€",
    amount: 52.99,
    period: "/an",
    commitmentFr: "paiement en 1 fois",
    commitmentEn: "prepaid once a year",
  },
};

export const PRICING_SUMMARY_FR =
  "9,99€/mois sans engagement, 4,99€/mois avec engagement 12 mois, ou 52,99€/an en 1 fois";

export const PRICING_SUMMARY_EN =
  "€9.99/month with no commitment, €4.99/month with a 12-month commitment, or €52.99/year prepaid";

export function priceIdForPlan(plan) {
  if (plan === "annual") return PRICE_IDS.annual;
  if (plan === "monthly_commit" || plan === "monthlyCommit") return PRICE_IDS.monthlyCommit;
  return PRICE_IDS.monthlyFlex;
}
