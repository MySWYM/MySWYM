import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { POSTS } from './src/posts.js'
import { withLocalePrefix } from './src/i18n/locale-path.js'

const SITE = 'https://www.myswym.app'

const STATIC_PATHS = [
  ['/', 'weekly', '1.0'],
  ['/comment-ca-marche', 'monthly', '0.8'],
  ['/faq', 'monthly', '0.7'],
  ['/avis', 'monthly', '0.6'],
  ['/tarifs', 'monthly', '0.9'],
  ['/contact', 'monthly', '0.7'],
  ['/blog', 'weekly', '0.8'],
  ['/mentions-legales', 'yearly', '0.3'],
  ['/politique-confidentialite', 'yearly', '0.3'],
  ['/politique-cookies', 'yearly', '0.3'],
  ['/cgu', 'yearly', '0.3'],
  ['/cgv', 'yearly', '0.3'],
]

function locXml(path, changefreq, priority) {
  return `  <url><loc>${SITE}${path}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
}

async function remoteBlogSlugs() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return []
  try {
    const res = await fetch(
      `${url.replace(/\/$/, '')}/rest/v1/articles?published=eq.true&select=slug`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    )
    if (!res.ok) return []
    const rows = await res.json()
    return Array.isArray(rows)
      ? rows.map((r) => r.slug).filter((s) => s && !String(s).startsWith('demo-'))
      : []
  } catch {
    return []
  }
}

function sitemapPlugin() {
  return {
    name: 'myswym-sitemap',
    apply: 'build',
    async closeBundle() {
      const slugs = new Set(POSTS.map((p) => p.slug))
      for (const slug of await remoteBlogSlugs()) slugs.add(slug)
      const urls = [
        ...STATIC_PATHS.flatMap(([path, freq, pri]) => [
          locXml(withLocalePrefix(path, "en"), freq, pri),
          locXml(withLocalePrefix(path, "fr"), freq, pri),
        ]),
        ...[...slugs].sort().flatMap((slug) => [
          locXml(withLocalePrefix(`/blog/${slug}`, "en"), "monthly", "0.6"),
          locXml(withLocalePrefix(`/blog/${slug}`, "fr"), "monthly", "0.6"),
        ]),
      ]
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
      const outDir = join(dirname(fileURLToPath(import.meta.url)), 'dist')
      mkdirSync(outDir, { recursive: true })
      writeFileSync(join(outDir, 'sitemap.xml'), xml)
    },
  }
}

/** Version client exposée au Version Gate (override via VITE_APP_VERSION). */
const APP_VERSION = process.env.VITE_APP_VERSION || '1.0.1'

function natationSheetDevApi(env) {
  const id = String(env.NATATION_SHEET_ID || '')
    .replace(/"/g, '')
    .trim()
  return {
    name: 'natation-sheet-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ''
        if (!url.startsWith('/api/natation-sheet')) return next()
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          res.statusCode = 405
          res.end('method_not_allowed')
          return
        }
        if (!id) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'missing_NATATION_SHEET_ID' }))
          return
        }
        try {
          const u = new URL(url, 'http://localhost')
          const sheet = (u.searchParams.get('sheet') || '').trim()
          if (!sheet) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'missing_sheet' }))
            return
          }
          const gUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`
          const upstream = await fetch(gUrl, { redirect: 'follow' })
          if (!upstream.ok) {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'upstream', status: upstream.status }))
            return
          }
          const csv = await upstream.text()
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify({ sheet, csv, bytes: csv.length }))
        } catch (err) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: 'fetch_failed',
              message: err?.message || String(err),
            }),
          )
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiOrigin = env.DEV_API_ORIGIN || 'https://staging.myswym.app'
  const bypass =
    env.VERCEL_AUTOMATION_BYPASS_SECRET || env.DEV_API_BYPASS_SECRET || ''

  return {
    plugins: [react(), tailwindcss(), sitemapPlugin(), natationSheetDevApi(env)],
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(APP_VERSION),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiOrigin,
          changeOrigin: true,
          secure: true,
          headers: bypass
            ? { 'x-vercel-protection-bypass': bypass }
            : undefined,
        },
      },
    },
  }
})
