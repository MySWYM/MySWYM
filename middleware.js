/**
 * 1) Geo/langue : `/`, `/faq`, `/contact`, `/blog` → `/fr/…` (302) si France
 *    ou Accept-Language fr, hors bots / cookie EN.
 * 2) Meta OG pour les crawlers sociaux (pas de JS).
 * Googlebot n’est pas redirigé : il voit l’anglais à `/` + hreflang.
 * Ne compte pas dans la limite Hobby des 12 serverless functions.
 */
import pages from "./seo-pages.json";
import { LANG_COOKIE, localeFromPathname, stripLocalePrefix, withLocalePrefix } from "./src/i18n/locale-path.js";

const SITE = "https://www.myswym.app";
const OG_IMAGE = `${SITE}/og-share.png`;

const SOCIAL_BOT =
  /facebookexternalhit|Facebot|Twitterbot|WhatsApp|Slackbot|LinkedInBot|TelegramBot|Discordbot|Pinterest|vkShare|Iframely|Embedly/i;

const SEARCH_BOT =
  /Googlebot|Google-InspectionTool|AdsBot-Google|Mediapartners-Google|bingbot|BingPreview|DuckDuckBot|Baiduspider|Yandex|Applebot|Slurp|Bytespider|PetalBot|CCBot|GPTBot|ChatGPT-User|ClaudeBot|anthropic|Perplexity/i;

const FR_COUNTRIES = new Set(["FR", "GP", "MQ", "GF", "RE", "YT", "NC", "PF", "BL", "MF", "PM", "WF"]);

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

export const config = {
  matcher: [
    "/",
    "/fr",
    "/fr/:path*",
    "/how-it-works",
    "/pricing",
    "/faq",
    "/contact",
    "/reviews",
    "/blog",
    "/blog/:slug",
    "/thanks",
    "/legal-notice",
    "/privacy",
    "/cookies",
    "/terms",
    "/terms-of-sale",
    "/comment-ca-marche",
    "/tarifs",
    "/mentions-legales",
    "/politique-confidentialite",
    "/politique-cookies",
    "/cgu",
    "/cgv",
    "/avis",
    "/en",
    "/en/:path*",
  ],
};

function isLocalHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function isSharedSlugPath(pathname) {
  if (pathname === "/" || pathname === "/faq" || pathname === "/contact" || pathname === "/blog") return true;
  return pathname.startsWith("/blog/");
}

/** Cookie header (Vite / Vercel Routing Middleware). `request.cookies` n’existe que sur NextRequest. */
function getCookie(request, name) {
  const fromNext = request.cookies?.get?.(name);
  if (fromNext != null) return typeof fromNext === "string" ? fromNext : fromNext.value;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = (request.headers.get("cookie") || "").match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function prefersFrench(request) {
  const cookie = getCookie(request, LANG_COOKIE);
  if (cookie === "en") return false;
  if (cookie === "fr") return true;
  const country = (request.headers.get("x-vercel-ip-country") || "").toUpperCase();
  if (FR_COUNTRIES.has(country)) return true;
  const accept = request.headers.get("accept-language") || "";
  const first = accept.split(",")[0]?.trim() || "";
  return /^fr\b/i.test(first);
}

export default function middleware(request) {
  const ua = request.headers.get("user-agent") || "";
  const url = new URL(request.url);
  const isSocial = SOCIAL_BOT.test(ua);
  const isSearch = SEARCH_BOT.test(ua);

  if (
    isSharedSlugPath(url.pathname)
    && !isSocial
    && !isSearch
    && !isLocalHost(url.hostname)
    && prefersFrench(request)
  ) {
    const dest = new URL(withLocalePrefix(url.pathname, "fr"), url.origin);
    dest.search = url.search;
    return Response.redirect(dest, 302);
  }

  if (!isSocial) return;

  const locale = localeFromPathname(url.pathname);
  const page = pages[url.pathname] || pages[stripLocalePrefix(url.pathname)];
  if (!page) return;

  const canonicalPath = url.pathname === "/" ? "/" : url.pathname.replace(/\/$/, "") || "/";
  const canonical = `${SITE}${canonicalPath === "/fr" ? "/fr" : canonicalPath}`;
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const ogLocale = locale === "fr" ? "fr_FR" : "en_US";
  const lang = locale === "fr" ? "fr" : "en";

  const html = `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="MySWYM" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${OG_IMAGE}" />
  <meta property="og:locale" content="${ogLocale}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${OG_IMAGE}" />
  <link rel="canonical" href="${canonical}" />
</head>
<body></body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
