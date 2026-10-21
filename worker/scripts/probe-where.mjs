/** Yayıncının sayfasında haber metninin gerçekten nerede durduğunu bul. */
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const url = process.argv[2]
const needle = process.argv[3]
const res = await fetch(url, { headers: { 'user-agent': UA } })
const buf = await res.arrayBuffer()
const ct = res.headers.get('content-type') ?? ''
const label = /charset=([\w-]+)/i.exec(ct)?.[1] ?? 'utf-8'
let html
try {
  html = new TextDecoder(label, { fatal: false }).decode(buf)
} catch {
  html = new TextDecoder('utf-8', { fatal: false }).decode(buf)
}

const strip = (s) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

let idx = -1
let n = 0
while ((idx = html.indexOf(needle, idx + 1)) !== -1 && n < 4) {
  n++
  console.log(`\n--- "${needle}" ${n}. bulundu (konum ${idx}) ---`)
  // 600 karakter geriye bak: hangi etiket içinde?
  const before = html.slice(Math.max(0, idx - 700), idx)
  const tags = [...before.matchAll(/<(\w+)([^>]*)>/g)]
  const last = tags[tags.length - 1]
  console.log(`  son etiket: <${last?.[1]} ${(last?.[2] ?? '').slice(0, 120)}>`)
  console.log(`  bağlam: ...${before.slice(-260).replace(/\s+/g, ' ')}`)
  console.log(`  sonrası: ${html.slice(idx, idx + 260).replace(/\s+/g, ' ')}`)
}

// articleBody var mı?
const ld = html.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/i)
console.log(`\nJSON-LD script: ${ld ? 'var' : 'yok'}`)
if (ld) {
  try {
    const d = JSON.parse(ld[1])
    console.log('  alanlar: ' + Object.keys(d).join(', '))
    if (d.articleBody) console.log('  articleBody uzunluk: ' + String(d.articleBody).length)
  } catch (e) {
    console.log('  parse edilemedi: ' + String(e.message).slice(0, 80))
  }
}

// Sayfadaki en uzun metin bloklarını (div) listele
const blocks = [...html.matchAll(/<div[^>]*class="([^"]*)"[^>]*>([\s\S]{200,200000}?)<\/div>/gi)]
const rows = blocks
  .map((m) => ({
    cls: m[1].slice(0, 50),
    text: strip(m[2]),
    len: strip(m[2]).length,
  }))
  .filter((r) => r.len > 300)
  .sort((a, b) => b.len - a.len)
  .slice(0, 6)
console.log('\nen uzun div metinleri:')
for (const r of rows) console.log(`  ${r.len} kr · class="${r.cls}"\n      ${r.text.slice(0, 130)}`)
