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

const CLEAN_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      paragraphs: { type: 'array', items: { type: 'string' } },
    },
    required: ['id', 'paragraphs'],
  },
}

const CLEAN_SYSTEM = `Sen Türkiye eğitim basınının editörüsün. Haber sayfalarından kopyalanan metinlerde
çöp vardır: reklamlar, "ilgili haberler", "en çok okunanlar", başka haberlerin başlıkları, yazar künyesi,
paylaşım butonları, çerez bildirimi, canlı yayın kutusu, " haberin devamı", kaynakça, reklam etiketleri.

GÖREV: Metni temizle.
- Haberin özünü, olay öğelerini, sayıları, tarihleri, yer adlarını, alıntıları ve kurum adlarını KORU.
- Metni KISALTMA. Alaksız girdileri çıkar; cümleleri düzgün Türkçeye getir.
- Her paragrafı ayrı paragraf olarak koru; boş paragraf bırakma.
- Yorum, reklam ya da yazar ekleme. Haber dışı hiçbir şey ekleme.
JSON dizisi döndür; id alanı girdi numarasıyla aynı olmalı.`

/**
 * Haber gövdelerini toplu hâlde temizler.
 *
 * Kaynak sayfalarda reklam, "ilgili haberler" ve benzeri kalıntılar
 * bulunuyor; bunlar hem metni bozuyor hem de sesli okumada okunuyor.
 * Ucuz model (flash-lite) toplu çalışıyor.
 *
 * @param {Array<{paragraphs?:string[]}>} clusters
 * @returns {Promise<Map<string,string[]>>} id -> temiz paragraflar
 */
export async function cleanBodies(gemini, clusters) {
  const targets = clusters.filter((c) => (c.paragraphs?.length ?? 0) >= 2)
  if (targets.length === 0) return new Map()

  const out = new Map()
  const BATCH = 8
  for (let i = 0; i < targets.length; i += BATCH) {
    const chunk = targets.slice(i, i + BATCH)
    const input = chunk
      .map((c, j) => `${j + 1}. BAŞLIK: ${c.title}\n   METİN:\n${c.paragraphs.join('\n')}`)
      .join('\n\n')
    try {
      const data = await gemini.call({
        systemInstruction: { parts: [{ text: CLEAN_SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: `${input}\n\n${chunk.length} haber temizle.` }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 16384,
          responseMimeType: 'application/json',
          responseSchema: CLEAN_SCHEMA,
        },
      })
      const byId = new Map(chunk.map((c, j) => [j + 1, c]))
      for (const d of Array.isArray(data) ? data : []) {
        const c = byId.get(d.id)
        if (!c || !Array.isArray(d.paragraphs) || d.paragraphs.length === 0) continue
        const clean = d.paragraphs
          .map((p) => String(p ?? '').trim())
          .filter((p) => p.length >= 60)
        // Temizlenmiş metin, orijinalin en az yarısı kadar olmalı; değilse
        // model metni gereksiz yere kısaltmış demektir, orijinali koru.
        const origChars = c.paragraphs.join(' ').length
        const newChars = clean.join(' ').length
        if (clean.length >= 2 && newChars >= origChars * 0.5) {
          out.set(c.key, clean)
        }
      }
    } catch {
      /* temizleme başarısız olursa orijinal metin korunur */
    }
  }
  return out
}

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
