/** AA ve benzeri sayfalarda govdeyi bulmaya calisir. */
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const url = process.argv[2]
const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' } })
const html = await res.text()
console.log(`HTTP ${res.status} · ${(html.length / 1024).toFixed(0)} KB`)

const strip = (s) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// JSON-LD articleBody
for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
  try {
    const data = JSON.parse(m[1])
    const arr = Array.isArray(data) ? data : [data]
    for (const d of arr) {
      if (d?.articleBody) {
        console.log(`JSON-LD articleBody: ${d.articleBody.length} karakter`)
        console.log(`  ${d.articleBody.slice(0, 200)}`)
      }
    }
  } catch {
    /* yorumlu json olabilir */
  }
}

// data-test veya sinifli govde kutulari
for (const re of [
  /data-test="[^"]*content[^"]*"[^>]*>([\s\S]{200,200000}?)<\/div>/gi,
  /class="[^"]*detay-icerik[^"]*"[^>]*>([\s\S]{200,200000}?)<\/div>/gi,
  /class="[^"]*news-detail[^"]*"[^>]*>([\s\S]{200,200000}?)<\/div>/gi,
  /id="[^"]*content[^"]*"[^>]*>([\s\S]{200,200000}?)<\/div>/gi,
]) {
  for (const m of html.matchAll(re)) {
    const ps = [...m[1].matchAll(/<p[^>]*>([\s\S]{40,3000}?)<\/p>/gi)].map((x) => strip(x[1]))
    const total = ps.reduce((a, b) => a + b.length, 0)
    console.log(`kutu: ${ps.length} paragraf · ${total} kr`)
    ps.slice(0, 2).forEach((p) => console.log(`   · ${p.slice(0, 110)}`))
  }
}

// Butun <p> etiketleri
const all = [...html.matchAll(/<p[^>]*>([\s\S]{40,3000}?)<\/p>/gi)].map((m) => strip(m[1]))
console.log(`toplam <p>: ${all.length} · ${all.reduce((a, b) => a + b.length, 0)} kr`)
all.slice(0, 3).forEach((p) => console.log(`   · ${p.slice(0, 110)}`))
