/**
 * Pont Capacitor au boot : fetch /api, classes CSS, barre de statut, splash.
 */
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "../supabase.js";
import { installNativeApiFetch, isNativeApp, isNativeIos, ensureNativeAppLocation } from "../lib/native-platform.js";
import { installNativeBillingBlock } from "../lib/native-billing.js";
import { installNativeInAppLinks } from "../lib/native-links.js";
import {
  completeNativeOAuthFromUrl,
  emitNativeOAuthCompleted,
  isNativeOAuthCallback,
} from "../lib/native-oauth.js";
import { markPasswordRecoveryIntent } from "../lib/password-recovery-intent.js";
import {
  closeNativeStravaBrowser,
  completeNativeStravaFromUrl,
  emitNativeStravaCompleted,
  isNativeStravaCallback,
} from "../lib/native-strava.js";
import { installProtectMediaAssets } from "../lib/protect-media-assets.js";
import { installAppleTransactionUpdates } from "../lib/native-iap.js";
import "./native-shell.css";

export { isNativeApp, isNativeIos };

/** À appeler avant le premier render (VersionGate fetch /api). */
export function prepareNativeRuntime() {
  if (!isNativeApp()) return false;
  installNativeApiFetch();
  installNativeBillingBlock();
  installNativeOAuthReturn();
  installAppleTransactionUpdates();
  installNativeInAppLinks();
  installProtectMediaAssets();
  ensureNativeAppLocation();
  const root = document.documentElement;
  root.classList.add("myswym-native");
  root.classList.remove("myswym-boot-public");
  if (isNativeIos()) root.classList.add("myswym-ios");
  void SplashScreen.hide().catch(() => {});
  return true;
}

async function handleNativeOAuthUrl(url) {
  if (!isNativeOAuthCallback(url)) return false;
  try {
    const data = await completeNativeOAuthFromUrl(supabase, url);
    if (data?.isPasswordRecovery) {
      markPasswordRecoveryIntent();
    }
    emitNativeOAuthCompleted({
      ok: true,
      user: data?.user ?? null,
      recovery: data?.isPasswordRecovery === true,
    });
    return true;
  } catch (err) {
    if (import.meta.env?.DEV) console.warn("[native-oauth]", err);
    emitNativeOAuthCompleted({
      ok: false,
      error: err?.message || String(err || "NATIVE_OAUTH_FAILED"),
    });
    return false;
  } finally {
    try {
      await Browser.close();
    } catch {
      /* feuille déjà fermée / Safari système */
    }
  }
}

async function handleNativeStravaUrl(url) {
  if (!isNativeStravaCallback(url)) return false;
  try {
    const json = await completeNativeStravaFromUrl(supabase, url);
    emitNativeStravaCompleted({
      ok: true,
      athlete: json?.athlete ?? null,
      synced: json?.initial_sync?.synced ?? 0,
      syncError: json?.initial_sync?.error ?? null,
    });
    return true;
  } catch (err) {
    emitNativeStravaCompleted({
      ok: false,
      error: err?.message || "Erreur Strava",
    });
    return false;
  } finally {
    await closeNativeStravaBrowser();
  }
}

const seenReturnUrls = new Set();

function claimReturnUrl(url) {
  const key = String(url || "");
  if (!key) return false;
  if (seenReturnUrls.has(key)) {
    console.warn("[native-return] url déjà traitée");
    return false;
  }
  seenReturnUrls.add(key);
  return true;
}

async function handleNativeReturnUrl(url) {
  if (!claimReturnUrl(url)) return;
  if (await handleNativeStravaUrl(url)) return;
  await handleNativeOAuthUrl(url);
}

function installNativeOAuthReturn() {
  if (typeof window !== "undefined" && window.__myswymNativeOAuth) return;
  if (typeof window !== "undefined") window.__myswymNativeOAuth = true;

  void App.getLaunchUrl()
    .then((res) => {
      const url = res?.url;
      if (url) void handleNativeReturnUrl(url);
    })
    .catch(() => {});

  void App.addListener("appUrlOpen", async ({ url }) => {
    await handleNativeReturnUrl(url);
  });
}

export async function bootstrapNativeChrome() {
  if (!isNativeApp()) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch {
    /* simulateur / plugin absent */
  }
  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
  } catch {
    /* ignore */
  }
  try {
    await Keyboard.setAccessoryBarVisible({ isVisible: true });
  } catch {
    /* ignore */
  }
  try {
    await SplashScreen.hide();
  } catch {
    /* ignore */
  }
  if (isNativeIos()) {
    void (async () => {
      try {
        const { clearAppIconBadge } = await import("../lib/native-app-badge.js");
        void clearAppIconBadge();
        void App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) void clearAppIconBadge();
        });
      } catch { /* ignore */ }
    })();
  }
}
