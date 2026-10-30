/**
 * Günlük e-Gazeteler & Manşetler Servisi
 *
 * 1. Tam Sayı e-Gazeteler (PDF):
 *    - Akşam: Esmedya API'sinden en son güncel sayı tespit edilir (thumb + full PDF).
 *    - Cumhuriyet: Cumhuriyet e-Arşiv API'sinden bugünün veya dünün sayısı tespit edilir (thumb + full PDF).
 *
 * 2. Günün Manşetleri (15 Gazete):
 *    - Sözcü, Nefes, Karar, Tavır, Korkusuz, Birgün, Evrensel, Yeniçağ, Oksijen,
 *      Posta, Hürriyet, Milliyet, Sabah, Takvim, Türkiye.
 *    - D1 ve Edge önbelleği ile hızlı yanıt ve kesintisiz erişim sağlanır.
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

export const TARGET_NEWSPAPERS = [
  { name: 'Sözcü', slug: 'sozcu-gazetesi-manseti' },
  { name: 'Nefes', slug: 'nefes-gazetesi-manseti' },
  { name: 'Karar', slug: 'karar-gazetesi-manseti' },
  { name: 'Tavır', slug: 'tavir-gazetesi-manseti' },
  { name: 'Korkusuz', slug: 'korkusuz-gazetesi-manseti' },
  { name: 'Birgün', slug: 'birgun-gazetesi-manseti' },
  { name: 'Evrensel', slug: 'evrensel-gazetesi-manseti' },
  { name: 'Yeniçağ', slug: 'yenicag-gazetesi-manseti' },
  { name: 'Oksijen', slug: 'oksijen-gazetesi-gazetesi-manseti' },
  { name: 'Posta', slug: 'posta-gazetesi-manseti' },
  { name: 'Hürriyet', slug: 'hurriyet-gazetesi-manseti' },
  { name: 'Milliyet', slug: 'milliyet-gazetesi-manseti' },
  { name: 'Sabah', slug: 'sabah-gazetesi-manseti' },
  { name: 'Takvim', slug: 'takvim-gazetesi-manseti' },
  { name: 'Türkiye', slug: 'turkiye-gazetesi-gazetesi-manseti' },
]

// Başlangıç / güvenilir yedek kapak haritası (hiçbir kart boş kalmasın diye)
const FALLBACK_MANSETLER = {
  'sozcu-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/10/29/sozcu-2026-10-29-rkgk.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/10/29/sozcu-2026-10-29-rkgk.jpg',
    date: '29 Ekim 2026',
  },
  'nefes-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/10/29/nefes-2026-10-29-jbuf.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/10/29/nefes-2026-10-29-jbuf.jpg',
    date: '29 Ekim 2026',
  },
  'karar-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/10/30/karar-2026-10-30-f2tx.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/10/30/karar-2026-10-30-f2tx.jpg',
    date: '30 Ekim 2026',
  },
  'tavir-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/10/29/tavir-gazetesi-2026-10-29-fzlu.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/10/29/tavir-gazetesi-2026-10-29-fzlu.jpg',
    date: '29 Ekim 2026',
  },
  'korkusuz-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/10/29/korkusuz-2026-10-29-abyt.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/10/29/korkusuz-2026-10-29-abyt.jpg',
    date: '29 Ekim 2026',
  },
  'birgun-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/10/30/birgun-2026-10-30-6g8i.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/10/30/birgun-2026-10-30-6g8i.jpg',
    date: '30 Ekim 2026',
  },
  'evrensel-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/10/30/evrensel-2026-10-30-80x4.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/10/30/evrensel-2026-10-30-80x4.jpg',
    date: '30 Ekim 2026',
  },
  'yenicag-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/10/30/yenicag-2026-10-30-cod4.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/10/30/yenicag-2026-10-30-cod4.jpg',
    date: '30 Ekim 2026',
  },
  'oksijen-gazetesi-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/10/30/oksijen-2026-10-30-4uz2.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/10/30/oksijen-2026-10-30-4uz2.jpg',
    date: '30 Ekim 2026',
  },
  'posta-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/10/29/posta-2026-10-29-kqfd.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/10/29/posta-2026-10-29-kqfd.jpg',
    date: '29 Ekim 2026',
  },
  'hurriyet-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/10/29/hurriyet-2026-10-29-g87p.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/10/29/hurriyet-2026-10-29-g87p.jpg',
    date: '29 Ekim 2026',
  },
  'milliyet-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/10/29/milliyet-2026-10-29-7gi8.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/10/29/milliyet-2026-10-29-7gi8.jpg',
    date: '29 Ekim 2026',
  },
  'sabah-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/10/29/sabah-2026-10-29-8jzj.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/10/29/sabah-2026-10-29-8jzj.jpg',
    date: '29 Ekim 2026',
  },
  'takvim-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/10/29/takvim-2026-10-29-gzsd.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/10/29/takvim-2026-10-29-gzsd.jpg',
    date: '29 Ekim 2026',
  },
  'turkiye-gazetesi-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/10/30/turkiye-gazetesi-2026-10-30-wckb.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/10/30/turkiye-gazetesi-2026-10-30-wckb.jpg',
    date: '30 Ekim 2026',
  },
}

// Türkçe aylar
const TR_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

function formatTurkishDate(dateStr) {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const year = parts[0]
  const month = parseInt(parts[1], 10)
  const day = parseInt(parts[2], 10)
  const monthName = TR_MONTHS[month - 1] || parts[1]
  return `${day} ${monthName} ${year}`
}

/** Akşam gazetesinin en güncel sayısını esmedya üzerinden bulur. */
async function fetchAksam() {
  for (let id = 17280; id >= 17268; id--) {
    try {
      const res = await fetch(`https://members.esmedya.com.tr/products?productId=${id}&memberId=0`, {
        headers: { 'User-Agent': UA },
      })
      if (res.ok) {
        const json = await res.json()
        const item = json?.ResultTable?.[0]
        if (item && item.pdf) {
          const dateMatch = (item.relDate || '').match(/\d+\s+\S+\s+\d{4}/)
          return {
            id: `aksam_${id}`,
            name: 'Akşam',
            title: item.name || 'Akşam Gazetesi',
            date: dateMatch ? dateMatch[0] : (item.relDate || 'Bugün'),
            thumb: item.thumb ? `https://members.esmedya.com.tr/${item.thumb}` : '',
            pdf: item.pdf ? `https://members.esmedya.com.tr/${item.pdf}` : '',
          }
        }
      }
    } catch {}
  }
  return null
}

