import { useEffect, useState } from "react";
import {
  APP_STORE_URL,
  detectClientPlatform,
  prefersAppStorePrimary,
  shouldShowWebStoreUi,
} from "./store-links.js";
import { useAuthSession, usePublicCta } from "./use-auth-session.js";

/**
 * CTA marketing store-aware (site web seulement).
 * iOS Safari : primaire App Store + échappatoire navigateur /app.
 * Android / desktop / Capacitor : primaire web inchangé.
 */
export function useClientPlatform() {
  const [platform, setPlatform] = useState(() =>
    typeof navigator !== "undefined" ? detectClientPlatform() : "other",
  );

  useEffect(() => {
    setPlatform(detectClientPlatform());
  }, []);

  return platform;
}

export function useStoreAwareCta() {
  const web = usePublicCta();
  const { isLoggedIn } = useAuthSession();
  const platform = useClientPlatform();
  const showStoreUi = shouldShowWebStoreUi();
  const storePrimary = prefersAppStorePrimary(platform);

  if (storePrimary) {
    return {
      platform,
      showStoreUi,
      storePrimary: true,
      primary: {
        external: true,
        href: APP_STORE_URL,
        labelKey: isLoggedIn ? "store.openApp" : "store.downloadApp",
      },
      browser: {
        href: web.href,
        labelKey: isLoggedIn ? "store.openWebApp" : "store.continueBrowser",
      },
      web,
    };
  }

  return {
    platform,
    showStoreUi,
    storePrimary: false,
    primary: {
      external: false,
      href: web.href,
      labelKey: web.labelKey,
      shortKey: web.shortKey,
    },
    browser: null,
    web,
  };
}
