/**
 * Geriye dönük metin doldurma.
 *
 * Toplayıcı eski sürümde haber gövdesini yanlış kapsayıcıdan çekiyordu;
 * haberler iki cümlelik özetle yayınlanmıştı. Bu betik, kaynak sayfaları
 * yeniden okuyup tam metni D1'ye yazar.
 *
 * Kullanım:  node worker/scripts/refill-bodies.mjs [--limit=200] [--force]
 */
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { fetchArticle } from '../src/article.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const API = process.env.VITE_API_URL ?? 'https://egitim-haberleri-api.omerzen.workers.dev'
const SECRET = (process.env.COLLECT_SECRET ?? '').trim()

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  }),
)
const LIMIT = Number(args.limit ?? 200)
const FORCE = Boolean(args.force)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Özet: ilk paragraftan 1-2 cümle. */
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

async function loadItems() {
  const res = await fetch(`${API}/api/news?limit=500`)
  if (!res.ok) throw new Error(`news ${res.status}`)
  const data = await res.json()
  return data.items ?? []
}

async function main() {
  if (!SECRET) throw new Error('COLLECT_SECRET boş')
  const all = await loadItems()
  let todo = all.filter((i) => {
    if (!i.source?.url) return false
    // Yabancı kaynaklı haberlerin gövdesi Türkçe çeviridir; kaynaktan
    // doldurulursa İngilizce orijinaliyle ezilir.
    if (i.lang === 'en') return false
    const chars = (i.body ?? []).reduce((a, b) => a + (b?.length ?? 0), 0)
    return FORCE ? true : chars < 900
  })
  todo = todo.slice(0, LIMIT)
  console.log(`[refill] ${all.length} haberden ${todo.length} tanesi yenilenecek`)

  let updated = 0
  let done = 0
  const payload = []
  for (const it of todo) {
    done++
    try {
      const art = await fetchArticle(it.source.url)
      const paragraphs = (art.paragraphs ?? []).filter((p) => p && p.length >= 80)
      if (paragraphs.length >= 2) {
        payload.push({
          slug: it.slug,
          body: paragraphs,
          excerpt: makeExcerpt(paragraphs, it.excerpt),
        })
        updated++
        console.log(
          `  [${done}/${todo.length}] ${paragraphs.length} paragraf · ${it.title.slice(0, 55)}`,
        )
      } else {
        console.log(`  [${done}/${todo.length}] metin bulunamadı · ${it.title.slice(0, 55)}`)
      }
    } catch (err) {
      console.warn(`  [${done}/${todo.length}] hata: ${String(err?.message ?? err).slice(0, 80)}`)
    }
    await sleep(400)
  }

  // 20'şerlik gruplar halinde gönder
  for (let i = 0; i < payload.length; i += 20) {
    const chunk = payload.slice(i, i + 20)
    const res = await fetch(`${API}/api/refill`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-collect-secret': SECRET },
      body: JSON.stringify({ items: chunk }),
    })
    const out = await res.json().catch(() => ({}))
    console.log(`  yazıldı: ${out.updated ?? '?'} (${i + chunk.length}/${payload.length})`)
    await sleep(300)
  }
  console.log(`[refill] tamam · ${updated} haber yenilendi`)
}

main().catch((err) => {
  console.error('[refill] hata:', err)
  process.exit(1)
})
