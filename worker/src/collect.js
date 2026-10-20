/**
 * Toplayıcı hattı:
 *   kaynaklar → alaka süzgeci → tekrar kümeleme → görsel + tam metin → Gemini → veritabanı
 *
 * Yayın kuralı: yalnızca gerçek fotoğrafı olan haberler yayınlanır.
 * Google News kayıtları kümeleme için okunur, tek başına yayına giremez
 * (sayfanın görseli Google'ın boş yer tutucusudur).
 */
import {
  RSS_FEEDS,
  SECTION_PAGES,
  GOOGLE_NEWS_QUERIES,
  BLOCK_SOURCES,
  MAX_AI_PER_RUN,
  AUTO_PUBLISH_SCORE,
  GEMINI_MODELS,
} from './config.js'
import { fetchFeed, googleNewsRssUrl } from './rss.js'
import { fetchSectionLinks } from './section.js'
import { dedupeKey, similarity, slugify, hash, normalizeTitleCase, foldWord } from './text.js'
import { scoreItem, detectCategory, detectProvince, detectExtraTags } from './classify.js'
import { collectForeign } from './foreign.js'
import { createGemini, enrichWithGemini } from './gemini.js'
import { fetchArticle } from './article.js'

const MAX_SECTION_FETCH = 45 // tur başına açılacak en fazla bölüm bağlantısı

/** Aynı konudaki farklı kaynak kopyalarını tek kayda indirger. */
function clusterItems(items, threshold = 0.42) {
  const clusters = []
  for (const item of items) {
    let target = null
    for (const c of clusters) {
      if (similarity(c.title, item.title) >= threshold) {
        target = c
        break
      }
    }
    if (target) {
      target.duplicates.push(item)
      // Doğrudan kaynak (gerçek makale adresi) her zaman önceliklidir
      if (item.direct && !target.direct) Object.assign(target, item, { direct: true })
      else if (item.score > target.score) {
        Object.assign(target, {
          title: item.title,
          link: item.link,
          sourceName: item.sourceName,
          sourceUrl: item.sourceUrl,
          score: item.score,
          publishedAt: item.publishedAt,
          direct: item.direct,
        })
      }
    } else {
      clusters.push({ ...item, duplicates: [] })
    }
  }
  return clusters
}

function clean(raw) {
  const seen = new Set()
  return raw
    .filter((i) => i.link)
    .filter((i) => !BLOCK_SOURCES.some((b) => (i.sourceName ?? '').toLowerCase().includes(b)))
    .filter((i) => {
      if (seen.has(i.link)) return false
      seen.add(i.link)
      return true
    })
}

/**
 * Haberin kategorisini belirler.
 * Kural tabanlı tespit güçlü bir eşleşme bulduysa onu kullanır; aksi hâlde
 * modelin seçimine güvenilir.
 */
function pickCategory(text, aiCategory) {
  const rule = detectCategory(text)
  if (rule === 'mesem') return 'mesem'
  if (aiCategory && aiCategory !== 'gundem') return aiCategory
  return rule
}

