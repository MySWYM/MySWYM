import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Landing from './Landing.jsx'
import TarifsPage from './Tarifs.jsx'
import Blog from './Blog.jsx'
import BlogPost from './BlogPost.jsx'
import { MentionsLegalesPage, PolitiqueConfidentialitePage, CguPage, CgvPage } from './LegalPages.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* App = racine du site */}
        <Route path="/" element={<App />} />
        <Route path="/app" element={<App />} />
        <Route path="/app/*" element={<App />} />

        {/* Landing marketing */}
        <Route path="/accueil" element={<Landing />} />
        <Route path="/comment-ca-marche" element={<Landing />} />
        <Route path="/objectifs" element={<Landing />} />
        <Route path="/conformite" element={<Landing />} />
        <Route path="/contact" element={<Landing />} />
        <Route path="/tarifs" element={<TarifsPage />} />
        {/* Alias (ancien lien) */}
        <Route path="/homepage" element={<Landing />} />

        {/* Blog */}
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />

        {/* Pages legales */}
        <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
        <Route path="/politique-confidentialite" element={<PolitiqueConfidentialitePage />} />
        <Route path="/cgu" element={<CguPage />} />
        <Route path="/cgv" element={<CgvPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