/** Cumhuriyet gazetesinin en güncel sayısını e-Arşiv API'sinden çeker. */
async function fetchCumhuriyet() {
  for (let offset = 0; offset <= 3; offset++) {
    const dt = new Date(Date.now() - offset * 86400000)
    try {
      const res = await fetch('https://egazete.cumhuriyet.com.tr/Monitor/GetAllWithSearch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': UA,
          Referer: 'https://egazete.cumhuriyet.com.tr/',
        },
        body: JSON.stringify({
          Year: dt.getFullYear(),
          Month: dt.getMonth() + 1,
          Day: dt.getDate(),
        }),
      })
      if (res.ok) {
        const list = await res.json()
        if (Array.isArray(list) && list.length > 0) {
          const first = list[0]
          const cover = first.NewspaperCover || ''
          const pdf = cover
            ? cover.replace(/_1_thumbnail\.jpe?g$/i, '.pdf').replace(/_thumbnail\.jpe?g$/i, '.pdf')
            : ''
          return {
            id: `cumhuriyet_${first.IdNewspaperPage || dt.toISOString().slice(0, 10)}`,
            name: 'Cumhuriyet',
            title: 'Cumhuriyet Gazetesi',
            date: first.NewspaperDate || `${dt.getDate()}.${dt.getMonth() + 1}.${dt.getFullYear()}`,
            thumb: cover ? `https://egazete.cumhuriyet.com.tr${cover}` : '',
            pdf: pdf ? `https://egazete.cumhuriyet.com.tr${pdf}` : '',
          }
        }
      }
    } catch {}
  }
  return null
}