export async function collect({
  keys,
  store,
  logger = console,
  maxAi = MAX_AI_PER_RUN,
  autoPublishScore = AUTO_PUBLISH_SCORE,
  minScore = 3.5,
  enrich = true,
  saveImage = null,
  knownTitles: knownTitlesArg = null,
} = {}) {
  const startedAt = new Date().toISOString()
  const run = {
    startedAt,
    fetched: 0,
    sectionLinks: 0,
    gnews: 0,
    clusters: 0,
    inserted: 0,
    skipped: 0,
    published: 0,
    withImage: 0,
    withFullText: 0,
    noImage: 0,
    foreign: 0,
    errors: [],
  }

  // 1) Kaynakları paralel oku
  const [rssResults, sectionResults, gnewsResults] = await Promise.all([
    Promise.allSettled(
      RSS_FEEDS.map(async (src) => {
        const items = await fetchFeed(src.url)
        return items.map((i) => ({
          ...i,
          sourceName: i.sourceName || src.name,
          sourceUrl: src.url,
          direct: true,
          feedWeight: src.weight,
          feedProvince: src.province ?? null,
          feedCategory: src.category ?? null,
        }))
      }),
    ),
    Promise.allSettled(
      SECTION_PAGES.map(async (src) => {
        const links = await fetchSectionLinks(src.url, src.prefix)
        return { name: src.name, links, weight: src.weight }
      }),
    ),
    Promise.allSettled(
      GOOGLE_NEWS_QUERIES.map(async (src) => {
        const items = await fetchFeed(googleNewsRssUrl(src.q))
        return items.map((i) => ({ ...i, queryCat: src.cat, direct: false }))
      }),
    ),
  ])

  const feedItems = []
  rssResults.forEach((f, idx) => {
    if (f.status === 'fulfilled') {
      run.fetched += f.value.length
      feedItems.push(...f.value)
    } else {
      run.errors.push(`besleme ${RSS_FEEDS[idx].name}: ${String(f.reason).slice(0, 70)}`)
    }
  })

  const knownUrls = await store.listUrls()

  // 2) Bölüm sayfalarından yeni makale bağlantılarını al
  const freshSectionLinks = []
  sectionResults.forEach((f, idx) => {
    if (f.status !== 'fulfilled') {
      run.errors.push(`bölüm ${SECTION_PAGES[idx].name}: ${String(f.reason).slice(0, 70)}`)
      return
    }
    const { name, links, weight } = f.value
    run.sectionLinks += links.length
    for (const link of links) {
      if (knownUrls.has(link)) continue
      if (freshSectionLinks.some((x) => x.link === link)) continue
      freshSectionLinks.push({ link, sourceName: name, feedWeight: weight })
      if (freshSectionLinks.length >= MAX_SECTION_FETCH) break
    }
  })
  logger.log(
    `[collect] ${run.fetched} RSS + ${run.sectionLinks} bölüm bağlantısı (${freshSectionLinks.length} yeni) · ${knownUrls.size} bilinen`,
  )

  // 3) Yeni bölüm bağlantılarının başlıklarını ve görsellerini al
  const sectionItems = []
  if (enrich && freshSectionLinks.length > 0) {
    let done = 0
    await Promise.all(
      freshSectionLinks.map(async ({ link, sourceName, feedWeight }) => {
        try {
          const art = await fetchArticle(link)
          const title = art.title
          if (!title) return
          sectionItems.push({
            title,
            link,
            description: art.description ?? '',
            sourceName: art.siteName || sourceName,
            sourceUrl: link,
            publishedAt: art.publishedAt ?? new Date().toISOString(),
            direct: true,
            feedWeight,
            image: art.image,
            paragraphs: art.paragraphs,
          })
        } catch {
          /* tekil hatalar akışı durdurmaz */
        } finally {
          done++
          if (done % 10 === 0) logger.log(`[collect] bölüm haberi açıldı ${done}/${freshSectionLinks.length}`)
        }
      }),
    )
    logger.log(`[collect] ${sectionItems.length} bölüm haberi başlığıyla eşleşti`)
  }

  const gnewsItems = []
  gnewsResults.forEach((f) => {
    if (f.status === 'fulfilled') {
      run.gnews += f.value.length
      gnewsItems.push(...f.value)
    }
  })

  // 4) Süzgeç + puanlama
  const pool = clean([...feedItems, ...sectionItems, ...gnewsItems])
  const scored = pool
    .map((i) => ({
      ...i,
      score: scoreItem(i),
      key: dedupeKey(i.title),
      category: i.feedCategory ?? detectCategory(`${i.title} ${i.description} ${i.queryCat ?? ''}`),
      province: i.feedProvince ?? detectProvince(`${i.title} ${i.description}`),
    }))
    .filter((i) => i.score >= minScore)
  logger.log(`[collect] ${pool.length} kayıttan ${scored.length} tanesi eğitim haberi`)

  // 5) Zaten yayınlanmış olanları ele
  const knownKeys = await store.listKeys()
  let fresh = scored.filter((i) => !knownKeys.has(i.key))

  // 5b) Aynı haberin benzer varyasyonlarını ele.
  // Anahtar (hash) birebir başlık eşleşmesini yakalar; ama aynı olay farklı
  // yayıncılarda farklı başlıklarla anlatılabiliyor. Son 3 haftanın
  // başlıklarıyla karşılaştırıp benzer olanı eliyoruz.
  const knownTitles = knownTitlesArg ?? (await store.listTitles?.()) ?? []
  if (knownTitles.length) {
    const before = fresh.length
    fresh = fresh.filter(
      (i) =>
        !knownTitles.some(
          (t) => similarity(t, i.title) >= 0.6 || similarity(t, i.description ?? '') >= 0.72,
        ),
    )
    const dropped = before - fresh.length
    if (dropped > 0) {
      logger.log(`[collect] ${dropped} benzer varyasyon elendi (tekrar koruması)`)
    }
  }
  logger.log(`[collect] ${fresh.length} yeni aday (${knownKeys.size} kayıtla karşılaştırıldı)`)

  // 6) Kümelendir — doğrudan kaynak öncelikli
  const clusters = clusterItems(fresh)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(maxAi * 2, 24))
  run.clusters = clusters.length
  logger.log(`[collect] ${clusters.length} küme işlenecek`)

  // 7) Görsel ve tam metin (doğrudan kaynaklarda)
  if (enrich) {
    await Promise.all(
      clusters.map(async (c) => {
        if (c.paragraphs?.length) run.withFullText++
        if (c.image) run.withImage++
        else if (!c.direct) {
          c.image = null
        } else {
          try {
            const art = c.paragraphs ? null : await fetchArticle(c.link)
            if (art) {
              c.image = art.image
              c.paragraphs = art.paragraphs
              c.siteName = art.siteName
              if (art.image) run.withImage++
              if (art.paragraphs?.length >= 2) run.withFullText++
            }
          } catch {
            /* yoksay */
          }
        }
        if (c.image && saveImage) {
          const saved = await saveImage(c.image, c.link, c)
          if (saved) c.localImage = saved
        }
      }),
    )
  }

  // 8) Görseli olmayanlar yayınlanmaz
  const withImage = clusters.filter((c) => c.localImage)
  run.noImage = clusters.length - withImage.length
  logger.log(
    `[collect] görsel: ${withImage.length}, tam metin: ${run.withFullText}, görselsiz elenen: ${run.noImage}`,
  )

  // 9) Gemini ile başlık, özet, etiket, kategori
  const targets = withImage.slice(0, maxAi)
  const gemini = createGemini(keys, GEMINI_MODELS)
  let enriched = []
  try {
    enriched = await enrichWithGemini(gemini, targets)
    logger.log(`[collect] Gemini ${enriched.length}/${targets.length} kaydı işledi`)
  } catch (err) {
    run.errors.push(`gemini: ${String(err.message ?? err).slice(0, 140)}`)
    logger.warn('[collect] Gemini başarısız, ham başlıklar kullanılacak')
    enriched = targets.map((c) => ({ cluster: c, ai: null }))
  }

  // 10) Haber kayıtlarına dönüştür
  const items = enriched.map(({ cluster, ai }) => {
    const title = normalizeTitleCase(ai?.title || cluster.title, cluster.title, {
      bodyText: cluster.paragraphs,
    })
    const fullText = Array.isArray(cluster.paragraphs) && cluster.paragraphs.length >= 2
    const sourceName = cluster.siteName || cluster.sourceName || 'Eğitim Haberleri'
    return {
      id: `n_${hash(cluster.key)}_${Date.now().toString(36)}`,
      slug: `${slugify(title)}-${cluster.key.slice(0, 6)}`,
      title,
      excerpt: ai?.excerpt || cluster.description || title,
      body: fullText ? cluster.paragraphs : (ai?.paragraphs ?? [title]),
      // Kategori önceliği: kural tabanlı tespit güçlü bir eşleşme bulduysa
      // (ör. MESEM terimleri) modelin seçiminden önce gelir. Model, terimi
      // bilmediği kategorileri "gundem" seçebiliyor ve MESEM hep boş kalıyordu.
      category: pickCategory(`${title} ${cluster.description ?? ''}`, ai?.category),
      // Ana kategorisi Çorum olsa bile MESEM haberi "mesem" etiketiyle
      // MESEM kategorisinde de listelenir.
      tags: [
        ...new Set([
          ...(ai?.tags?.length ? ai.tags : [sourceName]),
          ...detectExtraTags(`${title} ${cluster.description ?? ''}`),
        ]),
      ],
      source: { name: sourceName, url: cluster.link, image: cluster.localImage },
      publishedAt: cluster.publishedAt,
      views: 0,
      likes: 0,
      commentsCount: 0,
      featured: Boolean(ai?.featured) || cluster.score >= 8.5,
      province: ai?.province || cluster.province || undefined,
      fullText,
      score: cluster.score,
      dedupeKey: cluster.key,
      rawTitle: cluster.title,
      status: cluster.score >= autoPublishScore ? 'published' : 'review',
      lang: 'tr',
    }
  })

  // 10) Yabancı dilde eğitim haberleri (İngilizce kaynaklar, Türkçeye çevrilir)
  let foreignItems = []
  if (enrich) {
    try {
      foreignItems = await collectForeign({ keys, logger, saveImage, knownUrls: knownUrls })
    } catch (err) {
      run.errors.push(`foreign: ${String(err?.message ?? err).slice(0, 90)}`)
    }
  }
  if (foreignItems.length) {
    items.push(...foreignItems)
    run.foreign = foreignItems.length
  }

  const result = await store.upsert(items)
  run.inserted = result.inserted
  run.skipped = result.skipped
  run.published = items.filter((i) => i.status === 'published').length
  run.finishedAt = new Date().toISOString()

  return { run, items: result.items ?? items }
}
