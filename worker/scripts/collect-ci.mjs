#!/usr/bin/env node
/**
 * GitHub Actions için haber toplayıcı.
 *
 * Görselleri Worker'a (D1) yükler, haberleri /api/collect'e gönderir.
 * Yalnızca ortam değişkenlerinden okur, yerel .env dosyasına dokunmaz.
 *
 *   GEMINI_API_KEYS   virgülle ayrılmış anahtarlar
 *   COLLECT_SECRET    Worker'a yazma yetkisi için parola
 *   VITE_API_URL      Worker adresi
 */
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { hash } from '../src/text.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')
const outFile = path.resolve(root, 'src', 'data', 'collected.json')

const keys = (process.env.GEMINI_API_KEYS ?? '').split(',').map((k) => k.trim()).filter(Boolean)
const API = (process.env.VITE_API_URL ?? '').replace(/\/$/, '')
const SECRET = process.env.COLLECT_SECRET ?? ''

if (keys.length === 0) {
  console.error('GEMINI_API_KEYS boş.')
  process.exit(1)
}
if (!API || !SECRET) {
  console.error('VITE_API_URL veya COLLECT_SECRET boş.')
  process.exit(1)
}
console.log(`Gemini anahtarı: ${keys.length} · hedef: ${API}`)

const { collect } = await import(pathToFileURL(resolveSrc('collect.js')).href)
const { createJsonStore } = await import(pathToFileURL(resolveSrc('store.js')).href)

function resolveSrc(name) {
  return path.resolve(here, '..', 'src', name)
}

/** Görseli Worker'a yükleyip "/img/<anahtar>" adresini döndürür. */
async function saveImage(imageUrl, referer, cluster) {
  try {
    const { downloadImage } = await import(pathToFileURL(resolveSrc('article.js')).href)
    const result = await downloadImage(imageUrl, referer)
    if (!result) return null
    const ext = result.type.includes('png') ? 'png' : result.type.includes('webp') ? 'webp' : 'jpg'
    const key = `${slug(cluster?.title ?? imageUrl)}-${hash(imageUrl).slice(0, 6)}.${ext}`

    const res = await fetch(`${API}/api/image?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'content-type': result.type, 'x-collect-secret': SECRET },
      body: result.buffer,
    })
    if (!res.ok) {
      console.warn(`  görsel yüklenemedi (${res.status}): ${key}`)
      return null
    }
    return `/img/${key}`
  } catch (err) {
    console.warn(`  görsel hatası: ${String(err?.message ?? err).slice(0, 120)}`)
    return null
  }
}

function slug(s) {
  return String(s ?? '')
    .toLocaleLowerCase('tr')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

const store = createJsonStore(outFile)
const { run, items } = await collect({ keys, store, saveImage })

console.log('\n--- Özet ---')
console.log(`Ham kayıt     : ${run.fetched}`)
console.log(`Yeni haber    : ${run.inserted}`)
console.log(`Yayınlanan    : ${run.published}`)
if (run.errors.length) console.log(`Hatalar       :\n - ${run.errors.slice(0, 5).join('\n - ')}`)

// Görseller yüklendiği için localImage alanı URL'ye çevrildi; toplayıcı zaten
// kaydettiği için dosyayı bir kez daha yazıyoruz (görsel adresleri kalıcı).
// Ses bayrakları (audioId) önceki dosyadan korunur; aksi halde her koşuda
// aynı haberlerin sesi yeniden üretilirdi.
let previous = []
try {
  previous = JSON.parse(await readFile(outFile, 'utf8'))
} catch {
  /* dosya yoksa boş geç */
}
const audioFlags = new Map(previous.filter((i) => i.audioId).map((i) => [i.id, i]))
for (const item of items) {
  const flag = audioFlags.get(item.id)
  if (flag) {
    item.audioId = flag.audioId
    item.audioDuration = flag.audioDuration
  }
}

await mkdir(path.dirname(outFile), { recursive: true })
await writeFile(outFile, JSON.stringify(items, null, 2))

console.log('\nWorker\'a gönderiliyor...')
const CHUNK = 50
let inserted = 0
let skipped = 0
for (let i = 0; i < items.length; i += CHUNK) {
  const res = await fetch(`${API}/api/collect`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-collect-secret': SECRET },
    body: JSON.stringify({ items: items.slice(i, i + CHUNK) }),
  })
  if (!res.ok) {
    console.error(`  HATA ${res.status}: ${(await res.text()).slice(0, 200)}`)
    process.exit(1)
  }
  const r = await res.json()
  inserted += r.inserted
  skipped += r.skipped
  await new Promise((r2) => setTimeout(r2, 400)) // Worker kotasını zorlamamak için
}

console.log(`\nTamam · eklenen/güncellenen ${inserted} · değişmeyen ${skipped}`)
console.log(`Toplam ${items.length} haber, ${items.filter((i) => i.source.image).length} görselli`)