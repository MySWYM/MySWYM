/**
 * Pont Capacitor au boot : fetch /api, classes CSS, barre de statut, splash.
 */
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "../supabase.js";
import { installNativeApiFetch, isNativeApp, isNativeIos } from "../lib/native-platform.js";
import { installNativeBillingBlock } from "../lib/native-billing.js";
import { installNativeInAppLinks } from "../lib/native-links.js";
import {
  completeNativeOAuthFromUrl,
  isNativeOAuthCallback,
} from "../lib/native-oauth.js";
import "./native-shell.css";

export { isNativeApp, isNativeIos };

/** À appeler avant le premier render (VersionGate fetch /api). */
export function prepareNativeRuntime() {
  if (!isNativeApp()) return false;
  installNativeApiFetch();
  installNativeBillingBlock();
  installNativeOAuthReturn();
  installNativeInAppLinks();
  const root = document.documentElement;
  root.classList.add("myswym-native");
  root.classList.remove("myswym-boot-public");
  if (isNativeIos()) root.classList.add("myswym-ios");
  void SplashScreen.hide().catch(() => {});
  return true;
}

function installNativeOAuthReturn() {
  if (typeof window !== "undefined" && window.__myswymNativeOAuth) return;
  if (typeof window !== "undefined") window.__myswymNativeOAuth = true;
  void App.addListener("appUrlOpen", async ({ url }) => {
    if (!isNativeOAuthCallback(url)) return;
    try {
      await completeNativeOAuthFromUrl(supabase, url);
    } catch (err) {
      if (import.meta.env?.DEV) console.warn("[native-oauth]", err);
    } finally {
      try {
        await Browser.close();
      } catch {
        /* feuille déjà fermée */
      }
    }
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
    await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
  } catch {
    /* ignore */
  }
  try {
    await SplashScreen.hide();
  } catch {
    /* ignore */
  }
}
