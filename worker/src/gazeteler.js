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
  { name: 'Oksijen', slug: 'oksijen' },
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
  oksijen: {
    thumb: 'https://i.gazeteoksijen.com/storage/files/images/2026/10/09/whatsapp-image-2026-10-07-at-16-v5rq.jpg',
    full: 'https://i.gazeteoksijen.com/storage/files/images/2026/10/09/whatsapp-image-2026-10-07-at-16-v5rq.jpg',
    date: 'Haftalık Sayı',
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

    if (t.slug === 'oksijen') {
      try {
        const res = await fetch('https://gazeteoksijen.com/e-gazete', { headers: { 'User-Agent': UA } })
        if (res.ok) {
          const html = await res.text()
          const m = html.match(/https:\/\/i\.gazeteoksijen\.com\/storage\/files\/images\/[^\s"']+\.jpg/i)
          if (m) {
            map.set('oksijen', { thumb: m[0], full: m[0], date: 'Haftalık Sayı' })
            continue
          }
        }
      } catch {}
      continue
    }

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

  const [aksam, cumhuriyet, mansetler] = await Promise.all([
    fetchAksam().catch(() => null),
    fetchCumhuriyet().catch(() => null),
    fetchMansetler(prevMap).catch(() => []),
  ])

  const tamSayiList = [
    aksam || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Akşam'),
    cumhuriyet || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Cumhuriyet'),
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
