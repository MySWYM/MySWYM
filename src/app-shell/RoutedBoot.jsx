import { useLocation } from "react-router-dom";
import AppErrorBoundary from "../AppErrorBoundary.jsx";
import { shouldUseAppGifLoader } from "../lib/boot-warm.js";
import Loading from "./Loading.jsx";
import PublicLoading from "./PublicLoading.jsx";

export function RoutedErrorBoundary({ children }) {
  const { pathname } = useLocation();
  return <AppErrorBoundary resetKey={pathname}>{children}</AppErrorBoundary>;
}

export function RouteFallback() {
  return shouldUseAppGifLoader(window.location.pathname) ? <Loading /> : <PublicLoading />;
}
