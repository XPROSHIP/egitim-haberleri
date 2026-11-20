/**
 * Yayıncı sayfasından haber metnini çıkarır.
 *
 * Bu dosya gerçek bir HTML ayrıştırıcı kullanır (node-html-parser). Düzenli
 * ifadelerle kazımak yayıncının sayfa yapısına göre kırılıyordu: MEB haberi
 * <div> içinde, Hürriyet <p> içinde, bazı sayfalar haberin ortasına "ilgili
 * haber" bloğu koyuyor, bazıları alt bilgiyi gövdenin içine gömüyordu.
 * DOM üzerinden gezmek bu karışıklığı kesin olarak çözüyor.
 */
import { parse } from 'node-html-parser'
import { decodeEntities } from './rss.js'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const REQ_HEADERS = {
  'user-agent': UA,
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
}

const BAD_IMG = /meta-photo|logo|placeholder|default[-_.]?img|avatar|1x1|blank\.|banner|sponsor|mansetresim|varsayilan|gorsel-yeri|header[-_.]?image/i

const JUNK_CONTAINER =
  /\b(share|social|related|ilgili|recommend|newsletter|abone-ol|subscribe|comment|yorum|breadcrumb|post-info-bar|post-topics|post-source|follow-strip|author-bio|adpro|advert|evr-sub-cta|drawer-content|gpsource-cta)\b/i

/** Gövdenin bulunduğu kutular (öncelik sırasına göre). */
const BODY_SELECTORS = [
  'div.content-text',
  'div.article-prose',
  'div.node-body',
  'div.c-article-content',
  'div.js-article-content',
  'div.article__content',
  'div.article__body',
  'div.detail-content',
  'div.news-body',
  'div.haber-metni',
  'div.yazi-icerik',
  'div.yazi-metni',
  'div.column-content',
  'div.author-article',
  'div.news-detail-text',
  'div.rhd-all-article-detail',
  'div.article-body',
  'div.article-content',
  'div.article-text',
  'div.post-content',
  'div.post-body',
  'div.entry-content',
  'div.haber-icerik',
  'div.haber-govde',
  'div.story-body',
  'div.article-detail',
  'div.news-content',
  'div.haber-detay',
  'div.detay-icerik',
  'div.icerik',
  'article',
  'main',
]

