#!/usr/bin/env node
/**
 * Ham/bozuk başlıkları Gemini ile yeniden yazar.
 * Gemini çöktüğü turlarda başlıklar kaynaktaki biçimiyle (TÜM BÜYÜK HARF,
 * " - son dakika ..." ekleri, HTML kaçışları) kaydedilmiş oluyor.
 *
 *   node worker/scripts/retitle-gemini.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')
const outFile = path.join(root, 'src/data/collected.json')

const env = { ...process.env }
try {
  for (const line of fs.readFileSync(path.join(root, 'worker/.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
    if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  /* yoksa süreç ortamına güvenilir */
}
const keys = (env.GEMINI_API_KEYS ?? '').split(',').map((k) => k.trim()).filter(Boolean)
if (!keys.length) {
  console.error('GEMINI_API_KEYS yok')
  process.exit(1)
}

const { createGemini } = await import(pathToFileURL(path.join(here, '../src/gemini.js')).href)
const { GEMINI_MODELS } = await import(pathToFileURL(path.join(here, '../src/config.js')).href)
const { normalizeTitleCase } = await import(pathToFileURL(path.join(here, '../src/text.js')).href)

const data = JSON.parse(fs.readFileSync(outFile, 'utf8'))

/** Başlığın yeniden yazılmaya ihtiyacı var mı? */
function needsRewrite(item) {
  const t = item.title ?? ''
  if (!t) return true
  const letters = t.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, '')
  if (letters.length > 12) {
    const upper = letters.replace(/[^A-ZÇĞİÖŞÜ]/g, '').length
    // Başlığın büyük harf oranı çok yüksekse ham kaynak başlığıdır
    if (upper / letters.length > 0.75) return true
  }
  if (/&quot;|&#39;|&amp;|&lt;|&#\d+;/.test(t)) return true
  if (/\s[-–—|]\s/.test(t)) return true
  if (t === item.rawTitle) return true
  return false
}

// --all: mevcut başlıkların hepsini yeniden yaz (küçük harfli özel adlar düzelsin)
const ALL = process.argv.includes('--all')
const hedef = ALL ? data.filter((i) => i.title) : data.filter(needsRewrite)
console.log(`${data.length} kayıttan ${hedef.length} tanesi yeniden yazılacak`)

if (!hedef.length) process.exit(0)

const gemini = createGemini(keys, GEMINI_MODELS)
const SYSTEM = `Sen Türkiye eğitim basınının kıldır editörüsün. Sana haber başlıkları verilir.
KURALLAR:
- Yalnızca verilen kaynak bilgilerine dayan; uydurma bilgi, sayı, tarih veya kurum ekleme.
- Başlık: Türkçe ve doğal yazımla yaz, 8-14 kelime. Cümle başı büyük harfle başlar.
  Özel adlar (şehir, okul, bakanlık, kurum, marka) büyük harfle yazılır. TÜM HARFLERİ BÜYÜK YAZMA.
- Özet: tek paragraf, en fazla 2 cümle.
- Gövde: 2-3 kısa paragraf, kaynakta olmayan ayrıntıyı yazma.
- Etiketler: 2-4 adet, Türkçe, büyük harf.
- Kategori: verilen listeden birini seç.
JSON dizisi döndür; id alanı girdi numarasıyla aynı olmalı.`

const CATS = [
  'mesleki', 'mesem', 'meb', 'corum', 'liseler', 'ortaogretim',
  'ilkogretim', 'maarif', 'universite', 'sinav', 'yabanci', 'gundem',
]
const SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      title: { type: 'string' },
      excerpt: { type: 'string' },
      paragraphs: { type: 'array', items: { type: 'string' } },
      category: { type: 'string', enum: CATS },
      tags: { type: 'array', items: { type: 'string' } },
    },
    required: ['id', 'title', 'excerpt', 'paragraphs', 'category', 'tags'],
  },
}

const BATCH = 15
let degisen = 0

for (let bas = 0; bas < hedef.length; bas += BATCH) {
  const grup = hedef.slice(bas, bas + BATCH)
  const input = grup
    .map(
      (it, i) =>
        `${i + 1}. BAŞLIK: ${it.title}\n   KAYNAK: ${it.source?.name ?? ''}\n   ÖZET: ${(it.excerpt ?? '').slice(0, 300)}\n   TARİH: ${it.publishedAt}`,
    )
    .join('\n\n')

  let out = []
  try {
    out = await gemini.call({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: `${input}\n\n${grup.length} kayıt işle.` }] }],
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: SCHEMA,
      },
    })
  } catch (e) {
    console.log(`  grup ${bas / BATCH + 1} atlandı: ${String(e.message).slice(0, 70)}`)
    continue
  }

  for (const d of out ?? []) {
    const item = grup[d.id - 1]
    if (!item || !d.title) continue
    const yeni = normalizeTitleCase(d.title, item.rawTitle ?? d.title)
    if (yeni !== item.title) {
      item.title = yeni
      degisen += 1
    }
    if (d.excerpt) item.excerpt = d.excerpt
    if (d.paragraphs?.length) item.body = d.paragraphs
    if (d.category) item.category = d.category
    if (d.tags?.length) item.tags = [...new Set([...d.tags, ...(item.tags ?? [])])]
  }
  console.log(`  ${Math.min(bas + BATCH, hedef.length)}/${hedef.length} işlendi`)
}

fs.writeFileSync(outFile, JSON.stringify(data, null, 2))
console.log(`\n${degisen} başlık yeniden yazıldı`)
for (const it of data.slice(0, 10)) console.log('  ·', it.title.slice(0, 80))