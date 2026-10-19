/**
 * Yayınlanmış başlıkları kaynak başlığa göre yeniden biçimlendirir.
 * Kullanım: node worker/scripts/retitle.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeTitleCase } from '../src/text.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const file = path.join(root, 'src/data/collected.json')
const data = JSON.parse(fs.readFileSync(file, 'utf8'))

let changed = 0
for (const item of data) {
  const before = item.title
  item.title = normalizeTitleCase(before ?? '', item.rawTitle ?? '', {
    bodyText: item.fullText ? (Array.isArray(item.body) ? item.body : [item.body]) : [],
  })
  if (item.title !== before) changed += 1
}
fs.writeFileSync(file, JSON.stringify(data, null, 2))

console.log(`yeniden biçimlendirilen: ${changed}/${data.length}\n`)
for (const item of data) console.log(' ·', item.title)