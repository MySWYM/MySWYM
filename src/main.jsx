import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
import CookieBanner from './CookieBanner.jsx'
import { ConversionFlow } from './conversion/ConversionFlow.tsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* App = racine du site */}
        <Route path="/" element={<App />} />
        <Route path="/app" element={<App />} />
        <Route path="/app/*" element={<App />} />
        <Route path="/connexion" element={<App />} />
        <Route path="/inscription" element={<App />} />
        {/* Alias anglais → routes FR */}
        <Route path="/login" element={<Navigate to="/connexion" replace />} />
        <Route path="/register" element={<Navigate to="/inscription" replace />} />

        {/* Prototype parcours conversion (design + UX) */}
        <Route path="/prototype/conversion" element={<ConversionFlow />} />

        {/* Landing marketing */}
        <Route path="/accueil" element={<Landing />} />
        <Route path="/comment-ca-marche" element={<Landing />} />
        <Route path="/objectifs" element={<Landing />} />
        <Route path="/conformite" element={<Landing />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/tarifs" element={<TarifsPage />} />
        {/* Alias (ancien lien) */}
        <Route path="/homepage" element={<Landing />} />

        {/* Blog */}
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />

        {/* Pages legales */}
        <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
        <Route path="/politique-confidentialite" element={<PolitiqueConfidentialitePage />} />
        <Route path="/politique-cookies" element={<PolitiqueCookiesPage />} />
        <Route path="/cgu" element={<CguPage />} />
        <Route path="/cgv" element={<CgvPage />} />
      </Routes>
      <CookieBanner />
      <SpeedInsights />
    </BrowserRouter>
  </StrictMode>,
)
