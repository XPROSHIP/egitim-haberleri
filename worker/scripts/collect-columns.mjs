/**
 * Köşe Yazıları Toplayıcı Çalıştırıcısı (GitHub Actions & Local)
 *
 * Kullanım: node worker/scripts/collect-columns.mjs
 */
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectColumns } from '../src/collect-columns-core.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function loadEnv() {
  for (const rel of ['../../.env', '../.env']) {
    try {
      const p = resolve(__dirname, rel)
      const text = await readFile(p, 'utf-8')
      for (const line of text.split('\n')) {
        const m = line.match(/^\s*([\w]+)\s*=\s*(.*)?\s*$/)
        if (!m || m[1].startsWith('#')) continue
        const k = m[1]
        let v = (m[2] ?? '').trim().replace(/^['"]|['"]$/g, '')
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

const API_URL = (process.env.VITE_API_URL || 'https://egitim-haberleri-api.omerzen.workers.dev').replace(/\/$/, '')
const COLLECT_SECRET = process.env.COLLECT_SECRET || ''
const GEMINI_KEYS = (process.env.GEMINI_API_KEYS || '').split(',').map((k) => k.trim()).filter(Boolean)

console.log(`[collect-columns] API URL: ${API_URL}`)
console.log(`[collect-columns] Secret var mı: ${COLLECT_SECRET ? 'Evet' : 'HAYIR'}`)
console.log(`[collect-columns] Gemini anahtar sayısı: ${GEMINI_KEYS.length}`)

// 1. Mevcut bilinen yazıları API'den çek
let knownUrls = new Set()
try {
  const res = await fetch(`${API_URL}/api/columns?limit=200`)
  if (res.ok) {
    const data = await res.json()
    for (const item of data.items || []) {
      if (item.source_url) knownUrls.add(item.source_url)
    }
    console.log(`[collect-columns] Mevcut kayıtlı yazı: ${knownUrls.size}`)
  }
} catch (err) {
  console.warn(`[collect-columns] Mevcut yazılar alınamadı:`, err.message)
}

// 2. Taramayı başlat
const startedAt = Date.now()
const articles = await collectColumns({
  geminiKeys: GEMINI_KEYS,
  logger: console,
  targetMin: 12,
  knownUrls,
})

console.log(`[collect-columns] ${articles.length} köşe yazısı derlendi (${((Date.now() - startedAt) / 1000).toFixed(1)}s)`)

if (articles.length === 0) {
  console.log('[collect-columns] Gönderilecek yeni yazı yok.')
  process.exit(0)
}

// 3. API'ye gönder
if (!COLLECT_SECRET) {
  console.warn('[collect-columns] UYARI: COLLECT_SECRET tanımlı değil, API kayıt adımı atlandı.')
  process.exit(0)
}

try {
  const pushRes = await fetch(`${API_URL}/api/collect-columns`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-collect-secret': COLLECT_SECRET,
    },
    body: JSON.stringify({ items: articles }),
  })

  if (!pushRes.ok) {
    const errText = await pushRes.text()
    throw new Error(`API hatası (${pushRes.status}): ${errText}`)
  }

  const result = await pushRes.json()
  console.log(`[collect-columns] BAŞARILI! Eklenen: ${result.inserted}, Atlanan/Güncellenen: ${result.skipped}`)
} catch (err) {
  console.error('[collect-columns] API POST hatası:', err.message)
  process.exit(1)
}
