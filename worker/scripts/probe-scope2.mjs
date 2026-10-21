/** Yayıncının sayfasında haber gövdesinin gerçek kapsayıcısını bul. */
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const url = process.argv[2]
const res = await fetch(url, { headers: { 'user-agent': UA } })
const buf = await res.arrayBuffer()
const ct = res.headers.get('content-type') ?? ''
let html
if (/charset=([\w-]+)/i.test(ct)) {
  const label = /charset=([\w-]+)/i.exec(ct)[1]
  try {
    html = new TextDecoder(label, { fatal: false }).decode(buf)
  } catch {
    html = new TextDecoder('utf-8', { fatal: false }).decode(buf)
  }
} else {
  html = new TextDecoder('utf-8', { fatal: false }).decode(buf)
}

const strip = (s) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

console.log(`HTTP ${res.status} · ${(html.length / 1024).toFixed(0)} KB · ${ct}`)

// JSON-LD articleBody
for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
  try {
    const data = JSON.parse(m[1])
    const arr = Array.isArray(data) ? data : [data]
    for (const d of arr) {
      if (d?.articleBody) {
        const body = String(d.articleBody)
        console.log(`\nJSON-LD articleBody: ${body.length} karakter`)
        const paras = body.split(/<\/p>/i)
        console.log(`  <p> sayısı: ${paras.length}`)
        paras.slice(0, 6).forEach((p, i) => console.log(`   [${i}] ${strip(p).slice(0, 100)}`))
      }
    }
  } catch {
    /* yorumlu json */
  }
}

// Sayfadaki <p> dizisi ve kapsayıcı sınıfları
const paras = [...html.matchAll(/<p[^>]*>([\s\S]{20,3000}?)<\/p>/gi)]
console.log(`\nSayfadaki <p>: ${paras.length}`)
paras.slice(0, 10).forEach((m, i) => {
  const cls = /class="([^"]*)"/.exec(m[0])?.[1] ?? ''
  console.log(`  [${i}] class="${cls.slice(0, 40)}" :: ${strip(m[1]).slice(0, 90)}`)
})

// Hangi div'ler var?
const divs = [...html.matchAll(/<div[^>]+class="([^"]+)"/gi)].map((m) => m[1])
const counts = new Map()
for (const d of divs) {
  for (const c of d.split(/\s+/)) counts.set(c, (counts.get(c) ?? 0) + 1)
}
const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14)
console.log('\nen çok geçen sınıflar:')
for (const [c, n] of top) console.log(`  ${n} x ${c.slice(0, 60)}`)
