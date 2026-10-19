#!/usr/bin/env node
/**
 * Veritabanındaki bozuk HTML entity'lerini düzeltir.
 * Toplayıcı artık `he` ile çözdüğü için yeni veriler temiz; eski kayıtlar
 * ("CNN T&uuml;rk") bu betikle bir kez düzeltilir.
 *
 *   node worker/scripts/fix-entities.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')
const file = path.join(root, 'src/data/collected.json')

const { decodeEntities } = await import(pathToFileURL(path.join(here, '../src/rss.js')).href)

const data = JSON.parse(fs.readFileSync(file, 'utf8'))
let degisen = 0

for (const item of data) {
  const once = {
    title: decodeEntities(item.title ?? ''),
    excerpt: decodeEntities(item.excerpt ?? ''),
    body: (item.body ?? []).map((p) => decodeEntities(p)),
    rawTitle: item.rawTitle ? decodeEntities(item.rawTitle) : item.rawTitle,
  }
  if (
    once.title !== item.title ||
    once.excerpt !== item.excerpt ||
    once.rawTitle !== item.rawTitle ||
    once.body.some((p, i) => p !== (item.body ?? [])[i])
  ) {
    degisen += 1
    Object.assign(item, once)
  }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2))
console.log(`${degisen} kaydin metni duzeltildi (toplam ${data.length})`)

const ornek = data.find((i) => /Türk|Böyle|açıklam/.test(i.body.join(' ')))
if (ornek) {
  console.log('\nornek govde:')
  console.log('  ' + ornek.body.join(' ').slice(0, 300))
}
