/** pickBodyScope hata ayıklama */
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const url = process.argv[2]
const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' } })
const html = await res.text()
console.log(`HTTP ${res.status} · ${html.length} bayt`)

const strip = (s) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const candidates = []
for (const m of html.matchAll(/<(article|main)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
  candidates.push(['article/main', m[2]])
}
const boxRe =
  /<(?:div|section)\b[^>]*(?:itemprop|class|id)\s*=\s*["'][^"']*(?:article-?body|articleBody|post-?body|entry-?content|post-?content|story-?body|news-?content|text-?content|haber|icerik|content)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/gi
for (const m of html.matchAll(boxRe)) candidates.push(['box', m[1]])
const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)
if (body) candidates.push(['body', body[1]])
console.log(`aday sayisi: ${candidates.length}`)

let best = ''
let bestChars = 0
for (const [name, c] of candidates) {
  let chars = 0
  let n = 0
  for (const p of c.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)) {
    const t = strip(p[1])
    if (t.split(' ').length > 12) {
      chars += t.length
      n++
    }
  }
  console.log(`  ${name.padEnd(14)} ${String(c.length).padStart(7)} bayt · ${n} paragraf · ${chars} kr`)
  if (chars > bestChars) {
    bestChars = chars
    best = c
  }
}
console.log(`\nen iyi: ${bestChars} kr`)
const ps = [...best.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => strip(m[1]))
console.log(`p sayisi: ${ps.length}`)
ps.slice(0, 4).forEach((p, i) => console.log(`  [${i}] (${p.length}) ${p.slice(0, 100)}`))
