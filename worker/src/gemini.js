/** Gemini istemcisi: çoklu anahtar rotasyonu + toplu özetleme (ücretsiz katman). */
import { GEMINI_MODEL, GEMINI_MODELS } from './config.js'

const ENDPOINT = (model, key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

const CATEGORY_ENUM = [
  'mesleki', 'mesem', 'meb', 'corum', 'ortaogretim',
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
      category: { type: 'string', enum: CATEGORY_ENUM },
      tags: { type: 'array', items: { type: 'string' } },
      province: { type: 'string' },
      featured: { type: 'boolean' },
    },
    required: ['id', 'title', 'excerpt', 'paragraphs', 'category', 'tags'],
  },
}

export function createGemini(rawKeys, modelOrModels = GEMINI_MODEL) {
  const keys = (Array.isArray(rawKeys) ? rawKeys : String(rawKeys ?? '').split(','))
    .map((k) => k.trim())
    .filter(Boolean)

  const models = (Array.isArray(modelOrModels) ? modelOrModels : [modelOrModels]).filter(Boolean)
  if (!models.includes(GEMINI_MODEL)) models.unshift(GEMINI_MODEL)

  const health = keys.map(() => ({ fails: 0, blockedUntil: 0 }))
  let cursor = 0

  function pick() {
    const now = Date.now()
    for (let i = 0; i < keys.length; i++) {
      const idx = (cursor + i) % keys.length
      if (health[idx].blockedUntil < now) {
        cursor = (idx + 1) % keys.length
        return idx
      }
    }
    // Tümü geçici olarak engelliyse en çok başarısız olana dön
    const idx = health.findIndex((h) => h.blockedUntil === Math.min(...health.map((x) => x.blockedUntil)))
    return idx >= 0 ? idx : 0
  }

  async function callOnce(payload) {
    if (keys.length === 0) throw new Error('GEMINI_API_KEYS boş')
    let lastError = null

    // Model yedekleme: 5xx alınırsa sıradaki modele geçilir. Anahtar
    // döndürme tek başına yetmez, çünkü tüm anahtarlar aynı modele gider.
    for (const model of models) {
      for (let attempt = 0; attempt < keys.length; attempt++) {
        const idx = pick()
        try {
          const res = await fetch(ENDPOINT(model, keys[idx]), {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          })

          if (res.ok) {
            const json = await res.json()
            health[idx].fails = 0
            const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
            if (!text) throw new Error('Boş yanıt')
            return JSON.parse(text)
          }

          const detail = await res.text()
          lastError = new Error(`Gemini ${res.status} (${model}): ${detail.slice(0, 160)}`)
          if (res.status === 429 || res.status >= 500) {
            health[idx].fails++
            if (health[idx].fails >= 2) {
              health[idx].blockedUntil = Date.now() + 5 * 60_000
            }
            await sleep(350 * (attempt + 1))
            continue
          }
          // 400/403 gibi hatalarda diğer anahtar/modele geçmenin anlamı yok
          break
        } catch (err) {
          lastError = err
          await sleep(250 * (attempt + 1))
        }
      }
    }
    throw lastError ?? new Error('Gemini isteği başarısız')
  }

  return { call: callOnce, keys: keys.length }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const SYSTEM_PROMPT = `Sen Türkiye eğitim basınının kıdemli editörüsün. sana ham haber başlıkları ve kaynak künyesi verilir.
KURALLAR:
- Yalnızca verilen kaynak bilgilerine dayan; uydurma bilgi, sayı, tarih veya kurum ekleme.
- Başlık: Türkçe ve doğal yazımla yaz, 8-14 kelime. Cümle başı büyük harfle başlar. Özel adlar (şehir, okul, bakanlık, kurum adları) büyük harfle yazılır. Reklam ve clickbait yok, kaynaktaki olgunluğu korunur.
- Özet: tek paragraf, en fazla 2 cümle, okuru bilgilendirir.
- Gövde: 2-3 kısa paragraf (her biri 2-3 cümle), kaynakta olmayan ayrıntıyı yazma.
- Etiketler: 2-4 adet, Türkçe, büyük harf, en fazla 3 kelime.
- Kategori: verilen listeden birini seç.
- featured yalnızca gerçekten önemli ve geniş etkili bir gelişme için true olsun.
BAŞLIK ÖRNEKLERİ (doğru biçim):
  ✓ "Milli eğitim bakanlığı 2026-2027 öğretmen ataması takvimini açıkladı"
  ✓ "Çorum'da 12 yeni mesleki eğitim laboratuvarı açıldı"
  ✗ "Milli Eğitim Bakanlığı 2026-2027 Öğretmen Ataması Takvimini Açıkladı" (her kelime büyük harf olmaz)
JSON dizisi döndür; id alanı girdi numarasıyla aynı olmalı.`

export async function enrichWithGemini(gemini, clusters) {
  if (clusters.length === 0) return []

  const input = clusters
    .map(
      (c, i) =>
        `${i + 1}. BAŞLIK: ${c.title}\n   KAYNAK: ${c.sourceName}\n   ÖZET: ${(c.description || '').slice(0, 320)}\n   TARİH: ${c.publishedAt}`,
    )
    .join('\n\n')

  const data = await gemini.call({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: `${input}\n\n${clusters.length} kayıt işle.` }] }],
    generationConfig: {
      temperature: 0.25,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      responseSchema: SCHEMA,
    },
  })

  if (!Array.isArray(data)) return []
  const byId = new Map(clusters.map((c, i) => [i + 1, c]))
  return data
    .filter((d) => byId.has(d.id) && d.title && d.excerpt)
    .map((d) => ({ cluster: byId.get(d.id), ai: d }))
}
