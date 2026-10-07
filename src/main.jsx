import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Avant AppTree / supabase : capture type=recovery / ?reset=1 dans sessionStorage.
import "./lib/password-recovery-intent.js";
import "./i18n/index.js";
import { installDisplayTranslation } from "./i18n/dom-translate.js";
import "./theme/fonts.css";
import "./index.css";
import "./theme/app-fluid.css";
import AppTree from "./app-shell/AppTree.jsx";
import { bootstrapNativeChrome, prepareNativeRuntime } from "./native/bootstrap-native.js";
import { installProtectMediaAssets } from "./lib/protect-media-assets.js";
import { handoffStravaIosIfNeeded } from "./lib/native-strava.js";
import { bounceRecoveryToNativeApp, consumeRecoveryTokenHash } from "./lib/recovery-token.js";
import { supabase } from "./supabase.js";

handoffStravaIosIfNeeded();
if (!bounceRecoveryToNativeApp()) {
  void consumeRecoveryTokenHash(supabase).then((res) => {
    if (res.error) console.warn("[MySWYM] lien reset invalide ou expiré", res.error.message);
  });
}
prepareNativeRuntime();
installProtectMediaAssets();
void bootstrapNativeChrome();

const previewIap =
  import.meta.env.DEV &&
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("iap") === "1";

if (previewIap) {
  void import("./dev/IapPaywallPreview.jsx").then((mod) => mod.mountIapPaywallPreview());
} else {
  const render = () => createRoot(document.getElementById("root")).render(
    <StrictMode>
      <AppTree />
    </StrictMode>,
  );
  let rendered = false;
  const once = () => {
    if (rendered) return;
    rendered = true;
    render();
  };
  installDisplayTranslation().then(once, once);
  setTimeout(once, 1500);
}
