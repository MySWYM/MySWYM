import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { LEGAL_ENTITY } from "./legal-entity.js";
import { localeFromPathname, stripLocalePrefix, withLocalePrefix } from "../i18n/locale-path.js";

export const SITE_ORIGIN = "https://www.myswym.app";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-share.png`;

/** JSON-LD BreadcrumbList — items : { label, href? } (dernier cran sans href). */
export function breadcrumbJsonLd(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_ORIGIN}${withLocalePrefix(item.href, localeFromPathname(typeof window !== "undefined" ? window.location.pathname : "/"))}` } : {}),
    })),
  };
}

/** JSON-LD FAQPage. */
export function faqPageJsonLd(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

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

function upsertLink(rel, href, attrs = {}) {
  const hreflang = attrs.hreflang;
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  el.setAttribute("data-myswym-seo", "1");
  return el;
}

/**
 * Title + description + Open Graph / Twitter + canonical.
 * jsonLd : objet ou tableau d’objets schema.org (retiré au démontage).
 * `path` est la route FR interne (`/tarifs`) ; le slug EN / préfixe `/fr` suivent l’URL.
 */
export function usePageSeo({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
  jsonLd = null,
}) {
  const { pathname } = useLocation();
  const locale = localeFromPathname(pathname);
  const localizedPath = withLocalePrefix(stripLocalePrefix(path), locale);
  const json = jsonLd ? JSON.stringify(jsonLd) : "";

  useEffect(() => {
    const canonical = `${SITE_ORIGIN}${localizedPath === "/" ? "/" : localizedPath}`;
    const bare = stripLocalePrefix(localizedPath);
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:locale", locale === "en" ? "en_US" : "fr_FR");
    upsertMeta("property", "og:locale:alternate", locale === "en" ? "fr_FR" : "en_US");
    upsertMeta("property", "og:site_name", "MySWYM");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);

    upsertLink("canonical", canonical);

    document.querySelectorAll('link[data-myswym-hreflang]').forEach((el) => el.remove());
    if (!noIndex) {
      const frUrl = `${SITE_ORIGIN}${withLocalePrefix(bare, "fr")}`;
      const enUrl = `${SITE_ORIGIN}${withLocalePrefix(bare, "en")}`;
      upsertLink("alternate", frUrl, { hreflang: "fr" });
      upsertLink("alternate", enUrl, { hreflang: "en" });
      upsertLink("alternate", enUrl, { hreflang: "x-default" });
      document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => {
        el.setAttribute("data-myswym-hreflang", "1");
      });
    }

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
  }, [title, description, localizedPath, locale, image, noIndex, json]);
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
    url: `${SITE_ORIGIN}/`,
    description:
      "Plan d'entraînement natation personnalisé : nager, triathlon, eau libre, prépa diplôme — prêt en 2 minutes.",
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
