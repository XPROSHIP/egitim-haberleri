/**
 * Köşe Yazıları Geriye Dönük Tam Metin Doldurma Betiği
 *
 * Kısa veya tek paragrafa düşmüş köşe yazılarının kaynak sayfalarını
 * güncel çıkarıcıyla yeniden okuyarak tam metni D1 veritabanına yazar.
 *
 * Kullanım: node worker/scripts/refill-columns.mjs [--limit=100] [--force]
 */
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchArticle, splitLongParagraphs } from '../src/article.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function loadEnv() {
  for (const rel of ['../../.env', '../.env']) {
    try {
      const text = await readFile(resolve(__dirname, rel), 'utf-8')
      for (const line of text.split('\n')) {
        const m = line.match(/^\s*([\w]+)\s*=\s*(.*)?\s*$/)
        if (!m || m[1].startsWith('#')) continue
        const k = m[1]
        const v = (m[2] ?? '').trim().replace(/^['"]|['"]$/g, '')
        if (!process.env[k]) process.env[k] = v
      }
    } catch {}
  }
  try {
    const sec = await readFile(resolve(__dirname, '../.collect-secret'), 'utf-8')
    if (sec && sec.trim() && !process.env.COLLECT_SECRET) {
      process.env.COLLECT_SECRET = sec.trim()
    }
  } catch {}
}

await loadEnv()

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  }),
)

const LIMIT = Number(args.limit ?? 100)
const FORCE = Boolean(args.force)
const API_URL = (process.env.VITE_API_URL || 'https://egitim-haberleri-api.omerzen.workers.dev').replace(/\/$/, '')
const COLLECT_SECRET = (process.env.COLLECT_SECRET || '').trim()

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function makeExcerpt(paragraphs, fallback) {
  const first = paragraphs[0] ?? ''
  if (!first) return fallback
  const sentences = first.split(/(?<=[.!?…])\s+/).filter(Boolean)
  let out = ''
  for (const s of sentences.slice(0, 2)) {
    if ((out + ' ' + s).trim().length > 240) break
    out = (out + ' ' + s).trim()
  }
  return out || first.slice(0, 240)
}

async function main() {
  if (!COLLECT_SECRET) throw new Error('COLLECT_SECRET boş')

  const res = await fetch(`${API_URL}/api/columns?limit=100&include_body=1`)
  if (!res.ok) throw new Error(`columns ${res.status}`)
  const data = await res.json()
  const all = data.items || []

  const todo = all
    .filter((col) => {
      if (!col.source_url) return false
      if (col.translated === 1) return false
      const body = Array.isArray(col.body) ? col.body : []
      const chars = body.join(' ').length
      return FORCE ? true : body.length <= 1 || chars < 700
    })
    .slice(0, LIMIT)

  console.log(`[refill-columns] ${all.length} köşe yazısından ${todo.length} tanesi kontrol edilecek`)

  const payload = []
  let idx = 0
  for (const col of todo) {
    idx++
    const oldBody = Array.isArray(col.body) ? col.body : []
    const oldChars = oldBody.join(' ').length
    try {
      const art = await fetchArticle(col.source_url, { timeoutMs: 15000 })
      let newParas = splitLongParagraphs(art.paragraphs || [])
      let newChars = newParas.join(' ').length

      // Eğer sayfa hâlâ tek uzun blok döndüyse ama HTML okunamadıysa mevcut gövdeyi paragraflara böl
      if (newParas.length === 0 && oldBody.length === 1 && oldChars >= 900) {
        newParas = splitLongParagraphs(oldBody)
        newChars = newParas.join(' ').length
      }

      const isRicher =
        (newParas.length >= 2 && newChars > oldChars) ||
        (oldBody.length <= 1 && newParas.length >= 2 && newChars >= oldChars * 0.85)

      if (isRicher) {
        payload.push({
          slug: col.slug,
          body: newParas,
          excerpt: makeExcerpt(newParas, col.excerpt),
          author_name: art.author || null,
          author_image: art.image || null,
        })
        console.log(
          `  [${idx}/${todo.length}] GÜNCEL: ${oldBody.length}p (${oldChars}c) -> ${newParas.length}p (${newChars}c) · ${col.title.slice(0, 50)}`,
        )
      } else {
        console.log(
          `  [${idx}/${todo.length}] DEĞİŞMEDİ: ${newParas.length}p (${newChars}c) · ${col.title.slice(0, 50)}`,
        )
      }
    } catch (err) {
      console.warn(`  [${idx}/${todo.length}] hata (${col.slug}):`, String(err?.message ?? err).slice(0, 80))
    }
    await sleep(350)
  }

  let written = 0
  for (let i = 0; i < payload.length; i += 20) {
    const chunk = payload.slice(i, i + 20)
    const postRes = await fetch(`${API_URL}/api/refill-columns`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-collect-secret': COLLECT_SECRET,
      },
      body: JSON.stringify({ items: chunk }),
    })
    const out = await postRes.json().catch(() => ({}))
    written += Number(out.updated ?? 0)
    console.log(`  yazıldı: ${out.updated ?? '?'} (${Math.min(i + chunk.length, payload.length)}/${payload.length})`)
    await sleep(300)
  }

  console.log(`[refill-columns] tamam · ${written} köşe yazısı güncellendi`)
}

main().catch((err) => {
  console.error('[refill-columns] hata:', err)
  process.exit(1)
})
