import { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Landing from "../Landing.jsx";
import HowItWorksPage from "../HowItWorksPage.jsx";
import FaqPage from "../FaqPage.jsx";
import ReviewsPage from "../ReviewsPage.jsx";
import TarifsPage from "../Tarifs.jsx";
import ContactPage from "../Contact.jsx";
import Blog from "../Blog.jsx";
import BlogPost from "../BlogPost.jsx";
import { MentionsLegalesPage, PolitiqueConfidentialitePage, PolitiqueCookiesPage, CguPage, CgvPage } from "../LegalPages.jsx";
import MerciPage from "../Merci.jsx";
import NotFoundPage from "../NotFound.jsx";
import CookieBanner from "../CookieBanner.jsx";
import { hasPerformanceConsent } from "../lib/cookie-consent.js";
import VersionGate from "../VersionGate.jsx";
import { RouteFallback, RoutedErrorBoundary } from "./RoutedBoot.jsx";
import { LocaleSync } from "../i18n/locale-routing.jsx";
import { localeFromPathname, withLocalePrefix } from "../i18n/locale-path.js";
import { isNativeApp, isNativeMarketingPath } from "../lib/native-platform.js";
import { hasPersistedAuth } from "../lib/boot-warm.js";
import { markNativeQuizStarted, nativeQuizStarted, NATIVE_QUIZ_EVENT } from "../lib/native-welcome.js";
import { useAuthSession } from "../lib/use-auth-session.js";
import NativeGuestShell, { NativeOnboardingFrame } from "../native/NativeGuestShell.jsx";
import NativeWelcomeFork from "../native/NativeWelcomeFork.jsx";

const App = lazy(() => import("../App.jsx"));
const ConversionFlow = lazy(() => import("../conversion/ConversionFlow.tsx").then((m) => ({ default: m.ConversionFlow })));
const SessionPyramidPreview = lazy(() => import("../SessionPyramidPreview.jsx"));
const ArthurAdminShell = lazy(() => import("../ArthurAdminShell.jsx"));
const ArthurAdminHome = lazy(() => import("../ArthurAdminHome.jsx"));
const ArthurNageursAdmin = lazy(() => import("../ArthurNageursAdmin.jsx"));
const ArthurInstagramAdmin = lazy(() => import("../ArthurInstagramAdmin.jsx"));
const ArthurActiviteAdmin = lazy(() => import("../ArthurActiviteAdmin.jsx"));
const ArthurGenerateurAdmin = lazy(() => import("../ArthurGenerateurAdmin.jsx"));
const ArthurBusinessAdmin = lazy(() => import("../ArthurBusinessAdmin.jsx"));
const ArthurOpsAdmin = lazy(() => import("../ArthurOpsAdmin.jsx"));
const ArthurReadinessAdmin = lazy(() => import("../ArthurReadinessAdmin.jsx"));

function RedirectToHome() {
  const { hash, search, pathname } = useLocation();
  const locale = pathname.startsWith("/fr") ? "fr" : localeFromPathname(pathname);
  return <Navigate to={{ pathname: withLocalePrefix("/", locale), hash, search }} replace />;
}

function RedirectHomeSection({ hash }) {
  return <Navigate to={{ pathname: "/fr", hash }} replace />;
}

function LegacyEnRedirect() {
  const { pathname, search, hash } = useLocation();
  const rest = pathname.replace(/^\/en\/?/, "/") || "/";
  return <Navigate to={{ pathname: withLocalePrefix(rest, "en"), search, hash }} replace />;
}

function frMarketingRoutes() {
  return (
    <>
      <Route index element={<Landing />} />
      <Route path="accueil" element={<RedirectToHome />} />
      <Route path="homepage" element={<Navigate to="/" replace />} />
      <Route path="comment-ca-marche" element={<HowItWorksPage />} />
      <Route path="faq" element={<FaqPage />} />
      <Route path="avis" element={<ReviewsPage />} />
      <Route path="reviews" element={<Navigate to="/reviews" replace />} />
      <Route path="objectifs" element={<RedirectHomeSection hash="pourquoi" />} />
      <Route path="conformite" element={<RedirectHomeSection hash="seance" />} />
      <Route path="contact" element={<ContactPage />} />
      <Route path="tarifs" element={<TarifsPage />} />
      <Route path="merci" element={<MerciPage />} />
      <Route path="blog" element={<Blog />} />
      <Route path="blog/:slug" element={<BlogPost />} />
      <Route path="mentions-legales" element={<MentionsLegalesPage />} />
      <Route path="politique-confidentialite" element={<PolitiqueConfidentialitePage />} />
      <Route path="politique-cookies" element={<PolitiqueCookiesPage />} />
      <Route path="cgu" element={<CguPage />} />
      <Route path="cgv" element={<CgvPage />} />
      <Route path="how-it-works" element={<Navigate to="/how-it-works" replace />} />
      <Route path="pricing" element={<Navigate to="/pricing" replace />} />
      <Route path="thanks" element={<Navigate to="/thanks" replace />} />
      <Route path="legal-notice" element={<Navigate to="/legal-notice" replace />} />
      <Route path="privacy" element={<Navigate to="/privacy" replace />} />
      <Route path="cookies" element={<Navigate to="/cookies" replace />} />
      <Route path="terms" element={<Navigate to="/terms" replace />} />
      <Route path="terms-of-sale" element={<Navigate to="/terms-of-sale" replace />} />
      <Route path="app" element={<Navigate to="/app" replace />} />
      <Route path="app/*" element={<Navigate to="/app" replace />} />
      <Route path="connexion" element={<Navigate to="/connexion" replace />} />
      <Route path="inscription" element={<Navigate to="/inscription" replace />} />
      <Route path="login" element={<Navigate to="/connexion" replace />} />
      <Route path="register" element={<Navigate to="/inscription" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </>
  );
}

function enMarketingRoutes() {
  return (
    <>
      <Route index element={<Landing />} />
      <Route path="homepage" element={<RedirectToHome />} />
      <Route path="how-it-works" element={<HowItWorksPage />} />
      <Route path="faq" element={<FaqPage />} />
      <Route path="reviews" element={<ReviewsPage />} />
      <Route path="contact" element={<ContactPage />} />
      <Route path="pricing" element={<TarifsPage />} />
      <Route path="thanks" element={<MerciPage />} />
      <Route path="blog" element={<Blog />} />
      <Route path="blog/:slug" element={<BlogPost />} />
      <Route path="legal-notice" element={<MentionsLegalesPage />} />
      <Route path="privacy" element={<PolitiqueConfidentialitePage />} />
      <Route path="cookies" element={<PolitiqueCookiesPage />} />
      <Route path="terms" element={<CguPage />} />
      <Route path="terms-of-sale" element={<CgvPage />} />
      <Route path="tarifs" element={<Navigate to="/fr/tarifs" replace />} />
      <Route path="comment-ca-marche" element={<Navigate to="/fr/comment-ca-marche" replace />} />
      <Route path="mentions-legales" element={<Navigate to="/fr/mentions-legales" replace />} />
      <Route path="politique-confidentialite" element={<Navigate to="/fr/politique-confidentialite" replace />} />
      <Route path="politique-cookies" element={<Navigate to="/fr/politique-cookies" replace />} />
      <Route path="cgu" element={<Navigate to="/fr/cgu" replace />} />
      <Route path="cgv" element={<Navigate to="/fr/cgv" replace />} />
      <Route path="merci" element={<Navigate to="/fr/merci" replace />} />
      <Route path="accueil" element={<Navigate to="/fr" replace />} />
      <Route path="avis" element={<Navigate to="/fr/avis" replace />} />
      <Route path="objectifs" element={<Navigate to="/fr?s=pourquoi" replace />} />
      <Route path="conformite" element={<Navigate to="/fr?s=seance" replace />} />
      <Route path="app" element={<Navigate to="/app" replace />} />
      <Route path="app/*" element={<Navigate to="/app" replace />} />
      <Route path="connexion" element={<Navigate to="/connexion" replace />} />
      <Route path="inscription" element={<Navigate to="/inscription" replace />} />
      <Route path="login" element={<Navigate to="/connexion" replace />} />
      <Route path="register" element={<Navigate to="/inscription" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </>
  );
}

function LegacyQueryRedirects() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const auth = params.get("auth");
    if (auth === "login" && location.pathname !== "/connexion") {
      navigate("/connexion", { replace: true });
      return;
    }
    if (auth === "register" && location.pathname !== "/app") {
      navigate("/app", { replace: true });
    }
  }, [location.pathname, location.search, navigate]);
  return null;
}

