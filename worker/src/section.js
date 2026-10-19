/** Bölüm sayfasından haber bağlantılarını çıkarır. */
import { BLOCKED_PATH } from './config.js'

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const JUNK =
  /(wp-content|wp-json|wp-admin|themes|assets|\/css|\/js|\.css|\.js|\.png|\.jpg|cerez|kvkk|kvkk-aydinlatma|iletisim|abonelik|politika|etiket|arama|uye|giris|hesap|malli-kurumsal|kurumsal|reklam|sponsor|anket|iletisim-formu|yayin-rehberi)/i

/**
 * @param {string} url        bölüm sayfası
 * @param {string} prefix     yol ön eki (boş ise tüm bağlantılar)
 * @returns {Promise<string[]>} makale bağlantıları
 */
export async function fetchSectionLinks(url, prefix = '', { timeoutMs = 20000 } = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' },
    })
    if (!res.ok) return []
    const html = await res.text()
    const host = new URL(url).hostname.replace(/^www\./, '')
    const found = new Set()

    for (const m of html.matchAll(/href=["']([^"'#]+)["']/gi)) {
      let href = m[1].trim()
      // "//ornek.com/yol" protokol-göreli adrestir; "/yol" değil.
      if (href.startsWith('//')) href = `https:${href}`
      else if (href.startsWith('/')) href = `https://${host}${href}`
      if (!/^https?:\/\//i.test(href)) continue
      let u
      try {
        u = new URL(href)
      } catch {
        continue
      }
      if (u.hostname.replace(/^www\./, '') !== host) continue
      const p = u.pathname
      if (p === '/' || p.length < 22) continue
      if (JUNK.test(p)) continue
      if (BLOCKED_PATH.test(p)) continue
      if (/\.(xml|json|jpg|jpeg|png|webp|svg|gif|ico|pdf|html?)$/i.test(p)) continue
      if (prefix && !p.startsWith(prefix)) continue
      found.add(u.origin + p)
    }
    return [...found]
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}
