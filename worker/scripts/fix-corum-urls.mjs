/**
 * Çorum İl MEB: ölü adreslerin yerine güncel adresi bulur.
 *
 * Yayıncının adres yapısı zamanla değişiyor; eski haberlerin bağlantısı
 * ölünce gövde hata sayfasından gelen çöp metne dönüşüyor. Sitenin
 * kendi haber/düyuru listelerinden başlığa göre eşleştirme yapılır.
 */
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fold } from '../src/text.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const API = process.env.VITE_API_URL ?? 'https://egitim-haberleri-api.omerzen.workers.dev'
const SECRET = process.env.COLLECT_SECRET ?? ''

const LISTE = [
  'https://corum.meb.gov.tr/www/haberler/kategori/1',
  'https://corum.meb.gov.tr/www/duyurular/kategori/2',
]

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const words = (s) =>
  fold(s)
    .split(' ')
    .filter((w) => w.length > 3)

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
  const items = (data.items ?? []).filter(
    (i) => i.source?.url?.includes('corum.meb.gov.tr') && i.lang !== 'en',
  )
  console.log(`[corum] ${items.length} Çorum haberi`)

  // Sitenin liste sayfalarından aday bağlantılar
  const pool = []
  for (const url of LISTE) {
    for (let page = 1; page <= 6; page++) {
      const target = page === 1 ? url : `${url}?page=${page}`
      let html = ''
      try {
        const r = await fetch(target, { headers: { 'user-agent': UA } })
        if (!r.ok) break
        html = await r.text()
      } catch {
        break
      }
      const links = [...html.matchAll(/href="(\/www\/[^"#]+)"[^>]*>([\s\S]{0,300}?)<\/a>/g)]
      for (const m of links) {
        const title = m[2]
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        if (title.length > 25) pool.push({ title, link: 'https://corum.meb.gov.tr' + m[1] })
      }
      if (!links.length) break
    }
  }
  const unique = new Map(pool.map((p) => [p.link, p]))
  console.log(`[corum] ${unique.size} aday bağlantı`)

  const payload = []
  for (const it of items) {
    let best = null
    let bestScore = 0.6
    for (const p of unique.values()) {
      const s = overlap(it.title, p.title)
      if (s > bestScore) {
        bestScore = s
        best = p
      }
    }
    if (!best) {
      console.log(`  eşleşmedi: ${it.title.slice(0, 55)}`)
      continue
    }
    console.log(`  ${it.title.slice(0, 45)} -> ${best.link.slice(0, 70)}`)
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
  console.log(`[corum] gönderildi: ${JSON.stringify(await r.json().catch(() => ({})))}`)
}

main().catch((err) => {
  console.error('[corum] hata:', err)
  process.exit(1)
})