function NativeStartRedirect() {
  const { pathname, search, hash } = useLocation();
  if (!isNativeApp() || !isNativeMarketingPath(pathname)) return null;
  return <Navigate to={{ pathname: "/app", search, hash }} replace />;
}

function NativeIosShell({ children }) {
  const { pathname } = useLocation();
  const { isLoggedIn, loading } = useAuthSession();
  const [quizOpen, setQuizOpen] = useState(() => nativeQuizStarted());
  useEffect(() => {
    const sync = () => {
      if (nativeQuizStarted()) setQuizOpen(true);
    };
    window.addEventListener(NATIVE_QUIZ_EVENT, sync);
    return () => window.removeEventListener(NATIVE_QUIZ_EVENT, sync);
  }, []);
  if (!isNativeApp()) return children;

  const auth = pathname === "/connexion" || pathname === "/inscription";
  const app = pathname === "/app" || pathname.startsWith("/app/");
  if (auth) {
    return (
      <div className="myswym-native-guest is-funnel">
        <NativeGuestShell funnel showHeader={false}>{children}</NativeGuestShell>
      </div>
    );
  }
  if (app && !loading && !isLoggedIn) {
    if (hasPersistedAuth(typeof localStorage !== "undefined" ? localStorage : null)) {
      return <Navigate to="/connexion" replace />;
    }
    if (!quizOpen) {
      return (
        <div className="myswym-native-guest is-welcome">
          <NativeWelcomeFork
            onCreate={() => {
              markNativeQuizStarted();
              setQuizOpen(true);
            }}
          />
        </div>
      );
    }
    return (
      <NativeOnboardingFrame>
        <div className="myswym-native-onboarding">{children}</div>
      </NativeOnboardingFrame>
    );
  }
  return children;
}

