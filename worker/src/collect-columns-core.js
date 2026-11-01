/**
 * Köşe Yazıları ve Analiz Tarama Motoru
 *
 * Yerli basından (Cumhuriyet, BirGün, Gazete Duvar, Diken, Medyascope, BBC Türkçe,
 * Euronews, DW Türkçe, soL Haber, Independent Türkçe, Odatv, Hürriyet, Habertürk vb.)
 * eğitimle alakalı köşe yazılarını, görüşleri ve analizleri derler.
 *
 * Yetersiz kaldığında yabancı saygın kaynaklardan (The Guardian, BBC, Der Spiegel, Le Monde)
 * eğitim yazılarını Gemini ile 1:1 (özetlemesiz) çevirerek zenginleştirir.
 */
import { fetchFeed } from './rss.js'
import { fetchArticle } from './article.js'
import { createGemini } from './gemini.js'
import { slugify, hash } from './text.js'

export const COLUMN_FEEDS_TR = [
  // Köşe Yazarları & Görüş Odaklı
  { name: 'Cumhuriyet', url: 'https://www.cumhuriyet.com.tr/rss/yazarlar', isColumn: true },
  { name: 'BirGün', url: 'https://www.birgun.net/xml/rss.xml', isColumn: true },
  { name: 'Hürriyet', url: 'https://www.hurriyet.com.tr/rss/yazarlar', isColumn: true },
  { name: 'Habertürk', url: 'https://www.haberturk.com/rss/kategori/yazarlar.xml', isColumn: true },
  { name: 'Gazete Duvar', url: 'https://www.gazeteduvar.com.tr/rss', isColumn: true },
  { name: 'Diken', url: 'https://www.diken.com.tr/feed/', isColumn: true },
  { name: 'Medyascope', url: 'https://medyascope.tv/feed/', isColumn: true },
  { name: 'Independent Türkçe', url: 'https://www.indyturk.com/rss.xml', isColumn: true },
  { name: 'soL Haber', url: 'https://haber.sol.org.tr/rss.xml', isColumn: true },
  { name: 'BBC Türkçe', url: 'https://feeds.bbci.co.uk/turkce/rss.xml', isColumn: false },
  { name: 'Euronews Türkçe', url: 'https://tr.euronews.com/rss', isColumn: false },
  { name: 'DW Türkçe', url: 'https://rss.dw.com/xml/rss-tur-all', isColumn: false },
  { name: 'Odatv', url: 'https://www.odatv.com/rss.xml', isColumn: true },
  { name: 'Diriliş Postası', url: 'https://www.dirilispostasi.com/rss/yazarlar', isColumn: true },
  { name: 'Milat Gazetesi', url: 'https://www.milatgazetesi.com/rss/yazarlar.xml', isColumn: true },
]

export const COLUMN_FEEDS_FOREIGN = [
  { name: 'The Guardian', url: 'https://www.theguardian.com/education/rss', lang: 'en' },
  { name: 'The Guardian Opinion', url: 'https://www.theguardian.com/commentisfree/rss', lang: 'en' },
  { name: 'BBC News Education', url: 'https://feeds.bbci.co.uk/news/education/rss.xml', lang: 'en' },
  { name: 'Der Spiegel', url: 'https://www.spiegel.de/thema/bildung/index.rss', lang: 'de' },
  { name: 'Le Monde', url: 'https://www.lemonde.fr/education/rss_full.xml', lang: 'fr' },
]

export const EDU_TERMS_TR = [
  'eğitim', 'egitim', 'mesem', 'meb', 'ösym', 'osym', 'kpss', 'lgs', 'yks', 'yazılı sınav',
  'lise', 'ilkokul', 'ortaokul', 'ilköğretim', 'ortaöğretim', 'yükseköğretim',
  'üniversite', 'universite', 'kolej', 'öğretmen', 'ogretmen', 'öğrenci', 'ogrenci',
  'öğretim görevlisi', 'akademisyen', 'pedagoji', 'müfredat', 'ders', 'okul',
  'maarif', 'rektör', 'dekan', 'fakülte', 'burs', 'eğitimci', 'yök', 'yok', 'öğretim', 'öğretmenlik'
]

