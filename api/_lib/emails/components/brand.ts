/** Shared brand tokens for ForSwim emails, aligned with public.css DA. */
export const emailBrand = {
  /** Page background (light for inbox readability) */
  bg: "#f4f8fa",
  /** Dark brand header */
  headerBg: "#000514",
  headerBgEnd: "#06101f",
  card: "#ffffff",
  cardDark: "#06101f",
  ink: "#0a162c",
  inkSoft: "#3d4f63",
  muted: "#5a6b7d",
  primary: "#006bfd",
  primaryFg: "#ffffff",
  fgOnDark: "#f4f8fa",
  mutedOnDark: "#9bb0c8",
  border: "rgba(0, 107, 253, 0.18)",
  borderSoft: "rgba(10, 22, 44, 0.08)",
  site: "https://www.forswim.app",
  contact: "contact@forswim.app",
  support: "contact@forswim.app",
  logoText: "ForSwim",
  /** Absolute URLs (canonique forswim ; legacy myswym encore OK via 301). */
  logoOnDark: "https://www.forswim.app/logo-myswym-banner-blanc.png",
  logoOnLight: "https://www.forswim.app/logo-myswym-on-light.png",
  tagline: "ton coach natation",
  /** Pricing, source: src/lib/pricing.js */
  pricingLine:
    "8,99 €/mois sans engagement · 69,99 €/an",
  pricingShort: "dès 8,99 €/mois",
  referralCredit: "4,99 €",
} as const;

export const emailFonts = {
  display:
    "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  body: "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;
