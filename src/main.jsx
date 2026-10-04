import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Avant AppTree / supabase : capture type=recovery / ?reset=1 dans sessionStorage.
import "./lib/password-recovery-intent.js";
import "./i18n/index.js";
import "./theme/fonts.css";
import "./index.css";
import "./theme/app-fluid.css";
import AppTree from "./app-shell/AppTree.jsx";
import { bootstrapNativeChrome, prepareNativeRuntime } from "./native/bootstrap-native.js";
import { installProtectMediaAssets } from "./lib/protect-media-assets.js";
import { installDisablePageZoom } from "./lib/disable-page-zoom.js";
import { handoffStravaIosIfNeeded } from "./lib/native-strava.js";

handoffStravaIosIfNeeded();
prepareNativeRuntime();
installProtectMediaAssets();
installDisablePageZoom();
void bootstrapNativeChrome();

const previewIap =
  import.meta.env.DEV &&
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("iap") === "1";

if (previewIap) {
  void import("./dev/IapPaywallPreview.jsx").then((mod) => mod.mountIapPaywallPreview());
} else {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <AppTree />
    </StrictMode>,
  );
}
