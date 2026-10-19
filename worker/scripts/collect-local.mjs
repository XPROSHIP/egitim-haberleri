#!/usr/bin/env node
/**
 * Haber toplayıcıyı Node üzerinde çalıştırır.
 * Kullanım: npm run collect
 *
 * Çıktı: src/data/collected.json — sitenin beslendiği gerçek haber dosyası.
 * Üretimde aynı modül Cloudflare Worker içinde cron ile çalışır.
 */
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { hash } from '../src/text.js'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..', '..')
const outFile = resolve(root, 'src', 'data', 'collected.json')

async function loadEnv() {
  const env = { ...process.env }
  for (const file of ['.env', '.env.local']) {
    try {
      const raw = await readFile(resolve(root, 'worker', file), 'utf8')
      for (const line of raw.split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
        if (!m) continue
        const value = m[2].replace(/^["']|["']$/g, '')
        if (!(m[1] in env)) env[m[1]] = value
      }
    } catch {
      /* dosya yoksa geç */
    }
  }
  return env
}

const env = await loadEnv()
const keys = (env.GEMINI_API_KEYS ?? '').split(',').map((k) => k.trim()).filter(Boolean)

if (keys.length === 0) {
  console.error('GEMINI_API_KEYS bulunamadı. worker/.env dosyasına anahtarları ekleyin.')
  process.exit(1)
}
console.log(`Gemini anahtarı: ${keys.length} adet yüklendi`)

const { collect } = await import(pathToFileURL(resolve(here, '..', 'src', 'collect.js')).href)
const { createJsonStore } = await import(pathToFileURL(resolve(here, '..', 'src', 'store.js')).href)

const store = createJsonStore(outFile)
const imgDir = resolve(root, 'public', 'img')

/** Kapak görselini kendi klasörümüze indirip /img/... adresi döndürür. */
async function saveImage(imageUrl, referer, cluster) {
  try {
    const { downloadImage } = await import(pathToFileURL(resolve(here, '..', 'src', 'article.js')).href)
    const result = await downloadImage(imageUrl, referer)
    if (!result) return null
    const ext = result.type.includes('png') ? 'png' : result.type.includes('webp') ? 'webp' : 'jpg'
    const name = `${slug(cluster.title)}-${hash(imageUrl).slice(0, 6)}.${ext}`
    await mkdir(imgDir, { recursive: true })
    await writeFile(join(imgDir, name), result.buffer)
    return `/img/${name}`
  } catch {
    return null
  }
}

function slug(s) {
  return s
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

const { run, items } = await collect({ keys, store, saveImage })

console.log('\n--- Özet ---')
console.log(`Ham kayıt        : ${run.fetched}`)
console.log(`İşlenen küme     : ${run.clusters}`)
console.log(`Kapak görseli    : ${run.withImage}`)
console.log(`Tam metin        : ${run.withFullText}`)
console.log(`Yeni haber       : ${run.inserted}`)
console.log(`Doğrudan yayın   : ${run.published}`)
console.log(`Onay bekleyen    : ${run.inserted - run.published}`)
console.log(`Dosya            : ${outFile}`)
if (run.errors.length) console.log(`Hatalar          :\n - ${run.errors.slice(0, 5).join('\n - ')}`)

console.log('\nÖrnek başlıklar:')
for (const i of items.slice(0, 6)) {
  console.log(`  [${i.category}/${i.status}] ${i.title}`)
  console.log(`     ${i.excerpt.slice(0, 110)}…`)
}
