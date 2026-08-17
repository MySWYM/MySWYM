import { useEffect } from "react";
import { LEGAL_ENTITY } from "./legal-entity.js";

export const SITE_ORIGIN = "https://myswym.app";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-share.png`;

function upsertMeta(attr, key, content) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Title + description + Open Graph / Twitter + canonical.
 * jsonLd : objet ou tableau d’objets schema.org (retiré au démontage).
 */
export function usePageSeo({
  title,
  description,
  path = "/accueil",
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
  jsonLd = null,
}) {
  const json = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const canonical = `${SITE_ORIGIN}${path}`;
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:locale", "fr_FR");
    upsertMeta("property", "og:site_name", "MySWYM");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);

    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;

    const scriptId = "myswym-jsonld";
    document.getElementById(scriptId)?.remove();
    if (json) {
      const s = document.createElement("script");
      s.id = scriptId;
      s.type = "application/ld+json";
      s.textContent = json;
      document.head.appendChild(s);
    }

    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, [title, description, path, image, noIndex, json]);
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: LEGAL_ENTITY.tradeName,
    legalName: LEGAL_ENTITY.publisher,
    url: LEGAL_ENTITY.site,
    email: LEGAL_ENTITY.email,
    logo: `${SITE_ORIGIN}/logo-full-on-light.png`,
    sameAs: [
      "https://www.instagram.com/myswym.app/",
      "https://www.instagram.com/arthurnatation/",
    ],
  };
}

/** JSON-LD SoftwareApplication. aggregateRating uniquement s’il y a de vrais avis publiés. */
export function softwareApplicationJsonLd(reviews = []) {
  const app = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MySWYM",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    url: `${SITE_ORIGIN}/accueil`,
    description:
      "Générateur de plans d'entraînement natation personnalisés — niveau, objectif, bassin 25 m ou 50 m.",
    offers: {
      "@type": "Offer",
      price: "4.99",
      priceCurrency: "EUR",
    },
    publisher: { "@type": "Organization", name: LEGAL_ENTITY.tradeName },
  };
  if (reviews.length > 0) {
    const avg = reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length;
    app.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avg.toFixed(1),
      reviewCount: String(reviews.length),
      bestRating: "5",
      worstRating: "1",
    };
    app.review = reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.authorName },
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(r.rating),
        bestRating: "5",
      },
      reviewBody: r.body,
    }));
  }
  return app;
}
