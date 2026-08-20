/**
 * Meta OG/canonical pour les crawlers sociaux (pas de JS).
 * Googlebot n’est pas ciblé : il exécute JS et lit usePageSeo.
 * Ne compte pas dans la limite Hobby des 12 serverless functions.
 */
import pages from "./seo-pages.json";

const SITE = "https://myswym.app";
const OG_IMAGE = `${SITE}/og-share.png`;

const SOCIAL_BOT =
  /facebookexternalhit|Facebot|Twitterbot|WhatsApp|Slackbot|LinkedInBot|TelegramBot|Discordbot|Pinterest|vkShare|Iframely|Embedly/i;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

export const config = {
  matcher: [
    "/",
    "/tarifs",
    "/contact",
    "/blog",
    "/blog/:slug",
    "/mentions-legales",
    "/politique-confidentialite",
    "/politique-cookies",
    "/cgu",
    "/cgv",
  ],
};

export default function middleware(request) {
  const ua = request.headers.get("user-agent") || "";
  if (!SOCIAL_BOT.test(ua)) return;

  const url = new URL(request.url);
  const page = pages[url.pathname];
  if (!page) return;

  const canonical = `${SITE}${url.pathname === "/" ? "/" : url.pathname}`;
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);

  const html = `<!doctype html>
<html lang="fr">
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
  <meta property="og:locale" content="fr_FR" />
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
