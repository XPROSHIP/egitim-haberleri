/** star.com.tr sayfasında haber gövdesinin nerede bittiğini ara. */
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const url = process.argv[2]
const res = await fetch(url, { headers: { 'user-agent': UA } })
const html = await res.text()
const strip = (s) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

console.log(`HTTP ${res.status} · ${(html.length / 1024).toFixed(0)} KB`)

// h1 başlık nerede?
const h1 = html.match(/<h1[^>]*>([\s\S]{0,200}?)<\/h1>/i)
console.log(`h1: ${h1 ? strip(h1[1]).slice(0, 90) : '(yok)'}`)

// "İlgili" / "diğer" gibi blok başlıkları
for (const m of html.matchAll(/<(h2|h3|h4|div|span)[^>]*>([\s\S]{0,120}?)<\/\1>/gi)) {
  const t = strip(m[2])
  if (/^(ilgili|diğer|en çok|benzer|öne çıkan|haberler|manşet)/i.test(t) && t.length < 80) {
    console.log(`  blok basligi <${m[1]}>: "${t}"`)
  }
}

// og:description
const desc = html.match(/<meta[^>]+(?:property|name)="(?:og:description|description)"[^>]+content="([^"]+)"/i)
console.log(`aciklama: ${desc ? desc[1].slice(0, 120) : '(yok)'}`)

// Her <p> icin: h1'den sonra mi, "ilgili" basligindan once mi?
const paras = [...html.matchAll(/<p[^>]*>([\s\S]{20,3000}?)<\/p>/gi)]
console.log(`\n<p> sayisi: ${paras.length}`)
paras.slice(0, 20).forEach((m, i) => {
  const t = strip(m[1])
  console.log(`  [${i}] ${t.slice(0, 95)}`)
})
