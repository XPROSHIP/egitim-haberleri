/**
 * Yabancı dilde eğitim haberleri.
 *
 * İngilizce kaynaklardan eğitim gündemi haberleri alınır, hızlı modelle Türkçeye
 * çevrilir ve normal haber akışıyla aynı biçimde yayınlanır.
 */
import { fetchFeed } from './rss.js'
import { fetchArticle } from './article.js'
import { createGemini } from './gemini.js'
import { hash } from './text.js'
import {
  FOREIGN_EDU_TERMS,
  FOREIGN_FEEDS,
  MAX_FOREIGN_PER_RUN,
  MAX_FOREIGN_PER_SOURCE,
  TRANSLATE_MODEL,
} from './config.js'

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

const SYSTEM = `Sen Türkiye eğitim basınının editörüsün. Sana İngilizce eğitim haberleri verilir.
GÖREV: Haberleri TAM olarak Türkçeye çevir ve editle.
- Kaynak metindeki HER paragrafı çevir. Girdide kaç numaralı paragraf varsa, çıktıda da
  o kadar paragraf olsun ve SIRAYI KORU. Metni kısaltma, özetleme, atlama: bir paragrafın
  uzunluğu kaynağına yakın olmalı.
- Başlığı doğal Türkçe haber diliyle yaz (8-14 kelime). Cümle başı büyük harfle başlar, özel adlar büyük harfle korunur. TÜM HARFLERİ BÜYÜK YAZMA.
- Özet: tek paragraf, en fazla 2 cümle, Türkçe; kaynağın özünü yansıtır.
- Etiketler: 2-4 adet, Türkçe, büyük harf, en fazla 3 kelime.
- Kurum adlarını çevirme: "University of Oxford" -> "Oxford Üniversitesi", "Harvard" -> "Harvard".
- Sayı, tarih, yer adı, alıntı ve istatistikleri BİREBİR koru.
- Yorum, yorum alıntısı veya yeni bilgi ekleme.
JSON dizisi döndür; id alanı girdi numarasıyla aynı olmalı.`

const isEducation = (text) => {
  const t = text.toLowerCase()
  return FOREIGN_EDU_TERMS.some((term) => t.includes(term))
}

/**
 * Yabancı dilde eğitim haberlerini toplar ve çevirir.
 * @returns {Promise<Array>} yayınlanabilir haber kayıtları
 */
