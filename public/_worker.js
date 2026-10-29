/**
 * Site Worker'ı — sayfa HTML'ini adrese göre yeniden yazar.
 *
 * Tek sayfalık uygulama (SPA) olarak yayın yapıyoruz: Google sayfayı
 * çalıştırıp başlığı günsel bile sosyal medya ve WhatsApp önizlemeleri
 * boş kalıyor, her haber adresi ana sayfa gibi görünüyordu. Bu Worker
 * HTML kabuğunu alıp adrese göre doğru meta etiketlerini, şema
 * (schema.org) verisini ve haber metnini yerleştiriyor.
 *
 * Ayrıca:
 *   · /robots.txt, /sitemap.xml  → canlı veritabanından
 *   · /feed.xml, /kategori/*.xml  → RSS beslemeleri
 *   · /podcast.xml                → ZENPOD Eğitim ses bülteni
 *   · çerezsiz sayfa sayacı       → sunucu tarafında, kimlik tutmadan
 */

const DEFAULT_SITE = 'https://corummesem.com.tr'
const DEFAULT_API = 'https://egitim-haberleri-api.omerzen.workers.dev'
const PODCAST_TITLE = 'ZENPOD Eğitim'
/** Dağıtım sürümü (ölçüm için). */
const TRACK_VERSION = '2026-10-28b'

