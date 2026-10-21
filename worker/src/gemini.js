/** Gemini istemcisi: çoklu anahtar rotasyonu + toplu özetleme (ücretsiz katman). */
import { GEMINI_MODEL, GEMINI_MODELS } from './config.js'
import { isJunkParagraph } from './article.js'

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
      text: { type: 'string' },
    },
    required: ['id', 'text'],
  },
}

const CLEAN_SYSTEM = `Sen Türkiye eğitim basınının editörüsün. Haber sayfalarından alınan metinlerde çöp vardır.

KURAL 1 — ALT BAŞLIKLAR KORUNUR (öncelikli):
Metinde kısa, kalın (başlık gibi) satırlar vardır. Bunlar haberin alt başlıklarıdır.
- Bu satırların text'ini BOŞ BIRAKMA, OLDUĞU GİBİ YAZ.
- Tek istisna: BÜYÜK HARFLİ ve TİRE İLE BAŞLAYAN bir başlık (örneğin
  "- 8 ÜLKEDE 50 BİN ÇOCUĞA YÜZ YÜZE EĞİTİM") ve hemen ardından gelen 2-4 paragraf
  birlikte "ilgili haber" reklamıdır. O durumda: başlığın text'ini boş bırak VE
  başlıktan sonraki 2-4 paragrafın text'ini de boş bırak.

KURAL 2 — ALAKSIZ PARAGRAFLAR:
Reklam, "ilgili haberler", "en çok okunanlar", menü, arama kutusu, künye, yazar bilgisi,
paylaşım butonları, "abone ol", adres/telefon/e-posta bilgileri, erişilebilirlik araçları,
yazı tipi / sayfa genişliği seçenekleri, tarih-saat satırları hep alaksızdır: text boş olsun.

KURAL 3 — HABER METNİ KORUNUR:
- Habere ait paragrafların text'ini TAMAMEN yaz; KISAĞINA KISALTMA, özetleme.
  Yalnızca bozuk cümleleri ve yazımı düzelt.
- Sayıları, tarihleri, yer adlarını, kurum adlarını ve alıntıları BİREBİR koru.
- Yorum, reklam ya da yeni bilgi ekleme.

ÇIKTI: Her girdi paragrafı için bir kayıt üret: id = paragrafın sırası (1'den başlar),
text = o paragrafın temizlenmiş metni (alaksızsa boş string).
Kaç paragraf girdiysen o kadar kayıt üret; id'ler 1'den başlayarak sıralı olsun.
JSON dizisi döndür.`

/**
 * Haber gövdelerini toplu hâlde temizler.
 *
 * Kaynak sayfalarda reklam, "ilgili haberler" ve benzeri kalıntılar
 * bulunuyor; bunlar hem metni bozuyor hem de sesli okumada okunuyor.
 * Ucuz model (flash-lite) toplu çalışıyor.
 *
 * @param {Array<{paragraphs?:string[], title?:string}>} clusters
 * @returns {Promise<Map<string,string[]>>} anahtar -> temiz paragraflar
 */
export async function cleanBodies(gemini, clusters) {
  const targets = clusters.filter((c) => (c.paragraphs?.length ?? 0) >= 2)
  if (targets.length === 0) return new Map()

  const out = new Map()
  // Her haber tek tek gönderilir: model paragraf sayısını korusun diye
  // 1:1 eşleme şeması kullanılıyor (id = paragraf sırası).
  for (const c of targets) {
    const paras = c.paragraphs.map((p, k) => `[${k + 1}] ${p}`).join('\n')
    const input = `BAŞLIK: ${c.title}\n\nPARAGRAFLAR:\n${paras}`
    try {
      const rows = await gemini.call({
        systemInstruction: { parts: [{ text: CLEAN_SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: `${input}\n\nBu haberin paragraflarini temizle.` }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 16384,
          responseMimeType: 'application/json',
          responseSchema: CLEAN_SCHEMA,
        },
      })
      const list = (Array.isArray(rows) ? rows : [])
        .map((d) => ({ para: Number(d?.id), text: String(d?.text ?? '').trim() }))
        .filter((r) => Number.isInteger(r.para) && r.para >= 1)
        .sort((a, b) => a.para - b.para)

      // Model "ilgili haber" promo başlıklarını boşaltıyor; o bloğun devamı
      // da aynı reklama ait. Başlığı kod tarafında tanıyıp devamını da
      // düşürüyoruz (belirsizlik bırakmıyoruz).
      const drop = new Set(list.filter((r) => !r.text).map((r) => r.para))
      for (const n of [...drop]) {
        const original = String(c.paragraphs[n - 1] ?? '')
        // Alt başlık işaretli blok ("## ...") veya büyük harfli/tireli başlık
        // → promo başlığı olabilir.
        const isPromoHeading =
          (original.startsWith('## ') && original.length < 160) ||
          (original.length < 140 &&
            /^\s*[-–—•]?\s*[A-ZÇĞİÖŞÜ0-9 ,.'!?"“”()&/-]{10,}$/.test(original))
        if (!isPromoHeading) continue
        for (let k = n + 1; k <= n + 3; k++) drop.add(k)
      }

      const clean = list
        .filter((r) => !drop.has(r.para) && r.text.length >= 30)
        .filter((r) => !isJunkParagraph(r.text))
        .map((r) => r.text)
      if (clean.length < 2) continue
      const origChars = c.paragraphs.join(' ').length
      const newChars = clean.join(' ').length
      // Çok fazla kısalma olursa model özetlemiş demektir, orijinali koru.
      if (newChars >= origChars * 0.35) out.set(c.key, clean)
    } catch (err) {
      console.warn(`[temizleme] hata: ${String(err?.message ?? err).slice(0, 140)}`)
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