/** Posta gazetesinin en güncel tam sayısını Voltran e-Gazete API'sinden çeker. */
async function fetchPosta() {
  try {
    const deviceId = 'a1b2c3d4e5f60718'
    const pubUrl = `https://voltran-egazeteapi.hurriyet.com.tr/api/v1/content/publication/?appcode=posta&deviceid=${deviceId}&machine=Samsung&model=SM-S918B&platform=android&userid=null&ssoid=null`
    const pubRes = await fetch(pubUrl, {
      headers: { 'User-Agent': 'okhttp/4.9.1', Accept: 'application/json' },
    })
    if (!pubRes.ok) return null
    const pubData = await pubRes.json()
    const latestIssue = pubData?.latestIssue
    if (!latestIssue) return null

    const issueUrl = `https://voltran-egazeteapi.hurriyet.com.tr/api/v1/content/issue/?appcode=posta&deviceid=${deviceId}&machine=Samsung&model=SM-S918B&platform=android&userid=null&ssoid=null&issue=${latestIssue}`
    const issueRes = await fetch(issueUrl, {
      headers: { 'User-Agent': 'okhttp/4.9.1', Accept: 'application/json' },
    })
    if (!issueRes.ok) return null
    const issueData = await issueRes.json()

    const parts = issueData?.parts || []
    const mainPart = parts[0]
    const rawPages = mainPart?.pages || []
    if (rawPages.length === 0) return null

    const pages = rawPages.map((p) => {
      let highUrl = p.fullNameUrl || ''
      if (!highUrl && p.fullThumbNameUrl) {
        highUrl = p.fullThumbNameUrl.replace('/90/0x300/', '/80/1433x2424/').replace('/0x300/', '/1433x2424/')
      }
      return {
        page: p.page,
        img: highUrl.replace('http://', 'https://'),
        thumb: (p.fullThumbNameUrl || highUrl).replace('http://', 'https://'),
      }
    })

    const formattedDate = formatTurkishDate(latestIssue)
    const coverThumb = pages[0]?.thumb || pages[0]?.img || ''

    return {
      id: `posta_${latestIssue}`,
      name: 'Posta',
      title: 'Posta Gazetesi',
      date: formattedDate,
      thumb: coverThumb,
      pdf: '',
      pageCount: pages.length,
      pages,
    }
  } catch (err) {
    console.warn('[gazeteler] Posta cekilemedi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** Gazeteoku ve ilgili kaynaklardan günün manşetlerini derler. */
async function fetchMansetler(prevMap = {}) {
  const map = new Map(Object.entries(prevMap || {}))

  // 1. Gazeteoku gazeteler sayfası (tek istekte toplu manşetler)
  try {
    const res = await fetch('https://www.gazeteoku.com/gazeteler', { headers: { 'User-Agent': UA } })
    if (res.ok) {
      const html = await res.text()
      const cards = html.match(/<a[^>]+href="https:\/\/www\.gazeteoku\.com\/gazeteler\/[^"]+"[\s\S]*?<\/a>/gi) || []
      for (const card of cards) {
        const slugMatch = card.match(/href="https:\/\/www\.gazeteoku\.com\/gazeteler\/([^"]+)"/i)
        const dateMatch = card.match(/<small>([^<]+)<\/small>/i)
        const imgMatch = card.match(/data-src="([^"]+)"/i) || card.match(/src="([^"]+)"/i)
        if (slugMatch && imgMatch) {
          const slug = slugMatch[1]
          const thumb = imgMatch[1]
          const full = thumb.replace(/\/3\/230\/336\//, '/')
          const date = dateMatch ? dateMatch[1].trim() : ''
          map.set(slug, { thumb, full, date })
        }
      }
    }
  } catch (err) {
    console.warn('[gazeteler] gazeteoku toplu okuma hatasi:', String(err?.message ?? err).slice(0, 100))
  }

  // 2. Kalan gazeteler için tekil sayfaları tara (önbellekte varsa dokunma)
  for (const t of TARGET_NEWSPAPERS) {
    if (map.has(t.slug) && map.get(t.slug)?.thumb) continue

    try {
      const res = await fetch(`https://www.gazeteoku.com/gazeteler/${t.slug}`, { headers: { 'User-Agent': UA } })
      if (res.ok) {
        const html = await res.text()
        const imgMatch = html.match(/https:\/\/i\.gazeteoku\.com\/storage\/files\/images\/[^\s"']+\.jpg/i)
        const dateMatch = html.match(/<small>([^<]+)<\/small>/i) || html.match(/(\d+\s+\S+\s+\d{4})/i)
        if (imgMatch) {
          const full = imgMatch[0]
          const thumb = full.replace('/storage/files/images/', '/3/230/336/storage/files/images/')
          map.set(t.slug, { thumb, full, date: dateMatch ? dateMatch[1].trim() : 'Bugün' })
        }
      }
    } catch {}
  }

  // Listeyi orijinal sırayla hazırla, eksik olanları güvenli yedekle tamamla
  return TARGET_NEWSPAPERS.map((t) => {
    const data = map.get(t.slug) || FALLBACK_MANSETLER[t.slug]
    return {
      name: t.name,
      slug: t.slug,
      thumb: data?.thumb || FALLBACK_MANSETLER[t.slug]?.thumb || '',
      full: data?.full || FALLBACK_MANSETLER[t.slug]?.full || '',
      date: data?.date || 'Bugün',
    }
  })
}

/**
 * eGazeteleri D1 önbelleğinden okur, gerekirse arka planda günceller.
 */
export async function getGazeteler(env) {
  const CACHE_KEY = 'daily_gazeteler_cache'
  const TTL_MS = 30 * 60 * 1000 // 30 dakika önbellek süresi

  let cachedData = null
  try {
    const row = await env.DB.prepare('SELECT value FROM system_settings WHERE key = ?')
      .bind(CACHE_KEY)
      .first()
    if (row?.value) {
      cachedData = JSON.parse(row.value)
      const age = Date.now() - (cachedData.timestamp || 0)
      if (age < TTL_MS && cachedData.mansetler?.length && cachedData.tam_sayi?.length) {
        return cachedData.data
      }
    }
  } catch (err) {
    console.warn('[gazeteler] onbellek okuma hatasi:', String(err?.message ?? err).slice(0, 100))
  }

  // Önbellek yoksa veya eskimişse taze veriyi çek
  const prevMap = {}
  if (cachedData?.data?.mansetler) {
    for (const m of cachedData.data.mansetler) {
      if (m.slug && m.thumb) prevMap[m.slug] = m
    }
  }

  const [aksam, cumhuriyet, posta, mansetler] = await Promise.all([
    fetchAksam().catch(() => null),
    fetchCumhuriyet().catch(() => null),
    fetchPosta().catch(() => null),
    fetchMansetler(prevMap).catch(() => []),
  ])

  const tamSayiList = [
    aksam || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Akşam'),
    cumhuriyet || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Cumhuriyet'),
    posta || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Posta'),
  ].filter(Boolean)

  const payload = {
    tam_sayi: tamSayiList,
    mansetler: mansetler.length ? mansetler : (cachedData?.data?.mansetler || Object.values(FALLBACK_MANSETLER)),
    updated_at: new Date().toISOString(),
  }

  // D1'e kaydet
  try {
    await env.DB.prepare(
      `INSERT INTO system_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
      .bind(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: payload }))
      .run()
  } catch (err) {
    console.warn('[gazeteler] onbellek yazma hatasi:', String(err?.message ?? err).slice(0, 100))
  }

  return payload
}

/**
 * GZT (gazetemanset.gzt.com) üzerinden günün tüm ulusal gazete manşetlerini çeker.
 * D1 system_settings tablosunda günlük önbelleğe alınır.
 */
export async function getGztMansetler(env) {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const dateStr = `${y}-${m}-${d}`
  const formattedDate = formatTurkishDate(dateStr)
  const fileName = `ZEN Gazete Manşetleri - ${formattedDate}.pdf`

  const CACHE_KEY = `gzt_mansetler_${dateStr}`

  // 1. D1 önbellek kontrolü
  try {
    const row = await env.DB.prepare('SELECT value FROM system_settings WHERE key = ?')
      .bind(CACHE_KEY)
      .first()
    if (row?.value) {
      const parsed = JSON.parse(row.value)
      if (Array.isArray(parsed.newspapers) && parsed.newspapers.length > 0) {
        return parsed
      }
    }
  } catch {}

  // 2. GZT sayfasından canlı çekim
  try {
    const res = await fetch('https://gazetemanset.gzt.com/', {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    })
    if (!res.ok) throw new Error(`GZT HTTP ${res.status}`)
    const html = await res.text()

    const articles = html.split('<article class="newspaper-headline-card">').slice(1)
    const items = []

    for (const art of articles) {
      const content = art.split('</article>')[0]
      const srcM = content.match(/src=["']([^"']+)["']/)
      const nameM = content.match(/<span class="newspaper-headline-card-name-line">([^<]+)<\/span>/)
      const altM = content.match(/alt=["']([^"']*)["']/)

      let name = nameM ? nameM[1].trim() : altM ? altM[1].split('Gazetesi')[0].trim() : 'Gazete'
      name = name
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')

      const imgSrc = srcM ? srcM[1] : ''
      if (imgSrc && imgSrc.startsWith('http')) {
        items.push({
          id: items.length + 1,
          name,
          imgSrc,
        })
      }
    }

    const result = {
      success: true,
      date: dateStr,
      formattedDate,
      fileName,
      count: items.length,
      newspapers: items,
    }

    if (items.length > 0) {
      try {
        await env.DB.prepare(
          `INSERT INTO system_settings (key, value) VALUES (?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        )
          .bind(CACHE_KEY, JSON.stringify(result))
          .run()
      } catch {}
    }

    return result
  } catch (err) {
    console.error('[gzt-mansetler] Canli tarama hatasi:', err)
    return {
      success: false,
      error: String(err?.message ?? err),
      date: dateStr,
      formattedDate,
      fileName,
      count: 0,
      newspapers: [],
    }
  }
}
