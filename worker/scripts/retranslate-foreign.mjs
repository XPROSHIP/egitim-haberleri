/**
 * Yabancı (İngilizce) haberlerin Türkçe çevirisini yeniden yapar.
 *
 * Geriye dönük metin doldurma sırasında İngilizce kaynaklı haberlerin
 * gövdesi Türkçe çeviri yerine İngilizce orijinaliyle ezildi. Bu betik
 * çeviriyi yeniden üretip yazar.
 *
 * Kullanım:  node worker/scripts/retranslate-foreign.mjs
 */
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createGemini } from '../src/gemini.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const API = process.env.VITE_API_URL ?? 'https://egitim-haberleri-api.omerzen.workers.dev'
const SECRET = (process.env.COLLECT_SECRET ?? '').trim()
const BATCH = 6

const SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      title: { type: 'string' },
      excerpt: { type: 'string' },
      paragraphs: { type: 'array', items: { type: 'string' } },
    },
    required: ['id', 'title', 'excerpt', 'paragraphs'],
  },
}

const SYSTEM = `Sen Türkiye eğitim basınının editörüsün. Sana İngilizce eğitim haberleri verilir.
GÖREV: Haberleri Türkçeye çevir ve editle.
- Başlığı doğal Türkçe haber diliyle yaz (8-14 kelime). Cümle başı büyük harfle başlar, özel adlar büyük harfle korunur. TÜM HARFLERİ BÜYÜK YAZMA.
- Özet: tek paragraf, en fazla 2 cümle, Türkçe.
- Gövde: kaynaktaki tüm paragrafları çevir, kısaltma. Her paragraf 2-4 cümle olabilir. Kaynakta olmayan ayrıntı ekleme.
- Kurum adlarını çevirme: "University of Oxford" -> "Oxford Üniversitesi", "Harvard" -> "Harvard".
- Sayı, tarih ve yer adlarını olduğu gibi koru.
JSON dizisi döndür; id alanı girdi numarasıyla aynı olmalı.`

async function keys() {
  const raw = await readFile(resolve(ROOT, 'worker', '.env'), 'utf8')
  const m = raw.match(/GEMINI_API_KEYS\s*=\s*(.+)/)
  return (m?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  if (!SECRET) throw new Error('COLLECT_SECRET boş')
  const res = await fetch(`${API}/api/news?limit=500`)
  const data = await res.json()
  const foreign = (data.items ?? []).filter((i) => i.lang === 'en')
  console.log(`[retranslate] ${foreign.length} yabancı haber bulundu`)

  const gemini = createGemini(await keys(), [
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
  ])

  const out = []
  for (let i = 0; i < foreign.length; i += BATCH) {
    const chunk = foreign.slice(i, i + BATCH)
    const input = chunk
      .map(
        (c, j) =>
          `${j + 1}. TITLE: ${c.rawTitle ?? c.title}\n   BODY: ${(c.body ?? []).join('\n').slice(0, 4000)}\n   SOURCE: ${c.source.name}`,
      )
      .join('\n\n')
    try {
      const res = await gemini.call({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: `${input}\n\n${chunk.length} haber çevir.` }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 16384,
          responseMimeType: 'application/json',
          responseSchema: SCHEMA,
        },
      })
      const byId = new Map(chunk.map((c, j) => [j + 1, c]))
      for (const d of res ?? []) {
        const c = byId.get(d.id)
        if (!c || !d.paragraphs?.length) continue
        out.push({
          slug: c.slug,
          body: d.paragraphs,
          excerpt: d.excerpt || d.paragraphs[0].slice(0, 240),
        })
      }
      console.log(`  ${Math.min(i + BATCH, foreign.length)}/${foreign.length} çevrildi`)
    } catch (err) {
      console.warn(`  hata: ${String(err?.message ?? err).slice(0, 120)}`)
    }
    await sleep(600)
  }

  for (let i = 0; i < out.length; i += 20) {
    const chunk = out.slice(i, i + 20)
    const r = await fetch(`${API}/api/refill`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-collect-secret': SECRET },
      body: JSON.stringify({ items: chunk }),
    })
    const j = await r.json().catch(() => ({}))
    console.log(`  yazıldı: ${j.updated ?? '?'} (${i + chunk.length}/${out.length})`)
    await sleep(250)
  }
  console.log(`[retranslate] tamam · ${out.length} haber çevrildi`)
}

main().catch((err) => {
  console.error('[retranslate] hata:', err)
  process.exit(1)
})
