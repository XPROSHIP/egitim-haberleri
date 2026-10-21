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
import {
  answer,
  listMessages,
  quotaOf,
  saveMessage,
  searchNews,
} from './src/assistant.js'

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

/** Kısa, kararlı karma (abonelik uç noktası için). */
function hashString(str = '') {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

/** Sistemin durumunu D1'de tutar: tetikleme basarisi, son toplama zamani.
    Boylece token bozulursa hatirlamak yerine site uyariyor. */
async function recordState(env, key, value) {
  try {
    await env.DB.prepare(
      `INSERT INTO system_state (key, value, updated_at) VALUES (?,?,datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')`,
    )
      .bind(key, JSON.stringify(value))
      .run()
  } catch (err) {
    console.error('[worker] durum yazilamadi', String(err?.message ?? err).slice(0, 100))
  }
}

async function readState(env, key) {
  try {
    const row = await env.DB.prepare('SELECT value, updated_at FROM system_state WHERE key = ?')
      .bind(key)
      .first()
    if (!row) return null
    return { ...JSON.parse(row.value), updatedAt: row.updated_at }
  } catch {
    return null
  }
}
/** GitHub iş akışını tetikler. Hata ayrıntısını döndürür. */
async function dispatchCollect(env) {
  if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) {
    return { ok: false, error: 'GITHUB_TOKEN veya GITHUB_REPO tanimli degil' }
  }
  try {
    const res = await fetch(
      `https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/collect.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.GITHUB_TOKEN}`,
          accept: 'application/vnd.github+json',
          // GitHub REST API'si User-Agent başlığı olmadan isteği reddediyor
          // ("Request forbidden by administrative rules").
          'user-agent': 'EgitimHaberleri-Worker',
          'x-github-api-version': '2022-11-28',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main' }),
      },
    )
    const detail = res.status === 204 ? '' : (await res.text()).slice(0, 300)
    console.log(`[worker] tetikleme -> HTTP ${res.status} ${detail}`)
    await recordState(env, 'dispatch', {
      ok: res.status === 204,
      status: res.status,
      error: detail || undefined,
      at: new Date().toISOString(),
    })
    return {
      ok: res.status === 204,
      status: res.status,
      error: res.status === 204 ? undefined : detail,
    }
  } catch (err) {
    const message = String(err?.message ?? err).slice(0, 200)
    console.error('[worker] tetikleme hatasi', message)
    await recordState(env, 'dispatch', { ok: false, error: message, at: new Date().toISOString() })
    return { ok: false, error: message }
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

    // Eski haberlerin sesleri depolama yerini kapmasin: 180 gunden eskisi silinir.
    try {
      const { meta } = await env.DB.prepare(
        "DELETE FROM news_audio WHERE created_at < datetime('now', '-180 days')",
      ).run()
      if (meta?.changes) console.log(`[worker] ${meta.changes} eski ses silindi`)
    } catch (err) {
      console.error('[worker] ses temizleme hatasi', String(err?.message ?? err).slice(0, 100))
    }

    await dispatchCollect(env)
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
    // Haber sesi (EMA Lightning ile üretilmiş MP3)
    if (url.pathname.startsWith('/api/audio/') && request.method === 'GET') {
      const id = decodeURIComponent(url.pathname.slice('/api/audio/'.length))
      const row = await env.DB?.prepare('SELECT data, type FROM news_audio WHERE article_id = ?')
        .bind(id)
        .first()
      const bytes = toBytes(row?.data)
      if (!bytes) return new Response('Not found', { status: 404 })
      return new Response(bytes, {
        headers: {
          'content-type': row?.type ?? 'audio/mpeg',
          'cache-control': 'public, max-age=31536000, immutable',
          ...corsFor(request),
        },
      })
    }

    // Ses yükleme (yalnızca toplayıcı)
    if (url.pathname === '/api/audio' && request.method === 'POST') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      const id = url.searchParams.get('id') ?? ''
      if (!id || id.length > 120) return reply({ error: 'invalid_id' }, 400)
      const data = new Uint8Array(await request.arrayBuffer())
      if (data.length === 0) return reply({ error: 'empty' }, 400)
      if (data.length > 6_500_000) return reply({ error: 'too_large' }, 413)
      const duration = Number(request.headers.get('x-audio-duration') ?? 0) || null
      // Üretildiği "okuma tarifi" sürümü: hangi sesler bayat, hangiler güncel
      // bununla bilinir.
      const recipe = (request.headers.get('x-audio-recipe') ?? '').slice(0, 64) || null
      await env.DB.prepare(
        `INSERT INTO news_audio (article_id, data, type, duration, bytes, recipe)
         VALUES (?,?,?,?,?,?)
         ON CONFLICT(article_id) DO UPDATE SET data=excluded.data, type=excluded.type,
           duration=excluded.duration, bytes=excluded.bytes, recipe=excluded.recipe`,
      )
        .bind(id, data, 'audio/mpeg', duration, data.length, recipe)
        .run()
      await env.DB.prepare('UPDATE news SET audio_id = ?, audio_duration = ? WHERE id = ?')
        .bind(id, duration, id)
        .run()
      // Haber kaydında da tutulur: bayat ses tespiti tek sorguda yapılır.
      await env.DB.prepare('UPDATE news SET audio_recipe = ? WHERE id = ?')
        .bind(recipe, id)
        .run()
      return reply({ ok: true, id, bytes: data.length, recipe })
    }

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

      const myCommentLikes = user
        ? (
            await env.DB.prepare(
              'SELECT comment_id FROM news_comment_likes WHERE user_id = ? AND comment_id IN (SELECT id FROM news_comments WHERE article_id = ?)',
            )
              .bind(user.id, article)
              .all()
          ).results.map((r) => r.comment_id)
        : []

      return reply({
        likes: likes.results.length,
        bookmarks: bookmarks.results.length,
        myLikes: [...myLikes],
        myBookmarks: [...myBookmarks],
        myCommentLikes,
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

    // Gerçek görüntülenme sayacı: haber sayfası açıldığça bir kez artar.
    if (url.pathname === '/api/view' && request.method === 'POST') {
      const { article } = await request.json().catch(() => ({}))
      if (!article) return reply({ error: 'missing_article' }, 400)
      await env.DB.prepare('UPDATE news SET views = views + 1 WHERE id = ?').bind(article).run()
      const row = await env.DB.prepare('SELECT views FROM news WHERE id = ?').bind(article).first()
      return reply({ ok: true, views: row?.views ?? 0 })
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
      const likes = results[0]?.n ?? 0
      // Haber kaydındaki sayaç da güncel kalsın (sıralama ve listeler için).
      await env.DB.prepare('UPDATE news SET likes = ? WHERE id = ?').bind(likes, article).run()
      return reply({ ok: true, likes, liked: Boolean(on) })
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

    if (url.pathname === '/api/comment-like' && request.method === 'POST') {
      const user = await currentUser(request, env)
      if (!user) return reply({ error: 'unauthorized' }, 401)
      const { comment, on } = await request.json().catch(() => ({}))
      if (!comment) return reply({ error: 'missing_comment' }, 400)
      if (on) {
        await env.DB.prepare('INSERT OR IGNORE INTO news_comment_likes (comment_id, user_id) VALUES (?,?)')
          .bind(comment, user.id)
          .run()
      } else {
        await env.DB.prepare('DELETE FROM news_comment_likes WHERE comment_id = ? AND user_id = ?')
          .bind(comment, user.id)
          .run()
      }
      // Sayaç gerçek beğeni kayıtlarından yeniden hesaplanır.
      const { results } = await env.DB.prepare(
        'SELECT COUNT(*) AS n FROM news_comment_likes WHERE comment_id = ?',
      )
        .bind(comment)
        .all()
      const likes = results?.[0]?.n ?? 0
      await env.DB.prepare('UPDATE news_comments SET likes = ? WHERE id = ?').bind(likes, comment).run()
      return reply({ ok: true, likes, liked: Boolean(on) })
    }

    /* ── ZEN Asistan ────────────────────────────────────────────────────── */
    if (url.pathname === '/api/assistant/history' && request.method === 'GET') {
      const user = await currentUser(request, env)
      if (!user) return reply({ error: 'unauthorized' }, 401)
      const [messages, quota] = await Promise.all([
        listMessages(env, user.id),
        quotaOf(env, user.id),
      ])
      return reply({ messages, quota })
    }

    if (url.pathname === '/api/assistant' && request.method === 'POST') {
      const user = await currentUser(request, env)
      if (!user) return reply({ error: 'unauthorized' }, 401)
      const payload = await request.json().catch(() => ({}))
      const question = String(payload?.question ?? '').trim()
      if (!question) return reply({ error: 'missing_question' }, 400)

      const quota = await quotaOf(env, user.id)
      if (quota.remaining <= 0) return reply({ error: 'quota', quota }, 429)

      const history = await listMessages(env, user.id)
      const archive = await searchNews(env, question)
      const result = await answer(env, question, history, archive)
      if (!result.text) {
        console.error('[assistant] yanit alinamadi:', String(result.error ?? '').slice(0, 160))
        return reply({ error: 'model_hatasi' }, 502)
      }
      await bumpQuota(env, user.id)
      await saveMessage(env, user.id, 'user', question)
      await saveMessage(env, user.id, 'assistant', result.text, result.sources)
      const after = await quotaOf(env, user.id)
      return reply({ text: result.text, sources: result.sources, quota: after })
    }

    /* ── Sistem durumu (operatör için; ziyaretçi arayüzüne dokunmaz) ── */
    if (url.pathname === '/api/state/audio' && request.method === 'POST') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      const payload = await request.json().catch(() => ({}))
      await recordState(env, 'audio', payload)
      return reply({ ok: true })
    }

    // Gerçek görüntülenme sayacı — çerezsiz, kimlik tutmaz.
    if (url.pathname === '/api/track/stats' && request.method === 'GET') {
      const days = Math.min(Number(url.searchParams.get('days') ?? 14), 90)
      const total = await env.DB.prepare('SELECT COUNT(*) AS n FROM page_views').first()
      const recent = await env.DB.prepare(
        `SELECT day, SUM(count) AS n FROM page_views
         WHERE day >= date('now', ?) GROUP BY day ORDER BY day ASC`,
      )
        .bind(`-${days} days`)
        .all()
      const top = await env.DB.prepare(
        `SELECT path, SUM(count) AS n FROM page_views
         WHERE day >= date('now', '-30 days') GROUP BY path ORDER BY n DESC LIMIT 25`,
      ).all()
      return reply({
        ok: true,
        total: total?.n ?? 0,
        days: recent?.results ?? [],
        top: top?.results ?? [],
      })
    }

    /* ── Kullanıcı ilgi alanları ("Sana Özel" akışı) ─────────────────── */
    if (url.pathname === '/api/interest' && request.method === 'GET') {
      const user = await currentUser(request, env)
      if (!user) return reply({ error: 'unauthorized' }, 401)
      const rows = await env.DB.prepare(
        'SELECT kind, value, weight FROM user_interests WHERE user_id = ? ORDER BY weight DESC LIMIT 60',
      )
        .bind(user.id)
        .all()
      return reply({ interests: rows?.results ?? [] })
    }

    if (url.pathname === '/api/interest' && request.method === 'POST') {
      const user = await currentUser(request, env)
      if (!user) return reply({ error: 'unauthorized' }, 401)
      const { kind, value, delta } = await request.json().catch(() => ({}))
      const k = String(kind ?? '').slice(0, 20)
      const v = String(value ?? '').slice(0, 80)
      if (!k || !v) return reply({ error: 'missing_fields' }, 400)
      const d = Math.max(-1, Math.min(1, Number(delta ?? 1)))
      await env.DB.prepare(
        `INSERT INTO user_interests (user_id, kind, value, weight, updated_at)
         VALUES (?,?,?,?, datetime('now'))
         ON CONFLICT(user_id, kind, value) DO UPDATE SET
           weight = MAX(-5, MIN(5, user_interests.weight + ?)),
           updated_at = datetime('now')`,
      )
        .bind(user.id, k, v, d, d)
        .run()
      return reply({ ok: true })
    }

    /* ── Web push ────────────────────────────────────────────────────── */
    if (url.pathname === '/api/push/key' && request.method === 'GET') {
      return reply({ ok: true, publicKey: env.VAPID_PUBLIC_KEY ?? '' })
    }

    if (url.pathname === '/api/push/subscribe' && request.method === 'POST') {
      const user = await currentUser(request, env)
      const { endpoint, keys, categories } = await request.json().catch(() => ({}))
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return reply({ error: 'missing_fields' }, 400)
      }
      const id = `p_${hashString(endpoint).slice(0, 16)}`
      await env.DB.prepare(
        `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, categories)
         VALUES (?,?,?,?,?,?)
         ON CONFLICT(endpoint) DO UPDATE SET
           user_id=excluded.user_id, p256dh=excluded.p256dh, auth=excluded.auth,
           categories=excluded.categories`,
      )
        .bind(
          id,
          user?.id ?? null,
          String(endpoint).slice(0, 500),
          String(keys.p256dh).slice(0, 200),
          String(keys.auth).slice(0, 100),
          JSON.stringify(Array.isArray(categories) ? categories.slice(0, 12) : []).slice(0, 300),
        )
        .run()
      return reply({ ok: true, id })
    }

    if (url.pathname === '/api/push/unsubscribe' && request.method === 'POST') {
      const { endpoint } = await request.json().catch(() => ({}))
      if (!endpoint) return reply({ error: 'missing_fields' }, 400)
      await env.DB.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?')
        .bind(String(endpoint).slice(0, 500))
        .run()
      return reply({ ok: true })
    }

    // Abone listesi ve VAPID bilgisi yalnızca toplayıcı (CI) için.
    if (url.pathname === '/api/push/subscribers' && request.method === 'GET') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      const rows = await env.DB.prepare(
        'SELECT endpoint, p256dh, auth, categories FROM push_subscriptions',
      ).all()
      return reply({
        ok: true,
        publicKey: env.VAPID_PUBLIC_KEY ?? '',
        privateKey: env.VAPID_PRIVATE_KEY ?? '',
        subscribers: (rows?.results ?? []).map((r) => ({
          endpoint: r.endpoint,
          keys: { p256dh: r.p256dh, auth: r.auth },
          categories: r.categories ? JSON.parse(r.categories) : [],
        })),
      })
    }

    /* ── ZENPOD Eğitim bölümleri ────────────────────────────────────── */
    if (url.pathname === '/api/podcast/episode' && request.method === 'POST') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      const { id, title, description, duration } = await request.json().catch(() => ({}))
      if (!id || !title) return reply({ error: 'missing_fields' }, 400)
      await env.DB.prepare(
        `INSERT INTO podcast_episodes (id, title, description, audio_id, duration)
         VALUES (?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET title=excluded.title, description=excluded.description,
           audio_id=excluded.audio_id, duration=excluded.duration`,
      )
        .bind(
          String(id).slice(0, 80),
          String(title).slice(0, 200),
          String(description ?? '').slice(0, 2000),
          String(id).slice(0, 80),
          Number(duration ?? 0) || null,
        )
        .run()
      return reply({ ok: true, id })
    }

    if (url.pathname === '/api/podcast/episodes' && request.method === 'GET') {
      const rows = await env.DB.prepare(
        'SELECT id, title, description, duration, published_at FROM podcast_episodes ORDER BY published_at DESC LIMIT 30',
      ).all()
      return reply({ episodes: rows?.results ?? [] })
    }

    // Geriye dönük metin doldurma: eski haberlerin kısa gövdesi kaynak
    // sayfadan yeniden çekilip tam metinle değiştirilir.
    if (url.pathname === '/api/refill' && request.method === 'POST') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      const payload = await request.json().catch(() => ({}))
      const items = Array.isArray(payload?.items) ? payload.items : []
      if (items.length === 0) return reply({ ok: true, updated: 0 })
      let updated = 0
      for (const it of items.slice(0, 100)) {
        const body = Array.isArray(it.body) ? it.body.filter((p) => typeof p === 'string') : []
        if (!it.slug || body.length === 0) continue
        const res = await env.DB.prepare(
          'UPDATE news SET body = ?, full_text = ?, excerpt = COALESCE(?, excerpt) WHERE slug = ?',
        )
          .bind(JSON.stringify(body), body.length >= 2 ? 1 : 0, it.excerpt ?? null, it.slug)
          .run()
        updated += res?.meta?.changes ?? 0
      }
      return reply({ ok: true, updated })
    }

    // Tetikleme testi / elle tetikleme (COLLECT_SECRET korumalı)
    if (url.pathname === '/api/trigger' && request.method === 'POST') {
      if (!authorized(request, env)) return reply({ error: 'unauthorized' }, 401)
      const result = await dispatchCollect(env)
      return reply(result, result.ok ? 200 : 502)
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
      await recordState(env, 'collect', {
        ok: true,
        inserted,
        skipped,
        at: new Date().toISOString(),
      })
      return reply({ ok: true, inserted, skipped })
    }

    if (url.pathname === '/api/health') {
      const news = await env.DB?.prepare('SELECT COUNT(*) AS n FROM news').all()
      const images = await env.DB?.prepare('SELECT COUNT(*) AS n FROM images').all()
      const dispatch = await readState(env, 'dispatch')
      const collect = await readState(env, 'collect')
      // Ses üretim durumu operatör içindir; ziyaretçi arayüzü göstermez.
      const audio = await readState(env, 'audio')
      return reply({
        ok: true,
        news: news?.results?.[0]?.n ?? 0,
        images: images?.results?.[0]?.n ?? 0,
        // Otomasyon durumu: erişim anahtarı bozulursa site bunu gösterir.
        automation: { dispatch, collect },
        // Ses üretim durumu operatör içindir (ziyaretçi arayüzü göstermez).
        audio,
        time: new Date().toISOString(),
      })
    }

    return reply({ error: 'not_found' }, 404)
  },
}

export { fromRow }
