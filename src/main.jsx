import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './i18n/index.js'
import './index.css'
import App from './App.jsx'
import Landing from './Landing.jsx'
import TarifsPage from './Tarifs.jsx'
import ContactPage from './Contact.jsx'
import Blog from './Blog.jsx'
import BlogPost from './BlogPost.jsx'
import { MentionsLegalesPage, PolitiqueConfidentialitePage, PolitiqueCookiesPage, CguPage, CgvPage } from './LegalPages.jsx'
import MerciPage from './Merci.jsx'
import NotFoundPage from './NotFound.jsx'
import CookieBanner from './CookieBanner.jsx'
import { COOKIE_CONSENT_KEY } from './lib/cookie-consent.js'
import { ConversionFlow } from './conversion/ConversionFlow.tsx'
import SessionPyramidPreview from './SessionPyramidPreview.jsx'
import ArthurGrowthAdmin from './ArthurGrowthAdmin.jsx'
import ArthurFollowupsAdmin from './ArthurFollowupsAdmin.jsx'
import ArthurOptimizeAdmin from './ArthurOptimizeAdmin.jsx'
import ArthurReadinessAdmin from './ArthurReadinessAdmin.jsx'
import ArthurShadowAdmin from './ArthurShadowAdmin.jsx'
import VersionGate from './VersionGate.jsx'

/** Ancienne home marketing `/accueil` → `/` en conservant hash et query. */
function RedirectToHome() {
  const { hash, search } = useLocation();
  return <Navigate to={{ pathname: "/", hash, search }} replace />;
}

/** Anciens liens `?auth=login|register` (ils pointaient vers `/`). */
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
    if (auth === "register" && location.pathname !== "/inscription") {
      navigate("/inscription", { replace: true });
    }
  }, [location.pathname, location.search, navigate]);
  return null;
}

/** Speed Insights = mesure perf tierce → uniquement après consentement cookies. */
function ConsentedSpeedInsights() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const sync = () => {
      try {
        setOk(localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted");
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <VersionGate>
    <BrowserRouter>
      <LegacyQueryRedirects />
      <Routes>
        {/* Landing = racine du site */}
        <Route path="/" element={<Landing />} />
        <Route path="/accueil" element={<RedirectToHome />} />
        <Route path="/homepage" element={<RedirectToHome />} />
        <Route path="/comment-ca-marche" element={<Navigate to={{ pathname: "/", hash: "how" }} replace />} />
        <Route path="/objectifs" element={<Navigate to={{ pathname: "/", hash: "pourquoi" }} replace />} />
        <Route path="/conformite" element={<Navigate to={{ pathname: "/", hash: "seance" }} replace />} />

        {/* App (questionnaire + plans) */}
        <Route path="/app" element={<App />} />
        <Route path="/app/*" element={<App />} />
        <Route path="/connexion" element={<App />} />
        <Route path="/inscription" element={<App />} />
        {/* Alias anglais → routes FR */}
        <Route path="/login" element={<Navigate to="/connexion" replace />} />
        <Route path="/register" element={<Navigate to="/inscription" replace />} />

        {/* Prototype parcours conversion (design + UX) */}
        <Route path="/prototype/conversion" element={<ConversionFlow />} />
        <Route path="/prototype/session-pyramid" element={<SessionPyramidPreview />} />

        {/* Admin Arthur */}
        <Route path="/admin/arthur-growth" element={<ArthurGrowthAdmin />} />
        <Route path="/admin/arthur-followups" element={<ArthurFollowupsAdmin />} />
        <Route path="/admin/arthur-optimize" element={<ArthurOptimizeAdmin />} />
        <Route path="/admin/arthur-readiness" element={<ArthurReadinessAdmin />} />
        <Route path="/admin/arthur-shadow" element={<ArthurShadowAdmin />} />

        <Route path="/contact" element={<ContactPage />} />
        <Route path="/tarifs" element={<TarifsPage />} />
        <Route path="/merci" element={<MerciPage />} />

        {/* Blog */}
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />

        {/* Pages legales */}
        <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
        <Route path="/politique-confidentialite" element={<PolitiqueConfidentialitePage />} />
        <Route path="/politique-cookies" element={<PolitiqueCookiesPage />} />
        <Route path="/cgu" element={<CguPage />} />
        <Route path="/cgv" element={<CgvPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <CookieBanner />
      <ConsentedSpeedInsights />
    </BrowserRouter>
    </VersionGate>
  </StrictMode>,
)
