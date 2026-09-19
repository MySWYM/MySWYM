import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./i18n/index.js";
import "./theme/fonts.css";
import "./index.css";
import "./theme/app-fluid.css";
import AppTree from "./app-shell/AppTree.jsx";
import { bootstrapNativeChrome, prepareNativeRuntime } from "./native/bootstrap-native.js";

prepareNativeRuntime();
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
