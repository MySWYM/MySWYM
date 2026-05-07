import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Landing from './Landing.jsx'
import Blog from './Blog.jsx'
import BlogPost from './BlogPost.jsx'

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
        {/* Alias (ancien lien) */}
        <Route path="/homepage" element={<Landing />} />

        {/* Blog */}
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
