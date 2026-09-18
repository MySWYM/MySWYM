import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./i18n/index.js";
import "./theme/fonts.css";
import "./index.css";
import AppTree from "./app-shell/AppTree.jsx";
import { bootstrapNativeChrome, prepareNativeRuntime } from "./native/bootstrap-native.js";

prepareNativeRuntime();
void bootstrapNativeChrome();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppTree />
  </StrictMode>,
);