/** Haber dışı, tek başına duran satırlar. */
const BOILERPLATE_TEXT = [
  /erişilebilirlik\s+özellikleri/i,
  /gizlilik,\s*kullanım\s+ve\s+telif/i,
  /©\s*türkiye\s+cumhuriyeti/i,
  /t\.c\.\s*millet\s+eğitim\s+bakanlığı/i,
  /takip\s+edin/i,
  /yazı\s+(?:tipi|fontu)/i,
  /sayfa\s+(?:genişliği|düzeni)/i,
  /görünüm\s+(?:modu|ayarları)/i,
  /çerez\s+(?:politikası|tercihleri)/i,
  /(?:whatsapp(?:'ta| kanal| grub)|telegram kanal|sosyal medya hesaplarımız|bizi takip edin|yazıyı paylaş|haberi paylaş|haberi yazdır|linki kopyala)/i,
  /bize\s+ulaşın|iletişim\s+bilgileri/i,
  /güncel\s+(?:haberler|gelişmeler)/i,
  /ilgili\s+(?:haberler|news)/i,
  /en\s+çok\s+(?:okunanlar|izlenenler)/i,
  /öne\s+çıkan\s+haberler/i,
  /diğer\s+haberler/i,
  /^an\s+asayfa\s*\/?$/i,
  /^e-?posta\s*\/?$/i,
  /^s\.?s\.?s\.?$/i,
  /^haberler$/i,
  /^güncel$/i,
]

/** Tek başına tarih/saat satırı. */
const BOILERPLATE_DATE =
  /^(?:\d{1,2}\s+\w+\s+\d{4}(?:\s+\d{1,2}[:.]\d{2})?|\d{1,2}[./]\d{1,2}[./]\d{2,4}(?:\s+\d{1,2}[:.]\d{2})?|\d{1,2}[.:]\d{2})$/

/** Buradan sonrası başka haberler listesi. */
const LIST_MARKER =
  /^(?:güncel\s+haberler|ilgili\s+haberler|diğer\s+haberler|en\s+çok\s+okunanlar|öne\s+çıkan\s+haberler)\b/i

/** Buradan sonrası kurum künyesi / adres / iletişim bloğu. */
const CUT_MARKER =
  /^(?:adres\s*:|tel\s*:|telefon\s*:|faks\s*:|e-?posta\s*:|millî?\s*eğitim\s+bakanlığı['’]?nı\s+takip\s+edin|erişilebilirlik\s+özellikleri|gizlilik\s*,?\s*kullanım|©\s*türkiye\s+cumhuriyeti|haber\s*[:：]\s*$|takip\s+edin\b)/i

/**
 * Bir paragrafın haber dışı (alt bilgi, künye, menü, tarih) olduğunu söyler.
 * Hem çıkarıcı hem de metin temizleyici kullanır.
 */
export function isJunkParagraph(text = '') {
  const t = String(text)
  if (BOILERPLATE_DATE.test(t)) return true
  if (LIST_MARKER.test(t)) return true
  if (CUT_MARKER.test(t)) return true
  return BOILERPLATE_TEXT.some((re) => re.test(t))
}

/** Karşılaştırma için küçük harfe indirger, aksanları atar. */
function fold(s = '') {
  return s
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c])
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function clean(s = '') {
  return decodeEntities(
    String(s)
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ ]/g, ' ')
      .replace(/\s+/g, ' '),
  ).trim()
}

/** Görselin gerçek bir fotoğraf olduğunu boyut ve en-boy oranıyla doğrular. */
export function looksLikePhoto(buf) {
  const d = imageSize(buf)
  if (!d) return false
  const ratio = d.width / d.height
  if (d.width < 400 || d.height < 260) return false
  if (ratio < 1.15 || ratio > 2.4) return false
  return true
}

function imageSize(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf.length > 24) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i++
        continue
      }
      const marker = buf[i + 1]
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }
      }
      i += 2 + buf.readUInt16BE(i + 2)
    }
    return null
  }
  if (buf.length > 30 && buf.slice(8, 12).toString() === 'WEBP') {
    if (buf[12] === 0x56) return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff }
    if (buf[12] === 0x50) {
      return {
        width: 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16)),
        height: 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16)),
      }
    }
  }
  return null
}

/**
 * Sayfanın karakter kodlamasını belirler.
 *
 * Bazı yayıncılar (star.com.tr) ISO-8859-9/windows-1254 kullanıyor; "res.text()"
 * UTF-8 varsaydığı için karakterler bozuk çıkıyordu.
 */
