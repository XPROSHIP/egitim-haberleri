/**
 * Cloudflare Worker — Eğitim Haberleri
 *
 *  · GET  /api/news        → yayındaki haberler (CDN önbellekli)
 *  · GET  /api/news/:slug  → tek haber
 *  · GET  /img/:key        → haber görseli (D1'de saklanır)
 *  · POST /api/collect     → GitHub Actions'ın topladığı haberleri yazar
 *  · POST /api/image       → GitHub Actions'ın yüklediği görsel
 *  · GET  /api/health      → durum
 *
 * Burada bilerek toplama yapılmıyor. Workers Free kademesinde tek bir
 * çalıştırmaya 10 ms CPU tanınıyor; toplayıcı ise yüzlerce sayfa çekip
 * HTML ayrıştırdığı için ~200 ms harcıyor ve işlem kesiliyor. Ağır iş
 * GitHub Actions'ta çalışır, sonucu buraya POST eder.
 *
 * Görseller R2 yerine D1'de tutuluyor: R2'nin ücretsiz kademesi bile
 * kredi kartı istiyor, D1 ise istemiyor ve çıkış trafiği ücreti almıyor.
 */
import { createD1Store, createMemoryStore, fromRow } from './src/store.js'

/**
 * CORS basliklari istege gore uretilir.
 * "Authorization" basligi gonderen isteklerde Chrome joker "*" degerini kabul
 * etmez; tam origin dondurulmek zorundadir. Aksi halde tarayici istegi
 * engeller ve "Failed to fetch" hatasi verir.
 */
function corsFor(request) {
  const origin = request.headers.get('origin')
  return {
    'access-control-allow-origin': origin ?? '*',
    'access-control-allow-headers': 'content-type, authorization, x-collect-secret',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-max-age': '86400',
    vary: 'Origin',
  }
}

const json = (body, status = 200, extra = {}, cors = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...cors, ...extra },
  })

function store(env) {
  if (env.DB) return createD1Store(env.DB)
  return createMemoryStore()
}

const authorized = (request, env) => {
  const secret = request.headers.get('x-collect-secret')
  return Boolean(env.COLLECT_SECRET) && secret === env.COLLECT_SECRET
}

/**
 * D1 BLOB sütununu bayt dizisine çevirir.
 * D1 sürüme göre ArrayBuffer, Uint8Array ya da sayı dizisi döndürebiliyor;
 * hepsini destekliyoruz çünkü new Response() yalnızca ilk ikisini kabul eder.
 */
function toBytes(value) {
  if (!value) return null
  if (value instanceof ArrayBuffer) return new Uint8Array(value)
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
  if (Array.isArray(value)) return Uint8Array.from(value)
  if (typeof value === 'string') {
    // base64 gelen satırlar
    try {
      const bin = atob(value)
      const out = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
      return out
    } catch {
      return null
    }
  }
  return null
}

/**
 * Supabase oturum jetonundan kullanıcı kimliğini dogrular.
 * Jeton Supabase tarafindan imzalanir; istemcinin gonderdigi id'ye guvenilmez.
 */
