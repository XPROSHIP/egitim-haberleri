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

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type, x-collect-secret',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
}

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS, ...extra },
  })

function store(env) {
  if (env.DB) return createD1Store(env.DB)
  return createMemoryStore()
}

const authorized = (request, env) => {
  const secret = request.headers.get('x-collect-secret')
  return Boolean(env.COLLECT_SECRET) && secret === env.COLLECT_SECRET
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

    // Haber görselleri
    if (url.pathname.startsWith('/img/')) {
      const key = decodeURIComponent(url.pathname.slice('/img/'.length))
      const row = await env.DB?.prepare('SELECT data, type FROM images WHERE key = ?')
        .bind(key)
        .first()
      if (!row?.data) return new Response('Not found', { status: 404 })
      return new Response(row.data, {
        headers: {
          'content-type': row.type ?? 'image/jpeg',
          'cache-control': 'public, max-age=31536000, immutable',
          ...CORS,
        },
      })
    }

    // Görsel yükleme (yalnızca toplayıcı)
    if (url.pathname === '/api/image' && request.method === 'POST') {
      if (!authorized(request, env)) return json({ error: 'unauthorized' }, 401)
      const key = url.searchParams.get('key') ?? ''
      if (!/^[\w.-]{1,120}$/.test(key)) return json({ error: 'invalid_key' }, 400)
      const type = request.headers.get('content-type') ?? 'image/jpeg'
      const data = new Uint8Array(await request.arrayBuffer())
      if (data.length === 0) return json({ error: 'empty' }, 400)
      if (data.length > 2_000_000) return json({ error: 'too_large' }, 413)

      await env.DB.prepare(
        `INSERT INTO images (key, data, type, bytes) VALUES (?,?,?,?)
         ON CONFLICT(key) DO UPDATE SET data=excluded.data, type=excluded.type, bytes=excluded.bytes`,
      )
        .bind(key, data, type, data.length)
        .run()
      return json({ ok: true, key, bytes: data.length })
    }

    if (url.pathname === '/api/news') {
      const items = await store(env).all(Math.min(Number(url.searchParams.get('limit') ?? 500), 500))
      return json(
        { items, count: items.length },
        200,
        { 'cache-control': 'public, max-age=120, stale-while-revalidate=900' },
      )
    }

    if (url.pathname.startsWith('/api/news/')) {
      const slug = decodeURIComponent(url.pathname.slice('/api/news/'.length))
      const row = await store(env).bySlug(slug)
      if (!row) return json({ error: 'not_found' }, 404)
      return json(row, 200, { 'cache-control': 'public, max-age=300' })
    }

    // GitHub Actions topladığı haberleri buraya gönderir.
    if (url.pathname === '/api/collect' && request.method === 'POST') {
      if (!authorized(request, env)) return json({ error: 'unauthorized' }, 401)
      let payload
      try {
        payload = await request.json()
      } catch {
        return json({ error: 'invalid_json' }, 400)
      }
      const items = Array.isArray(payload?.items) ? payload.items : []
      if (items.length === 0) return json({ ok: true, inserted: 0, skipped: 0 })

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
      return json({ ok: true, inserted, skipped })
    }

    if (url.pathname === '/api/health') {
      const news = await env.DB?.prepare('SELECT COUNT(*) AS n FROM news').all()
      const images = await env.DB?.prepare('SELECT COUNT(*) AS n FROM images').all()
      return json({
        ok: true,
        news: news?.results?.[0]?.n ?? 0,
        images: images?.results?.[0]?.n ?? 0,
        time: new Date().toISOString(),
      })
    }

    return json({ error: 'not_found' }, 404)
  },
}

export { fromRow }