const getSite = (url, env) => url?.origin || env?.SITE_URL || DEFAULT_SITE
const getApi = (env) => env?.API_URL || DEFAULT_API

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
    .replace(/'/g, '&#39;')

const setMeta = (html, attr, content) => {
  const re = new RegExp(`<meta ${attr}\\s*[^>]*>`, 'i')
  const tag = `<meta ${attr} content="${esc(content)}" />`
  return re.test(html) ? html.replace(re, tag) : html
}

const dayKey = () => new Date().toISOString().slice(0, 10)

/* ── Veritabanı ─────────────────────────────────────────────────────────── */

async function findArticle(env, slug) {
  try {
    return await env.DB.prepare(
      `SELECT slug, title, excerpt, body, source_name, source_url, source_image, published_at,
              category, lang, full_text
       FROM news WHERE slug = ? AND status = 'published' LIMIT 1`,
    )
      .bind(slug)
      .first()
  } catch {
    return null
  }
}

async function listNews(env, { category = null, limit = 50 } = {}) {
  const where = category ? 'AND category = ?' : ''
  const sql = `SELECT slug, title, excerpt, body, source_name, source_url, source_image,
                      published_at, category, lang
               FROM news WHERE status = 'published' ${where}
               ORDER BY published_at DESC LIMIT ?`
  const stmt = category ? env.DB.prepare(sql).bind(category, limit) : env.DB.prepare(sql).bind(limit)
  const { results } = await stmt.all()
  return results ?? []
}

/* ── Analitik: çerezsiz, sunucu tarafı sayfa sayacı ─────────────────────── */

async function track(env, path) {
  await env.DB.prepare(
    `INSERT INTO page_views (day, path, count) VALUES (?,?,1)
     ON CONFLICT(day, path) DO UPDATE SET count = count + 1`,
  )
    .bind(dayKey(), path.slice(0, 200))
    .run()
}

/* ── Meta ve şema ──────────────────────────────────────────────────────── */

function articleMeta(a, site, api) {
  const url = `${site}/haber/${a.slug}`
  const image = a.source_image
    ? a.source_image.startsWith('/img/')
      ? `${api}${a.source_image}`
      : a.source_image
    : `${api}/icon-512.png`
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
    inLanguage: 'tr',
    articleSection: CATEGORY_NAMES[a.category] ?? 'Eğitim',
    author: { '@type': 'Organization', name: 'Eğitim Haberleri' },
    publisher: {
      '@type': 'Organization',
      name: 'Eğitim Haberleri',
      logo: { '@type': 'ImageObject', url: `${api}/icon-512.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    isBasedOn: a.source_url,
  }
  return { title, description, url, image, jsonld }
}

function categoryMeta(slug, site, api) {
  const name = CATEGORY_NAMES[slug] ?? slug
  const url = `${site}/kategori/${slug}`
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
  return { title, description, url, image: `${api}/icon-512.png`, jsonld }
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

  const canonical = `<link rel="canonical" href="${esc(meta.url)}" />`
  if (/<link rel="canonical"[^>]*>/i.test(out)) {
    out = out.replace(/<link rel="canonical"[^>]*>/i, canonical)
  } else {
    out = out.replace('</head>', `${canonical}\n</head>`)
  }

  const ld = `<script type="application/ld+json">${JSON.stringify(meta.jsonld)}</script>`
  out = out.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, ld)
  return out
}

/* ── Haber ön-render: metin de arama motoruna gitsin ───────────────────── */

function paragraphsOf(a) {
  let body = a.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = []
    }
  }
  if (!Array.isArray(body)) body = []
  const out = []
  for (const p of body) {
    if (typeof p !== 'string' || !p.trim()) continue
    if (p.startsWith('## ')) {
      out.push(`<h2>${esc(p.slice(3).trim())}</h2>`)
    } else {
      out.push(`<p>${esc(p)}</p>`)
    }
  }
  return out.join('\n      ')
}

/**
 * Haber sayfasının gövdesini HTML'e önceden yazar.
 * React uygulaması yüklenirken tarayıcıda (ve Google'da) metin hazır olur.
 */
function prerenderArticle(a, site, api) {
  const cat = CATEGORY_NAMES[a.category] ?? 'Eğitim'
  const img = a.source_image
    ? a.source_image.startsWith('/img/')
      ? `${api}${a.source_image}`
      : a.source_image
    : ''
  const published = new Date(a.published_at ?? Date.now()).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return `
    <article class="mx-auto max-w-[1180px] px-3 pt-6 sm:px-4">
      <div class="max-w-[760px]">
        <span class="inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold text-white" style="background:var(--primary)">${esc(cat)}</span>
        <h1 class="mt-2.5 text-[23px] leading-[1.16] font-bold tracking-tight text-fg sm:text-[34px]">${esc(a.title)}</h1>
        <p class="mt-4 text-[0.96875rem] leading-relaxed text-muted sm:text-[1.0625rem]">${esc(a.excerpt ?? '')}</p>
        <p class="tnum mt-4 border-y border-line py-3 text-[0.75rem] text-faint">${esc(a.source_name ?? '')} · ${esc(published)}</p>
        ${img ? `<img src="${esc(img)}" alt="${esc(a.title)}" class="mt-6 aspect-[16/9] w-full rounded-2xl object-cover" />` : ''}
        <div class="article-prose mt-8 space-y-5">
      ${paragraphsOf(a)}
        </div>
        <p class="mt-8 text-[0.75rem] text-faint">Kaynak: <a href="${esc(a.source_url ?? '')}" rel="noopener nofollow" class="underline underline-offset-2">${esc(a.source_name ?? '')}</a> — Eğitim Haberleri</p>
      </div>
    </article>`
}

/* ── RSS ────────────────────────────────────────────────────────────────── */

function rssItem(a, site, api) {
  const url = `${site}/haber/${a.slug}`
  const image = a.source_image?.startsWith('/img/') ? `${api}${a.source_image}` : a.source_image
  const pub = new Date(a.published_at ?? Date.now()).toUTCString()
  return `    <item>
      <title>${esc(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pub}</pubDate>
      <category>${esc(CATEGORY_NAMES[a.category] ?? 'Eğitim')}</category>
      <description>${esc(a.excerpt ?? '')}</description>${image ? `\n      <enclosure url="${esc(image)}" type="image/jpeg" length="0"/>` : ''}
    </item>`
}

function rssFeed(items, { title, description, link, self, api }) {
  const siteUrl = link
  const itemsXml = items.map((a) => rssItem(a, siteUrl, api)).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${esc(title)}</title>
    <link>${link}</link>
    <atom:link href="${self}" rel="self" type="application/rss+xml"/>
    <description>${esc(description)}</description>
    <language>tr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Eğitim Haberleri</generator>
    <image><url>${api}/icon-512.png</url><title>${esc(title)}</title><link>${link}</link></image>
${itemsXml}
  </channel>
</rss>`
}

/* ── ZENPOD Eğitim (podcast) ────────────────────────────────────────────── */

async function podcastFeed(env, site, api) {
  let episodes = []
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, title, description, audio_id, duration, published_at FROM podcast_episodes ORDER BY published_at DESC LIMIT 30',
    ).all()
    episodes = results ?? []
  } catch {
    episodes = []
  }
  const items = episodes
    .map((e) => {
      const url = `${site}/podcast/${e.id}.mp3`
      const date = new Date(e.published_at ?? Date.now()).toUTCString()
      return `    <item>
      <title>${esc(e.title)}</title>
      <link>${site}/podcast</link>
      <guid isPermaLink="false">zenpod-${e.id}</guid>
      <pubDate>${date}</pubDate>
      <description>${esc(e.description ?? '')}</description>
      <enclosure url="${url}" type="audio/mpeg" length="0"/>
      <itunes:duration>${Math.round(e.duration ?? 0)}</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>${esc(PODCAST_TITLE)}</title>
    <link>${site}/podcast</link>
    <atom:link href="${site}/podcast.xml" rel="self" type="application/rss+xml"/>
    <description>Eğitim gündeminden günün haberleri, sesli. Eğitim Haberleri'ni takip edin, yorumlarla destekleyin.</description>
    <language>tr</language>
    <itunes:author>Eğitim Haberleri</itunes:author>
    <itunes:summary>Eğitim gündeminden günün haberleri, sesli.</itunes:summary>
    <itunes:explicit>false</itunes:explicit>
    <itunes:image href="${api}/icon-512.png"/>
    <itunes:category text="Education"/>
    <itunes:owner><itunes:name>Eğitim Haberleri</itunes:name></itunes:owner>
${items}
  </channel>
</rss>`
}

/* ── robots.txt ve sitemap.xml ──────────────────────────────────────────── */

function robots(site) {
  return `User-agent: *
Allow: /

# Haber arşivi ve kategoriler açık; arama ve profil sayfaları indekslenmesin
Disallow: /ara
Disallow: /giris
Disallow: /profil

Sitemap: ${site}/sitemap.xml
`
}

async function sitemap(env, site) {
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

  const today = dayKey()
  const staticUrls = [
    { loc: `${site}/`, priority: '1.0', changefreq: 'hourly' },
    ...Object.keys(CATEGORY_NAMES).map((c) => ({
      loc: `${site}/kategori/${c}`,
      priority: '0.7',
      changefreq: 'hourly',
    })),
    { loc: `${site}/kategoriler`, priority: '0.5', changefreq: 'weekly' },
    { loc: `${site}/podcast`, priority: '0.6', changefreq: 'daily' },
  ]

  const parts = []
  for (const u of staticUrls) {
    parts.push(
      `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
    )
  }
  for (const a of rows) {
    const loc = `${site}/haber/${a.slug}`
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

/* ── Worker ─────────────────────────────────────────────────────────────── */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const site = getSite(url, env)
    const api = getApi(env)

    // TurkTicaret gibi yönlendirme servislerinin eklediği yinelenen eğik çizgileri temizle:
    // Örneğin https://egitim.omerzen.workers.dev//sitemap.xml -> /sitemap.xml
    const pathname = url.pathname.replace(/\/+/g, '/') || '/'

    if (pathname === '/robots.txt') {
      return new Response(robots(site), {
        headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' },
      })
    }

    if (pathname === '/sitemap.xml') {
      return new Response(await sitemap(env, site), {
        headers: {
          'content-type': 'application/xml; charset=utf-8',
          'cache-control': 'public, max-age=1800',
        },
      })
    }

    // RSS
    if (pathname === '/feed.xml' || pathname === '/rss.xml') {
      const items = await listNews(env, { limit: 50 })
      return new Response(
        rssFeed(items, {
          title: 'Eğitim Haberleri',
          description:
            'Mesleki eğitim, MESEM, MEB, Çorum eğitim ve yabancı eğitim gündeminden güncel haberler.',
          link: site,
          self: `${site}/feed.xml`,
          api,
        }),
        {
          headers: {
            'content-type': 'application/rss+xml; charset=utf-8',
            'cache-control': 'public, max-age=900',
          },
        },
      )
    }

    const catFeed = pathname.match(/^\/kategori\/([a-z-]+)\.xml$/)
    if (catFeed) {
      const slug = catFeed[1]
      const name = CATEGORY_NAMES[slug] ?? slug
      const items = await listNews(env, { category: slug, limit: 50 })
      return new Response(
        rssFeed(items, {
          title: `${name} — Eğitim Haberleri`,
          description: `${name} kategorisindeki güncel haberler.`,
          link: `${site}/kategori/${slug}`,
          self: `${site}/kategori/${slug}.xml`,
          api,
        }),
        {
          headers: {
            'content-type': 'application/rss+xml; charset=utf-8',
            'cache-control': 'public, max-age=900',
          },
        },
      )
    }

    if (pathname === '/podcast.xml') {
      return new Response(await podcastFeed(env, site, api), {
        headers: {
          'content-type': 'application/rss+xml; charset=utf-8',
          'cache-control': 'public, max-age=1800',
        },
      })
    }

    // Podcast bölümü sesi: DB_AUDIO, DB veya API fallback ile asla 404 dönmez
    if (pathname.startsWith('/podcast/') && pathname.endsWith('.mp3')) {
      const id = pathname.slice('/podcast/'.length, -4)
      let row = null
      const audioDbs = [
        env.DB_AUDIO,
        env.DB_AUDIO_2,
        env.DB_AUDIO_3,
        env.DB_AUDIO_4,
        env.DB_AUDIO_5,
        env.DB_AUDIO_6,
        env.DB_AUDIO_7,
        env.DB,
      ].filter(Boolean)

      for (let i = audioDbs.length - 1; i >= 0; i--) {
        try {
          const r = await audioDbs[i]
            .prepare('SELECT data, type FROM news_audio WHERE article_id = ?')
            .bind(id)
            .first()
          if (r && r.data) {
            row = r
            break
          }
        } catch {}
      }

      if (!row || !row.data) {
        // Doğrudan API Worker'dan proxy dene
        try {
          const apiRes = await fetch(`${api}/api/audio/${encodeURIComponent(id)}`)
          if (apiRes.ok) {
            const h = new Headers(apiRes.headers)
            h.set('content-disposition', `attachment; filename="${id}.mp3"`)
            h.set('cache-control', 'public, max-age=86400')
            return new Response(apiRes.body, { status: 200, headers: h })
          }
        } catch {}
        return new Response('Not found', { status: 404 })
      }

      const bytes =
        row.data instanceof ArrayBuffer
          ? new Uint8Array(row.data)
          : Array.isArray(row.data)
            ? Uint8Array.from(row.data)
            : new Uint8Array(0)

      const total = bytes.byteLength
      const range = request.headers.get('range')
      const contentType = row.type ?? 'audio/mpeg'

      if (range && range.startsWith('bytes=')) {
        const parts = range.slice(6).split('-')
        const start = parseInt(parts[0], 10) || 0
        const end = parts[1] ? parseInt(parts[1], 10) : total - 1
        if (start < total && end < total && start <= end) {
          const chunk = bytes.subarray(start, end + 1)
          return new Response(chunk, {
            status: 206,
            headers: {
              'content-type': contentType,
              'content-range': `bytes ${start}-${end}/${total}`,
              'content-length': String(chunk.byteLength),
              'accept-ranges': 'bytes',
              'cache-control': 'public, max-age=86400',
            },
          })
        }
      }

      return new Response(bytes, {
        headers: {
          'content-type': contentType,
          'content-length': String(total),
          'accept-ranges': 'bytes',
          'content-disposition': `attachment; filename="${id}.mp3"`,
          'cache-control': 'public, max-age=86400',
        },
      })
    }

    // Meta yazımı yalnızca haber ve kategori adreslerinde gerekir.
    const article = pathname.match(/^\/haber\/([^/]+)$/)
    const cat = pathname.match(/^\/kategori\/([^/]+)$/)
    if (!article && !cat) {
      // Dosya uzantısı olan bilinmeyen bir yol (mp3, mp4, pdf, zip...):
      // SPA kabuğu DEĞİL, temiz 404 dönsün. Aksi halde indirilen dosyanın
      // içine HTML yazılıyor.
      if (/\.[a-z0-9]{2,5}$/i.test(pathname)) {
        return new Response('Not found', {
          status: 404,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        })
      }
      return env.ASSETS.fetch(request)
    }

    const response = await env.ASSETS.fetch(request)
    const type = response.headers.get('content-type') ?? ''
    if (!type.includes('text/html')) return response

    const html = await response.text()
    let meta = null
    let pre = ''

    if (article) {
      const a = await findArticle(env, decodeURIComponent(article[1]))
      if (a) {
        meta = articleMeta(a, site, api)
        pre = prerenderArticle(a, site, api)
        await track(env, `/haber/${a.slug}`)
      }
    } else {
      meta = categoryMeta(decodeURIComponent(cat[1]), site, api)
      await track(env, `/kategori/${cat[1]}`)
    }

    if (!meta) return response

    let out = applyMeta(html, meta)
    // Haber metnini de HTML'e yaz: hem arama motoru hem hızlı ilk boyama.
    if (pre) out = out.replace('<div id="root"></div>', `<div id="root">${pre}</div>`)

    const headers = new Headers(response.headers)
    headers.set('x-seo', `injected-v${TRACK_VERSION}`)
    return new Response(out, { status: response.status, headers })
  },
}
