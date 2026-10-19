/** Bağımlılıksız RSS/Atom ayrıştırıcı (Google News RSS uyumlu). */

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  '#39': "'",
  '#x27': "'",
  '#231': 'ç',
  '#246': 'ö',
  '#252': 'ü',
  '#220': 'Ü',
  '#199': 'Ç',
  '#214': 'Ö',
  '#287': 'ğ',
  '#305': 'ı',
  '#351': 'ş',
}

export function decodeEntities(str = '') {
  return str
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeChar(parseInt(d, 10)))
    .replace(/&([a-z0-9#]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
}

function safeChar(code) {
  try {
    return String.fromCodePoint(code)
  } catch {
    return ''
  }
}

export function stripHtml(html = '') {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim()
}

function unwrapCdata(v = '') {
  const m = v.match(/<!\[CDATA\[([\s\S]*?)\]\]>/)
  return (m ? m[1] : v).trim()
}

function tag(block, name) {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i')
  const m = block.match(re)
  return m ? unwrapCdata(decodeEntities(m[1])) : ''
}

/** <source url="..."> Yayıncı</source> biçimindeki alanı ayrıştırır. */
function sourceTag(block) {
  const m = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i)
  if (!m) return { name: '', url: '' }
  const openTag = block.match(/<source([^>]*)>/i)?.[1] ?? ''
  const url = openTag.match(/url="([^"]*)"/i)?.[1] ?? ''
  return { name: unwrapCdata(decodeEntities(m[1])), url }
}

/** Google News başlıkları "Başlık - Yayıncı" biçimindedir. */
export function splitTitle(title = '') {
  const i = title.lastIndexOf(' - ')
  if (i > 20 && title.length - i < 40) {
    return { title: title.slice(0, i).trim(), publisher: title.slice(i + 3).trim() }
  }
  return { title: title.trim(), publisher: '' }
}

export function parseFeed(xml = '') {
  const items = []
  const re = /<item\b[^>]*>([\s\S]*?)<\/item>/gi
  let m
  while ((m = re.exec(xml)) !== null) {
    const block = m[1]
    const rawTitle = tag(block, 'title')
    if (!rawTitle) continue
    const { title, publisher } = splitTitle(stripHtml(rawTitle))
    const src = sourceTag(block)
    const description = stripHtml(tag(block, 'description'))
    const pubDate = tag(block, 'pubDate') || tag(block, 'dc:date')
    const parsed = pubDate ? new Date(pubDate) : null

    items.push({
      title,
      link: tag(block, 'link') || tag(block, 'guid'),
      description,
      image: block.match(/<img[^>]+src=["']?([^"']+)/i)?.[1] ?? '',
      sourceName: src.name || publisher || '',
      sourceUrl: src.url || '',
      publishedAt: parsed && !Number.isNaN(+parsed) ? parsed.toISOString() : new Date().toISOString(),
    })
  }
  return items
}

export async function fetchFeed(url, { timeoutMs = 12000, retries = 2 } = {}) {
  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'user-agent': 'EgitimHaberleriBot/1.0 (+https://egitimhaberleri.pages.dev)' },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return parseFeed(await res.text())
    } catch (err) {
      lastError = err
      if (attempt < retries) await sleep(400 * (attempt + 1))
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export function googleNewsRssUrl(query) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(
    query,
  )}&hl=tr&gl=TR&ceid=TR:tr`
}
