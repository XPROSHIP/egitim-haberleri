#!/usr/bin/env node
/**
 * Arşivdeki haber metinlerini toplu olarak temizler.
 *
 * Kaynak sayfalardan alınan metinlerde reklam, "ilgili haberler" ve
 * benzeri kalıntılar var. Toplayıcı artık yeni haberleri temizliyor;
 * bu betik mevcut arşivi de aynı işlemden geçirir.
 *
 * Kullanım:  node worker/scripts/clean-bodies.mjs [--limit=200] [--dry]
 */
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createGemini, cleanBodies } from '../src/gemini.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const API = process.env.VITE_API_URL ?? 'https://egitim-haberleri-api.omerzen.workers.dev'
const SECRET = process.env.COLLECT_SECRET ?? ''

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v ?? true]
  }),
)
const LIMIT = Number(args.limit ?? 200)
const DRY = Boolean(args.dry)
/** Yalnızca gerçekten bozuk görünenleri temizle (hızlı onarım). */
const JUNK_ONLY = Boolean(args['junk-only'])

/** Gövdede çöp kalıntısı var mı? */
function hasJunk(body) {
  const text = (body ?? []).join(' ')
  return (
    /Adres:|İstenen adres|Güncel Haberler|Erişilebilirlik|© Türkiye Cumhuriyeti|Yazı Tipi|Sayfa Genişliği|^Tel:|Takip Edin|Gizlilik, Kullanım/i.test(
      text,
    ) || text.length < 300
  )
}

async function keys() {
  const raw = await readFile(resolve(ROOT, 'worker', '.env'), 'utf8')
  const m = raw.match(/GEMINI_API_KEYS\s*=\s*(.+)/)
  return (m?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  if (!SECRET) throw new Error('COLLECT_SECRET boş')
  const res = await fetch(`${API}/api/news?limit=500`)
  const data = await res.json()
  const items = (data.items ?? []).slice(0, LIMIT)

  // Zaten temizlenmiş gibi görünenleri atla (alt başlık işareti olanlar
  // yeni modelden geçmiş demektir).
  let todo = items.filter((i) => (i.body ?? []).length >= 2)
  if (JUNK_ONLY) todo = todo.filter((i) => hasJunk(i.body))
  console.log(`[clean] ${todo.length} haber temizlenecek`)

  const gemini = createGemini(await keys(), [
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
  ])

  let updated = 0
  const BATCH = 8
  for (let i = 0; i < todo.length; i += BATCH) {
    const chunk = todo.slice(i, i + BATCH)
    try {
      // cleanBodies paragraf dizisini bekliyor; API "body" alanını veriyor.
      const clusters = chunk.map((c) => ({
        key: c.id,
        title: c.title,
        paragraphs: c.body ?? [],
      }))
      const cleaned = await cleanBodies(gemini, clusters)

      const payload = []
      for (const c of chunk) {
        const next = cleaned.get(c.id)
        if (!next) continue
        payload.push({ slug: c.slug, body: next, excerpt: c.excerpt })
      }
      if (!payload.length) {
        console.log(`  ${i + chunk.length}/${todo.length} temizlenemedi`)
        continue
      }
      if (!DRY) {
        const r = await fetch(`${API}/api/refill`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-collect-secret': SECRET },
          body: JSON.stringify({ items: payload }),
          signal: AbortSignal.timeout(120_000),
        })
        const j = await r.json().catch(() => ({}))
        updated += j.updated ?? 0
      }
      console.log(`  ${i + chunk.length}/${todo.length} · ${payload.length} haber yazıldı`)
    } catch (err) {
      // Tek grup hatası tüm işi durdurmamalı.
      console.warn(`  ${i + chunk.length}/${todo.length} hata: ${String(err?.message ?? err).slice(0, 90)}`)
    }
    await sleep(700)
  }

  console.log(`[clean] tamam · ${updated} haberin metni temizlendi`)
}

main().catch((err) => {
  console.error('[clean] hata:', err)
  process.exit(1)
})
