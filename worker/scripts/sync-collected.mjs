/**
 * src/data/collected.json dosyasını canlı veritabanıyla eşitler.
 *
 * Depodaki kopya, toplayıcının her koşuda ürettiği yerel dosyadır. Geriye
 * dönük metin doldurma sonrası D1'deki tam metinler buraya yansımazsa
 * sonraki koşuda kısa metinler gönderilir. Upsert bunu engelliyor ama
 * dosya da tutarlı kalmalı.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const OUT = resolve(ROOT, 'src', 'data', 'collected.json')
const API = process.env.VITE_API_URL ?? 'https://egitim-haberleri-api.omerzen.workers.dev'

const res = await fetch(`${API}/api/news?limit=500`)
if (!res.ok) throw new Error(`news ${res.status}`)
const data = await res.json()
const live = data.items ?? []

let local = []
try {
  local = JSON.parse(await readFile(OUT, 'utf8'))
} catch {
  /* dosya yoksa sifirdan baslar */
}

const bySlug = new Map(local.map((i) => [i.slug, i]))
let updated = 0
let added = 0

for (const item of live) {
  const found = bySlug.get(item.slug)
  if (!found) {
    bySlug.set(item.slug, { ...item })
    added++
    continue
  }
  const liveChars = (item.body ?? []).join(' ').length
  const localChars = (found.body ?? []).join(' ').length
  if (liveChars > localChars) {
    found.body = item.body
    found.excerpt = item.excerpt
    found.fullText = item.fullText
    updated++
  }
  if (item.hasAudio && !found.audioId) {
    found.audioId = item.id
    found.audioDuration = item.audioDuration
  }
  if (item.rawTitle) found.rawTitle = item.rawTitle
}

const merged = [...bySlug.values()].sort(
  (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt),
)

await writeFile(OUT, JSON.stringify(merged, null, 2), 'utf8')
console.log(
  `[sync] ${merged.length} haber · ${updated} gövde güncellendi · ${added} yeni eklendi`,
)