async function currentUser(request, env) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const base = (env.SUPABASE_URL ?? '').replace(/\/$/, '')
  if (!base) return null
  try {
    const res = await fetch(`${base}/auth/v1/user`, {
      headers: { apikey: env.SUPABASE_ANON_KEY ?? '', Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const user = await res.json()
    return user?.id
      ? { id: user.id, name: user.user_metadata?.full_name ?? user.email ?? 'Kullanıcı' }
      : null
  } catch {
    return null
  }
}

export default {
  /**
   * Zamanlayıcı: GitHub iş akışını tetikler.
   *
   * Neden Worker cron'u: GitHub'ın kendi zamanlayıcısı yeni oluşturulan
   * depolarda saatlerce (bazen hiç) tetiklenmiyor. Cloudflare'ın cron'u
   * güvenilir ve tek bir HTTP çağrısı yaptığı için CPU limitinin çok altında.
   * Ağır iş yine GitHub Actions'ta (2.000 dk/ay) yapılır.
   */
  async scheduled(controller, env) {
    controller.noRetry()
    if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
      console.warn('[worker] GITHUB_TOKEN/GITHUB_REPO tanimli degil, tetiklenmedi')
      return
    }
    try {
      const res = await fetch(
        `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/collect.yml/dispatches`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${env.GITHUB_TOKEN}`,
            accept: 'application/vnd.github+json',
            'x-github-api-version': '2022-11-28',
            'content-type': 'application/json',
          },
          body: JSON.stringify({ ref: 'main' }),
        },
      )
      console.log(`[worker] tetikleme istegi -> HTTP ${res.status}`)
    } catch (err) {
      console.error('[worker] tetikleme hatasi', String(err?.message ?? err).slice(0, 120))
    }
  },

  async fetch(request, env) {
    const url = new URL(request.url)
    const cors = corsFor(request)
    /** Bu isteğe ait CORS başlıklarıyla JSON döndürür. */
    const reply = (body, status = 200, extra = {}) => json(body, status, extra, cors)

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors })

    // Haber görselleri
    // Not: D1, BLOB sütununu normal sorguda sayı dizisi olarak döndürüyor;
    // new Response() onu boş gövdeye çeviriyor. Dönüş biçimi sürüme göre
    // değişebildiği için hepsini karşılayacak şekilde dönüştürüyoruz.
    if (url.pathname.startsWith('/img/')) {
      const key = decodeURIComponent(url.pathname.slice('/img/'.length))
      const row = await env.DB?.prepare('SELECT data, type FROM images WHERE key = ?')
        .bind(key)
        .first()
      const bytes = toBytes(row?.data)
      if (!bytes) return new Response('Not found', { status: 404 })
      return new Response(bytes, {
        headers: {
          'content-type': row?.type ?? 'image/jpeg',
          'cache-control': 'public, max-age=31536000, immutable',
          ...cors,
        },
      })
    }

    // Görsel yükleme (yalnızca toplayıcı)
    if (url.pathname === '/api/image' && request.method === 'POST') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      const key = url.searchParams.get('key') ?? ''
      if (!/^[\w.-]{1,120}$/.test(key)) return reply({ error: 'invalid_key' }, 400)
      const type = request.headers.get('content-type') ?? 'image/jpeg'
      const data = new Uint8Array(await request.arrayBuffer())
      if (data.length === 0) return reply({ error: 'empty' }, 400)
      if (data.length > 2_000_000) return reply({ error: 'too_large' }, 413)

      await env.DB.prepare(
        `INSERT INTO images (key, data, type, bytes) VALUES (?,?,?,?)
         ON CONFLICT(key) DO UPDATE SET data=excluded.data, type=excluded.type, bytes=excluded.bytes`,
      )
        .bind(key, data, type, data.length)
        .run()
      return reply({ ok: true, key, bytes: data.length })
    }

    // --- Etkileşim: beğeni, kaydetme, yorum (gerçek kullanıcı verisi) ---

    if (url.pathname === '/api/engagement' && request.method === 'GET') {
      const article = url.searchParams.get('article') ?? ''
      const user = await currentUser(request, env)
      if (!article) return reply({ error: 'missing_article' }, 400)

      const [likes, bookmarks, comments] = await Promise.all([
        env.DB.prepare('SELECT article_id FROM news_likes WHERE article_id = ?').bind(article).all(),
        env.DB.prepare('SELECT article_id FROM news_bookmarks WHERE article_id = ?').bind(article).all(),
        env.DB.prepare(
          'SELECT id, article_id, user_id, author_name, body, parent_id, likes, created_at FROM news_comments WHERE article_id = ? ORDER BY created_at ASC LIMIT 300',
        ).bind(article).all(),
      ])

      const myLikes = new Set(
        user
          ? (
              await env.DB.prepare('SELECT article_id FROM news_likes WHERE user_id = ?').bind(user.id).all()
            ).results.map((r) => r.article_id)
          : [],
      )
      const myBookmarks = new Set(
        user
          ? (
              await env.DB.prepare('SELECT article_id FROM news_bookmarks WHERE user_id = ?').bind(user.id).all()
            ).results.map((r) => r.article_id)
          : [],
      )

      return reply({
        likes: likes.results.length,
        bookmarks: bookmarks.results.length,
        myLikes: [...myLikes],
        myBookmarks: [...myBookmarks],
        comments: comments.results.map((c) => ({
          id: c.id,
          articleId: c.article_id,
          authorId: c.user_id,
          authorName: c.author_name,
          body: c.body,
          parentId: c.parent_id ?? null,
          likes: c.likes,
          createdAt: c.created_at,
        })),
      })
    }

    if (url.pathname === '/api/like' && request.method === 'POST') {
      const user = await currentUser(request, env)
      if (!user) return reply({ error: 'unauthorized' }, 401)
      const { article, on } = await request.json().catch(() => ({}))
      if (!article) return reply({ error: 'missing_article' }, 400)
      if (on) {
        await env.DB.prepare('INSERT OR IGNORE INTO news_likes (article_id, user_id) VALUES (?,?)')
          .bind(article, user.id)
          .run()
      } else {
        await env.DB.prepare('DELETE FROM news_likes WHERE article_id = ? AND user_id = ?')
          .bind(article, user.id)
          .run()
      }
      const { results } = await env.DB.prepare('SELECT COUNT(*) AS n FROM news_likes WHERE article_id = ?')
        .bind(article)
        .all()
      return reply({ ok: true, likes: results[0]?.n ?? 0, liked: Boolean(on) })
    }

    if (url.pathname === '/api/bookmark' && request.method === 'POST') {
      const user = await currentUser(request, env)
      if (!user) return reply({ error: 'unauthorized' }, 401)
      const { article, on } = await request.json().catch(() => ({}))
      if (!article) return reply({ error: 'missing_article' }, 400)
      if (on) {
        await env.DB.prepare('INSERT OR IGNORE INTO news_bookmarks (article_id, user_id) VALUES (?,?)')
          .bind(article, user.id)
          .run()
      } else {
        await env.DB.prepare('DELETE FROM news_bookmarks WHERE article_id = ? AND user_id = ?')
          .bind(article, user.id)
          .run()
      }
      return reply({ ok: true, bookmarked: Boolean(on) })
    }

    if (url.pathname === '/api/comment' && request.method === 'POST') {
      const user = await currentUser(request, env)
      if (!user) return reply({ error: 'unauthorized' }, 401)
      const { article, body, parentId } = await request.json().catch(() => ({}))
      const text = String(body ?? '').trim()
      if (!article || !text) return reply({ error: 'missing_fields' }, 400)
      if (text.length > 1000) return reply({ error: 'too_long' }, 413)
      const id = `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
      await env.DB.prepare(
        'INSERT INTO news_comments (id, article_id, user_id, author_name, body, parent_id) VALUES (?,?,?,?,?,?)',
      )
        .bind(id, article, user.id, user.name, text, parentId ?? null)
        .run()
      return reply({
        ok: true,
        comment: {
          id,
          articleId: article,
          authorId: user.id,
          authorName: user.name,
          body: text,
          parentId: parentId ?? null,
          likes: 0,
          createdAt: new Date().toISOString(),
        },
      })
    }

    if (url.pathname === '/api/news') {      const items = await store(env).all(Math.min(Number(url.searchParams.get('limit') ?? 500), 500))
      return reply(
        { items, count: items.length },
        200,
        { 'cache-control': 'public, max-age=120, stale-while-revalidate=900' },
      )
    }

    if (url.pathname.startsWith('/api/news/')) {
      const slug = decodeURIComponent(url.pathname.slice('/api/news/'.length))
      const row = await store(env).bySlug(slug)
      if (!row) return reply({ error: 'not_found' }, 404)
      return reply(row, 200, { 'cache-control': 'public, max-age=300' })
    }

    // GitHub Actions topladığı haberleri buraya gönderir.
    if (url.pathname === '/api/collect' && request.method === 'POST') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      let payload
      try {
        payload = await request.json()
      } catch {
        return reply({ error: 'invalid_json' }, 400)
      }
      const items = Array.isArray(payload?.items) ? payload.items : []
      if (items.length === 0) return reply({ ok: true, inserted: 0, skipped: 0 })

      // D1 tek seferde en fazla 100 bağlı ifade kabul eder.
      const CHUNK = 50
      let inserted = 0
      let skipped = 0
      for (let i = 0; i < items.length; i += CHUNK) {
        const chunk = items.slice(i, i + CHUNK)
        const result = await store(env).upsert(chunk)
        inserted += result.inserted
        skipped += result.skipped
      }
      console.log(`[worker] ${inserted} yeni, ${skipped} tekrar`)
      return reply({ ok: true, inserted, skipped })
    }

    if (url.pathname === '/api/health') {
      const news = await env.DB?.prepare('SELECT COUNT(*) AS n FROM news').all()
      const images = await env.DB?.prepare('SELECT COUNT(*) AS n FROM images').all()
      return reply({
        ok: true,
        news: news?.results?.[0]?.n ?? 0,
        images: images?.results?.[0]?.n ?? 0,
        time: new Date().toISOString(),
      })
    }

    return reply({ error: 'not_found' }, 404)
  },
}

export { fromRow }
