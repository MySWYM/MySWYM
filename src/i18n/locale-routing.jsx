import { useEffect, forwardRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { setAppLanguage } from "./index.js";
import {
  isAppPath,
  localeFromPathname,
  shouldLocalizePath,
  withLocalePrefix,
} from "./locale-path.js";

export function useActiveLocale() {
  const { pathname } = useLocation();
  const { i18n: i18nHook } = useTranslation();
  if (!isAppPath(pathname)) return localeFromPathname(pathname);
  return i18nHook.language?.startsWith("en") ? "en" : "fr";
}

/** Sur les pages marketing, `/fr` impose le français ; le reste est l’anglais. */
export function LocaleSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (isAppPath(pathname)) return;
    const next = localeFromPathname(pathname);
    setAppLanguage(next);
  }, [pathname]);
  return null;
}

/** `Link` qui préfixe `/fr` et traduit le slug selon la locale. */
export const LocalizedLink = forwardRef(function LocalizedLink({ to, ...rest }, ref) {
  const locale = useActiveLocale();
  let resolved = to;
  if (typeof to === "string") {
    resolved = withLocalePrefix(to, locale);
  } else if (to && typeof to === "object" && typeof to.pathname === "string") {
    resolved = { ...to, pathname: withLocalePrefix(to.pathname, locale) };
  }
  return <Link ref={ref} to={resolved} {...rest} />;
});

export function localePath(pathname, locale) {
  return shouldLocalizePath(pathname) ? withLocalePrefix(pathname, locale) : pathname;
}
