/**
 * D1 dışa aktarımındaki (export) sesleri yeni ses veritabanına taşır.
 *
 * Neden var: depolama bölünmesinde eski sesleri taşımak gerekti, ama
 * Workers Free'de çağrı başına 10 ms CPU var. Bir BLOB'u D1'den okuyup başka
 * veritabanına yazmak 2 MB üstünde bu bütçeyi aşıyor (error 1102). Bu yüzden
 * `wrangler d1 export --table=news_audio --no-schema` ile alınan dosya
 * yerelde ayrıştırılır ve her ses POST /api/storage/put ucuna doğrudan
 * yüklenir. `created_at` korunur ki silme sırası (en eski önce) bozulmasın.
 *
 * Büyük seslerde yazma yine sınırda kalabildiği için her ses birkaç kez
 * denenir; kalıcı hata olursa betik hangi seslerin kaldığını yazar.
 *
 * Kullanım:
 *   node worker/scripts/upload-exported-audio.mjs <audio.sql> [--dry-run] [--skip-file <liste>]
 *
 * `--skip-file`: "id boyut" satırları. Boyutu eşleşen sesler atlanır; yarım
 * kalmış ya da bozulmuş kayıtlar yeniden yazılır.
 *
 * Gerekli ortam: VITE_API_URL, COLLECT_SECRET (worker/.collect-secret).
 */
import { createReadStream, existsSync, readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'

const args = process.argv.slice(2)
const file = args.find((a) => !a.startsWith('--') && a.endsWith('.sql'))
const dryRun = args.includes('--dry-run')
const skipIdx = args.indexOf('--skip-file')
const skipFile = skipIdx >= 0 ? args[skipIdx + 1] : null
const tries = Number((args.find((a) => a.startsWith('--tries=')) ?? '--tries=8').split('=')[1]) || 8
const kind = (args.find((a) => a.startsWith('--kind=')) ?? '--kind=audio').split('=')[1]

const api = (process.env.VITE_API_URL ?? '').replace(/\/+$/, '')
const secret = process.env.COLLECT_SECRET ?? ''

if (!file || !existsSync(file)) {
  console.error('kullanim: node worker/scripts/upload-exported-audio.mjs <audio.sql> [--dry-run] [--skip-file <liste>]')
  process.exit(1)
}
if (!dryRun && (!api || !secret)) {
  console.error('VITE_API_URL ve COLLECT_SECRET gerekli')
  process.exit(1)
}

// Zaten taşınmış sesleri yeniden yazmayalım. Karşılaştırma BOYUTLA yapılır:
// yarım kalmış ya da bozulmuş bir kayıt "taşındı" sayılmaz.
const skip = new Map()
if (skipFile && existsSync(skipFile)) {
  for (const line of readFileSync(skipFile, 'utf8').split(/\r?\n/)) {
    const [id, size] = line.trim().split(/\s+/)
    if (id) skip.set(id, Number(size ?? -1))
  }
}

// news_audio: INSERT INTO "news_audio" (...) VALUES('id',X'hex','type',duration,bytes,'created_at',recipe);
// images:     INSERT INTO "images" (...)     VALUES('key',X'hex','type',bytes,'created_at');
const ROW_AUDIO =
  /VALUES\('([^']+)',X'([0-9a-fA-F]*)','([^']*)',(NULL|-?[0-9.]+),(\d+),'([^']*)',(NULL|'[^']*')\)/
const ROW_IMAGE = /VALUES\('([^']+)',X'([0-9a-fA-F]*)','([^']*)',(\d+),'([^']*)'\)/

let ok = 0
let skipped = 0
let fail = 0
let bytes = 0
const failed = []

const rl = createInterface({ input: createReadStream(file, { encoding: 'utf8' }), crlfDelay: Infinity })
for await (const line of rl) {
  const m = kind === 'images' ? ROW_IMAGE.exec(line) : ROW_AUDIO.exec(line)
  if (!m) continue
  const id = m[1]
  const hex = m[2]
  const type = m[3]
  const createdAt = kind === 'images' ? m[5] : m[6]
  const duration = kind === 'images' ? '' : m[4]
  const recipe = kind === 'images' ? '' : m[7] === 'NULL' ? '' : m[7].slice(1, -1)
  const dur = duration === 'NULL' ? '' : duration

  const body = Buffer.from(hex, 'hex')
  if (skip.get(id) === body.length) {
    skipped++
    continue
  }
  if (dryRun) {
    ok++
    bytes += body.length
    continue
  }

  const url =
    kind === 'images'
      ? `${api}/api/storage/put-image?key=${encodeURIComponent(id)}`
      : `${api}/api/storage/put?id=${encodeURIComponent(id)}`
  const headers =
    kind === 'images'
      ? {
          'content-type': type || 'image/jpeg',
          'x-collect-secret': secret,
          'x-image-type': type || 'image/jpeg',
          'x-image-created': createdAt,
        }
      : {
          'content-type': 'audio/mpeg',
          'x-collect-secret': secret,
          'x-audio-created': createdAt,
          ...(dur ? { 'x-audio-duration': dur } : {}),
          ...(recipe ? { 'x-audio-recipe': recipe } : {}),
        }

  let done = false
  let last = ''
  for (let attempt = 1; attempt <= tries && !done; attempt++) {
    try {
      const res = await fetch(url, { method: 'POST', headers, body })
      if (res.ok) {
        done = true
      } else {
        last = `HTTP ${res.status}`
        await res.text()
        await new Promise((r) => setTimeout(r, 300 * attempt))
      }
    } catch (err) {
      last = String(err?.cause?.code ?? err?.message ?? err)
      await new Promise((r) => setTimeout(r, 500 * attempt))
    }
  }

  if (done) {
    ok++
    bytes += body.length
  } else {
    fail++
    failed.push(`${id} ${body.length}`)
    console.log(`[hata] ${id} (${(body.length / 1048576).toFixed(1)} MB) → ${last}`)
  }
  if (ok > 0 && ok % 20 === 0) console.log(`[tasi] ${ok} ses · ${(bytes / 1048576).toFixed(1)} MB`)
}

console.log(
  `[bitti] tasinan ${ok} · atlanan ${skipped} · hata ${fail} · ${(bytes / 1048576).toFixed(1)} MB`,
)
if (failed.length > 0) {
  console.log('[kalan] ' + failed.join(', '))
  process.exit(1)
}
