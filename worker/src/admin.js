/**
 * Yönetici Paneli (/admin) Arka Uç Uç Noktaları
 *
 * Tüm mutasyon uç noktaları HMAC-SHA256 imzalı oturum belirteci ile korunur.
 * Yanlış şifre denemelerinde IP bazlı 60 saniyelik sunucu kilidi uygulanır.
 */

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000
const LOCK_MS = 60 * 1000

const TR_MAP = {
  ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i',
  ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
}

function slugifyTr(text) {
  return String(text || '')
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (ch) => TR_MAP[ch] || ch)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'haber'
}

function normSearch(text) {
  return String(text || '')
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (ch) => TR_MAP[ch] || ch)
    .replace(/['’`".,;:!?()\[\]{}\-–—/\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchesSearch(qNorm, qCompact, ...fields) {
  if (!qNorm) return true
  for (const f of fields) {
    const nf = normSearch(f)
    if (nf.includes(qNorm)) return true
    if (qCompact && nf.replace(/\s+/g, '').includes(qCompact)) return true
  }
  return false
}

function toBase64Url(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4)
  const bin = atob(padded)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function getHmacKey(env) {
  const raw = env.ADMIN_TOKEN_SECRET || env.COLLECT_SECRET || env.SUPABASE_ANON_KEY || 'eh-admin-hmac-key-2027'
  return await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(raw),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function signAdminToken(env) {
  const payload = { role: 'admin', iat: Date.now(), exp: Date.now() + TOKEN_TTL_MS }
  const data = new TextEncoder().encode(JSON.stringify(payload))
  const key = await getHmacKey(env)
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, data))
  return { token: `${toBase64Url(data)}.${toBase64Url(sig)}`, expiresAt: payload.exp }
}

export async function verifyAdminToken(request, env) {
  const headerToken = request.headers.get('x-admin-token') || ''
  const auth = request.headers.get('authorization') || ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  const token = headerToken || bearer
  if (!token || !token.includes('.')) return false

  try {
    const [payloadB64, sigB64] = token.split('.', 2)
    const data = fromBase64Url(payloadB64)
    const sig = fromBase64Url(sigB64)
    const key = await getHmacKey(env)
    const ok = await crypto.subtle.verify('HMAC', key, sig, data)
    if (!ok) return false
    const parsed = JSON.parse(new TextDecoder().decode(data))
    return parsed?.role === 'admin' && typeof parsed.exp === 'number' && parsed.exp > Date.now()
  } catch {
    return false
  }
}

function parseBodyParagraphs(bodyInput) {
  if (Array.isArray(bodyInput)) {
    return bodyInput.map((p) => String(p).trim()).filter(Boolean)
  }
  if (typeof bodyInput === 'string') {
    return bodyInput
      .split(/\r?\n\s*\r?\n|\r?\n/)
      .map((p) => p.trim())
      .filter(Boolean)
  }
  return []
}

function parseTags(tagsInput) {
  if (Array.isArray(tagsInput)) {
    return tagsInput.map((t) => String(t).trim()).filter(Boolean)
  }
  if (typeof tagsInput === 'string') {
    return tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  }
  return []
}