function decodeHtml(buf, contentType) {
  const bytes = new Uint8Array(buf)
  const candidates = []
  const fromHeader = /charset=["']?([\w-]+)/i.exec(contentType ?? '')?.[1]
  if (fromHeader) candidates.push(fromHeader)

  const head = new TextDecoder('utf-8', { fatal: false }).decode(bytes.subarray(0, 2048))
  const metaCharset =
    /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1] ??
    /<meta[^>]+content=["'][^"']*charset=([\w-]+)/i.exec(head)?.[1]
  if (metaCharset) candidates.push(metaCharset)

  candidates.push('utf-8', 'windows-1254', 'iso-8859-9')

  for (const label of candidates) {
    try {
      const text = new TextDecoder(label, { fatal: false }).decode(bytes)
      const broken = (text.match(/�/g) ?? []).length
      if (broken < 5) return text
    } catch {
      /* bilinmeyen etiket */
    }
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

function metaOf(root, ...patterns) {
  for (const p of patterns) {
    const m = root.querySelector(p)
    const v = m?.getAttribute('content')
    if (v && v.trim().length > 4) return decodeEntities(v.trim())
  }
  return null
}

/**
 * Bir düğümün metin bloklarını toplar.
 * Yalnızca "kendi metni" olan bloklar alınır (iç içe kutu metni iki kez sayılmaz).
 */
function collectBlocks(node) {
  const blocks = []
  const walk = (el) => {
    for (const child of el.childNodes) {
      if (child.nodeType !== 1) continue
      const tag = child.rawTagName?.toLowerCase()
      if (['script', 'style', 'noscript', 'svg', 'iframe', 'form', 'nav', 'footer', 'header', 'aside', 'button'].includes(tag)) {
        continue
      }
      const cls = child.getAttribute?.('class') ?? ''
      const id = child.getAttribute?.('id') ?? ''
      if (JUNK_CONTAINER.test(`${cls} ${id}`)) {
        continue
      }
      if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'figcaption'].includes(tag)) {
        const text = clean(child.text)
        if (!text) continue
        // Yayıncının "BAŞLIK — metin" düzeni: kalın giriş ayrı bir alt başlıktır.
        const strong = child.querySelector('strong, b')
        if (strong && strong.rawTagName) {
          const lead = clean(strong.text)
          // strong metni paragrafın başında mı? (metinden çıkarılır)
          const whole = clean(child.text)
          const atStart = whole.toLocaleLowerCase('tr').startsWith(lead.toLocaleLowerCase('tr'))
          const rest = clean(whole.replace(lead, ' '))
          if (atStart && lead.length >= 8 && lead.length <= 140 && rest.length >= 90) {
            blocks.push({ text: lead, strong: true })
            blocks.push({ text: rest, strong: false })
            continue
          }
        }
        const strongOnly = strong && clean(strong.text) === text
        blocks.push({ text, strong: Boolean(strongOnly) })
        continue
      }
      // div gibi kutu etiketleri: kendi doğrudan metni varsa blok, yoksa içeriğine in
      const own = child.childNodes
        .filter((n) => n.nodeType === 3)
        .map((n) => n.rawText ?? '')
        .join(' ')
        .trim()
      if (own.length > 40) {
        blocks.push({ text: clean(own), strong: false })
        continue
      }
      // Yalnızca kalın metinden oluşan kutu: alt başlıktır (ya da promo başlığı).
      const strong = child.querySelector('strong, b')
      if (strong && clean(child.text) === clean(strong.text) && strong.text) {
        blocks.push({ text: clean(strong.text), strong: true })
        continue
      }
      walk(child)
    }
  }
  walk(node)
  return blocks
}

/** Tek parça uzun paragrafları cümle sınırlarından bölerek okunaklı paragraflar üretir. */
export function splitLongParagraphs(list = [], maxLen = 900, targetLen = 480) {
  const out = []
  for (const raw of list) {
    const p = String(raw || '').trim()
    if (!p) continue
    if (p.startsWith('## ') || p.length <= maxLen) {
      out.push(p)
      continue
    }
    const sentences = p.split(/(?<=[.!?…»"])\s+(?=[A-ZÇĞİÖŞÜ0-9"«“])/).map((s) => s.trim()).filter(Boolean)
    if (sentences.length <= 1) {
      out.push(p)
      continue
    }
    let buf = ''
    for (const s of sentences) {
      if (buf && (buf.length + 1 + s.length > targetLen)) {
        out.push(buf)
        buf = s
      } else {
        buf = buf ? `${buf} ${s}` : s
      }
    }
    if (buf) out.push(buf)
  }
  return out
}

function filterCleanParagraphs(rawList = []) {
  return splitLongParagraphs(rawList)
    .filter((p) => {
      if (p.startsWith('## ')) return p.length >= 8 && p.length <= 150
      if (p.length < 130 && /^(?:paylaş|yazdır|facebook|twitter|instagram|linkedin|telegram|whatsapp)\b/i.test(p)) {
        return false
      }
      return (
        p.length >= 30 &&
        p.split(/\s+/).length >= 5 &&
        !/^(İçindekiler|Editör|Abone ol|©|Photo|Fotoğraf|REKLAM|Bu haber|Kaynakça|Linki Kopyala|Kaynak:|Bu içerik|Bu haber |İşte |Bunlar )/i.test(p) &&
        !/Kanuna aykırı ve izinsiz olarak kopyalanamaz/i.test(p) &&
        !/son dakika haberleri, köşe yazıları/i.test(p) &&
        !/haber içerikleri izin alınmadan/i.test(p) &&
        !p.includes('©')
      )
    })
    .filter((p, i, arr) => arr.indexOf(p) === i)
    .slice(0, 80)
}

/** DOM kapsayıcısından temiz makale paragraflarını çıkarır. */
export function extractParagraphsFromNode(scope) {
  if (!scope) return []
  const blocks = collectBlocks(scope)
  const paragraphs = []
  let collectedChars = 0
  let realParaCount = 0

  for (const b of blocks) {
    const t = b.text
    if (!t) continue
    const pastIntro = realParaCount >= 2 || collectedChars >= 300
    if (LIST_MARKER.test(t) || CUT_MARKER.test(t) || /^ABONE\s*OL/i.test(t.slice(0, 20))) {
      if (pastIntro) break
      continue
    }
    if (BOILERPLATE_TEXT.some((re) => re.test(t))) continue
    if (BOILERPLATE_DATE.test(t)) continue
    if (b.strong) {
      if (t.length >= 8 && t.length <= 140) paragraphs.push(`## ${t}`)
      continue
    }
    paragraphs.push(t)
    collectedChars += t.length
    realParaCount++
  }

  return filterCleanParagraphs(paragraphs)
}

/** Sayfadaki JSON-LD şemalarından articleBody ve yazar adını çıkarır. */
function extractJsonLd(root) {
  let articleBody = ''
  let authorName = ''
  const targetTypes = new Set(['NewsArticle', 'Article', 'OpinionNewsArticle', 'BlogPosting', 'ReportageNewsArticle'])

  const inspectNode = (node) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) inspectNode(item)
      return
    }
    if (Array.isArray(node['@graph'])) inspectNode(node['@graph'])

    const rawType = node['@type']
    const types = Array.isArray(rawType) ? rawType : [rawType]
    const isArticle = types.some((t) => typeof t === 'string' && targetTypes.has(t))

    if (typeof node.articleBody === 'string' && node.articleBody.trim().length > articleBody.length && (isArticle || !articleBody)) {
      articleBody = decodeEntities(node.articleBody).trim()
    }
    if (!authorName && node.author) {
      const a = Array.isArray(node.author) ? node.author[0] : node.author
      if (typeof a === 'string') authorName = clean(a)
      else if (a && typeof a.name === 'string') authorName = clean(a.name)
    }
  }

  const scripts = root.querySelectorAll('script[type="application/ld+json"]')
  for (const s of scripts) {
    try {
      const txt = (s.text || s.rawText || '').trim()
      if (!txt) continue
      inspectNode(JSON.parse(txt))
    } catch {}
  }

  return { articleBody, authorName }
}