export const EDU_TERMS_FOREIGN = [
  'education', 'school', 'teacher', 'student', 'university', 'college', 'curriculum',
  'pedagogy', 'exam', 'teaching', 'campus', 'academic',
  'bildung', 'schule', 'lehrer', 'schüler', 'universität',
  'éducation', 'école', 'enseignant', 'professeur', 'étudiant',
  'təhsil', 'məktəb', 'müəllim', 'tələbə'
]

export const TAG_KEYWORDS = [
  { term: 'mesem', tag: 'MESEM' },
  { term: 'maarif', tag: 'Maarif' },
  { term: 'meb', tag: 'MEB' },
  { term: 'ösym', tag: 'ÖSYM' },
  { term: 'kpss', tag: 'KPSS' },
  { term: 'lgs', tag: 'LGS' },
  { term: 'yks', tag: 'YKS' },
  { term: 'üniversite', tag: 'Üniversite' },
  { term: 'öğretmen', tag: 'Öğretmen' },
  { term: 'öğrenci', tag: 'Öğrenci' },
  { term: 'lise', tag: 'Lise' },
  { term: 'ilkokul', tag: 'İlkokul' },
  { term: 'ortaokul', tag: 'Ortaokul' },
  { term: 'müfredat', tag: 'Müfredat' },
  { term: 'pedagoji', tag: 'Pedagoji' },
  { term: 'akademisyen', tag: 'Akademi' },
  { term: 'yazılı sınav', tag: 'Yazılı Sınav' },
  { term: 'burs', tag: 'Burs' },
  { term: 'kolej', tag: 'Kolej' },
  { term: 'yök', tag: 'YÖK' },
  { term: 'rektör', tag: 'Rektör' },
  { term: 'dekan', tag: 'Fakülte' },
  { term: 'ders', tag: 'Ders' },
]

export function isEduTr(text = '') {
  if (!text) return false
  const lower = text.toLowerCase()
  return EDU_TERMS_TR.some((term) => {
    const reg = new RegExp('(?<![a-zçğıöşü])' + term + '(?![a-zçğıöşü])', 'i')
    return reg.test(lower)
  })
}

export function isEduForeign(text = '') {
  if (!text) return false
  const lower = text.toLowerCase()
  return EDU_TERMS_FOREIGN.some((term) => {
    const reg = new RegExp('(?<![a-z])' + term + '(?![a-z])', 'i')
    return reg.test(lower)
  })
}

/**
 * Başlık ve metin içinden akıllı hashtag'ler çıkarır.
 */
export function extractSmartTags(title = '', paragraphs = [], sourceName = '') {
  const full = (title + ' ' + (Array.isArray(paragraphs) ? paragraphs.join(' ') : '')).toLowerCase()
  const tags = new Set(['Eğitim'])

  for (const item of TAG_KEYWORDS) {
    const reg = new RegExp('(?<![a-zçğıöşü])' + item.term + '(?![a-zçğıöşü])', 'i')
    if (reg.test(full)) {
      tags.add(item.tag)
    }
  }

  if (sourceName) tags.add(sourceName)
  return Array.from(tags).slice(0, 8)
}

/**
 * Başlık veya URL'den yazar adı ve temiz başlığı ayıklar.
 */
