/**
 * public/img/ altındaki görselleri Worker'a (D1'e) yükler.
 * Böylece yerel klasör silinse bile görseller canlıda kalır.
 *
 *   node worker/scripts/upload-images.mjs
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

const dir = path.join(root, 'public', 'img')
const files = fs.readdirSync(dir).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
console.log(`${files.length} görsel yükleniyor -> ${API}`)

const TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
let done = 0
let failed = 0
let bytes = 0

for (const file of files) {
  const data = fs.readFileSync(path.join(dir, file))
  const type = TYPES[path.extname(file).slice(1).toLowerCase()] ?? 'image/jpeg'
  const res = await fetch(`${API}/api/image?key=${encodeURIComponent(file)}`, {
    method: 'POST',
    headers: { 'content-type': type, 'x-collect-secret': SECRET },
    body: data,
  })
  if (!res.ok) {
    console.error(`  ✗ ${file} → ${res.status} ${(await res.text()).slice(0, 120)}`)
    failed += 1
    continue
  }
  done += 1
  bytes += data.length
  if (done % 20 === 0) console.log(`  ${done}/${files.length}`)
}

console.log(`\nTamam · yüklendi ${done} · başarısız ${failed} · ${(bytes / 1024 / 1024).toFixed(1)} MB`)
const health = await (await fetch(`${API}/api/health`)).json()
console.log('veritabanı:', JSON.stringify(health))