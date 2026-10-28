#!/usr/bin/env node
/**
 * Depolama bakımı: ses, görsel ve podcast kotası.
 *
 * D1'in ÜCRETSİZ kademesi 500 MB'tır (5 GB olan sınır ücretli kademenin).
 * Sınır aşılınca D1 yazmayı tamamen reddeder — "Exceeded maximum DB size" —
 * yani haber toplama, ses ve görsel üretimi aynı anda durur. Bu yüzden sabit
 * "şu kadar ay sonra sil" kuralı yerine kota izleniyor: toplam boyut bütçeyi
 * geçerse Worker tarafında EN ESKİ kayıtlardan başlanarak hedefe kadar
 * silinir. Kota dolmadıkça hiçbir kayda dokunulmaz.
 *
 * Emniyet tabanları: 5 günden yeni ses, 7 günden yeni görsel asla silinmez.
 * Ses silinen haber `audio_retired` ile işaretlenir (bir daha seslendirilmez).
 * Podcast'te en yeni 30 bölüm kalır.
 *
 * Bu betik toplamadan ÖNCE çalışır: yeni tur başlarken yer açılmış olur.
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

/**
 * MB cinsinden bütçeler. Ses ve görseller AYRI veritabanlarında; her birinin
 * ücretsiz kademe tavanı 500 MB. 480'de tetiklenip 440'a iner: tur arasında
 * biriken yeni medya (~15-20 MB) rahat sığsın diye 40 MB emniyet payı var.
 */
const LIMITS = {
  audioBudget: 480,
  audioTarget: 440,
  imageBudget: 480,
  imageTarget: 440,
  audioMinAgeDays: 5,
  imageMinAgeDays: 7,
  podcastKeep: 30,
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
if (r.podcast?.deleted) {
  console.log(
    `[prune] podcast: ${r.podcast.deleted} eski bölüm silindi (${mb(r.podcast.freed)}), en yeni ${r.podcast.keep} bölüm duruyor`,
  )
}
console.log(
  `[prune] ses: ${mb(r.audio.before)} · silinen ${r.audio.deleted} dosya (${mb(r.audio.freed)}) · kalan ${mb(r.audio.after)}`,
)
console.log(
  `[prune] görsel: ${mb(r.images.before)} · silinen ${r.images.deleted} dosya (${mb(r.images.freed)}) · kalan ${mb(r.images.after)}`,
)
const total = r.audio.after + r.images.after
console.log(`[prune] medya toplamı: ${mb(total)} · her veritabanı 500 MB, hesap toplamı 5 GB`)
if (r.audio.deleted === 0 && r.images.deleted === 0 && !r.podcast?.deleted) {
  console.log('[prune] kotalar dolmadı, hiçbir şey silinmedi')
} else if (dryRun) {
  console.log('[prune] DENEME: hiçbir şey silinmedi (--dry-run)')
}
