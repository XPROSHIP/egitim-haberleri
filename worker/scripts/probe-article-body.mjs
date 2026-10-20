/** Hürriyet haber sayfasının gerçek gövdesi nerede? */
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const url =
  process.argv[2] ??
  'https://www.hurriyet.com.tr/egitim/turkiye-yuzyili-maarif-modelinin-3uncu-uygulama-yili-43338381'

const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' } })
const html = await res.text()
console.log(`HTTP ${res.status} · ${(html.length / 1024).toFixed(0)} KB\n`)

const strip = (s) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// Tüm <p> etiketlerini sınıfına göre grupla
const groups = new Map()
for (const m of html.matchAll(/<p([^>]*)>([\s\S]{20,4000}?)<\/p>/gi)) {
  const attrs = m[1]
  const cls = (attrs.match(/class=["']([^"']+)["']/i)?.[1] ?? '(sinif yok)').slice(0, 70)
  const text = strip(m[2])
  if (text.length < 60) continue
  const g = groups.get(cls) ?? { n: 0, chars: 0, sample: '' }
  g.n += 1
  g.chars += text.length
  if (!g.sample) g.sample = text.slice(0, 90)
  groups.set(cls, g)
}

console.log('--- <p> etiketleri sınıf bazında ---')
;[...groups.entries()]
  .sort((a, b) => b[1].chars - a[1].chars)
  .slice(0, 10)
  .forEach(([cls, g]) => {
    console.log(`  ${String(g.n).padStart(3)} p · ${String(g.chars).padStart(6)} kr · ${cls}`)
    console.log(`        ${g.sample}`)
  })

// Bizim kullandigimiz kapsayici
for (const [name, re] of [
  ['<article>', /<article[\s\S]*?<\/article>/i],
  ['itemprop=articleBody', /itemprop=["']articleBody["'][\s\S]{0,200000}/i],
  ['class*=article-body', /class=["'][^"']*article-?body[^"']*["'][\s\S]{0,200000}/i],
  ['id=content', /id=["']content["'][\s\S]{0,200000}/i],
  ['class*=content', /class=["'][^"']*content[^"']*["'][\s\S]{0,200000}/i],
]) {
  const m = html.match(re)
  if (!m) {
    console.log(`\n${name}: yok`)
    continue
  }
  const ps = [...m[0].matchAll(/<p[^>]*>([\s\S]{40,3000}?)<\/p>/gi)].map((x) => strip(x[1])).filter((t) => t.length > 60)
  console.log(`\n${name}: ${m[0].length} bayt · ${ps.length} paragraf · ${ps.reduce((a, b) => a + b.length, 0)} kr`)
  ps.slice(0, 2).forEach((p) => console.log(`   · ${p.slice(0, 110)}`))
}