/** WordPress sitelerinde (örn. Medyascope) HTML engellendiğinde veya kısa kaldığında WP REST API'sinden tam yazıyı çeker. */
async function tryWordPressApi(url, signal) {
  try {
    const u = new URL(url)
    const segments = u.pathname.split('/').filter(Boolean)
    const slug = segments[segments.length - 1]
    if (!slug || slug.length < 4 || /^\d+$/.test(slug)) return null

    const apiUrl = `${u.origin}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=1`
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    if (signal) signal.addEventListener('abort', () => ctrl.abort(), { once: true })

    try {
      const res = await fetch(apiUrl, {
        signal: ctrl.signal,
        headers: { 'user-agent': UA, accept: 'application/json' },
      })
      if (!res.ok) return null
      const arr = await res.json()
      const post = Array.isArray(arr) ? arr[0] : null
      if (!post?.content?.rendered) return null

      const contentRoot = parse(post.content.rendered)
      const paragraphs = extractParagraphsFromNode(contentRoot)
      if (paragraphs.length === 0) return null

      const wpTitle = clean(post.title?.rendered ?? '')
      const wpDesc = clean(post.excerpt?.rendered ?? '')
      const wpAuthor = clean(post._embedded?.author?.[0]?.name ?? '')
      const wpImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null
      const wpDateRaw = post.date_gmt || post.date || null
      const wpDate = wpDateRaw ? new Date(wpDateRaw) : null

      return {
        title: wpTitle || null,
        author: wpAuthor || null,
        image: wpImage && !BAD_IMG.test(wpImage) ? absolutize(wpImage, url) : null,
        paragraphs,
        description: wpDesc || null,
        siteName: null,
        publishedAt: wpDate && !Number.isNaN(+wpDate) ? wpDate.toISOString() : null,
      }
    } finally {
      clearTimeout(timer)
    }
  } catch {
    return null
  }
}

