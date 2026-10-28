/** Depolama katmanı: bellek (test), JSON dosya (yerel), D1 ve Supabase (üretim). */

const itemUrl = (i) => i?.source?.url ?? i?.url ?? ''

export function createMemoryStore(initial = []) {
  let rows = [...initial]
  return {
    name: 'memory',
    async listKeys() {
      return new Set(rows.map((r) => r.dedupeKey).filter(Boolean))
    },
    async listUrls() {
      return new Set(rows.map(itemUrl).filter(Boolean))
    },
    async listTitles() {
      return rows.flatMap((r) => [r.title, r.rawTitle].filter(Boolean))
    },
    async upsert(items) {
      const known = new Set(rows.map((r) => r.dedupeKey).filter(Boolean))
      const fresh = items.filter((i) => !known.has(i.dedupeKey))
      rows = [...fresh, ...rows]
      return { inserted: fresh.length, skipped: items.length - fresh.length, items: rows }
    },
    async all() {
      return rows
    },
    async bySlug(slug) {
      return rows.find((r) => r.slug === slug) ?? null
    },
  }
}

/** Node için dosya tabanlı depo. */
export function createJsonStore(path) {
  return {
    name: `json:${path}`,
    async listKeys() {
      return new Set((await readJson(path)).map((r) => r.dedupeKey).filter(Boolean))
    },
    async listUrls() {
      return new Set((await readJson(path)).map(itemUrl).filter(Boolean))
    },
    async listTitles() {
      return (await readJson(path)).flatMap((r) => [r.title, r.rawTitle].filter(Boolean))
    },
    async upsert(items) {
      const rows = await readJson(path)
      const known = new Set(rows.map((r) => r.dedupeKey).filter(Boolean))
      const fresh = items.filter((i) => !known.has(i.dedupeKey))
      const merged = [...fresh, ...rows].sort(
        (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt),
      )
      await writeJson(path, merged)
      return { inserted: fresh.length, skipped: items.length - fresh.length, items: merged }
    },
    async all() {
      return readJson(path)
    },
    async bySlug(slug) {
      return (await readJson(path)).find((r) => r.slug === slug) ?? null
    },
  }
}

/** Cloudflare D1 — Worker ile aynı hesapta, ücretsiz (5 GB). */
export function createD1Store(db) {
  return {
    name: 'd1',
    async listKeys() {
      const { results } = await db
        .prepare('SELECT dedupe_key FROM news WHERE dedupe_key IS NOT NULL LIMIT 20000')
        .all()
      return new Set(results.map((r) => r.dedupe_key).filter(Boolean))
    },
    async listUrls() {
      const { results } = await db
        .prepare('SELECT source_url FROM news WHERE source_url IS NOT NULL LIMIT 20000')
        .all()
      return new Set(results.map((r) => r.source_url).filter(Boolean))
    },
    /**
     * Son yayınlanan haberlerin başlıkları.
     * Aynı haberin farklı varyasyonlarının tekrar yayınlanmasını engellemek
     * için başlık benzerliği karşılaştırmasında kullanılır.
     */
    async listTitles(limit = 500) {
      const { results } = await db
        .prepare(
          `SELECT title, raw_title FROM news
           WHERE published_at > datetime('now', '-21 days')
           ORDER BY published_at DESC LIMIT ?`,
        )
        .bind(limit)
        .all()
      return results.flatMap((r) => [r.title, r.raw_title].filter(Boolean))
    },
    async upsert(items) {
      if (items.length === 0) return { inserted: 0, skipped: 0, items: [] }
      // Gövde ve özet kısalırsa üzerine yazılmaz: toplayıcının yerel
      // kopyası (collected.json) D1'deki tam metni geri kısaltıyordu.
      const stmt = db.prepare(`
        INSERT INTO news (id, slug, title, excerpt, body, category, tags, source_name, source_url,
                          source_image, published_at, views, likes, featured, province, score,
                          dedupe_key, status, raw_title, full_text, lang)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(dedupe_key) DO UPDATE SET
          title=excluded.title,
          source_url=excluded.source_url,
          excerpt=CASE WHEN LENGTH(excluded.excerpt) > LENGTH(excerpt) THEN excluded.excerpt ELSE excerpt END,
          body=CASE WHEN LENGTH(excluded.body) > LENGTH(body) THEN excluded.body ELSE body END,
          category=excluded.category, tags=excluded.tags, source_image=excluded.source_image,
          featured=excluded.featured, province=excluded.province, score=excluded.score,
          status=excluded.status, raw_title=excluded.raw_title,
          full_text=CASE WHEN LENGTH(excluded.body) > LENGTH(body) THEN excluded.full_text ELSE full_text END,
          lang=excluded.lang
      `)
      const bound = items.map((i) =>
        stmt.bind(
          i.id,
          i.slug,
          i.title,
          i.excerpt,
          JSON.stringify(i.body ?? []),
          i.category,
          JSON.stringify(i.tags ?? []),
          i.source.name,
          i.source.url,
          i.source.image ?? null,
          i.publishedAt,
          i.views ?? 0,
          i.likes ?? 0,
          i.featured ? 1 : 0,
          i.province ?? null,
          i.score ?? 0,
          i.dedupeKey,
          i.status ?? 'published',
          i.rawTitle ?? null,
          i.fullText ? 1 : 0,
          i.lang ?? 'tr',
        ),
      )
      const result = await db.batch(bound)
      const inserted = result.reduce((sum, r) => sum + (r?.meta?.changes ?? 0), 0)
      return { inserted, skipped: items.length - inserted, items }
    },
    async all(limit = 500) {
      const { results } = await db
        .prepare(
          `SELECT id, slug, title, excerpt, category, tags, source_name, source_url,
                  source_image, published_at, views, likes, featured, province, score,
                  status, raw_title, full_text, lang, audio_id, audio_duration
           FROM news WHERE status = 'published' ORDER BY published_at DESC LIMIT ?`,
        )
        .bind(limit)
        .all()
      return results.map(fromRow)
    },
    async bySlug(slug) {
      const row = await db.prepare('SELECT * FROM news WHERE slug = ?').bind(slug).first()
      return row ? fromRow(row) : null
    },
  }
}

