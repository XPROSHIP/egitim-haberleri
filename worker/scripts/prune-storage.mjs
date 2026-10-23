#!/usr/bin/env node
/**
 * Depolama bakımı: ses ve görsel kotaları.
 *
 * D1'in ücretsiz kademesi 5 GB. Sabit "şu kadar ay sonra sil" kuralı yerine
 * kota izleniyor: toplam boyut bütçeyi geçerse Worker tarafında EN ESKİ
 * kayıtlardan başlanarak hedefe kadar siliniyor. Kota dolmadıkça hiçbir
 * kayda dokunulmaz — yani normal günlerde bu betik hiçbir şey silmez.
 *
 * Emniyet tabanı: `--min-age` günden yeni kayıtlar asla silinmez.
 * Ses silinen haber `audio_retired` ile işaretlenir (bir daha seslendirilmez).
 *
 *   node worker/scripts/prune-storage.mjs --dry-run     # sadece rapor
 *   node worker/scripts/prune-storage.mjs               # gerçekten sil
 */
const API = (process.env.VITE_API_URL ?? '').replace(/\/$/, '')
const SECRET = process.env.COLLECT_SECRET ?? ''

if (!API || !SECRET) {
  console.error('[prune] VITE_API_URL / COLLECT_SECRET eksik')
  process.exit(1)
}

/** MB cinsinden bütçeler. 3 GB ses + 1,25 GB görsel ≈ 4,25 GB (5 GB sınır). */
const LIMITS = {
  audioBudget: 3072,
  audioTarget: 2560,
  imageBudget: 1280,
  imageTarget: 1024,
  minAgeDays: 14,
}

const dryRun = process.argv.includes('--dry-run')
const mb = (b) => `${(b / 1048576).toFixed(1)} MB`

const res = await fetch(`${API}/api/storage/prune`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-collect-secret': SECRET },
  body: JSON.stringify({ ...LIMITS, dryRun }),
})

if (!res.ok) {
  console.error(`[prune] HTTP ${res.status}: ${await res.text()}`)
  process.exit(1)
}

const r = await res.json()
console.log(
  `[prune] ses: ${mb(r.audio.before)} · silinen ${r.audio.deleted} dosya (${mb(r.audio.freed)}) · kalan ${mb(r.audio.after)}`,
)
console.log(
  `[prune] görsel: ${mb(r.images.before)} · silinen ${r.images.deleted} dosya (${mb(r.images.freed)}) · kalan ${mb(r.images.after)}`,
)
if (r.audio.deleted === 0 && r.images.deleted === 0) {
  console.log('[prune] kotalar dolmadı, hiçbir şey silinmedi')
} else if (dryRun) {
  console.log('[prune] DENEME: hiçbir şey silinmedi (--dry-run)')
}
