/** Yayıncı sayfasından kapak görseli ve haber metnini çıkarır. */
import { decodeEntities } from './rss.js'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const BAD_IMG = /meta-photo|logo|placeholder|default[-_.]?img|avatar|1x1|blank\.|banner|sponsor|mansetresim|varsayilan|gorsel-yeri|header[-_.]?image/i

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

function meta(html, ...patterns) {
  for (const p of patterns) {
    const m = html.match(p)
    if (m?.[1] && m[1].trim().length > 4) return decodeEntities(m[1].trim())
  }
  return null
}

function cleanText(s) {
  return decodeEntities(
    s
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ ]/g, ' ')
      .replace(/\s+/g, ' '),
  ).trim()
}

/**
 * Haber sayfasını okur.
 * @returns {{image:string|null, paragraphs:string[], description:string|null, siteName:string|null}}
 */
export async function fetchArticle(url, { timeoutMs = 15000 } = {}) {
  // Google News sayfaları gerçek makale değildir; og:image'ı boş yer tutucusudur
  if (/news\.google\.com/i.test(url)) {
    return { image: null, paragraphs: [], description: null, siteName: null, title: null }
  }
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' },
    })
    if (!res.ok) return { image: null, paragraphs: [], description: null, siteName: null }
    const html = await res.text()

    const image = meta(
      html,
      /<meta[^>]+property=["']og:image(?::secure_url|:url)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url|:url)?["']/i,
      /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    )

    const description = meta(
      html,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    )

    const siteName = meta(
      html,
      /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
    )

    const title = meta(
      html,
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<title[^>]*>([\s\S]{10,220}?)<\/title>/i,
    )?.replace(/\s*[|–—·]\s*[^|–—·]{0,40}$/, '')

    const publishedRaw = meta(
      html,
      /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i,
      /<time[^>]+datetime=["']([^"']+)["']/i,
    )
    const published = publishedRaw ? new Date(publishedRaw) : null

    const scope =
      html.match(/<article[\s\S]*?<\/article>/i)?.[0] ??
      html.match(/<div[^>]+(?:itemprop|class)=["'][^"']*article[^"']*["'][\s\S]*?<\/div>/i)?.[0] ??
      html

    const paragraphs = [...scope.matchAll(/<p[^>]*>([\s\S]{60,1200}?)<\/p>/gi)]
      .map((m) => cleanText(m[1]))
      .filter(
        (p) =>
          p.split(' ').length > 14 &&
          !/^(İçindekiler|Editör|Abone ol|©|Photo|Fotoğraf|REKLAM|Bu haber|Kaynakça)/i.test(p) &&
          !p.includes('©'),
      )
      .filter((p, i, arr) => arr.indexOf(p) === i)
      .slice(0, 24)

    // MEB il müdürlüklerinde gövde <p> değil og:description içindedir
    if (paragraphs.length < 2 && description && description.length > 200) {
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
      if (sentences.length > 0) paragraphs.push(...sentences.slice(0, 6))
    }

    return {
      title,
      image: image && !BAD_IMG.test(image) ? absolutize(image, url) : null,
      paragraphs,
      description,
      siteName,
      publishedAt: published && !Number.isNaN(+published) ? published.toISOString() : null,
    }
  } catch {
    return { image: null, paragraphs: [], description: null, siteName: null, title: null }
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
export async function downloadImage(url, referer, { maxBytes = 3_000_000 } = {}) {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, referer },
    redirect: 'follow',
  })
  if (!res.ok) return null
  const type = res.headers.get('content-type') ?? ''
  if (!/^image\/(jpeg|png|webp|avif)/.test(type)) return null
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 8000 || buf.length > maxBytes) return null
  if (!looksLikePhoto(buf)) return null
  return { buffer: buf, type }
}
