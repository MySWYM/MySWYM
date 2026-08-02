import { supabase } from "./supabase.js";
import { POSTS } from "./posts.js";

/** Catégories affichées dans le filtre du blog */
export const BLOG_CATEGORIES = [
  "Conseils entraînement",
  "Technique & éducatifs",
  "Mental & préparation",
  "Physiologie & performance",
  "Eau libre",
  "Matériel",
  "Récits & Interviews",
];

export const PAGE_SIZE = 12;

const CATEGORY_FALLBACK = {
  Entraînement: "Conseils entraînement",
  Triathlon: "Conseils entraînement",
  Diplômes: "Conseils entraînement",
  Débutants: "Technique & éducatifs",
};

/** Articles Lorem de démo — utilisés si Supabase est indisponible ou vide */
export const DEMO_ARTICLES = [
  {
    id: "demo-1",
    titre: "[Démo] Lorem ipsum — conseils d'entraînement",
    slug: "demo-conseils-entrainement",
    extrait:
      "PLACEHOLDER — Lorem ipsum dolor sit amet, consectetur adipiscing elit. Article de démo pour tester l'affichage du blog.",
    contenu:
      "## Placeholder — contenu de démo\n\n**Ceci est un article de démonstration.** Le texte ci-dessous est du Lorem ipsum et doit être remplacé manuellement.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\n## Deuxième section (placeholder)\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\n**Fin du placeholder.** Remplace ce contenu par un vrai article.",
    categorie: "Conseils entraînement",
    image_url: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80",
    date_publication: "2026-07-01T10:00:00Z",
    published: true,
  },
  {
    id: "demo-2",
    titre: "[Démo] Lorem ipsum — technique & éducatifs",
    slug: "demo-technique-educatifs",
    extrait:
      "PLACEHOLDER — Sed ut perspiciatis unde omnis iste natus error sit voluptatem. Article de démo pour tester le filtre et la carte.",
    contenu:
      "## Placeholder — technique\n\n**Article de démonstration (Lorem ipsum).** À remplacer manuellement.\n\nSed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis.\n\n## Suite du placeholder\n\nNemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
    categorie: "Technique & éducatifs",
    image_url: "https://images.unsplash.com/photo-1519315901367-f34ff911840e?w=1200&q=80",
    date_publication: "2026-07-08T10:00:00Z",
    published: true,
  },
  {
    id: "demo-3",
    titre: "[Démo] Lorem ipsum — mental & préparation",
    slug: "demo-mental-preparation",
    extrait:
      "PLACEHOLDER — At vero eos et accusamus et iusto odio dignissimos. Article de démo pour tester la page article complète.",
    contenu:
      "## Placeholder — mental\n\n**Ceci est un placeholder Lorem ipsum.** Aucun contenu éditorial réel.\n\nAt vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi.\n\n## Dernière section (à remplacer)\n\nTemporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.",
    categorie: "Mental & préparation",
    image_url: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&q=80",
    date_publication: "2026-07-15T10:00:00Z",
    published: true,
  },
];

function parseFrDate(label) {
  const months = {
    janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
    juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
  };
  const m = String(label || "").toLowerCase().match(/(\d{1,2})\s+(\S+)\s+(\d{4})/);
  if (!m) return new Date(0).toISOString();
  const month = months[m[2]];
  if (month == null) return new Date(0).toISOString();
  return new Date(Number(m[3]), month, Number(m[1])).toISOString();
}

/** Anciens articles statiques (posts.js) → forme articles, pour les URLs déjà indexées */
function legacyPostToArticle(post) {
  const contenu = (post.sections || [])
    .map((s) => `## ${s.h2}\n\n${s.content}`)
    .join("\n\n");
  return {
    id: `legacy-${post.slug}`,
    titre: post.title,
    slug: post.slug,
    extrait: post.description || post.intro || "",
    contenu: post.intro ? `${post.intro}\n\n${contenu}` : contenu,
    categorie: CATEGORY_FALLBACK[post.category] || "Conseils entraînement",
    image_url: null,
    date_publication: parseFrDate(post.date),
    published: true,
    _legacy: true,
  };
}

const LEGACY_ARTICLES = POSTS.map(legacyPostToArticle);

function sortByDateDesc(a, b) {
  return new Date(b.date_publication) - new Date(a.date_publication);
}

/** Catalogue local pour la liste : articles éditoriaux (posts.js), démos en dernier recours */
function localListCatalog() {
  const bySlug = new Map();
  for (const a of [...LEGACY_ARTICLES, ...DEMO_ARTICLES]) {
    if (!bySlug.has(a.slug)) bySlug.set(a.slug, a);
  }
  // Masquer les démos Lorem si on a du vrai contenu
  const all = [...bySlug.values()];
  const real = all.filter((a) => !String(a.slug).startsWith("demo-"));
  return (real.length ? real : all).sort(sortByDateDesc);
}

/** Lookup local par slug : démos + anciens posts.js (liens App / SEO) */
function localBySlug(slug) {
  return (
    DEMO_ARTICLES.find((a) => a.slug === slug) ||
    LEGACY_ARTICLES.find((a) => a.slug === slug) ||
    null
  );
}

/**
 * Liste paginée des articles publiés.
 * @returns {{ articles: object[], total: number, page: number, pageCount: number, source: 'supabase'|'local' }}
 */
export async function fetchPublishedArticles({ categorie = null, page = 1 } = {}) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  try {
    let query = supabase
      .from("articles")
      .select("*", { count: "exact" })
      .eq("published", true)
      .order("date_publication", { ascending: false });

    if (categorie) query = query.eq("categorie", categorie);

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    // Table absente de données (migration non seedée) → démos locales
    // Ne pas fallback si un filtre catégorie renvoie 0 résultat volontairement.
    if ((!data || data.length === 0) && (count === 0 || count == null) && !categorie && page === 1) {
      return paginateLocal({ categorie, page });
    }

    return {
      articles: data || [],
      total: count ?? data?.length ?? 0,
      page,
      pageCount: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
      source: "supabase",
    };
  } catch {
    return paginateLocal({ categorie, page });
  }
}

function paginateLocal({ categorie, page }) {
  let list = localListCatalog();
  if (categorie) list = list.filter((a) => a.categorie === categorie);
  const total = list.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  return {
    articles: list.slice(start, start + PAGE_SIZE),
    total,
    page: safePage,
    pageCount,
    source: "local",
  };
}

/** Article par slug (Supabase, sinon démo / legacy posts.js) */
export async function fetchArticleBySlug(slug) {
  if (!slug) return null;

  try {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (!error && data) return { ...data, source: "supabase" };
  } catch {
    // fallback ci-dessous
  }

  const local = localBySlug(slug);
  return local ? { ...local, source: "local" } : null;
}

/** Quelques articles liés (même catégorie de préférence) */
export async function fetchRelatedArticles(slug, categorie, limit = 2) {
  const { articles } = await fetchPublishedArticles({ page: 1 });
  const pool = articles.length ? articles : localListCatalog();
  const others = pool.filter((a) => a.slug !== slug);
  const same = others.filter((a) => a.categorie === categorie);
  const rest = others.filter((a) => a.categorie !== categorie);
  return [...same, ...rest].slice(0, limit);
}

export function formatArticleDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