export function extractAuthorAndTitle(rawTitle = '', url = '', defaultSource = '', domAuthor = '') {
  let title = rawTitle.trim()
  let author = domAuthor ? domAuthor.trim() : ''

  // "Yazar Adı yazdı : Başlık" (Cumhuriyet formatı)
  const yazdiMatch = title.match(/^(.+?)\s+yazdı\s*:\s*(.+)$/i)
  if (yazdiMatch) {
    author = yazdiMatch[1].trim()
    title = yazdiMatch[2].trim()
  }

  // "Yazar Adı: Başlık"
  if (!author) {
    const colonMatch = title.match(/^([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]+){1,3})\s*:\s*(.+)$/)
    if (colonMatch && colonMatch[1].length < 35 && colonMatch[2].length > 15) {
      author = colonMatch[1].trim()
      title = colonMatch[2].trim()
    }
  }

  // URL'den yazar slug'ı: /yazarlar/ad-soyad/ veya /yazar/ad-soyad/
  if (!author && url) {
    const urlMatch = url.match(/\/(?:yazarlar|yazar|author)\/([a-z0-9-]+)(?:\/|$)/i)
    if (urlMatch && urlMatch[1] && !urlMatch[1].includes('kategori')) {
      author = urlMatch[1]
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    }
  }

  if (!author) {
    author = defaultSource ? defaultSource + ' Yazarı' : 'Köşe Yazarı'
  }

  return { author, title }
}

const TRANSLATE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    excerpt: { type: 'string' },
    paragraphs: { type: 'array', items: { type: 'string' } },
    tags: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'excerpt', 'paragraphs', 'tags'],
}

const TRANSLATE_PROMPT = `Sen Türk basınının usta bir köşe yazarı ve deneyimli bir tercümansın.
Sana yabancı basından eğitim üzerine yazılmış önemli bir köşe yazısı/makale verilir.
GÖREV: Makaleyi eksiksiz, duru, edebi ve akıcı bir Türkçe köşe yazısı olarak çevir.
KURALLAR:
1. KESİNLİKLE ÖZETLEME YAPMA. Girdideki HER BİR paragrafı tek tek ve tam olarak çevir.
2. Paragraf sayısını ve akış sırasını BİREBİR KORU. Girdide kaç paragraf varsa çıktıda da o kadar paragraf olsun.
3. Başlığı Türkiye'deki bir gazetenin köşe yazısına yakışır şekilde etkileyici ve akıcı yap.
4. Özet: en fazla 2 cümlelik vurucu bir giriş.
5. Sayıları, isimleri, kurum adlarını ve yerleri tam koru.
JSON nesnesi döndür.`

/**
 * Köşe yazılarını toplar.
 */