/**
 * Haber sayfasını okur.
 * @returns {{title?:string|null, author?:string|null, image:string|null, paragraphs:string[], description:string|null, siteName:string|null, publishedAt?:string|null}}
 */
export async function fetchArticle(url, { timeoutMs = 20000 } = {}) {
  if (/news\.google\.com/i.test(url)) {
    return { image: null, paragraphs: [], description: null, siteName: null, title: null, author: null }
  }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    let res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: REQ_HEADERS,
    })
    if (!res.ok && (res.status === 429 || res.status >= 500)) {
      await new Promise((r) => setTimeout(r, 700))
      res = await fetch(url, {
        signal: ctrl.signal,
        redirect: 'follow',
        headers: REQ_HEADERS,
      })
    }
    if (!res.ok) {
      const wp = await tryWordPressApi(url, ctrl.signal)
      if (wp) return wp
      return { image: null, paragraphs: [], description: null, siteName: null, title: null, author: null }
    }
    const html = decodeHtml(await res.arrayBuffer(), res.headers.get('content-type'))

    const root = parse(html, {
      blockTextElements: { script: false, noscript: false, style: false, pre: true },
    })

    const image = metaOf(
      root,
      'meta[property="og:image"]',
      'meta[property="og:image:secure_url"]',
      'meta[name="twitter:image"]',
      'meta[name="twitter:image:src"]',
    )
    const description = metaOf(
      root,
      'meta[name="description"]',
      'meta[property="og:description"]',
    )
    const siteName = metaOf(root, 'meta[property="og:site_name"]')
    const title = (
      metaOf(root, 'meta[property="og:title"]', 'meta[name="twitter:title"]') ??
      clean(root.querySelector('title')?.text ?? '')
    ).replace(/\s*[|–—·]\s*[^|–—·]{0,40}$/, '')

    const publishedRaw =
      metaOf(root, 'meta[property="article:published_time"]') ??
      root.querySelector('time')?.getAttribute('datetime') ??
      null
    const published = publishedRaw ? new Date(publishedRaw) : null

    const { articleBody: ldBody, authorName: ldAuthor } = extractJsonLd(root)
    const metaAuthor = metaOf(root, 'meta[name="author"]', 'meta[property="article:author"]')
    const author = ldAuthor || metaAuthor || null

    // Gövde kutusu: bilinen seçicileri dene, içi boş olmayan en iyi gövdeyi seç.
    let bestParagraphs = []
    let bestChars = 0

    for (const sel of BODY_SELECTORS) {
      const matches = root.querySelectorAll(sel)
      for (const found of matches) {
        const cand = extractParagraphsFromNode(found)
        const chars = cand.join(' ').length
        if (chars > bestChars) {
          bestParagraphs = cand
          bestChars = chars
        }
        if (sel !== 'article' && sel !== 'main' && cand.length >= 2 && chars >= 300) {
          break
        }
      }
      if (sel !== 'article' && sel !== 'main' && bestParagraphs.length >= 2 && bestChars >= 300) {
        break
      }
    }

    if (bestParagraphs.length < 2 || bestChars < 300) {
      const candidates = root.querySelectorAll('div, section, article')
      let best = null
      let bestLen = 0
      for (const c of candidates) {
        const cls = c.getAttribute?.('class') ?? ''
        const id = c.getAttribute?.('id') ?? ''
        if (JUNK_CONTAINER.test(`${cls} ${id}`)) continue
        const len = clean(c.text).length
        if (len > bestLen && len < 200000) {
          bestLen = len
          best = c
        }
      }
      if (best) {
        const cand = extractParagraphsFromNode(best)
        const chars = cand.join(' ').length
        if (chars > bestChars) {
          bestParagraphs = cand
          bestChars = chars
        }
      }
    }

    // JSON-LD articleBody yedek/zenginleştirici
    if (ldBody && (bestParagraphs.length < 2 || bestChars < 350 || (ldBody.length > bestChars * 1.8 && bestChars < 900))) {
      const rawLines = ldBody
        .split(/\r?\n+/)
        .map((l) => clean(l))
        .filter((l) => l && !BOILERPLATE_TEXT.some((re) => re.test(l)) && !LIST_MARKER.test(l) && !CUT_MARKER.test(l))
      const ldParas = filterCleanParagraphs(rawLines)
      const ldChars = ldParas.join(' ').length
      if (ldChars > bestChars) {
        bestParagraphs = ldParas
        bestChars = ldChars
      }
    }

    // WordPress REST API fallback (HTML metin çok kısaysa veya engellendiyse)
    if (bestParagraphs.length < 2 || bestChars < 300) {
      const wp = await tryWordPressApi(url, ctrl.signal)
      if (wp && wp.paragraphs.join(' ').length > bestChars) {
        return {
          title: wp.title || title,
          author: wp.author || author,
          image: wp.image || (image && !BAD_IMG.test(image) ? absolutize(image, url) : null),
          paragraphs: wp.paragraphs,
          description: wp.description || description,
          siteName,
          publishedAt: (published && !Number.isNaN(+published) ? published.toISOString() : null) || wp.publishedAt,
        }
      }
    }

    // Gövde bulunamadıysa özet metninden paragraf kur.
    if (bestParagraphs.length < 2 && description && description.length > 200) {
      const sentences = description
        .split(/(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ])/)
        .reduce((acc, s) => {
          const last = acc[acc.length - 1]
          if (last && (last + ' ' + s).length < 700) acc[acc.length - 1] = last + ' ' + s
          else acc.push(s)
          return acc
        }, [])
        .map((s) => s.trim())
        .filter((s) => s.split(' ').length > 12)
      if (sentences.length > 0 && bestParagraphs.length === 0) {
        bestParagraphs.push(...sentences.slice(0, 6))
      }
    }

    return {
      title,
      author,
      image: image && !BAD_IMG.test(image) ? absolutize(image, url) : null,
      paragraphs: bestParagraphs,
      description,
      siteName,
      publishedAt: published && !Number.isNaN(+published) ? published.toISOString() : null,
    }
  } catch (err) {
    console.warn(`[article] okunamadı: ${url} ${String(err?.message ?? err).slice(0, 90)}`)
    const wp = await tryWordPressApi(url, null)
    if (wp) return wp
    return { image: null, paragraphs: [], description: null, siteName: null, title: null, author: null }
  } finally {
    clearTimeout(timer)
  }
}

function absolutize(src, base) {
  try {
    return new URL(src, base).toString()
  } catch {
    return src
  }
}

/** Görseli indirir; gerçek fotoğraf değilse null döner. */
export async function downloadImage(url, referer, { maxBytes = 3_000_000, attempts = 3 } = {}) {
  let lastError = null
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': UA, referer, accept: 'image/*,*/*;q=0.8' },
        redirect: 'follow',
        signal: AbortSignal.timeout(20000),
      })
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`)
        if (res.status < 500 && res.status !== 429) return null
        continue
      }
      const type = res.headers.get('content-type') ?? ''
      if (!/^image\/(jpeg|png|webp|avif)/.test(type)) return null
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 8000 || buf.length > maxBytes) return null
      if (!looksLikePhoto(buf)) return null
      return { buffer: buf, type }
    } catch (err) {
      lastError = err
      await new Promise((r) => setTimeout(r, 600 * (i + 1)))
    }
  }
  if (lastError) {
    console.warn(
      `[article] görsel indirilemedi: ${url.slice(0, 90)} · ${String(lastError.message ?? lastError).slice(0, 60)}`,
    )
  }
  return null
}
