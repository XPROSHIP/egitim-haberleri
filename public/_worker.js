/**
 * Site Worker'ı — sayfa HTML'ini adrese göre yeniden yazar.
 *
 * Tek sayfalık uygulama (SPA) olarak yayın yapıyoruz: Google sayfayı
 * çalıştırıp başlığı güncellese bile sosyal medya ve WhatsApp önizlemeleri
 * boş kalıyor, her haber adresi ana sayfa gibi görünüyordu. Bu Worker
 * HTML kabuğunu alıp adrese göre doğru meta etiketlerini ve şema
 * (schema.org) verisini yerleştiriyor.
 *
 * Ayrıca /robots.txt ve /sitemap.xml dosyalarını canlı veritabanından
 * üretiyor (Google Haberler sitemap'i dâhil).
 */

const SITE = 'https://egitim-haberleri.omerzen.workers.dev'
const API = 'https://egitim-haberleri-api.omerzen.workers.dev'

const CATEGORY_NAMES = {
  mesleki: 'Mesleki Eğitim',
  mesem: 'MESEM',
  meb: 'MEB',
  corum: 'Çorum Eğitim',
  ortaogretim: 'Ortaöğretim',
  ilkogretim: 'İlköğretim',
  maarif: 'Maarif Modeli',
  universite: 'Üniversite / YKS',
  sinav: 'Sınavlar',
  yabanci: 'Yabancı Eğitim',
  gundem: 'Gündem',
}

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const setMeta = (html, attr, content) => {
  const re = new RegExp(`<meta ${attr}\\s*[^>]*>`, 'i')
  const tag = `<meta ${attr} content="${esc(content)}" />`
  return re.test(html) ? html.replace(re, tag) : html
}

/** /haber/:slug → haber kaydı. */
async function findArticle(env, slug) {
  try {
    return await env.DB.prepare(
      `SELECT slug, title, excerpt, source_name, source_url, source_image, published_at, category, lang
       FROM news WHERE slug = ? AND status = 'published' LIMIT 1`,
    )
      .bind(slug)
      .first()
  } catch {
    return null
  }
}