export async function collectColumns({
  geminiKeys = [],
  logger = console,
  targetMin = 15,
  knownUrls = new Set(),
} = {}) {
  const articles = []
  const seenUrls = new Set(knownUrls)

  logger.log('[columns] Yerli ve bağımsız basın taranıyor...')

  for (const feed of COLUMN_FEEDS_TR) {
    try {
      const items = await fetchFeed(feed.url, { timeoutMs: 7000 })
      logger.log(`[columns] ${feed.name}: ${items.length} potansiyel yazı`)

      for (const item of items) {
        if (!item.link || seenUrls.has(item.link)) continue

        const combinedText = (item.title + ' ' + (item.description || '')).toLowerCase()
        const isTarget = isEduTr(combinedText)

        if (!isTarget) continue

        seenUrls.add(item.link)
        logger.log(`[columns:TR] Bulundu: "${item.title}" (${feed.name})`)

        try {
          const art = await fetchArticle(item.link, { timeoutMs: 12000 })
          const paragraphs = art.paragraphs && art.paragraphs.length >= 2
            ? art.paragraphs
            : item.description ? [item.description] : []

          if (paragraphs.length === 0) continue

          const { author, title } = extractAuthorAndTitle(
            art.title || item.title,
            item.link,
            feed.name
          )
          const dedupeKey = hash(`${author}:${title}`)
          const itemSlug = slugify(title) + '-' + dedupeKey.slice(0, 6)
          const smartTags = extractSmartTags(title, paragraphs, feed.name)

          articles.push({
            id: 'col_' + dedupeKey.slice(0, 16),
            slug: itemSlug,
            title,
            author_name: author,
            author_image: art.image || null,
            author_title: feed.name + ' Köşe Yazarı',
            source_name: feed.name,
            source_url: item.link,
            excerpt: art.description || (paragraphs[0] ? paragraphs[0].slice(0, 240) + '...' : ''),
            body: paragraphs,
            published_at: item.publishedAt || new Date().toISOString(),
            lang: 'tr',
            original_lang: 'tr',
            translated: 0,
            tags: smartTags,
            dedupe_key: dedupeKey,
          })
        } catch (err) {
          logger.warn(`[columns] Makale detayı alınamadı (${item.link}):`, err.message)
        }
      }
    } catch (err) {
      logger.warn(`[columns] Besleme okunamadı (${feed.name}):`, err.message)
    }
  }

  logger.log(`[columns] Toplanan yerli yazı sayısı: ${articles.length}`)

  // Hedef sayıya ulaşılamadıysa yabancı basından eğitim yazıları tamamla
  if (articles.length < targetMin && geminiKeys && geminiKeys.length > 0) {
    logger.log(`[columns] Yabancı basından eğitim köşe yazıları taranıyor...`)
    const gemini = createGemini(geminiKeys)

    for (const feed of COLUMN_FEEDS_FOREIGN) {
      if (articles.length >= targetMin + 5) break
      try {
        const items = await fetchFeed(feed.url, { timeoutMs: 10000 })
        for (const item of items) {
          if (articles.length >= targetMin + 5) break
          if (!item.link || seenUrls.has(item.link)) continue

          const text = (item.title + ' ' + (item.description || '')).toLowerCase()
          if (!isEduForeign(text)) continue

          seenUrls.add(item.link)
          logger.log(`[columns:Foreign] Bulundu: "${item.title}" (${feed.name})`)

          try {
            const art = await fetchArticle(item.link, { timeoutMs: 15000 })
            const paragraphs = art.paragraphs && art.paragraphs.length >= 3 ? art.paragraphs : []
            if (paragraphs.length < 2) continue

            // Gemini ile tam çeviri (özetleme yok!)
            logger.log(`[columns:Translate] Çevriliyor (${feed.lang} -> tr): "${item.title}"`)
            const inputPayload = {
              title: art.title || item.title,
              paragraphs: paragraphs.slice(0, 15),
            }

            const res = await gemini.generateStructured({
              system: TRANSLATE_PROMPT,
              prompt: JSON.stringify(inputPayload),
              schema: TRANSLATE_SCHEMA,
            })

            if (res && res.title && Array.isArray(res.paragraphs) && res.paragraphs.length > 0) {
              const { author } = extractAuthorAndTitle(art.title || item.title, item.link, feed.name)
              const dedupeKey = hash(`${author}:${res.title}`)
              const itemSlug = slugify(res.title) + '-' + dedupeKey.slice(0, 6)
              const smartTags = extractSmartTags(res.title, res.paragraphs, feed.name)

              articles.push({
                id: 'col_' + dedupeKey.slice(0, 16),
                slug: itemSlug,
                title: res.title,
                author_name: author,
                author_image: art.image || null,
                author_title: feed.name + ' Yazarı',
                source_name: feed.name,
                source_url: item.link,
                excerpt: res.excerpt || res.paragraphs[0]?.slice(0, 240) + '...',
                body: res.paragraphs,
                published_at: item.publishedAt || new Date().toISOString(),
                lang: 'tr',
                original_lang: feed.lang,
                translated: 1,
                tags: smartTags,
                dedupe_key: dedupeKey,
              })
              logger.log(`[columns:Translate] Başarılı: "${res.title}"`)
            }
          } catch (err) {
            logger.warn(`[columns] Çeviri hatası (${item.link}):`, err.message)
          }
        }
      } catch (err) {
        logger.warn(`[columns] Yabancı besleme okunamadı (${feed.name}):`, err.message)
      }
    }
  }

  return articles
}
