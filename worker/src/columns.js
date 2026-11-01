/**
 * Köşe Yazıları Servisi & D1 Deposu
 */

export function createColumnsStore(db) {
  return {
    async list({ author = '', q = '', limit = 30, offset = 0, includeBody = false } = {}) {
      const conditions = []
      const bindings = []

      if (author) {
        conditions.push('author_name = ?')
        bindings.push(author)
      }

      if (q) {
        conditions.push('(title LIKE ? OR author_name LIKE ? OR source_name LIKE ? OR tags LIKE ?)')
        const pattern = `%${q}%`
        bindings.push(pattern, pattern, pattern, pattern)
      }

      const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
      const selectFields = includeBody
        ? '*'
        : 'id, slug, title, author_name, author_image, author_title, source_name, source_url, excerpt, published_at, views, likes, lang, original_lang, translated, tags, created_at'

      const countQuery = `SELECT COUNT(*) as total FROM column_articles ${where}`
      const countStmt = db.prepare(countQuery)
      const countRes = bindings.length ? await countStmt.bind(...bindings).first() : await countStmt.first()
      const total = countRes?.total ?? 0

      const dataQuery = `SELECT ${selectFields} FROM column_articles ${where} ORDER BY published_at DESC LIMIT ? OFFSET ?`
      const dataStmt = db.prepare(dataQuery)
      const rows = bindings.length
        ? await dataStmt.bind(...bindings, limit, offset).all()
        : await dataStmt.bind(limit, offset).all()

      const items = (rows.results || []).map((r) => ({
        ...r,
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags || '[]') : r.tags || [],
        body: includeBody && typeof r.body === 'string' ? JSON.parse(r.body || '[]') : undefined,
      }))

      return { items, total }
    },

    async bySlug(slug) {
      const row = await db
        .prepare('SELECT * FROM column_articles WHERE slug = ? OR id = ?')
        .bind(slug, slug)
        .first()
      if (!row) return null

      // Görüntülenme artır
      try {
        await db.prepare('UPDATE column_articles SET views = views + 1 WHERE id = ?').bind(row.id).run()
      } catch {}

      return {
        ...row,
        views: (row.views || 0) + 1,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : row.tags || [],
        body: typeof row.body === 'string' ? JSON.parse(row.body || '[]') : row.body || [],
      }
    },

    async listAuthors() {
      const { results } = await db
        .prepare(
          `SELECT 
             author_name as name, 
             MAX(author_image) as image, 
             MAX(source_name) as source, 
             COUNT(*) as count,
             MAX(published_at) as last_published
           FROM column_articles 
           GROUP BY author_name 
           ORDER BY count DESC, last_published DESC 
           LIMIT 100`
        )
        .all()
      return results || []
    },

    async upsert(items) {
      if (!items || items.length === 0) return { inserted: 0, skipped: 0 }
      const stmt = db.prepare(`
        INSERT INTO column_articles (
          id, slug, title, author_name, author_image, author_title, source_name, source_url,
          excerpt, body, published_at, views, likes, lang, original_lang, translated, tags, dedupe_key
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(dedupe_key) DO UPDATE SET
          title = excluded.title,
          author_name = excluded.author_name,
          author_image = COALESCE(excluded.author_image, column_articles.author_image),
          author_title = COALESCE(excluded.author_title, column_articles.author_title),
          source_name = excluded.source_name,
          source_url = excluded.source_url,
          excerpt = CASE WHEN LENGTH(excluded.excerpt) > LENGTH(column_articles.excerpt) THEN excluded.excerpt ELSE column_articles.excerpt END,
          body = CASE WHEN LENGTH(excluded.body) > LENGTH(column_articles.body) THEN excluded.body ELSE column_articles.body END,
          tags = excluded.tags
      `)

      const bound = items.map((i) =>
        stmt.bind(
          i.id,
          i.slug,
          i.title,
          i.author_name || i.authorName || 'Köşe Yazarı',
          i.author_image || i.authorImage || null,
          i.author_title || i.authorTitle || null,
          i.source_name || i.sourceName || '',
          i.source_url || i.sourceUrl || '',
          i.excerpt || '',
          JSON.stringify(i.body || []),
          i.published_at || i.publishedAt || new Date().toISOString(),
          i.views ?? 0,
          i.likes ?? 0,
          i.lang || 'tr',
          i.original_lang || i.originalLang || null,
          i.translated ? 1 : 0,
          JSON.stringify(i.tags || []),
          i.dedupe_key || i.dedupeKey || null,
        )
      )

      const result = await db.batch(bound)
      const inserted = result.reduce((sum, r) => sum + (r?.meta?.changes ?? 0), 0)
      return { inserted, skipped: items.length - inserted }
    },
  }
}
