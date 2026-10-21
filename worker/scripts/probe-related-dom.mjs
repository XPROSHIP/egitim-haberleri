/** star.com.tr: ilgili haber bloğunun DOM yapısı. */
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const url = process.argv[2]
const res = await fetch(url, { headers: { 'user-agent': UA } })
const buf = await res.arrayBuffer()
const html = new TextDecoder('iso-8859-9', { fatal: false }).decode(buf)

const needle = process.argv[3] ?? '8 ÜLKEDE'
const i = html.indexOf(needle)
console.log(`"${needle}" konumu: ${i}`)
if (i > 0) {
  const chunk = html.slice(Math.max(0, i - 1400), i + 300)
  console.log('--- öncesi ---')
  console.log(chunk.replace(/\s+/g, ' ').slice(-1700))
}
