import assert from "node:assert/strict";
import {
  isLegalPath,
  localeFromPathname,
  SITE_LANGS,
  stripLocalePrefix,
  withLocalePrefix,
} from "./locale-path.js";

const eq = (a, b, msg) => assert.equal(a, b, msg);

eq(SITE_LANGS.length, 13, "13 langues site");

eq(localeFromPathname("/"), "en", "racine = en");
eq(localeFromPathname("/pricing"), "en", "slug EN = en");
eq(localeFromPathname("/fr"), "fr", "/fr");
eq(localeFromPathname("/fr/tarifs"), "fr", "/fr/tarifs");
eq(localeFromPathname("/es/pricing"), "es", "/es/pricing");
eq(localeFromPathname("/pt-br/terms"), "pt-BR", "/pt-br");
eq(localeFromPathname("/PT-BR/terms"), "pt-BR", "/PT-BR insensible à la casse");
eq(localeFromPathname("/en/pricing"), "en", "legacy /en");
eq(localeFromPathname("/blog/da-swim"), "en", "segment blog pas une langue");
eq(localeFromPathname("/italie"), "en", "/italie n’est pas /it");

eq(stripLocalePrefix("/es/pricing"), "/tarifs", "strip /es + slug FR");
eq(stripLocalePrefix("/de"), "/", "strip /de racine");
eq(stripLocalePrefix("/fr/cgu"), "/cgu", "strip /fr");
eq(stripLocalePrefix("/pt-br/privacy"), "/politique-confidentialite", "strip /pt-br");

eq(withLocalePrefix("/cgu", "fr"), "/fr/cgu", "fr cgu");
eq(withLocalePrefix("/cgu", "en"), "/terms", "en cgu");
eq(withLocalePrefix("/cgu", "es"), "/es/terms", "es cgu");
eq(withLocalePrefix("/cgv", "de"), "/de/terms-of-sale", "de cgv");
eq(withLocalePrefix("/politique-confidentialite", "pt-BR"), "/pt-br/privacy", "pt-BR privacy");
eq(withLocalePrefix("/", "ja"), "/ja", "ja racine");
eq(withLocalePrefix("/", "en"), "/", "en racine");
eq(withLocalePrefix("/es/pricing", "fr"), "/fr/tarifs", "es → fr");
eq(withLocalePrefix("/fr/tarifs", "nb"), "/nb/pricing", "fr → nb");
eq(withLocalePrefix("/blog/mon-article", "it"), "/it/blog/mon-article", "blog it");
eq(withLocalePrefix("/faq", "xx"), "/faq", "langue inconnue = en");
eq(withLocalePrefix("/app", "es"), "/app", "app jamais préfixée");
eq(withLocalePrefix("/es/app", "es"), "/app", "préfixe retiré sur app");

for (const lang of SITE_LANGS) {
  for (const bare of ["/", "/tarifs", "/cgu", "/cgv", "/politique-confidentialite", "/faq"]) {
    const url = withLocalePrefix(bare, lang);
    eq(localeFromPathname(url), lang, `aller-retour langue ${lang} ${bare}`);
    eq(stripLocalePrefix(url), bare, `aller-retour slug ${lang} ${bare}`);
  }
  assert.ok(isLegalPath(withLocalePrefix("/cgu", lang)), `cgu légale en ${lang}`);
}

console.log("locale-path ok");