function safeJsonParse(raw, fallback) {
  if (typeof raw !== 'string') return raw ?? fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

async function deleteNewsRelated(env, ids, getAudioDbs, getImageDbs) {
  if (!ids || ids.length === 0) return
  const placeholders = ids.map(() => '?').join(',')

  // İlişkili /img/... kapak görsellerini topla
  const imgKeys = []
  try {
    const { results } = await env.DB.prepare(`SELECT source_image FROM news WHERE id IN (${placeholders})`)
      .bind(...ids)
      .all()
    for (const r of results || []) {
      if (typeof r.source_image === 'string' && r.source_image.startsWith('/img/')) {
        imgKeys.push(r.source_image.slice('/img/'.length))
      }
    }
  } catch {}

  for (const tbl of ['news_likes', 'news_bookmarks', 'news_comments', 'news']) {
    try {
      const col = tbl === 'news' ? 'id' : 'article_id'
      await env.DB.prepare(`DELETE FROM ${tbl} WHERE ${col} IN (${placeholders})`).bind(...ids).run()
    } catch {}
  }

  for (const adb of getAudioDbs(env)) {
    try {
      await adb.prepare(`DELETE FROM news_audio WHERE article_id IN (${placeholders})`).bind(...ids).run()
    } catch {}
  }

  if (imgKeys.length > 0) {
    const imgMarks = imgKeys.map(() => '?').join(',')
    for (const idb of getImageDbs(env)) {
      try {
        await idb.prepare(`DELETE FROM images WHERE key IN (${imgMarks})`).bind(...imgKeys).run()
      } catch {}
    }
  }
}

export async function handleAdminRequest(request, env, url, reply, helpers) {
  const { getAudioDbs, getImageDbs, getGazeteler } = helpers
  const path = url.pathname

  /* ── 1. Giriş ve 60 sn Sunucu Kilidi ─────────────────────────────────── */
  if (path === '/api/admin/login' && request.method === 'POST') {
    const ip = request.headers.get('cf-connecting-ip') || 'unknown'
    const lockKey = `admin_lock_${ip}`

    try {
      const lockRow = await env.DB.prepare('SELECT value FROM system_settings WHERE key = ?').bind(lockKey).first()
      if (lockRow?.value) {
        const until = Number(lockRow.value)
        if (until > Date.now()) {
          const retryAfterSec = Math.ceil((until - Date.now()) / 1000)
          return reply({ ok: false, error: 'locked', retryAfterSec }, 429)
        }
      }
    } catch {}

    let body = {}
    try {
      body = await request.json()
    } catch {}
    const submitted = String(body?.password ?? '').trim()
    const expected = String(env.ADMIN_PASS || '7041').trim()

    if (!submitted || submitted !== expected) {
      const until = Date.now() + LOCK_MS
      try {
        await env.DB.prepare(
          `INSERT INTO system_settings (key, value) VALUES (?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        )
          .bind(lockKey, String(until))
          .run()
      } catch {}
      return reply({ ok: false, error: 'wrong_password', retryAfterSec: 60 }, 401)
    }

    try {
      await env.DB.prepare('DELETE FROM system_settings WHERE key = ?').bind(lockKey).run()
    } catch {}

    const { token, expiresAt } = await signAdminToken(env)
    return reply({ ok: true, token, expiresAt }, 200, { 'cache-control': 'no-store' })
  }

  /* ── Tüm diğer /api/admin/* uç noktaları token gerektirir ──────────────── */
  const isAuthed = await verifyAdminToken(request, env)
  if (!isAuthed) {
    return reply({ error: 'unauthorized' }, 401, { 'cache-control': 'no-store' })
  }

  /* ── 2. Durum Özeti ─────────────────────────────────────────────────── */
  if (path === '/api/admin/status' && request.method === 'GET') {
    const [newsAll, newsPub, newsDraft, colAll, comAll, visitRow] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) AS n FROM news').first(),
      env.DB.prepare("SELECT COUNT(*) AS n FROM news WHERE status = 'published'").first(),
      env.DB.prepare("SELECT COUNT(*) AS n FROM news WHERE status != 'published'").first(),
      env.DB.prepare('SELECT COUNT(*) AS n FROM column_articles').first().catch(() => ({ n: 0 })),
      env.DB.prepare('SELECT COUNT(*) AS n FROM news_comments').first().catch(() => ({ n: 0 })),
      env.DB.prepare("SELECT value FROM system_settings WHERE key = 'site_visit_count'").first().catch(() => null),
    ])
    return reply({
      ok: true,
      newsTotal: Number(newsAll?.n ?? 0),
      newsPublished: Number(newsPub?.n ?? 0),
      newsDraft: Number(newsDraft?.n ?? 0),
      columnsTotal: Number(colAll?.n ?? 0),
      commentsTotal: Number(comAll?.n ?? 0),
      visitCount: Number(visitRow?.value ?? 0),
    })
  }

  /* ── 3. Görsel Yükleme (DB_IMAGES) ──────────────────────────────────── */
  if (path === '/api/admin/image' && request.method === 'POST') {
    const contentType = request.headers.get('content-type') || 'image/jpeg'
    const extMap = {
      'image/png': 'png',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
    }
    const ext = extMap[contentType.split(';')[0].trim().toLowerCase()] || 'jpg'
    const key = `admin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`
    const data = new Uint8Array(await request.arrayBuffer())
    if (data.length === 0) return reply({ error: 'empty' }, 400)
    if (data.length > 2_000_000) return reply({ error: 'too_large' }, 413)

    await env.DB_IMAGES.prepare(
      `INSERT INTO images (key, data, type, bytes) VALUES (?,?,?,?)
       ON CONFLICT(key) DO UPDATE SET data=excluded.data, type=excluded.type, bytes=excluded.bytes`,
    )
      .bind(key, data, contentType, data.length)
      .run()

    return reply({ ok: true, key, url: `/img/${key}`, bytes: data.length })
  }

  /* ── 4. eGazete Önbelleği Yenileme ──────────────────────────────────── */
  if (path === '/api/admin/refresh-gazeteler' && request.method === 'POST') {
    const data = await getGazeteler(env, true)
    return reply({
      ok: true,
      tamSayi: data?.tam_sayi?.length ?? 0,
      dergiler: data?.dergiler?.length ?? 0,
    })
  }

  /* ── 5. Haberler CRUD ───────────────────────────────────────────────── */
  if (path === '/api/admin/news' && request.method === 'GET') {
    const q = (url.searchParams.get('q') || '').trim()
    const qNorm = normSearch(q)
    const qCompact = qNorm.replace(/\s+/g, '')
    const category = (url.searchParams.get('category') || '').trim()
    const status = (url.searchParams.get('status') || '').trim()
    const featured = (url.searchParams.get('featured') || '').trim()
    const limit = Math.min(Math.max(1, Number(url.searchParams.get('limit') || 150)), 5000)
    const offset = Math.max(Number(url.searchParams.get('offset') || 0), 0)

    const where = []
    const binds = []
    if (category) {
      where.push('category = ?')
      binds.push(category)
    }
    if (status === 'published') {
      where.push("status = 'published'")
    } else if (status === 'draft') {
      where.push("(status != 'published' OR status IS NULL)")
    }
    if (featured === '1') {
      where.push('featured = 1')
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    let rows = []
    let total = 0

    if (qNorm) {
      const listSql = `
        SELECT id, slug, title, category, published_at, views, likes, featured, status,
               source_name, source_url, source_image
        FROM news ${whereSql}
        ORDER BY published_at DESC
      `
      const res = binds.length ? await env.DB.prepare(listSql).bind(...binds).all() : await env.DB.prepare(listSql).all()
      const filtered = (res?.results || []).filter((r) => matchesSearch(qNorm, qCompact, r.title, r.source_name, r.slug))
      total = filtered.length
      rows = filtered.slice(offset, offset + limit)
    } else {
      const countStmt = env.DB.prepare(`SELECT COUNT(*) AS total FROM news ${whereSql}`)
      const countRow = binds.length ? await countStmt.bind(...binds).first() : await countStmt.first()
      total = Number(countRow?.total ?? 0)
      const listSql = `
        SELECT id, slug, title, category, published_at, views, likes, featured, status,
               source_name, source_url, source_image
        FROM news ${whereSql}
        ORDER BY published_at DESC
        LIMIT ? OFFSET ?
      `
      const { results } = await env.DB.prepare(listSql).bind(...binds, limit, offset).all()
      rows = results || []
    }

    return reply({
      items: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        category: r.category,
        publishedAt: r.published_at,
        views: r.views ?? 0,
        likes: r.likes ?? 0,
        featured: Boolean(r.featured),
        status: r.status || 'published',
        sourceName: r.source_name || '',
        sourceUrl: r.source_url || '',
        sourceImage: r.source_image || '',
      })),
      total,
    })
  }

  if (path === '/api/admin/news' && request.method === 'POST') {
    const body = await request.json().catch(() => null)
    const title = String(body?.title ?? '').trim()
    if (!title) return reply({ error: 'title_required' }, 400)

    const suffix = Math.random().toString(36).slice(2, 7)
    const id = `manual_${Date.now()}_${suffix}`
    const slug = `${slugifyTr(title)}-${suffix}`
    const paragraphs = parseBodyParagraphs(body?.body)
    const excerpt = String(body?.excerpt ?? '').trim() || (paragraphs[0] ? paragraphs[0].slice(0, 220) : '')
    const category = String(body?.category ?? '').trim() || 'gundem'
    const tags = parseTags(body?.tags)
    const sourceName = String(body?.sourceName ?? '').trim()
    const sourceUrl = String(body?.sourceUrl ?? '').trim()
    const sourceImage = String(body?.sourceImage ?? '').trim() || null
    const publishedAt = String(body?.publishedAt ?? '').trim() || new Date().toISOString()
    const featured = body?.featured ? 1 : 0
    const status = body?.status === 'draft' ? 'draft' : 'published'
    const province = String(body?.province ?? '').trim() || null

    await env.DB.prepare(
      `INSERT INTO news (
        id, slug, title, excerpt, body, category, tags, source_name, source_url,
        source_image, published_at, views, likes, featured, province, score,
        dedupe_key, status, raw_title, full_text, lang
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
      .bind(
        id,
        slug,
        title,
        excerpt,
        JSON.stringify(paragraphs),
        category,
        JSON.stringify(tags),
        sourceName,
        sourceUrl,
        sourceImage,
        publishedAt,
        0,
        0,
        featured,
        province,
        featured ? 100 : 10,
        `manual:${id}`,
        status,
        title,
        paragraphs.length > 0 ? 1 : 0,
        'tr',
      )
      .run()

    return reply({ ok: true, id, slug }, 201)
  }

  if (path === '/api/admin/news/bulk' && request.method === 'POST') {
    const body = await request.json().catch(() => null)
    const ids = Array.isArray(body?.ids) ? body.ids.map(String).filter(Boolean) : []
    const action = String(body?.action || '')
    if (ids.length === 0) return reply({ error: 'no_ids' }, 400)

    const marks = ids.map(() => '?').join(',')
    if (action === 'delete') {
      await deleteNewsRelated(env, ids, getAudioDbs, getImageDbs)
    } else if (action === 'publish') {
      await env.DB.prepare(`UPDATE news SET status = 'published' WHERE id IN (${marks})`).bind(...ids).run()
    } else if (action === 'draft') {
      await env.DB.prepare(`UPDATE news SET status = 'draft' WHERE id IN (${marks})`).bind(...ids).run()
    } else if (action === 'feature') {
      await env.DB.prepare(`UPDATE news SET featured = 1 WHERE id IN (${marks})`).bind(...ids).run()
    } else if (action === 'unfeature') {
      await env.DB.prepare(`UPDATE news SET featured = 0 WHERE id IN (${marks})`).bind(...ids).run()
    } else if (action === 'category' && body?.category) {
      await env.DB.prepare(`UPDATE news SET category = ? WHERE id IN (${marks})`)
        .bind(String(body.category), ...ids)
        .run()
    } else {
      return reply({ error: 'invalid_action' }, 400)
    }

    return reply({ ok: true, affected: ids.length })
  }

  if (path.startsWith('/api/admin/news/')) {
    const id = decodeURIComponent(path.slice('/api/admin/news/'.length))
    if (!id) return reply({ error: 'missing_id' }, 400)

    if (request.method === 'GET') {
      const row = await env.DB.prepare('SELECT * FROM news WHERE id = ? OR slug = ?').bind(id, id).first()
      if (!row) return reply({ error: 'not_found' }, 404)
      return reply({
        id: row.id,
        slug: row.slug,
        title: row.title,
        excerpt: row.excerpt || '',
        body: safeJsonParse(row.body, []),
        category: row.category || 'gundem',
        tags: safeJsonParse(row.tags, []),
        sourceName: row.source_name || '',
        sourceUrl: row.source_url || '',
        sourceImage: row.source_image || '',
        publishedAt: row.published_at || '',
        views: row.views ?? 0,
        likes: row.likes ?? 0,
        featured: Boolean(row.featured),
        province: row.province || '',
        status: row.status || 'published',
      })
    }

    if (request.method === 'PUT' || request.method === 'PATCH') {
      const existing = await env.DB.prepare('SELECT * FROM news WHERE id = ?').bind(id).first()
      if (!existing) return reply({ error: 'not_found' }, 404)
      const body = await request.json().catch(() => null)
      if (!body) return reply({ error: 'invalid_json' }, 400)

      const title = body.title !== undefined ? String(body.title).trim() : existing.title
      if (!title) return reply({ error: 'title_required' }, 400)
      const paragraphs = body.body !== undefined ? parseBodyParagraphs(body.body) : safeJsonParse(existing.body, [])
      const excerpt = body.excerpt !== undefined ? String(body.excerpt).trim() : (existing.excerpt || '')
      const category = body.category !== undefined ? (String(body.category).trim() || 'gundem') : existing.category
      const tags = body.tags !== undefined ? parseTags(body.tags) : safeJsonParse(existing.tags, [])
      const sourceName = body.sourceName !== undefined ? String(body.sourceName).trim() : (existing.source_name || '')
      const sourceUrl = body.sourceUrl !== undefined ? String(body.sourceUrl).trim() : (existing.source_url || '')
      const sourceImage = body.sourceImage !== undefined ? (String(body.sourceImage).trim() || null) : existing.source_image
      const publishedAt = body.publishedAt !== undefined ? (String(body.publishedAt).trim() || existing.published_at) : existing.published_at
      const featured = body.featured !== undefined ? (body.featured ? 1 : 0) : existing.featured
      const status = body.status !== undefined ? (body.status === 'draft' ? 'draft' : 'published') : existing.status
      const province = body.province !== undefined ? (String(body.province).trim() || null) : existing.province

      await env.DB.prepare(
        `UPDATE news SET
          title = ?, excerpt = ?, body = ?, category = ?, tags = ?,
          source_name = ?, source_url = ?, source_image = ?, published_at = ?,
          featured = ?, status = ?, province = ?, full_text = ?
         WHERE id = ?`,
      )
        .bind(
          title,
          excerpt,
          JSON.stringify(paragraphs),
          category,
          JSON.stringify(tags),
          sourceName,
          sourceUrl,
          sourceImage,
          publishedAt,
          featured,
          status,
          province,
          paragraphs.length > 0 ? 1 : 0,
          id,
        )
        .run()

      return reply({ ok: true, id })
    }

    if (request.method === 'DELETE') {
      await deleteNewsRelated(env, [id], getAudioDbs, getImageDbs)
      return reply({ ok: true, id })
    }
  }

  /* ── 6. Köşe Yazıları CRUD ──────────────────────────────────────────── */
  if (path === '/api/admin/columns' && request.method === 'GET') {
    const q = (url.searchParams.get('q') || '').trim()
    const qNorm = normSearch(q)
    const qCompact = qNorm.replace(/\s+/g, '')
    const author = (url.searchParams.get('author') || '').trim()
    const limit = Math.min(Math.max(1, Number(url.searchParams.get('limit') || 150)), 5000)
    const offset = Math.max(Number(url.searchParams.get('offset') || 0), 0)

    const where = []
    const binds = []
    if (author) {
      where.push('author_name = ?')
      binds.push(author)
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    let rows = []
    let total = 0

    if (qNorm) {
      const listSql = `
        SELECT id, slug, title, author_name, author_image, author_title, source_name,
               published_at, views, likes
        FROM column_articles ${whereSql}
        ORDER BY published_at DESC
      `
      const res = binds.length ? await env.DB.prepare(listSql).bind(...binds).all() : await env.DB.prepare(listSql).all()
      const filtered = (res?.results || []).filter((r) => matchesSearch(qNorm, qCompact, r.title, r.author_name, r.source_name, r.slug))
      total = filtered.length
      rows = filtered.slice(offset, offset + limit)
    } else {
      const countStmt = env.DB.prepare(`SELECT COUNT(*) AS total FROM column_articles ${whereSql}`)
      const countRow = binds.length ? await countStmt.bind(...binds).first() : await countStmt.first()
      total = Number(countRow?.total ?? 0)
      const listSql = `
        SELECT id, slug, title, author_name, author_image, author_title, source_name,
               published_at, views, likes
        FROM column_articles ${whereSql}
        ORDER BY published_at DESC
        LIMIT ? OFFSET ?
      `
      const { results } = await env.DB.prepare(listSql).bind(...binds, limit, offset).all()
      rows = results || []
    }

    return reply({
      items: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        authorName: r.author_name || '',
        authorImage: r.author_image || '',
        authorTitle: r.author_title || '',
        sourceName: r.source_name || '',
        publishedAt: r.published_at || '',
        views: r.views ?? 0,
        likes: r.likes ?? 0,
      })),
      total,
    })
  }

  if (path === '/api/admin/columns' && request.method === 'POST') {
    const body = await request.json().catch(() => null)
    const title = String(body?.title ?? '').trim()
    if (!title) return reply({ error: 'title_required' }, 400)

    const suffix = Math.random().toString(36).slice(2, 7)
    const id = `col_manual_${Date.now()}_${suffix}`
    const slug = `${slugifyTr(title)}-${suffix}`
    const authorName = String(body?.authorName ?? '').trim() || 'Editör'
    const authorImage = String(body?.authorImage ?? '').trim() || null
    const authorTitle = String(body?.authorTitle ?? '').trim() || null
    const sourceName = String(body?.sourceName ?? '').trim() || 'Eğitim Haberleri'
    const sourceUrl = String(body?.sourceUrl ?? '').trim()
    const paragraphs = parseBodyParagraphs(body?.body)
    const excerpt = String(body?.excerpt ?? '').trim() || (paragraphs[0] ? paragraphs[0].slice(0, 220) : '')
    const publishedAt = String(body?.publishedAt ?? '').trim() || new Date().toISOString()
    const tags = parseTags(body?.tags)

    await env.DB.prepare(
      `INSERT INTO column_articles (
        id, slug, title, author_name, author_image, author_title, source_name, source_url,
        excerpt, body, published_at, views, likes, lang, original_lang, translated, tags, dedupe_key
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
      .bind(
        id,
        slug,
        title,
        authorName,
        authorImage,
        authorTitle,
        sourceName,
        sourceUrl,
        excerpt,
        JSON.stringify(paragraphs),
        publishedAt,
        0,
        0,
        'tr',
        'tr',
        0,
        JSON.stringify(tags),
        `col_manual:${id}`,
      )
      .run()

    return reply({ ok: true, id, slug }, 201)
  }

  if (path === '/api/admin/columns/bulk' && request.method === 'POST') {
    const body = await request.json().catch(() => null)
    const ids = Array.isArray(body?.ids) ? body.ids.map(String).filter(Boolean) : []
    if (ids.length === 0) return reply({ error: 'no_ids' }, 400)
    if (body?.action === 'delete') {
      const marks = ids.map(() => '?').join(',')
      await env.DB.prepare(`DELETE FROM column_articles WHERE id IN (${marks})`).bind(...ids).run()
      return reply({ ok: true, affected: ids.length })
    }
    return reply({ error: 'invalid_action' }, 400)
  }

  if (path.startsWith('/api/admin/columns/')) {
    const id = decodeURIComponent(path.slice('/api/admin/columns/'.length))
    if (!id) return reply({ error: 'missing_id' }, 400)

    if (request.method === 'GET') {
      const row = await env.DB.prepare('SELECT * FROM column_articles WHERE id = ? OR slug = ?').bind(id, id).first()
      if (!row) return reply({ error: 'not_found' }, 404)
      return reply({
        id: row.id,
        slug: row.slug,
        title: row.title,
        authorName: row.author_name || '',
        authorImage: row.author_image || '',
        authorTitle: row.author_title || '',
        sourceName: row.source_name || '',
        sourceUrl: row.source_url || '',
        excerpt: row.excerpt || '',
        body: safeJsonParse(row.body, []),
        publishedAt: row.published_at || '',
        tags: safeJsonParse(row.tags, []),
        views: row.views ?? 0,
        likes: row.likes ?? 0,
      })
    }

    if (request.method === 'PUT' || request.method === 'PATCH') {
      const existing = await env.DB.prepare('SELECT * FROM column_articles WHERE id = ?').bind(id).first()
      if (!existing) return reply({ error: 'not_found' }, 404)
      const body = await request.json().catch(() => null)
      if (!body) return reply({ error: 'invalid_json' }, 400)

      const title = body.title !== undefined ? String(body.title).trim() : existing.title
      if (!title) return reply({ error: 'title_required' }, 400)
      const authorName = body.authorName !== undefined ? (String(body.authorName).trim() || 'Editör') : existing.author_name
      const authorImage = body.authorImage !== undefined ? (String(body.authorImage).trim() || null) : existing.author_image
      const authorTitle = body.authorTitle !== undefined ? (String(body.authorTitle).trim() || null) : existing.author_title
      const sourceName = body.sourceName !== undefined ? String(body.sourceName).trim() : (existing.source_name || '')
      const sourceUrl = body.sourceUrl !== undefined ? String(body.sourceUrl).trim() : (existing.source_url || '')
      const paragraphs = body.body !== undefined ? parseBodyParagraphs(body.body) : safeJsonParse(existing.body, [])
      const excerpt = body.excerpt !== undefined ? String(body.excerpt).trim() : (existing.excerpt || '')
      const publishedAt = body.publishedAt !== undefined ? (String(body.publishedAt).trim() || existing.published_at) : existing.published_at
      const tags = body.tags !== undefined ? parseTags(body.tags) : safeJsonParse(existing.tags, [])

      await env.DB.prepare(
        `UPDATE column_articles SET
          title = ?, author_name = ?, author_image = ?, author_title = ?,
          source_name = ?, source_url = ?, excerpt = ?, body = ?,
          published_at = ?, tags = ?
         WHERE id = ?`,
      )
        .bind(
          title,
          authorName,
          authorImage,
          authorTitle,
          sourceName,
          sourceUrl,
          excerpt,
          JSON.stringify(paragraphs),
          publishedAt,
          JSON.stringify(tags),
          id,
        )
        .run()

      return reply({ ok: true, id })
    }

    if (request.method === 'DELETE') {
      await env.DB.prepare('DELETE FROM column_articles WHERE id = ?').bind(id).run()
      return reply({ ok: true, id })
    }
  }

  /* ── 7. Yorumlar (news_comments) ──────────────────────────────────── */
  if (path === '/api/admin/comments' && request.method === 'GET') {
    const q = (url.searchParams.get('q') || '').trim()
    const qNorm = normSearch(q)
    const qCompact = qNorm.replace(/\s+/g, '')
    const limit = Math.min(5000, Math.max(1, Number(url.searchParams.get('limit') || 150)))
    const offset = Math.max(0, Number(url.searchParams.get('offset') || 0))

    let results = []
    let total = 0

    if (qNorm) {
      const res = await env.DB.prepare(
        `SELECT c.id, c.article_id, c.user_id, c.author_name, c.body, c.parent_id, c.likes, c.created_at,
                n.title AS article_title, n.slug AS article_slug
         FROM news_comments c
         LEFT JOIN news n ON n.id = c.article_id
         ORDER BY c.created_at DESC`,
      ).all()
      const filtered = (res?.results || []).filter((r) => matchesSearch(qNorm, qCompact, r.body, r.author_name, r.article_title))
      total = filtered.length
      results = filtered.slice(offset, offset + limit)
    } else {
      const countRow = await env.DB.prepare('SELECT COUNT(*) AS total FROM news_comments').first()
      total = Number(countRow?.total ?? 0)
      const rows = await env.DB.prepare(
        `SELECT c.id, c.article_id, c.user_id, c.author_name, c.body, c.parent_id, c.likes, c.created_at,
                n.title AS article_title, n.slug AS article_slug
         FROM news_comments c
         LEFT JOIN news n ON n.id = c.article_id
         ORDER BY c.created_at DESC
         LIMIT ? OFFSET ?`,
      )
        .bind(limit, offset)
        .all()
      results = rows?.results || []
    }

    const items = results.map((r) => ({
      id: r.id,
      articleId: r.article_id,
      articleTitle: r.article_title || '(Silinmiş haber)',
      articleSlug: r.article_slug || '',
      userId: r.user_id || '',
      authorName: r.author_name || 'Okur',
      body: r.body || '',
      parentId: r.parent_id || null,
      likes: r.likes ?? 0,
      createdAt: r.created_at || '',
    }))

    return reply({ items, total, limit, offset })
  }

  if (path === '/api/admin/comments/bulk' && request.method === 'POST') {
    const body = await request.json().catch(() => null)
    const ids = Array.isArray(body?.ids) ? body.ids.map(String).filter(Boolean) : []
    if (ids.length === 0) return reply({ error: 'no_ids' }, 400)
    if (body?.action === 'delete') {
      const marks = ids.map(() => '?').join(',')
      await env.DB.prepare(`DELETE FROM news_comment_likes WHERE comment_id IN (${marks})`).bind(...ids).run().catch(() => {})
      await env.DB.prepare(`DELETE FROM news_comments WHERE id IN (${marks}) OR parent_id IN (${marks})`)
        .bind(...ids, ...ids)
        .run()
      return reply({ ok: true, affected: ids.length })
    }
    return reply({ error: 'invalid_action' }, 400)
  }

  if (path.startsWith('/api/admin/comments/')) {
    const id = decodeURIComponent(path.slice('/api/admin/comments/'.length))
    if (!id) return reply({ error: 'missing_id' }, 400)

    if (request.method === 'PUT' || request.method === 'PATCH') {
      const existing = await env.DB.prepare('SELECT * FROM news_comments WHERE id = ?').bind(id).first()
      if (!existing) return reply({ error: 'not_found' }, 404)
      const body = await request.json().catch(() => null)
      if (!body) return reply({ error: 'invalid_json' }, 400)
      const authorName = body.authorName !== undefined ? (String(body.authorName).trim() || 'Okur') : existing.author_name
      const text = body.body !== undefined ? String(body.body).trim() : existing.body
      if (!text) return reply({ error: 'body_required' }, 400)
      await env.DB.prepare('UPDATE news_comments SET author_name = ?, body = ? WHERE id = ?')
        .bind(authorName, text, id)
        .run()
      return reply({ ok: true, id })
    }

    if (request.method === 'DELETE') {
      await env.DB.prepare('DELETE FROM news_comment_likes WHERE comment_id = ?').bind(id).run().catch(() => {})
      await env.DB.prepare('DELETE FROM news_comments WHERE id = ? OR parent_id = ?').bind(id, id).run()
      return reply({ ok: true, id })
    }
  }

  /* ── 8. Aboneler (Supabase Auth Admin API) ───────────────────────── */
  const supaBase = String(env.SUPABASE_URL || '').replace(/\/$/, '')
  const supaSecret = String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

  if (path === '/api/admin/subscribers' && request.method === 'GET') {
    if (!supaBase || !supaSecret) {
      return reply({ error: 'missing_supabase_service_key' }, 500)
    }
    const q = (url.searchParams.get('q') || '').trim()
    const qNorm = normSearch(q)
    const qCompact = qNorm.replace(/\s+/g, '')
    const page = Math.max(1, Number(url.searchParams.get('page') || 1))
    const perPage = Math.min(1000, Math.max(1, Number(url.searchParams.get('perPage') || 200)))

    const res = await fetch(`${supaBase}/auth/v1/admin/users?page=${page}&per_page=${perPage}`, {
      headers: {
        apikey: supaSecret,
        Authorization: `Bearer ${supaSecret}`,
      },
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      return reply({ error: 'supabase_error', status: res.status, detail: txt.slice(0, 200) }, 502)
    }
    const data = await res.json().catch(() => ({}))
    const rawUsers = Array.isArray(data?.users) ? data.users : []
    let items = rawUsers.map((u) => {
      const meta = u.user_metadata || {}
      const appMeta = u.app_metadata || {}
      const name = String(meta.full_name || meta.name || meta.user_name || '').trim()
      return {
        id: u.id,
        email: u.email || '',
        name,
        avatar: String(meta.avatar_url || meta.picture || '').trim(),
        provider: String(appMeta.provider || 'email'),
        providers: Array.isArray(appMeta.providers) ? appMeta.providers : [],
        confirmed: Boolean(u.email_confirmed_at || u.confirmed_at),
        createdAt: u.created_at || '',
        lastSignInAt: u.last_sign_in_at || '',
      }
    })

    if (qNorm) {
      items = items.filter((u) => matchesSearch(qNorm, qCompact, u.email, u.name, u.provider))
    }

    return reply({ items, total: items.length, page, perPage })
  }

  if (path === '/api/admin/subscribers/bulk' && request.method === 'POST') {
    if (!supaBase || !supaSecret) {
      return reply({ error: 'missing_supabase_service_key' }, 500)
    }
    const body = await request.json().catch(() => null)
    const ids = Array.isArray(body?.ids) ? body.ids.map(String).filter(Boolean) : []
    if (ids.length === 0) return reply({ error: 'no_ids' }, 400)
    if (body?.action === 'delete') {
      let deleted = 0
      for (const uid of ids) {
        const res = await fetch(`${supaBase}/auth/v1/admin/users/${encodeURIComponent(uid)}`, {
          method: 'DELETE',
          headers: {
            apikey: supaSecret,
            Authorization: `Bearer ${supaSecret}`,
          },
        })
        if (res.ok) {
          deleted++
          for (const tbl of ['news_likes', 'news_bookmarks', 'news_comment_likes']) {
            await env.DB.prepare(`DELETE FROM ${tbl} WHERE user_id = ?`).bind(uid).run().catch(() => {})
          }
        }
      }
      return reply({ ok: true, affected: deleted })
    }
    return reply({ error: 'invalid_action' }, 400)
  }

  if (path.startsWith('/api/admin/subscribers/')) {
    if (!supaBase || !supaSecret) {
      return reply({ error: 'missing_supabase_service_key' }, 500)
    }
    const id = decodeURIComponent(path.slice('/api/admin/subscribers/'.length))
    if (!id) return reply({ error: 'missing_id' }, 400)

    if (request.method === 'DELETE') {
      const res = await fetch(`${supaBase}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          apikey: supaSecret,
          Authorization: `Bearer ${supaSecret}`,
        },
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        return reply({ error: 'supabase_delete_failed', status: res.status, detail: txt.slice(0, 200) }, 502)
      }
      for (const tbl of ['news_likes', 'news_bookmarks', 'news_comment_likes']) {
        await env.DB.prepare(`DELETE FROM ${tbl} WHERE user_id = ?`).bind(id).run().catch(() => {})
      }
      return reply({ ok: true, id })
    }
  }

  return reply({ error: 'not_found' }, 404)
}