function ConsentedSpeedInsights() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (isNativeApp()) {
      setOk(false);
      return;
    }
    const sync = () => {
      try {
        setOk(hasPerformanceConsent());
      } catch {
        setOk(false);
      }
    };
    sync();
    window.addEventListener("myswym:cookie-consent-changed", sync);
    window.addEventListener("myswym:cookie-consent-reset", sync);
    return () => {
      window.removeEventListener("myswym:cookie-consent-changed", sync);
      window.removeEventListener("myswym:cookie-consent-reset", sync);
    };
  }, []);
  return ok ? <SpeedInsights /> : null;
}

export default function AppTree() {
  return (
    <VersionGate>
      <BrowserRouter>
        <RoutedErrorBoundary>
          <NativeStartRedirect />
          <LocaleSync />
          <LegacyQueryRedirects />
          <Suspense fallback={<RouteFallback />}>
            <NativeIosShell>
            <Routes>
              <Route path="/app" element={<App />} />
              <Route path="/app/*" element={<App />} />
              <Route path="/connexion" element={<App />} />
              <Route path="/inscription" element={<App />} />
              <Route path="/login" element={<Navigate to="/connexion" replace />} />
              <Route path="/register" element={<Navigate to="/inscription" replace />} />

              <Route path="/prototype/conversion" element={<ConversionFlow />} />
              <Route path="/prototype/session-pyramid" element={<SessionPyramidPreview />} />

              <Route path="/admin" element={<ArthurAdminShell />}>
                <Route index element={<ArthurAdminHome />} />
                <Route path="arthur-nageurs" element={<ArthurNageursAdmin />} />
                <Route path="activite" element={<ArthurActiviteAdmin />} />
                <Route path="generateur" element={<ArthurGenerateurAdmin />} />
                <Route path="business" element={<ArthurBusinessAdmin />} />
                <Route path="feedbacks" element={<ArthurOpsAdmin />} />
                <Route path="instagram" element={<ArthurInstagramAdmin />} />
                <Route path="coulisses" element={<ArthurReadinessAdmin />} />
                <Route path="arthur-growth" element={<Navigate to="/admin/instagram" replace />} />
                <Route path="arthur-followups" element={<Navigate to="/admin/instagram" replace />} />
                <Route path="arthur-optimize" element={<Navigate to="/admin/instagram" replace />} />
                <Route path="arthur-readiness" element={<Navigate to="/admin/coulisses" replace />} />
                <Route path="arthur-shadow" element={<Navigate to="/admin/instagram" replace />} />
              </Route>

              <Route path="/en" element={<Navigate to="/" replace />} />
              <Route path="/en/*" element={<LegacyEnRedirect />} />
              <Route path="/fr">{frMarketingRoutes()}</Route>
              {enMarketingRoutes()}
            </Routes>
            </NativeIosShell>
          </Suspense>
          <CookieBanner />
          <ConsentedSpeedInsights />
        </RoutedErrorBoundary>
      </BrowserRouter>
    </VersionGate>
  );
}
