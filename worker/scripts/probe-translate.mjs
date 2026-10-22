/** Yabancı çevirinin tam olup olmadığını ölçer. */
import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchArticle } from '../src/article.js'
import { createGemini } from '../src/gemini.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')

const SYSTEM = `Sen Türkiye eğitim basınının editörüsün. Sana İngilizce eğitim haberleri verilir.
GÖREV: Haberleri TAM olarak Türkçeye çevir ve editle.
- Kaynak metindeki HER paragrafı çevir. Girdide kaç numaralı paragraf varsa, çıktıda da
  o kadar paragraf olsun ve SIRAYI KORU. Metni kısaltma, özetleme, atlama: bir paragrafın
  uzunluğu kaynağına yakın olmalı.
- Başlığı doğal Türkçe haber diliyle yaz (8-14 kelime).
- Özet: tek paragraf, en fazla 2 cümle, Türkçe.
- Etiketler: 2-4 adet, Türkçe.
- Sayı, tarih, yer adı ve alıntıları BİREBİR koru.
JSON dizisi döndür; id alanı girdi numarasıyla aynı olmalı.`

const SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      title: { type: 'string' },
      excerpt: { type: 'string' },
      paragraphs: { type: 'array', items: { type: 'string' } },
      tags: { type: 'array', items: { type: 'string' } },
    },
    required: ['id', 'title', 'excerpt', 'paragraphs', 'tags'],
  },
}

const raw = await readFile(resolve(ROOT, 'worker', '.env'), 'utf8')
const keys = (raw.match(/GEMINI_API_KEYS\s*=\s*(.+)/)?.[1] ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const res = await fetch('https://egitim-haberleri-api.omerzen.workers.dev/api/news?limit=500')
const d = await res.json()
const yab = d.items.filter((i) => i.lang === 'en').slice(0, 5)

const gemini = createGemini(keys, ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'])

for (const it of yab) {
  const art = await fetchArticle(it.source.url)
  const paras = art.paragraphs ?? []
  if (!paras.length) {
    console.log('kaynak metin yok:', it.title.slice(0, 40))
    continue
  }
  const srcChars = paras.join(' ').length
  const input = `1. TITLE: ${art.title}\n   BODY:\n${paras.map((p, k) => `[${k + 1}] ${p}`).join('\n')}\n   SOURCE: ${it.source.name}`
  const t0 = Date.now()
  let out = []
  try {
    out = await gemini.call({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: `${input}\n\n1 haber çevir.` }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 32768,
        responseMimeType: 'application/json',
        responseSchema: SCHEMA,
      },
    })
  } catch (err) {
    console.log('HATA:', String(err?.message ?? err).slice(0, 160))
    continue
  }
  const row = (out ?? [])[0]
  const trChars = (row?.paragraphs ?? []).join(' ').length
  console.log(
    `kaynak ${srcChars} kr (${paras.length} pr) -> ceviri ${trChars} kr (${(row?.paragraphs ?? []).length} pr) | %${Math.round((trChars / srcChars) * 100)} | ${((Date.now() - t0) / 1000).toFixed(0)} sn`,
  )
  console.log('   baslik:', row?.title?.slice(0, 70))
  console.log('   ilk paragraf:', row?.paragraphs?.[0]?.slice(0, 110))
}
