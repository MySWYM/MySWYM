/**
 * Liens iOS : le site myswym.app s’ouvre dans Safari (ou le navigateur
 * par défaut). Le WebView ne montre que le produit nageur.
 */
import { isAppPath } from "../i18n/locale-path.js";
import { isNativeApp, nativeApiOrigin } from "./native-platform.js";

const SITE_HOSTS = new Set(["www.myswym.app", "myswym.app", "staging.myswym.app"]);

export function inAppPathFromHref(href) {
  const raw = String(href || "").trim();
  if (!raw || raw.startsWith("mailto:") || raw.startsWith("tel:")) return null;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const u = new URL(raw, `${nativeApiOrigin()}/`);
    if (SITE_HOSTS.has(u.hostname)) return `${u.pathname}${u.search}${u.hash}` || "/";
  } catch {
    return null;
  }
  return null;
}

/** URL https du site public (jamais capacitor://). */
export function absoluteSiteUrl(href) {
  const path = inAppPathFromHref(href);
  if (!path) return null;
  return `${nativeApiOrigin()}${path}`;
}

/** Landing, blog, légal, FAQ : hors app. /app et auth : dans le WebView. */
export function isNativeExternalSitePath(pathname) {
  const path = inAppPathFromHref(pathname);
  if (!path) return false;
  return !isAppPath(path);
}

/** Ouvre une URL https hors WebView (navigateur par défaut iOS). */
export function openInSystemBrowser(url) {
  if (typeof document === "undefined" || !url) return;
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.setAttribute("data-myswym-safari", "1");
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function installNativeInAppLinks() {
  if (typeof document === "undefined" || !isNativeApp()) return false;
  if (window.__myswymNativeLinks) return true;
  window.__myswymNativeLinks = true;
  document.addEventListener(
    "click",
    (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target?.closest?.("a[href]");
      if (!a) return;
      if (a.getAttribute("data-myswym-safari") === "1") return;
      const href = a.getAttribute("href");
      const path = inAppPathFromHref(href);
      if (!path) return;
      if (isAppPath(path)) return;
      e.preventDefault();
      const abs = absoluteSiteUrl(href);
      if (abs) openInSystemBrowser(abs);
    },
    true,
  );
  const origOpen = window.open?.bind(window);
  if (origOpen) {
    window.open = (url, target, ...rest) => {
      const path = inAppPathFromHref(String(url || ""));
      if (path && !isAppPath(path)) {
        const abs = absoluteSiteUrl(String(url || ""));
        if (abs) return origOpen(abs, target || "_blank", ...rest);
      }
      return origOpen(url, target, ...rest);
    };
  }
  return true;
}
