/**
 * Régénère public/sitemap.xml : pages publiques en 13 langues (hreflang), articles blog FR + EN.
 * Usage : node scripts/build-sitemap.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_LANGS, withLocalePrefix } from "../src/i18n/locale-path.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://www.myswym.app";

const PAGES = [
  ["/", "weekly", "1.0"],
  ["/comment-ca-marche", "monthly", "0.8"],
  ["/faq", "monthly", "0.7"],
  ["/avis", "monthly", "0.6"],
  ["/tarifs", "monthly", "0.9"],
  ["/contact", "monthly", "0.7"],
  ["/blog", "weekly", "0.8"],
  ["/mentions-legales", "yearly", "0.3"],
  ["/politique-confidentialite", "yearly", "0.3"],
  ["/politique-cookies", "yearly", "0.3"],
  ["/cgu", "yearly", "0.3"],
  ["/cgv", "yearly", "0.3"],
];

const BLOG_SLUGS = [
  "comment-reussir-bnssa",
  "depart-interval-natation",
  "glossaire-natation",
  "personnalisation-100m-natation",
  "plan-natation-debutant",
  "programme-natation-triathlon",
];

function entry(bare, langs, changefreq, priority) {
  const alternates = langs
    .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${ORIGIN}${withLocalePrefix(bare, l)}"/>`)
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${withLocalePrefix(bare, "en")}"/>`)
    .join("\n");
  return langs
    .map((l) => [
      "  <url>",
      `    <loc>${ORIGIN}${withLocalePrefix(bare, l)}</loc>`,
      alternates,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      "  </url>",
    ].join("\n"))
    .join("\n");
}

const body = [
  ...PAGES.map(([bare, freq, prio]) => entry(bare, SITE_LANGS, freq, prio)),
  ...BLOG_SLUGS.map((slug) => entry(`/blog/${slug}`, ["en", "fr"], "monthly", "0.6")),
].join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, "public/sitemap.xml"), xml);
console.log(`sitemap.xml : ${(xml.match(/<url>/g) || []).length} URL`);
