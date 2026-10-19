/**
 * collected.json içeriğini Worker'a gönderir (POST /api/collect).
 * GitHub Actions iş akışı da aynı yolu kullanacak.
 *
 *   node worker/scripts/push-to-worker.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const API = (process.env.VITE_API_URL ?? '').replace(/\/$/, '')
const SECRET = (process.env.COLLECT_SECRET ?? fs.readFileSync(path.join(root, 'worker/.collect-secret'), 'utf8')).trim()

if (!API) {
  console.error('VITE_API_URL tanımlı değil.')
  process.exit(1)
}

const items = JSON.parse(fs.readFileSync(path.join(root, 'src/data/collected.json'), 'utf8'))
console.log(`${items.length} haber gönderiliyor -> ${API}`)

const CHUNK = 50
let inserted = 0
let skipped = 0

for (let i = 0; i < items.length; i += CHUNK) {
  const chunk = items.slice(i, i + CHUNK)
  const res = await fetch(`${API}/api/collect`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-collect-secret': SECRET },
    body: JSON.stringify({ items: chunk }),
  })
  if (!res.ok) {
    console.error(`  HATA ${res.status}: ${(await res.text()).slice(0, 200)}`)
    process.exit(1)
  }
  const r = await res.json()
  inserted += r.inserted
  skipped += r.skipped
  console.log(`  ${i + chunk.length}/${items.length} · +${r.inserted} (tekrar ${r.skipped})`)
}

console.log(`\nTamam · yeni ${inserted} · tekrar ${skipped}`)