/** Supabase (PostgREST) deposu. */
export function createSupabaseStore(url, serviceKey) {
  const base = `${url.replace(/\/$/, '')}/rest/v1`
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'content-type': 'application/json',
  }
  return {
    name: 'supabase',
    async listKeys() {
      const res = await fetch(`${base}/news?select=dedupe_key&limit=5000`, { headers })
      if (!res.ok) throw new Error(`Supabase listKeys ${res.status}`)
      return new Set((await res.json()).map((r) => r.dedupe_key).filter(Boolean))
    },
    async listUrls() {
      const res = await fetch(`${base}/news?select=source_url&limit=5000`, { headers })
      if (!res.ok) throw new Error(`Supabase listUrls ${res.status}`)
      return new Set((await res.json()).map((r) => r.source_url).filter(Boolean))
    },
    async upsert(items) {
      const payload = items.map((i) => ({
        id: i.id,
        slug: i.slug,
        title: i.title,
        excerpt: i.excerpt,
        body: i.body,
        category: i.category,
        tags: i.tags,
        source_name: i.source.name,
        source_url: i.source.url,
        source_image: i.source.image ?? null,
        published_at: i.publishedAt,
        views: i.views,
        likes: i.likes ?? 0,
        featured: i.featured,
        province: i.province ?? null,
        score: i.score,
        dedupe_key: i.dedupeKey,
        status: i.status,
        full_text: i.fullText,
      }))
      const res = await fetch(`${base}/news?on_conflict=dedupe_key`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Supabase upsert ${res.status}`)
      return { inserted: payload.length, skipped: 0, items: payload }
    },
    async all(limit = 500) {
      const res = await fetch(
        `${base}/news?select=*&status=eq.published&order=published_at.desc&limit=${limit}`,
        { headers },
      )
      if (!res.ok) throw new Error(`Supabase all ${res.status}`)
      return (await res.json()).map(fromRow)
    },
    async bySlug(slug) {
      const res = await fetch(`${base}/news?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`, {
        headers,
      })
      if (!res.ok) throw new Error(`Supabase bySlug ${res.status}`)
      const rows = await res.json()
      return rows[0] ? fromRow(rows[0]) : null
    },
  }
}

function parseJson(value, fallback) {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export function fromRow(r) {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    body: parseJson(r.body, []),
    category: r.category,
    tags: parseJson(r.tags, []),
    source: { name: r.source_name, url: r.source_url, image: r.source_image ?? undefined },
    publishedAt: r.published_at,
    views: r.views ?? 0,
    likes: r.likes ?? 0,
    commentsCount: 0,
    featured: !!r.featured,
    province: r.province ?? undefined,
    dedupeKey: r.dedupe_key ?? undefined,
    score: r.score ?? 0,
    fullText: !!r.full_text,
    lang: r.lang ?? 'tr',
    rawTitle: r.raw_title ?? undefined,
    hasAudio: !!r.audio_id,
    audioDuration: r.audio_duration ?? undefined,
    /** Sesin üretildiği okuma tarifi sürümü (yalnızca kayıt/denetim amaçlı). */
    audioRecipe: r.audio_recipe ?? undefined,
    /**
     * Ses kotası dolduğu için sesi silinmiş haber. Bir daha seslendirilmez;
     * aksi halde silme ile üretim birbirini kovalar.
     */
    audioRetired: !!r.audio_retired,
  }
}

async function readJson(path) {
  try {
    const { readFile } = await import('node:fs/promises')
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return []
  }
}

async function writeJson(path, data) {
  const { writeFile } = await import('node:fs/promises')
  await writeFile(path, JSON.stringify(data, null, 2), 'utf8')
}