export async function collectForeign({
  keys,
  logger = console,
  saveImage = null,
  knownUrls = new Set(),
  max = MAX_FOREIGN_PER_RUN,
} = {}) {
  const results = await Promise.allSettled(
    FOREIGN_FEEDS.map(async (src) => {
      const items = await fetchFeed(src.url)
      return items.map((i) => ({ ...i, sourceName: src.name, sourceUrl: src.url, weight: src.weight }))
    }),
  )

  const pool = []
  results.forEach((r, idx) => {
    if (r.status === 'fulfilled') pool.push(...r.value)
    else logger.log(`[foreign] ${FOREIGN_FEEDS[idx].name}: ${String(r.reason).slice(0, 60)}`)
  })

  // Eğitim gündemi olan ve daha önce yayınlanmamış haberler.
  // Aynı kaynaktan çok sayıda haber almamak için kaynak başına en fazla 2.
  const candidates = []
  const perSource = new Map()
  for (const i of pool) {
    if (!isEducation(`${i.title} ${i.description ?? ''}`)) continue
    if (knownUrls.has(i.link)) continue
    const n = perSource.get(i.sourceName) ?? 0
    if (n >= MAX_FOREIGN_PER_SOURCE) continue
    perSource.set(i.sourceName, n + 1)
    candidates.push(i)
    if (candidates.length >= max * 2) break
  }
  const selected = candidates.slice(0, max)

  if (!candidates.length) {
    logger.log(`[foreign] ${pool.length} kayıttan uygun haber yok`)
    return []
  }
  logger.log(`[foreign] ${pool.length} kayıttan ${selected.length} haber çevrilecek`)

  // Görsel ve tam metin
  await Promise.all(
    selected.map(async (c) => {
      try {
        const art = await fetchArticle(c.link)
        if (!art) return
        c.image = art.image
        c.paragraphs = art.paragraphs
        // Kaynak adı RSS'ten gelen biçimde ("the Guardian") olabiliyor;
        // yapılandırmadaki temiz adı kullanıyoruz.
        c.siteName = c.sourceName
        c.publishedAt = art.publishedAt ?? c.publishedAt
        if (c.image && saveImage) {
          const saved = await saveImage(c.image, c.link, c)
          if (saved) c.localImage = saved
        }
      } catch {
        /* yoksay */
      }
    }),
  )

  // Görseli yüklenemeyen (depolama dolu, kaynak engeli) haber de çevrilir;
  // yalnızca hiç görseli olmayanlar elenir. Aksi halde geçici bir depolama
  // sorunu yabancı haber akışını tümden durdurur.
  const withImage = selected.filter((c) => c.localImage || c.image)
  if (!withImage.length) {
    logger.log('[foreign] görsel bulunamadı, atlandı')
    return []
  }

  // Çeviri: kaynak metnin TAMAMI gönderilir. Kısaltmak çevirileri eksik bırakıyordu
  // (ölçüm: kaynak metnin %3-26'sı çevriliyordu).
  const gemini = createGemini(keys, [TRANSLATE_MODEL, 'gemini-3.1-flash-lite', 'gemini-3.5-flash'])
  const input = withImage
    .map((c, i) => {
      const paras = (c.paragraphs ?? [])
        .map((p, k) => `[${k + 1}] ${p}`)
        .join('\n')
      return `${i + 1}. TITLE: ${c.title}\n   SUMMARY: ${(c.description || '').slice(0, 400)}\n   BODY:\n${paras}\n   SOURCE: ${c.siteName ?? c.sourceName}\n   DATE: ${c.publishedAt}`
    })
    .join('\n\n')

  let out = []
  try {
    out = await gemini.call({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: `${input}\n\n${withImage.length} haber çevir.` }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 32768,
        responseMimeType: 'application/json',
        responseSchema: SCHEMA,
      },
    })
  } catch (err) {
    logger.log(`[foreign] çeviri başarısız: ${String(err?.message ?? err).slice(0, 90)}`)
    return []
  }

  const byIndex = new Map(withImage.map((c, i) => [i + 1, c]))
  const items = []
  for (const d of out ?? []) {
    const c = byIndex.get(d.id)
    if (!c || !d.title) continue
    // Model bazen "[1] " gibi girdi numaralarını metne yansıtır.
    const paras = (d.paragraphs ?? [])
      .map((p) => String(p ?? '').replace(/^\s*\[\d+\]\s*/, '').trim())
      .filter((p) => p.length >= 40)
    const srcChars = (c.paragraphs ?? []).join(' ').length
    const trChars = paras.join(' ').length
    if (srcChars > 800 && trChars < srcChars * 0.35) {
      logger.log(`[foreign] eksik çeviri: ${Math.round((trChars / srcChars) * 100)}% (${c.title.slice(0, 40)})`)
    }
    items.push({
      id: `f_${hash(c.link)}_${Date.now().toString(36)}`,
      slug: `yabanci-${slugifyTr(d.title)}-${hash(c.link).slice(0, 6)}`,
      title: d.title,
      excerpt: d.excerpt || d.title,
      body: paras.length ? paras : [d.excerpt || d.title],
      category: 'yabanci',
      tags: [...new Set(['yabancı eğitim', ...(d.tags ?? [])])],
      source: { name: c.siteName ?? c.sourceName, url: c.link, image: c.localImage },
      publishedAt: c.publishedAt ?? new Date().toISOString(),
      views: 0,
      likes: 0,
      commentsCount: 0,
      featured: false,
      province: undefined,
      fullText: (c.paragraphs?.length ?? 0) >= 2,
      score: 4,
      dedupeKey: `foreign:${hash(c.link)}`,
      rawTitle: c.title,
      status: 'published',
      lang: 'en',
    })
  }

  logger.log(`[foreign] ${items.length} haber çevrildi`)
  return items
}

function slugifyTr(s) {
  return String(s ?? '')
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