function articleMeta(env, a) {
  const url = `${SITE}/haber/${a.slug}`
  const image = a.source_image
    ? a.source_image.startsWith('/img/')
      ? `${API}${a.source_image}`
      : a.source_image
    : `${API}/icon-512.png`
  const title = `${a.title} — Eğitim Haberleri`
  const description = (a.excerpt || '').slice(0, 300)
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: a.title,
    description,
    image: [image],
    datePublished: a.published_at,
    dateModified: a.published_at,
    inLanguage: a.lang === 'en' ? 'tr' : 'tr',
    articleSection: CATEGORY_NAMES[a.category] ?? 'Eğitim',
    author: { '@type': 'Organization', name: 'Eğitim Haberleri' },
    publisher: {
      '@type': 'Organization',
      name: 'Eğitim Haberleri',
      logo: { '@type': 'ImageObject', url: `${API}/icon-512.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    isBasedOn: a.source_url,
  }
  return { title, description, url, image, jsonld }
}

function categoryMeta(slug) {
  const name = CATEGORY_NAMES[slug] ?? slug
  const url = `${SITE}/kategori/${slug}`
  const title = `${name} Haberleri — Eğitim Haberleri`
  const description = `${name} kategorisindeki güncel haberler, duyurular ve gelişmeler. Eğitim Haberleri'nden her üç saatte bir yenilenir.`
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url,
    inLanguage: 'tr',
  }
  return { title, description, url, image: `${API}/icon-512.png`, jsonld }
}

/** HTML kabuğuna meta etiketlerini ve şemayı yazar. */
function applyMeta(html, meta) {
  let out = html
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(meta.title)}</title>`)
  out = setMeta(out, 'name="description"', meta.description)
  out = setMeta(out, 'property="og:title"', meta.title)
  out = setMeta(out, 'property="og:description"', meta.description)
  out = setMeta(out, 'property="og:url"', meta.url)
  out = setMeta(out, 'property="og:image"', meta.image)
  out = setMeta(out, 'property="og:type"', 'article')
  out = setMeta(out, 'name="twitter:title"', meta.title)
  out = setMeta(out, 'name="twitter:description"', meta.description)
  out = setMeta(out, 'name="twitter:image"', meta.image)

  // Canonical
  const canonical = `<link rel="canonical" href="${esc(meta.url)}" />`
  if (/<link rel="canonical"[^>]*>/i.test(out)) {
    out = out.replace(/<link rel="canonical"[^>]*>/i, canonical)
  } else {
    out = out.replace('</head>', `${canonical}\n</head>`)
  }

  // Şema (JSON-LD)
  const ld = `<script type="application/ld+json">${JSON.stringify(meta.jsonld)}</script>`
  out = out.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/i,
    ld,
  )
  return out
}

function robots() {
  return `User-agent: *
Allow: /

# Haber arşivi ve kategoriler açık; arama ve profil sayfaları indekslenmesin
Disallow: /ara
Disallow: /giris
Disallow: /profil

Sitemap: ${SITE}/sitemap.xml
`
}

async function sitemap(env) {
  let rows = []
  try {
    const { results } = await env.DB.prepare(
      `SELECT slug, title, published_at FROM news
       WHERE status = 'published' ORDER BY published_at DESC LIMIT 1000`,
    ).all()
    rows = results ?? []
  } catch {
    rows = []
  }

  const today = new Date().toISOString().slice(0, 10)
  const staticUrls = [
    { loc: `${SITE}/`, priority: '1.0', changefreq: 'hourly' },
    ...Object.keys(CATEGORY_NAMES).map((c) => ({
      loc: `${SITE}/kategori/${c}`,
      priority: '0.7',
      changefreq: 'hourly',
    })),
    { loc: `${SITE}/kategoriler`, priority: '0.5', changefreq: 'weekly' },
  ]

  const parts = []
  for (const u of staticUrls) {
    parts.push(
      `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
    )
  }
  for (const a of rows) {
    const loc = `${SITE}/haber/${a.slug}`
    const date = String(a.published_at ?? '').slice(0, 10)
    parts.push(
      `  <url><loc>${loc}</loc><lastmod>${date}</lastmod><changefreq>daily</changefreq><priority>0.8</priority>` +
        `<news:news><news:publication><news:name>Eğitim Haberleri</news:name><news:language>tr</news:language></news:publication>` +
        `<news:publication_date>${a.published_at}</news:publication_date><news:title>${esc(a.title)}</news:title></news:news></url>`,
    )
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${parts.join('\n')}
</urlset>
`
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/robots.txt') {
      return new Response(robots(), {
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' },
      })
    }

    if (url.pathname === '/sitemap.xml') {
      return new Response(await sitemap(env), {
        headers: {
          'content-type': 'application/xml; charset=utf-8',
          'cache-control': 'public, max-age=1800',
        },
      })
    }

    // Meta yazımı yalnızca haber ve kategori adreslerinde gerekir; geri
    // kalanı doğrudan servis et (CPU tasarrufu).
    const article = url.pathname.match(/^\/haber\/([^/]+)$/)
    const cat = url.pathname.match(/^\/kategori\/([^/]+)$/)
    if (!article && !cat) return env.ASSETS.fetch(request)

    const response = await env.ASSETS.fetch(request)
    const type = response.headers.get('content-type') ?? ''
    if (!type.includes('text/html')) return response

    const html = await response.text()
    let meta = null

    if (article) {
      const a = await findArticle(env, decodeURIComponent(article[1]))
      if (a) meta = articleMeta(env, a)
    } else {
      meta = categoryMeta(decodeURIComponent(cat[1]))
    }

    if (!meta) return response

    const headers = new Headers(response.headers)
    headers.set('x-seo', 'injected')
    return new Response(applyMeta(html, meta), { status: response.status, headers })
  },
}
