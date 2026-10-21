/**
 * Ölü kaynak adreslerini günceller.
 *
 * Yayıncının adres yapısı değişince eski haberlerin kaynak bağlantısı 500
 * vermeye başlıyor ve gövde hata sayfasından gelen çöp metne dönüşüyor.
 * RSS'ten eşleşip güncel adresi bulur.
 */
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchFeed } from '../src/rss.js'
import { fold } from '../src/text.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const API = process.env.VITE_API_URL ?? 'https://egitim-haberleri-api.omerzen.workers.dev'
const SECRET = process.env.COLLECT_SECRET ?? ''

const FEEDS = [
  'https://corum.meb.gov.tr/meb_iys_dosyalar/xml/rss_haberler.xml',
  'https://corum.meb.gov.tr/meb_iys_dosyalar/xml/rss_duyurular.xml',
  'https://www.meb.gov.tr/meb_haberindex.php',
]

async function keys() {
  const raw = await readFile(resolve(ROOT, 'worker', '.env'), 'utf8')
  return (raw.match(/GEMINI_API_KEYS\s*=\s*(.+)/)?.[1] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

const words = (s) =>
  fold(s)
    .split(' ')
    .filter((w) => w.length > 3)

/** İki başlığın ne kadar örtüştüğü (0-1). */
function overlap(a, b) {
  const A = new Set(words(a))
  const B = new Set(words(b))
  if (!A.size || !B.size) return 0
  let hit = 0
  for (const w of A) if (B.has(w)) hit++
  return hit / Math.min(A.size, B.size)
}

async function main() {
  const res = await fetch(`${API}/api/news?limit=500`)
  const data = await res.json()
  const items = data.items ?? []

  // Kaynak adresi ölmüş olanları bul (kaynak sayfası hata veriyor)
  const dead = []
  for (const it of items) {
    if (!it.source?.url) continue
    if (it.lang === 'en') continue
    try {
      const r = await fetch(it.source.url, {
        method: 'HEAD',
        headers: { 'user-agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(12000),
      })
      if (!r.ok) dead.push(it)
    } catch {
      dead.push(it)
    }
  }
  console.log(`[fix] ${dead.length} haberin kaynak adresi ölü görünüyor`)

  if (!dead.length) return

  // RSS'ten aday adresler
  const pool = []
  for (const feed of FEEDS) {
    try {
      const got = await fetchFeed(feed)
      for (const g of got) pool.push({ title: g.title, link: g.link })
    } catch {
      /* besleme açılamadı */
    }
  }
  console.log(`[fix] ${pool.length} aday başlık yüklendi`)

  const payload = []
  for (const it of dead) {
    let best = null
    let bestScore = 0.55
    for (const p of pool) {
      const s = overlap(it.title, p.title)
      if (s > bestScore) {
        bestScore = s
        best = p
      }
    }
    if (!best) {
      console.log(`  eşleşmedi: ${it.title.slice(0, 60)}`)
      continue
    }
    console.log(`  ${it.title.slice(0, 50)} -> ${best.link.slice(0, 70)}`)
    payload.push({
      id: it.id,
      slug: it.slug,
      title: it.title,
      excerpt: it.excerpt,
      body: it.body,
      category: it.category,
      tags: it.tags,
      source: { name: it.source.name, url: best.link, image: it.source.image },
      publishedAt: it.publishedAt,
      views: it.views,
      likes: it.likes,
      featured: it.featured,
      province: it.province,
      score: 0,
      dedupeKey: it.dedupeKey,
      status: 'published',
      rawTitle: it.title,
      fullText: it.fullText,
      lang: it.lang ?? 'tr',
    })
  }

  if (!payload.length) return
  const r = await fetch(`${API}/api/collect`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-collect-secret': SECRET },
    body: JSON.stringify({ items: payload }),
  })
  const out = await r.json().catch(() => ({}))
  console.log(`[fix] gönderildi: ${JSON.stringify(out)}`)
}

main().catch((err) => {
  console.error('[fix] hata:', err)
  process.exit(1)
})
