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
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/11/08/sozcu-2026-11-08-nkeu.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/11/08/sozcu-2026-11-08-nkeu.jpg',
    date: '8 Kasım 2026',
  },
  'nefes-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/11/08/nefes-2026-11-08-kl85.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/11/08/nefes-2026-11-08-kl85.jpg',
    date: '8 Kasım 2026',
  },
  'karar-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/11/09/karar-2026-11-09-l7gb.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/11/09/karar-2026-11-09-l7gb.jpg',
    date: '9 Kasım 2026',
  },
  'tavir-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/11/08/tavir-gazetesi-2026-11-08-nxj5.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/11/08/tavir-gazetesi-2026-11-08-nxj5.jpg',
    date: '8 Kasım 2026',
  },
  'korkusuz-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/11/08/korkusuz-2026-11-08-1m0p.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/11/08/korkusuz-2026-11-08-1m0p.jpg',
    date: '8 Kasım 2026',
  },
  'birgun-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/11/09/birgun-2026-11-09-hayf.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/11/09/birgun-2026-11-09-hayf.jpg',
    date: '9 Kasım 2026',
  },
  'evrensel-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/11/09/evrensel-2026-11-09-vtjq.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/11/09/evrensel-2026-11-09-vtjq.jpg',
    date: '9 Kasım 2026',
  },
  'yenicag-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/11/09/yenicag-2026-11-09-6n5b.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/11/09/yenicag-2026-11-09-6n5b.jpg',
    date: '9 Kasım 2026',
  },
  'oksijen-gazetesi-gazetesi-manseti': {
    thumb: 'https://gazeteoksijen.com/wp-content/uploads/2026/11/6-kasim-2026-manset-768x1161.jpg',
    full: 'https://gazeteoksijen.com/wp-content/uploads/2026/11/6-kasim-2026-manset.jpg',
    date: '6 - 12 Kasım 2026',
  },
  'posta-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/11/09/posta-2026-11-09-to18.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/11/09/posta-2026-11-09-to18.jpg',
    date: '9 Kasım 2026',
  },
  'hurriyet-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/11/09/hurriyet-2026-11-09-ejmo.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/11/09/hurriyet-2026-11-09-ejmo.jpg',
    date: '9 Kasım 2026',
  },
  'milliyet-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/11/09/milliyet-2026-11-09-kqgf.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/11/09/milliyet-2026-11-09-kqgf.jpg',
    date: '9 Kasım 2026',
  },
  'sabah-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/11/09/sabah-2026-11-09-ixdy.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/11/09/sabah-2026-11-09-ixdy.jpg',
    date: '9 Kasım 2026',
  },
  'takvim-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/11/09/takvim-2026-11-09-0jpd.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/11/09/takvim-2026-11-09-0jpd.jpg',
    date: '9 Kasım 2026',
  },
  'turkiye-gazetesi-gazetesi-manseti': {
    thumb: 'https://i.gazeteoku.com/3/230/336/storage/files/images/2026/11/09/turkiye-gazetesi-2026-11-09-im9r.jpg',
    full: 'https://i.gazeteoku.com/storage/files/images/2026/11/09/turkiye-gazetesi-2026-11-09-im9r.jpg',
    date: '9 Kasım 2026',
  },
}

const FALLBACK_AKSAM = {
  id: 'aksam_17284',
  name: 'Akşam',
  title: 'Akşam',
  date: '9 Kasım 2026',
  thumb: 'https://members.esmedya.com.tr/images/products/678b88d4-53fc-463d-ad4a-a035ce675c96.jpg',
  pdf: 'https://members.esmedya.com.tr/pdf/products/1269fb9c-feeb-4919-8669-e931fe641040.pdf',
}

const FALLBACK_YANKI = {
  id: 'yanki_2026-11-06',
  name: 'Yankı',
  title: 'Yankı',
  date: '6 Kasım 2026',
  thumb: '/api/proxy-image?url=https%3A%2F%2Fcdn.webaksiyon.com%2Fuploads%2F13620%2F2026%2F11%2F06%2Fwhatsapp-image-2026-11-05-at-175102-093612.jpeg',
  pdf: '',
  pageCount: 4,
  pages: [
    { page: 1, img: '/api/proxy-image?url=https%3A%2F%2Fcdn.webaksiyon.com%2Fuploads%2F13620%2F2026%2F11%2F06%2Fwhatsapp-image-2026-11-05-at-175102-093612.jpeg', thumb: '/api/proxy-image?url=https%3A%2F%2Fcdn.webaksiyon.com%2Fuploads%2F13620%2F2026%2F11%2F06%2Fwhatsapp-image-2026-11-05-at-175102-093612.jpeg' },
    { page: 2, img: '/api/proxy-image?url=https%3A%2F%2Fcdn.webaksiyon.com%2Fuploads%2F13620%2F2026%2F11%2F06%2Fwhatsapp-image-2026-11-05-at-174234-093613.jpeg', thumb: '/api/proxy-image?url=https%3A%2F%2Fcdn.webaksiyon.com%2Fuploads%2F13620%2F2026%2F11%2F06%2Fwhatsapp-image-2026-11-05-at-174234-093613.jpeg' },
    { page: 3, img: '/api/proxy-image?url=https%3A%2F%2Fcdn.webaksiyon.com%2Fuploads%2F13620%2F2026%2F11%2F06%2Fwhatsapp-image-2026-11-05-at-174234-1-093615.jpeg', thumb: '/api/proxy-image?url=https%3A%2F%2Fcdn.webaksiyon.com%2Fuploads%2F13620%2F2026%2F11%2F06%2Fwhatsapp-image-2026-11-05-at-174234-1-093615.jpeg' },
    { page: 4, img: '/api/proxy-image?url=https%3A%2F%2Fcdn.webaksiyon.com%2Fuploads%2F13620%2F2026%2F11%2F06%2Fwhatsapp-image-2026-11-05-at-174234-2-093617.jpeg', thumb: '/api/proxy-image?url=https%3A%2F%2Fcdn.webaksiyon.com%2Fuploads%2F13620%2F2026%2F11%2F06%2Fwhatsapp-image-2026-11-05-at-174234-2-093617.jpeg' },
  ],
}

const FALLBACK_EKSPRES = {
  id: 'ekspres_izmir-haber-ekspres-gazetesi-6-mayis-2025-sali-manseti',
  name: 'Ekspres',
  title: 'Haber Ekspres',
  date: '6 Mayıs 2025',
  thumb: '/api/proxy-image?url=https%3A%2F%2Fhabereksprescomtr.teimg.com%2Fhaberekspres-com-tr%2Fuploads%2F2025%2F05%2F6-mayis-sali-1.jpeg',
  pdf: '',
  pageCount: 8,
  pages: [
    { page: 1, img: '/api/proxy-image?url=https%3A%2F%2Fhabereksprescomtr.teimg.com%2Fhaberekspres-com-tr%2Fuploads%2F2025%2F05%2F6-mayis-sali-1.jpeg', thumb: '/api/proxy-image?url=https%3A%2F%2Fhabereksprescomtr.teimg.com%2Fhaberekspres-com-tr%2Fuploads%2F2025%2F05%2F6-mayis-sali-1.jpeg' },
    { page: 2, img: '/api/proxy-image?url=https%3A%2F%2Fhabereksprescomtr.teimg.com%2Fhaberekspres-com-tr%2Fuploads%2F2025%2F05%2F6-mayis-sali-2.jpeg', thumb: '/api/proxy-image?url=https%3A%2F%2Fhabereksprescomtr.teimg.com%2Fhaberekspres-com-tr%2Fuploads%2F2025%2F05%2F6-mayis-sali-2.jpeg' },
    { page: 3, img: '/api/proxy-image?url=https%3A%2F%2Fhabereksprescomtr.teimg.com%2Fhaberekspres-com-tr%2Fuploads%2F2025%2F05%2F6-mayis-sali-3.jpeg', thumb: '/api/proxy-image?url=https%3A%2F%2Fhabereksprescomtr.teimg.com%2Fhaberekspres-com-tr%2Fuploads%2F2025%2F05%2F6-mayis-sali-3.jpeg' },
    { page: 4, img: '/api/proxy-image?url=https%3A%2F%2Fhabereksprescomtr.teimg.com%2Fhaberekspres-com-tr%2Fuploads%2F2025%2F05%2F6-mayis-sali-4.jpeg', thumb: '/api/proxy-image?url=https%3A%2F%2Fhabereksprescomtr.teimg.com%2Fhaberekspres-com-tr%2Fuploads%2F2025%2F05%2F6-mayis-sali-4.jpeg' },
    { page: 5, img: '/api/proxy-image?url=https%3A%2F%2Fhabereksprescomtr.teimg.com%2Fhaberekspres-com-tr%2Fuploads%2F2025%2F05%2F6-mayis-sali-5.jpeg', thumb: '/api/proxy-image?url=https%3A%2F%2Fhabereksprescomtr.teimg.com%2Fhaberekspres-com-tr%2Fuploads%2F2025%2F05%2F6-mayis-sali-5.jpeg' },
    { page: 6, img: '/api/proxy-image?url=https%3A%2F%2Fhabereksprescomtr.teimg.com%2Fhaberekspres-com-tr%2Fuploads%2F2025%2F05%2F6-mayis-sali-6.jpeg', thumb: '/api/proxy-image?url=https%3A%2F%2Fhabereksprescomtr.teimg.com%2Fhaberekspres-com-tr%2Fuploads%2F2025%2F05%2F6-mayis-sali-6.jpeg' },
    { page: 7, img: '/api/proxy-image?url=https%3A%2F%2Fhabereksprescomtr.teimg.com%2Fhaberekspres-com-tr%2Fuploads%2F2025%2F05%2F6-mayis-sali-7.jpeg', thumb: '/api/proxy-image?url=https%3A%2F%2Fhabereksprescomtr.teimg.com%2Fhaberekspres-com-tr%2Fuploads%2F2025%2F05%2F6-mayis-sali-7.jpeg' },
    { page: 8, img: '/api/proxy-image?url=https%3A%2F%2Fhabereksprescomtr.teimg.com%2Fhaberekspres-com-tr%2Fuploads%2F2025%2F05%2F6-mayis-sali-8.jpeg', thumb: '/api/proxy-image?url=https%3A%2F%2Fhabereksprescomtr.teimg.com%2Fhaberekspres-com-tr%2Fuploads%2F2025%2F05%2F6-mayis-sali-8.jpeg' },
  ],
}

const FALLBACK_HURSES = {
  id: 'hurses_533128',
  name: 'Hürses',
  title: 'Hürses Gazetesi',
  date: '7 Kasım 2026',
  thumb: '/api/proxy-image?url=https%3A%2F%2Fimages.haberantalya.com%2Farsivgaleri%2F2026%2F11%2Fhurses-1-7-6aedfec315f8d.webp',
  pdf: '',
  pageCount: 4,
  pages: [
    { page: 1, img: '/api/proxy-image?url=https%3A%2F%2Fimages.haberantalya.com%2Farsivgaleri%2F2026%2F11%2Fhurses-1-7-6aedfec315f8d.webp', thumb: '/api/proxy-image?url=https%3A%2F%2Fimages.haberantalya.com%2Farsivgaleri%2F2026%2F11%2Fhurses-1-7-6aedfec315f8d.webp' },
    { page: 2, img: '/api/proxy-image?url=https%3A%2F%2Fimages.haberantalya.com%2Farsivgaleri%2F2026%2F11%2Fhurses-2-7-6aedfec466950.webp', thumb: '/api/proxy-image?url=https%3A%2F%2Fimages.haberantalya.com%2Farsivgaleri%2F2026%2F11%2Fhurses-2-7-6aedfec466950.webp' },
    { page: 3, img: '/api/proxy-image?url=https%3A%2F%2Fimages.haberantalya.com%2Farsivgaleri%2F2026%2F11%2Fhurses-3-7-6aedfec587484.webp', thumb: '/api/proxy-image?url=https%3A%2F%2Fimages.haberantalya.com%2Farsivgaleri%2F2026%2F11%2Fhurses-3-7-6aedfec587484.webp' },
    { page: 4, img: '/api/proxy-image?url=https%3A%2F%2Fimages.haberantalya.com%2Farsivgaleri%2F2026%2F11%2Fhurses-4-7-6aedfec67cf3f.webp', thumb: '/api/proxy-image?url=https%3A%2F%2Fimages.haberantalya.com%2Farsivgaleri%2F2026%2F11%2Fhurses-4-7-6aedfec67cf3f.webp' },
  ],
}

const FALLBACK_CORUMHABER = {
  id: 'corumhaber_2026-11-09',
  name: 'Çorum Haber',
  title: 'Çorum Haber',
  date: '9 Kasım 2026',
  thumb: 'https://corumhabernet.teimg.com/resize/600x900/corumhaber-net/uploads/2026/11/egazete/9-kasim-23.jpg',
  pdf: 'https://corumhabernet.teimg.com/corumhaber-net/uploads/2026/11/egazete/9-kasim-2026-pazartesi.pdf',
}

// Türkçe aylar

const TR_MONTHS = [

  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',

  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',

]

const TR_MONTHS_MAP = {
  ocak: '01', subat: '02', 'şubat': '02', mart: '03', nisan: '04', mayis: '05', 'mayıs': '05',
  haziran: '06', temmuz: '07', agustos: '08', 'ağustos': '08', eylul: '09', 'eylül': '09',
  ekim: '10', kasim: '11', 'kasım': '11', aralik: '12', 'aralık': '12',
}

const EN_TO_TR_MONTHS = {
  january: 'Ocak', february: 'Şubat', march: 'Mart', april: 'Nisan', may: 'Mayıs', june: 'Haziran',
  july: 'Temmuz', august: 'Ağustos', september: 'Eylül', october: 'Ekim', november: 'Kasım', december: 'Aralık',
}

function formatTurkishDate(dateStr) {
  if (!dateStr) return 'Bugün'
  let s = String(dateStr).trim()
  // İngilizce ay adlarını Türkçeye çevir (örn. "08 November 2026" -> "8 Kasım 2026")
  for (const [en, tr] of Object.entries(EN_TO_TR_MONTHS)) {
    const re = new RegExp(`\\b${en}\\b`, 'i')
    if (re.test(s)) {
      s = s.replace(re, tr)
      const dm = s.match(/^0?(\d{1,2})\s+([^\s\d]+)\s+(\d{4})/)
      if (dm) return `${parseInt(dm[1], 10)} ${dm[2]} ${dm[3]}`
    }
  }
  // Eğer zaten Türkçe veya tarih aralığı ("6 - 12 Kasım 2026" gibi) içeriyorsa doğrudan döndür
  if (/[a-zA-ZçğıöşüÇĞİÖŞÜ]/.test(s)) {
    const m = s.match(/^0?(\d{1,2})\s+([^\s\d]+)\s+(\d{4})(\s*·\s*.*)?$/)
    if (m) {
      return `${parseInt(m[1], 10)} ${m[2]} ${m[3]}${m[4] || ''}`
    }
    return s
  }
  const dotMatch = s.match(/^0?(\d{1,2})\.0?(\d{1,2})\.(\d{4})/)
  if (dotMatch) {
    const day = parseInt(dotMatch[1], 10)
    const month = parseInt(dotMatch[2], 10)
    const year = dotMatch[3]
    const monthName = TR_MONTHS[month - 1] || month
    return `${day} ${monthName} ${year}`
  }
  const isoMatch = s.match(/^(\d{4})-0?(\d{1,2})-0?(\d{1,2})/)
  if (isoMatch) {
    const year = isoMatch[1]
    const month = parseInt(isoMatch[2], 10)
    const day = parseInt(isoMatch[3], 10)
    const monthName = TR_MONTHS[month - 1] || month
    return `${day} ${monthName} ${year}`
  }
  return s
}

function ddmmYYYYToISO(s) {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(String(s || ''))
  if (!m) return null
  return `${m[3]}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`
}

function getTurkeyDate(offsetDays = 0) {

  const now = new Date()

  const trNow = new Date(now.getTime() + 3 * 3600 * 1000 + offsetDays * 86400 * 1000)

  const y = trNow.getUTCFullYear()

  const m = String(trNow.getUTCMonth() + 1).padStart(2, '0')

  const d = String(trNow.getUTCDate()).padStart(2, '0')

  const yy = String(y).slice(-2)

  return { y, m, d, yy, yymmdd: `${yy}${m}${d}`, iso: `${y}-${m}-${d}`, display: `${d}.${m}.${y}` }

}

async function probeUrl(url, timeoutMs = 4000) {

  try {

    const controller = new AbortController()

    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const res = await fetch(url, {

      method: 'HEAD',

      headers: { 'User-Agent': UA },

      signal: controller.signal,

    })

    clearTimeout(timer)

    return res.ok ? url : null

  } catch {

    return null

  }

}

/** Akşam gazetesinin en güncel sayısını esmedya üzerinden bulur. */

async function fetchAksam() {
  // 7 Kasım 2026 tarihinde ID 17282 idi. Gün farkına göre dinamik tahmin edilir.
  const trToday = getTurkeyDate(0)
  const diffDays = Math.round((new Date(trToday.iso).getTime() - new Date('2026-11-07').getTime()) / 86400000)
  const baseId = 17282 + diffDays

  // Erken yüklenen sayıları ve son 5 günü tara
  for (let id = baseId + 2; id >= baseId - 5; id--) {
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
            title: 'Akşam',
            date: formatTurkishDate(dateMatch ? dateMatch[0] : (item.relDate || 'Bugün')),
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

            title: 'Cumhuriyet',

            date: formatTurkishDate(first.NewspaperDate || `${dt.getDate()}.${dt.getMonth() + 1}.${dt.getFullYear()}`),

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

/** Voltran API üzerinden gazete çeker (Posta / Fanatik) */
async function fetchVoltranGazete(app, displayName) {
  const deviceId = `${app}_web_` + Date.now().toString(36)
  const tried = new Set()
  const dates = [0, -1, -2, -3].map((off) => getTurkeyDate(off).iso)

  for (const date of dates) {
    if (tried.has(date)) continue
    tried.add(date)

    const url = `https://voltran-egazeteapi.hurriyet.com.tr/api/v1/content/issue/?appcode=${app}&deviceid=${deviceId}&machine=Samsung&model=SM-S918B&platform=android&userid=null&ssoid=null&issue=${date}`
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'okhttp/5.0.0-alpha.14', Accept: 'application/json' },
      })
      if (!res.ok) continue
      const issueData = await res.json()

      const parts = (issueData?.parts || []).filter((p) => (p.pages || []).length)
      if (parts.length > 0) {
        return buildVoltranGazeteResult(app, displayName, parts, date)
      }

      const smart = issueData?.smartDate ? ddmmYYYYToISO(issueData.smartDate) : null
      if (smart && !tried.has(smart)) {
        tried.add(smart)
        const url2 = `https://voltran-egazeteapi.hurriyet.com.tr/api/v1/content/issue/?appcode=${app}&deviceid=${deviceId}&machine=Samsung&model=SM-S918B&platform=android&userid=null&ssoid=null&issue=${smart}`
        const res2 = await fetch(url2, {
          headers: { 'User-Agent': 'okhttp/5.0.0-alpha.14', Accept: 'application/json' },
        })
        if (res2.ok) {
          const issueData2 = await res2.json()
          const parts2 = (issueData2?.parts || []).filter((p) => (p.pages || []).length)
          if (parts2.length > 0) {
            return buildVoltranGazeteResult(app, displayName, parts2, smart)
          }
        }
      }
    } catch {}
  }
  return null
}

function buildVoltranGazeteResult(app, displayName, parts, actualDate) {
  const mainPart = parts.find((p) => p.name && p.name.trim().toLowerCase() === app.toLowerCase())
    || [...parts].sort((a, b) => (b.pages?.length || 0) - (a.pages?.length || 0))[0]

  const rawPages = mainPart?.pages || []
  if (rawPages.length === 0) return null

  const pages = rawPages.map((p, idx) => {
    let highUrl = p.fullNameUrl || ''
    if (!highUrl && p.fullThumbNameUrl) {
      highUrl = p.fullThumbNameUrl.replace('/90/0x300/', '/80/1433x2424/').replace('/0x300/', '/1433x2424/')
    }
    highUrl = highUrl.replace('http://', 'https://')

    // Hurimg dinamik boyutlandırma: fullNameUrl üzerinden 600x1015 veya 400x0 thumb türet (asla 404 vermez)
    const reliableThumb = highUrl
      ? highUrl.replace(/\/80\/\d+x\d+\//, '/75/600x1015/').replace(/\/(\d+x\d+)\//, '/600x1015/')
      : (p.fullThumbNameUrl || '').replace('http://', 'https://')

    return {
      page: p.page || (idx + 1),
      img: highUrl,
      thumb: reliableThumb,
    }
  })

  const formattedDate = formatTurkishDate(actualDate)
  return {
    id: `${app}_${actualDate}`,
    name: displayName,
    title: displayName,
    date: formattedDate,
    thumb: pages[0]?.thumb || pages[0]?.img || '',
    pdf: '',
    pageCount: pages.length,
    pages,
  }
}

/** Posta gazetesinin en güncel tam sayısını çeker. */
async function fetchPosta() {
  return await fetchVoltranGazete('posta', 'Posta')
}

/** Sözcü gazetesinin en güncel tam sayısını web edisyonundan çeker. */
async function fetchSozcu() {
  try {
    const todayIso = getTurkeyDate(0).iso
    const yesterdayIso = getTurkeyDate(-1).iso

    const [resToday, resYesterday] = await Promise.all([
      fetch(`https://www.sozcu.com.tr/e-gazete?date=${todayIso}`, {
        headers: { 'User-Agent': UA, Accept: 'text/html' },
      }),
      fetch(`https://www.sozcu.com.tr/e-gazete?date=${yesterdayIso}`, {
        headers: { 'User-Agent': UA, Accept: 'text/html' },
      }),
    ])

    if (!resToday.ok) return null
    const htmlToday = await resToday.text()
    const htmlYesterday = resYesterday.ok ? await resYesterday.text() : ''

    const getFirstImageId = (html) => {
      const match = html.match(/data-pswp-src=["']https:\/\/sozcu01\.sozcucdn\.com\/sozcu\/production\/uploads\/enewspaper\/[^\/]+\/[^\/]+\/(\d+)jpg/)
      return match ? match[1] : null
    }

    const idToday = getFirstImageId(htmlToday)
    const idYesterday = getFirstImageId(htmlYesterday)

    // Eğer bugünün ilk görsel id'si dünkü ile aynıysa henüz yeni sayı çıkmamıştır, dünün sayısı yayındadır
    const isTodayPublished = idToday && idYesterday ? idToday !== idYesterday : true
    const actualDateIso = isTodayPublished ? todayIso : yesterdayIso
    const formattedDate = formatTurkishDate(actualDateIso)

    const slideRegex = /<a[^>]+data-pswp-src=["']([^"']+)["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/gi
    const pages = []
    let match
    let pageNum = 1
    while ((match = slideRegex.exec(htmlToday)) !== null) {
      const full = match[1].replace(/&amp;/g, '&')
      const thumb = match[2].replace(/&amp;/g, '&')
      pages.push({
        page: pageNum++,
        img: full,
        thumb: thumb || full,
      })
    }

    if (pages.length === 0) return null

    return {
      id: `sozcu_${actualDateIso}`,
      name: 'Sözcü',
      title: 'Sözcü',
      date: formattedDate,
      thumb: pages[0]?.thumb || pages[0]?.img || '',
      pdf: '',
      pageCount: pages.length,
      pages,
    }
  } catch (err) {
    console.warn('[gazeteler] Sozcu cekilemedi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** Aydınlık gazetesinin en güncel sayısını (resmi tek parça tam PDF) bulur. */

async function fetchAydinlik() {

  try {

    // 1. Probing stratejisi: Bugün, dün, 2 gün önce kontrol et

    for (let dayOffset = 0; dayOffset <= 3; dayOffset++) {

      const target = getTurkeyDate(-dayOffset)

      // Drupal klasör yükleme tarihi adayı: 1 gün önce, aynı gün, 2 gün önce

      const uploadCandidates = [1, 0, 2].map((upOffset) => {

        const up = getTurkeyDate(-(dayOffset + upOffset))

        return `${up.y}/${up.m}/${up.d}`

      })

      const pdfPromises = uploadCandidates.map(async (folder) => {

        const url = `https://egazete.aydinlik.com.tr/sites/default/files/gazeteler/${folder}/Aydinlik-${target.yymmdd}.pdf`

        const okUrl = await probeUrl(url)

        return okUrl ? { folder, pdfUrl: okUrl } : null

      })

      const results = await Promise.all(pdfPromises)

      const match = results.find(Boolean)

      if (match) {

        const coverCandidate = `https://egazete.aydinlik.com.tr/sites/default/files/gazete-gorselleri/${match.folder}/Aydinlik-${target.yymmdd}1.jpeg`

        const isCoverOk = await probeUrl(coverCandidate)

        const formattedDate = formatTurkishDate(target.iso)

        return {

          id: `aydinlik_${target.iso}`,

          name: 'Aydınlık',

          title: 'Aydınlık',

          date: formattedDate,

          thumb: isCoverOk || coverCandidate,

          pdf: match.pdfUrl,

        }

      }

    }

    // 2. Yedek Strateji: e-gazete HTML sayfasından regex ile çek

    const listingRes = await fetch('https://egazete.aydinlik.com.tr/e-gazete', {

      headers: { 'User-Agent': UA },

    })

    if (listingRes.ok) {

      const html = await listingRes.text()

      const m = html.match(/gazete-gorselleri\/(\d{4})\/(\d{2})\/(\d{2})\/Aydinlik-(\d{2})(\d{2})(\d{2})1\.jpeg/)

      if (m) {

        const [, upY, upM, upD, issYY, issM, issD] = m

        const folder = `${upY}/${upM}/${upD}`

        const yymmdd = `${issYY}${issM}${issD}`

        const fullYear = `20${issYY}`

        const iso = `${fullYear}-${issM}-${issD}`

        const pdfUrl = `https://egazete.aydinlik.com.tr/sites/default/files/gazeteler/${folder}/Aydinlik-${yymmdd}.pdf`

        const coverUrl = `https://egazete.aydinlik.com.tr/sites/default/files/gazete-gorselleri/${folder}/Aydinlik-${yymmdd}1.jpeg`

        return {

          id: `aydinlik_${iso}`,

          name: 'Aydınlık',

          title: 'Aydınlık',

          date: formatTurkishDate(iso),

          thumb: coverUrl,

          pdf: pdfUrl,

        }

      }

    }

  } catch (err) {

    console.warn('[gazeteler] Aydinlik cekilemedi:', String(err?.message ?? err).slice(0, 100))

  }

  return null

}

/** Fanatik spor gazetesinin en güncel tam sayısını Voltran e-Gazete API'sinden çeker. */

/** Fanatik spor gazetesinin en güncel tam sayısını çeker. */
async function fetchFanatik() {
  return await fetchVoltranGazete('fanatik', 'Fanatik')
}

/** Yeniçağ gazetesinin en güncel sayısını (tüm yüksek çözünürlüklü sayfalar) çeker. */

async function fetchYenicag() {

  try {

    const TR_MONTHS_LOWER = ['', 'ocak', 'subat', 'mart', 'nisan', 'mayis', 'haziran',

      'temmuz', 'agustos', 'eylul', 'ekim', 'kasim', 'aralik']

    const TR_WEEKDAYS_LOWER = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi', 'pazar']

    const dateToYenicagSlug = (dateStr) => {

      const [y, m, d] = dateStr.split('-').map(Number)

      const dt = new Date(Date.UTC(y, m - 1, d))

      const day = d

      const month = TR_MONTHS_LOWER[m]

      const year = y

      const dayOfWeek = (dt.getUTCDay() + 6) % 7

      const weekday = TR_WEEKDAYS_LOWER[dayOfWeek]

      return {

        fullSlug: `${day}-${month}-${year}-${weekday}`,

        simpleSlug: `${day}-${month}-${year}`,

      }

    }

    let htmlContent = null

    let resolvedDate = null

    // 1. Doğrudan güncel slug adaylarını dene (bugün, dün, 2 gün önce)

    for (let offset = 0; offset <= 2; offset++) {

      const dtInfo = getTurkeyDate(-offset)

      const { fullSlug, simpleSlug } = dateToYenicagSlug(dtInfo.iso)

      for (const slug of [fullSlug, simpleSlug]) {

        try {

          const res = await fetch(`https://www.yenicaggazetesi.com/egazete/${slug}`, {

            headers: { 'User-Agent': UA, Accept: 'text/html' },

          })

          if (res.ok) {

            htmlContent = await res.text()

            resolvedDate = dtInfo.iso

            break

          }

        } catch {}

      }

      if (htmlContent) break

    }

    // 2. Bulunamadıysa arşiv listing sayfasından ilk bağlantıyı yakala

    if (!htmlContent) {

      const listRes = await fetch('https://www.yenicaggazetesi.com/egazete', {

        headers: { 'User-Agent': UA, Accept: 'text/html' },

      })

      if (listRes.ok) {

        const listHtml = await listRes.text()

        const m = listHtml.match(/href=["']https?:\/\/www\.yenicaggazetesi\.com\/egazete\/([^"'#?]+)["']/i)

        if (m && m[1]) {

          const slug = m[1]

          const pageRes = await fetch(`https://www.yenicaggazetesi.com/egazete/${slug}`, {

            headers: { 'User-Agent': UA, Accept: 'text/html' },

          })

          if (pageRes.ok) {

            htmlContent = await pageRes.text()

            const sm = slug.match(/^(\d{1,2})-([a-z]+)-(\d{4})/i)

            if (sm) {

              const monthIdx = TR_MONTHS_LOWER.indexOf(sm[2].toLowerCase())

              if (monthIdx > 0) {

                resolvedDate = `${sm[3]}-${String(monthIdx).padStart(2, '0')}-${String(sm[1]).padStart(2, '0')}`

              }

            }

          }

        }

      }

    }

    if (!htmlContent) return null

    // Sayfa görsellerini ayıkla

    const matches = htmlContent.match(/https:\/\/img\.yenicaggazetesi\.com\/(?:rcman\/[^/]+\/)?storage\/([^"'\s]+?\.jpg)/gi) || []

    const uniquePaths = [...new Set(matches.map((m) => m.replace(/https:\/\/img\.yenicaggazetesi\.com\/(?:rcman\/[^/]+\/)?storage\//, '')))]

    if (uniquePaths.length === 0) return null

    const pagesWithNum = uniquePaths.map((p) => {

      const m1 = p.match(/-(\d{1,2})-yc[-.]/i)

      let pNum = 99

      if (m1) {

        pNum = parseInt(m1[1], 10)

      } else {

        const m2 = p.match(/\/(\d{1,2})\.jpg$/i)

        if (m2) pNum = parseInt(m2[1], 10)

      }

      return { path: p, pNum }

    })

    pagesWithNum.sort((a, b) => a.pNum - b.pNum)

    const pages = pagesWithNum.map((item, idx) => ({

      page: idx + 1,

      img: `https://img.yenicaggazetesi.com/rcman/Cw1433h2424q95gc/storage/${item.path}`,

      thumb: `https://img.yenicaggazetesi.com/rcman/Cw356h600q90gc/storage/${item.path}`,

    }))

    const dateToUse = resolvedDate || getTurkeyDate(0).iso

    const formattedDate = formatTurkishDate(dateToUse)

    return {

      id: `yenicag_${dateToUse}`,

      name: 'Yeniçağ',

      title: 'Yeniçağ',

      date: formattedDate,

      thumb: pages[0]?.thumb || pages[0]?.img || '',

      pdf: '',

      pageCount: pages.length,

      pages,

    }

  } catch (err) {

    console.warn('[gazeteler] Yenicag cekilemedi:', String(err?.message ?? err).slice(0, 100))

    return null

  }

}

/** Hakimiyet gazetesinin en güncel sayısını (PDF) çeker. */

async function fetchHakimiyet() {

  try {

    const listRes = await fetch('https://www.corumhakimiyet.net/egazete', {

      headers: { 'User-Agent': UA, Accept: 'text/html' },

    })

    if (!listRes.ok) return null

    const html = await listRes.text()

    // En güncel gazete bağlantısını bul: /egazete/corum-hakimiyet-04112026

    const m = html.match(/href=["'](\/egazete\/corum-hakimiyet-(\d{2})(\d{2})(\d{4}))["']/i)

    if (!m) return null

    const detailPath = m[1]

    const [, , d, mo, yr] = m

    const isoDate = `${yr}-${mo}-${d}`

    // Thumb görselini bağlantının yakınından yakala

    const idx = html.indexOf(detailPath)

    const chunk = html.slice(Math.max(0, idx - 300), Math.min(html.length, idx + 600))

    const imgMatch = chunk.match(/src=["'](https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp))["']/i)

    let thumb = imgMatch ? imgMatch[1] : ''

    if (thumb) {

      thumb = thumb.replace(/\/resize\/\d+x\d+\//, '/resize/600x900/')

    }

    // Detay sayfasından PDF bağlantısını çek

    let pdfUrl = ''

    try {

      const detailRes = await fetch(`https://www.corumhakimiyet.net${detailPath}`, {

        headers: { 'User-Agent': UA, Accept: 'text/html' },

      })

      if (detailRes.ok) {

        const detailHtml = await detailRes.text()

        const pdfMatch = detailHtml.match(/href=["'](https?:\/\/[^"'\s]+\.pdf)["']/i)

        if (pdfMatch) pdfUrl = pdfMatch[1]

      }

    } catch {}

    if (!pdfUrl) {

      pdfUrl = `https://corumhakimiyetnet.teimg.com/corumhakimiyet-net/uploads/${yr}/${mo}/${d}-${mo}-${yr}.pdf`

    }

    return {

      id: `hakimiyet_${isoDate}`,

      name: 'Hakimiyet',

      title: 'Hakimiyet',

      date: formatTurkishDate(isoDate),

      thumb,

      pdf: pdfUrl,

    }

  } catch (err) {

    console.warn('[gazeteler] Hakimiyet cekilemedi:', String(err?.message ?? err).slice(0, 100))

    return null

  }

}

/** Çorum Haber gazetesinin en güncel sayısını (PDF) çeker. */

async function fetchCorumHaber() {

  try {

    const TR_MONTHS_MAP = {

      ocak: '01', subat: '02', 'şubat': '02', mart: '03', nisan: '04', mayis: '05', 'mayıs': '05',

      haziran: '06', temmuz: '07', agustos: '08', 'ağustos': '08', eylul: '09', 'eylül': '09',

      ekim: '10', kasim: '11', 'kasım': '11', aralik: '12', 'aralık': '12',

    }

    const listRes = await fetch('https://corumhaber.net/e-gazete', {

      headers: { 'User-Agent': UA, Accept: 'text/html' },

    })

    if (!listRes.ok) return null

    const html = await listRes.text()

    // En güncel gazete bağlantısını bul: /e-gazete/4-kasim-2026

    const m = html.match(/href=["'](\/e-gazete\/(\d{1,2})-([a-zçğıöşü]+)-(\d{4}))["']/i)

    if (!m) return null

    const detailPath = m[1]

    const day = String(m[2]).padStart(2, '0')

    const monthName = m[3].toLowerCase()

    const month = TR_MONTHS_MAP[monthName] || '01'

    const year = m[4]

    const isoDate = `${year}-${month}-${day}`

    // Thumb görselini bağlantının yakınından yakala

    const idx = html.indexOf(detailPath)

    const chunk = html.slice(Math.max(0, idx - 300), Math.min(html.length, idx + 600))

    const imgMatch = chunk.match(/src=["'](https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp))["']/i)

    let thumb = imgMatch ? imgMatch[1] : ''

    if (thumb) {

      thumb = thumb.replace(/\/resize\/\d+x\d+\//, '/resize/600x900/')

    }

    // Detay sayfasından PDF bağlantısını çek

    let pdfUrl = ''

    try {

      const detailRes = await fetch(`https://corumhaber.net${detailPath}`, {

        headers: { 'User-Agent': UA, Accept: 'text/html' },

      })

      if (detailRes.ok) {

        const detailHtml = await detailRes.text()

        const pdfMatch = detailHtml.match(/href=["'](https?:\/\/[^"'\s]+\.pdf)["']/i)

        if (pdfMatch) pdfUrl = pdfMatch[1]

      }

    } catch {}

    return {

      id: `corumhaber_${isoDate}`,

      name: 'Çorum Haber',

      title: 'Çorum Haber',

      date: formatTurkishDate(isoDate),

      thumb,

      pdf: pdfUrl,

    }

  } catch (err) {

    console.warn('[gazeteler] Corum Haber cekilemedi:', String(err?.message ?? err).slice(0, 100))

    return null

  }

}

/** Türkgün gazetesinin en güncel sayısını (PDF) çeker. */
async function fetchTurkgun() {
  try {
    const listRes = await fetch('https://www.turkgun.com/e-gazeteler', {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    })
    if (!listRes.ok) return null
    const html = await listRes.text()

    const m = html.match(/href=["']([^"']*(?:\/e-gazete\/\d+\/turkgun-gazetesi-(\d{1,2})-([a-zçğıöşü]+)-(\d{4})))["']/i)
    if (!m) return null

    const rawUrl = m[1]
    const detailUrl = rawUrl.startsWith('http') ? rawUrl : `https://www.turkgun.com${rawUrl}`
    const day = String(m[2]).padStart(2, '0')
    const monthName = m[3].toLowerCase()
    const TR_MONTHS_MAP = {
      ocak: '01', subat: '02', 'şubat': '02', mart: '03', nisan: '04', mayis: '05', 'mayıs': '05',
      haziran: '06', temmuz: '07', agustos: '08', 'ağustos': '08', eylul: '09', 'eylül': '09',
      ekim: '10', kasim: '11', 'kasım': '11', aralik: '12', 'aralık': '12',
    }
    const month = TR_MONTHS_MAP[monthName] || '01'
    const year = m[4]
    const isoDate = `${year}-${month}-${day}`

    const detailRes = await fetch(detailUrl, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    })
    if (!detailRes.ok) return null
    const detailHtml = await detailRes.text()

    const pdfMatch = detailHtml.match(/href=["'](https?:\/\/[^"'\s]+\.pdf)["']/i)
    const pdfUrl = pdfMatch ? pdfMatch[1] : ''
    if (!pdfUrl) return null

    const imgMatch = detailHtml.match(/src=["'](https?:\/\/[^"'\s]*\/uploads\/enews\/[^"'\s]+?\.(?:png|jpg|jpeg|webp))["']/i)
    const coverUrl = imgMatch ? imgMatch[1] : `https://www.turkgun.com/cropImages/245x418/uploads/enews/${pdfUrl.split('/').pop().replace('pdf-', 'e-gazete-').replace('.pdf', '.png')}`

    return {
      id: `turkgun_${isoDate}`,
      name: 'Türkgün',
      title: 'Türkgün',
      date: formatTurkishDate(isoDate),
      thumb: coverUrl,
      pdf: pdfUrl,
    }
  } catch (err) {
    console.warn('[gazeteler] Turkgun cekilemedi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** Sonsöz gazetesinin en güncel sayısını (PDF) çeker. */
async function fetchSonsoz() {
  try {
    const TR_MONTHS_MAP = {
      ocak: '01', subat: '02', 'şubat': '02', mart: '03', nisan: '04', mayis: '05', 'mayıs': '05',
      haziran: '06', temmuz: '07', agustos: '08', 'ağustos': '08', eylul: '09', 'eylül': '09',
      ekim: '10', kasim: '11', 'kasım': '11', aralik: '12', 'aralık': '12',
    }

    const listRes = await fetch('https://sonsoz.com.tr/egazete/', {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    })
    if (!listRes.ok) return null
    const html = await listRes.text()

    const m = html.match(/href=["'](\/egazete\/(\d{1,2})-([a-zçğıöşü]+)-(\d{4}))["']/i)
    if (!m) return null

    const detailPath = m[1]
    const day = String(m[2]).padStart(2, '0')
    const monthName = m[3].toLowerCase()
    const month = TR_MONTHS_MAP[monthName] || '01'
    const year = m[4]
    const isoDate = `${year}-${month}-${day}`

    const idx = html.indexOf(detailPath)
    const chunk = html.slice(Math.max(0, idx - 400), Math.min(html.length, idx + 600))
    const imgMatch = chunk.match(/src=["'](https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp))["']/i)
    let thumb = imgMatch ? imgMatch[1] : ''
    if (thumb) {
      thumb = thumb.replace(/\/resize\/\d+x\d+\//, '/resize/600x900/')
    }

    let pdfUrl = ''
    try {
      const detailRes = await fetch(`https://sonsoz.com.tr${detailPath}`, {
        headers: { 'User-Agent': UA, Accept: 'text/html' },
      })
      if (detailRes.ok) {
        const detailHtml = await detailRes.text()
        const pdfMatch = detailHtml.match(/href=["'](https?:\/\/[^"'\s]+\.pdf)["']/i)
        if (pdfMatch) pdfUrl = pdfMatch[1]
      }
    } catch {}

    if (!pdfUrl) return null

    return {
      id: `sonsoz_${isoDate}`,
      name: 'Sonsöz',
      title: 'Sonsöz',
      date: formatTurkishDate(isoDate),
      thumb,
      pdf: pdfUrl,
    }
  } catch (err) {
    console.warn('[gazeteler] Sonsoz cekilemedi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** Milli Gazete tam PDF ve kapak manşetini çeker. */
async function fetchMilliGazete() {
  try {
    // 1. Kapak görseli için GZT'yi hızlıca tara
    let gztThumb = ''
    try {
      const gztRes = await fetch('https://gazetemanset.gzt.com/', {
        headers: { 'User-Agent': UA, Accept: 'text/html' }
      })
      if (gztRes.ok) {
        const gztHtml = await gztRes.text()
        const parts = gztHtml.split('<article class="newspaper-headline-card">').slice(1)
        for (const p of parts) {
          if (/milli[\s_-]*gazete/i.test(p) && !/milliyet/i.test(p)) {
            const srcM = p.match(/src=["']([^"']+)["']/)
            if (srcM && srcM[1]) {
              gztThumb = srcM[1]
              break
            }
          }
        }
      }
    } catch {}

    // 2. Güncel PDF'i Milli Gazete API'sinden çek (bugün ve 3 gün gerisi)
    for (let i = 0; i <= 3; i++) {
      const trDate = getTurkeyDate(-i)
      const checkDate = trDate.iso
      const url = `https://api.milligazete.com.tr/api/newspapers/publishDate?value=${checkDate}&cb=${Date.now()}`
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': UA,
            Accept: 'application/json',
            Referer: 'https://dijital.milligazete.com.tr/'
          }
        })
        if (!res.ok) continue
        const data = await res.json()
        const pdfPath = data?.newspaperFile?.path
        if (!pdfPath) continue

        const issueDate = (data.publishDate || checkDate).slice(0, 10)
        const formattedDate = formatTurkishDate(issueDate)

        const coverThumb = (gztThumb && !gztThumb.includes('milliyet')) ? gztThumb : `https://statictebilisim.teimg.com/statictebilisim/newspapers/${issueDate}/big_milli-gazete.jpg`

        return {
          id: `milligazete_${issueDate}`,
          name: 'Milli Gazete',
          title: 'Milli Gazete',
          date: formattedDate,
          thumb: coverThumb,
          pdf: pdfPath,
          pageCount: 16,
        }
      } catch {}
    }
  } catch (err) {
    console.warn('[gazeteler] Milli Gazete cekilemedi:', String(err?.message ?? err).slice(0, 100))
  }
  return null
}

/** Gazeteoku ve ilgili kaynaklardan günün manşetlerini derler. */

async function fetchMansetler(prevMap = {}) {
  const map = new Map()
  // Yalnızca güncel (Ekim ayı kalıntısı olmayan) önceki manşetleri koru
  if (prevMap && typeof prevMap === 'object') {
    for (const [k, v] of Object.entries(prevMap)) {
      if (v?.date && !v.date.includes('Ekim')) {
        map.set(k, v)
      }
    }
  }

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
          const date = dateMatch ? formatTurkishDate(dateMatch[1].trim()) : ''
          map.set(slug, { thumb, full, date })
        }
      }
    }
  } catch (err) {
    console.warn('[gazeteler] gazeteoku toplu okuma hatasi:', String(err?.message ?? err).slice(0, 100))
  }

  // 2. Kalan veya bayat tarihli gazeteler için tekil sayfaları tara (yalnızca ana listede çıkmayanlara istek at)
  const NEED_SINGLE = new Set([
    'sozcu-gazetesi-manseti',
    'nefes-gazetesi-manseti',
    'tavir-gazetesi-manseti',
    'korkusuz-gazetesi-manseti',
  ])
  for (const t of TARGET_NEWSPAPERS) {
    if (!NEED_SINGLE.has(t.slug)) continue
    const existing = map.get(t.slug)
    if (existing?.thumb && existing?.date && !existing.date.includes('Ekim')) continue

    try {
      const res = await fetch(`https://www.gazeteoku.com/gazeteler/${t.slug}`, { headers: { 'User-Agent': UA } })
      if (res.ok) {
        const html = await res.text()
        const imgMatch = html.match(/https:\/\/i\.gazeteoku\.com\/storage\/files\/images\/[^\s"']+\.jpg/i)
        const dateMatch = html.match(/<small>([^<]+)<\/small>/i) || html.match(/(\d+\s+\S+\s+\d{4})/i)
        if (imgMatch) {
          const full = imgMatch[0]
          const thumb = full.replace('/storage/files/images/', '/3/230/336/storage/files/images/')
          const date = dateMatch ? formatTurkishDate(dateMatch[1].trim()) : 'Bugün'
          map.set(t.slug, { thumb, full, date })
        }
      }
    } catch {}
  }

  // Oksijen haftalık gazetesinin güncel sayısını güvenli fallback veya güncel değerle besle
  if (!map.has('oksijen-gazetesi-gazetesi-manseti') || map.get('oksijen-gazetesi-gazetesi-manseti')?.date?.includes('Ekim')) {
    map.set('oksijen-gazetesi-gazetesi-manseti', FALLBACK_MANSETLER['oksijen-gazetesi-gazetesi-manseti'])
  }

  // Listeyi orijinal sırayla hazırla, eksik olanları güvenli yedekle tamamla
  return TARGET_NEWSPAPERS.map((t) => {
    const data = map.get(t.slug) || FALLBACK_MANSETLER[t.slug]
    return {
      name: t.name,
      slug: t.slug,
      thumb: data?.thumb || FALLBACK_MANSETLER[t.slug]?.thumb || '',
      full: data?.full || FALLBACK_MANSETLER[t.slug]?.full || '',
      date: formatTurkishDate(data?.date || 'Bugün'),
    }
  })
}

const SLUG_MONTH_MAP = {
  ocak: 'Ocak',
  subat: 'Şubat',
  mart: 'Mart',
  nisan: 'Nisan',
  mayis: 'Mayıs',
  haziran: 'Haziran',
  temmuz: 'Temmuz',
  agustos: 'Ağustos',
  eylul: 'Eylül',
  ekim: 'Ekim',
  kasim: 'Kasım',
  aralik: 'Aralık',
}

function formatDiyanetIssueSlug(slug) {
  if (!slug) return 'Güncel Sayı'
  const parts = slug.split('-')
  if (parts.length >= 2) {
    const mKey = parts[0].toLowerCase()
    const year = parts[1]
    const mName = SLUG_MONTH_MAP[mKey] || (parts[0].charAt(0).toUpperCase() + parts[0].slice(1))
    return `${mName} ${year}`
  }
  return slug
}

/** Somuncu Baba, Somuncu Aile ve Somuncu Çocuk dergilerinin en güncel sayılarını çeker. */
async function fetchSomuncuDergiler() {
  let issueNum = '313'
  let dateText = 'Kasım 2026'
  let mainThumb = 'https://www.somuncubaba.net/wp-content/uploads/2026/11/somuncu-baba-dergisi-313-1.jpg'
  let aileThumb = 'https://www.somuncubaba.net/wp-content/uploads/2026/11/somuncu-baba-dergisi-313-aile-1.jpg'
  let cocukThumb = 'https://www.somuncubaba.net/wp-content/uploads/2026/11/somuncu-baba-dergisi-313-cocuk-1.jpg'

  try {
    const res = await fetch('https://www.somuncubaba.net/busayi', {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    })
    if (res.ok) {
      const html = await res.text()
      const cards = [...html.matchAll(/<a[^>]+class=['"][^'"]*dergi_paper_card[^'"]*['"][\s\S]*?<\/a>/gi)].map((m) => m[0])
      for (const card of cards) {
        const imgM = card.match(/<img[^>]+src=['"]([^'"]+)['"]/i)
        const titleM = card.match(/<h5[^>]*>([^<]+)<\/h5>/i)
        const dateM = card.match(/<span[^>]+class=['"][^'"]*dergi_kapak_tarih[^'"]*['"][^>]*>([^<]+)<\/span>/i)

        const imgUrl = imgM ? imgM[1].trim() : ''
        const titleStr = titleM ? titleM[1].trim() : ''
        const dtStr = dateM ? dateM[1].trim() : ''

        if (dtStr) dateText = dtStr
        const numM = titleStr.match(/(\d{3,4})/) || imgUrl.match(/dergisi-(\d{3,4})/i)
        if (numM) issueNum = numM[1]

        if (/aile/i.test(titleStr) || /aile/i.test(imgUrl)) {
          if (imgUrl) aileThumb = imgUrl
        } else if (/çocuk|cocuk/i.test(titleStr) || /cocuk|çocuk/i.test(imgUrl)) {
          if (imgUrl) cocukThumb = imgUrl
        } else if (imgUrl) {
          mainThumb = imgUrl
        }
      }
    }
  } catch (err) {
    console.warn('[dergiler] Somuncu Baba cekilemedi:', String(err?.message ?? err).slice(0, 100))
  }

  const padded = String(issueNum).padStart(4, '0')
  const displayDate = `${dateText} · ${issueNum}. Sayı`

  return [
    {
      id: `somuncu_baba_${issueNum}`,
      name: 'Somuncu Baba Dergisi',
      title: 'Somuncu Baba Dergisi',
      date: displayDate,
      thumb: mainThumb,
      pdf: `https://somuncubaba.net/pdf/${padded}/somuncu-baba-dergisi-${issueNum}.pdf`,
    },
    {
      id: `somuncu_aile_${issueNum}`,
      name: 'Somuncu Aile Dergisi',
      title: 'Somuncu Aile Dergisi',
      date: displayDate,
      thumb: aileThumb,
      pdf: `https://somuncubaba.net/pdf/${padded}/somuncu-baba-dergisi-${issueNum}-aile-eki.pdf`,
    },
    {
      id: `somuncu_cocuk_${issueNum}`,
      name: 'Somuncu Çocuk Dergisi',
      title: 'Somuncu Çocuk Dergisi',
      date: displayDate,
      thumb: cocukThumb,
      pdf: `https://somuncubaba.net/pdf/${padded}/somuncu-baba-dergisi-${issueNum}-cocuk-eki.pdf`,
    },
  ]
}

/** Diyanet İşleri Başkanlığı aylık ve ilmi dergilerinin en güncel tam sayılarını çeker. */
async function fetchDiyanetDergiler() {
  const targets = [
    { idPrefix: 'diyanet_dergisi', name: 'Diyanet Dergisi', slug: 'aylik-dergi', fallbackId: '10958', fallbackDate: 'Ekim 2026' },
    { idPrefix: 'diyanet_aile', name: 'Aile Dergi', slug: 'aile-dergi', fallbackId: '10959', fallbackDate: 'Ekim 2026' },
    { idPrefix: 'diyanet_gecerken', name: 'Geçerken', slug: 'gecerken', fallbackId: '10960', fallbackDate: 'Ekim 2026' },
    { idPrefix: 'diyanet_ilmi', name: 'İlmi Dergi', slug: 'diyanet-ilmi-dergi', fallbackId: '8367', fallbackDate: 'Eylül 2026' },
  ]

  let html = ''
  try {
    const res = await fetch('https://dijital.diyanet.gov.tr/Dergilik', {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    })
    if (res.ok) {
      html = await res.text()
    }
  } catch (err) {
    console.warn('[dergiler] Diyanet Dergilik cekilemedi:', String(err?.message ?? err).slice(0, 100))
  }

  return targets.map((t) => {
    let id = t.fallbackId
    let dateStr = t.fallbackDate

    if (html) {
      const regex = new RegExp(`/Dergilik/${t.slug}/([^"'?]+)\\?id=(\\d+)`, 'i')
      const m = html.match(regex)
      if (m) {
        dateStr = formatDiyanetIssueSlug(m[1])
        id = m[2]
      }
    }

    let thumbUrl = `https://dijital.diyanet.gov.tr/Image/GetImage?image=${id}_1.jpeg&imageType=1`
    if (html) {
      const imgRegex = new RegExp(`/Image/GetImage\\?image=${id}_1\\.[a-zA-Z0-9]+(?:&amp;|&)imageType=1`, 'i')
      const imgM = html.match(imgRegex)
      if (imgM) {
        thumbUrl = `https://dijital.diyanet.gov.tr${imgM[0].replace(/&amp;/g, '&')}`
      }
    }

    return {
      id: `${t.idPrefix}_${id}`,
      name: t.name,
      title: t.name,
      date: dateStr,
      thumb: thumbUrl,
      pdf: `https://dijital.diyanet.gov.tr/File/Download?path=${id}_1.pdf&id=${id}`,
    }
  })
}

const TUBITAK_MONTH_NAMES = [
  '',
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
]

/**
 * TÜBİTAK popüler bilim dergilerinin (Bilim ve Teknik, Bilim Çocuk, Meraklı Minik)
 * üye girişi gerektirmeyen en güncel açık arşiv tam sayı PDF'lerini dinamik olarak çeker.
 */
async function fetchTubitakDergiler() {
  const targets = [
    {
      idPrefix: 'tubitak_biltek',
      name: 'Bilim ve Teknik',
      dergiKodu: '4',
      slug: 'biltek',
      fallbackYil: '2026',
      fallbackAy: '7',
      fallbackSayiId: '1280',
      fallbackCilt: '59',
    },
    {
      idPrefix: 'tubitak_cocuk',
      name: 'Bilim Çocuk',
      dergiKodu: '8',
      slug: 'cocuk',
      fallbackYil: '2026',
      fallbackAy: '7',
      fallbackSayiId: '1282',
      fallbackCilt: '29',
    },
    {
      idPrefix: 'tubitak_minik',
      name: 'Meraklı Minik',
      dergiKodu: '12',
      slug: 'minik',
      fallbackYil: '2026',
      fallbackAy: '7',
      fallbackSayiId: '1281',
      fallbackCilt: '19',
    },
  ]

  const currentYear = new Date().getFullYear()

  return await Promise.all(
    targets.map(async (t) => {
      let yil = t.fallbackYil
      let ay = t.fallbackAy
      let sayiId = t.fallbackSayiId
      let cilt = t.fallbackCilt
      let pdfUrl = `https://e-dergi.tubitak.gov.tr/edergi/yazi.pdf?dergiKodu=${t.dergiKodu}&cilt=${cilt}&sayiid=${sayiId}&yil=${yil}&ay=${ay}&mod=tum`

      try {
        const res = await fetch('https://e-dergi.tubitak.gov.tr/yillaraGoreArsiv.htm', {
          method: 'POST',
          headers: {
            'User-Agent': UA,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `yil=${currentYear}&dergiKodu=${t.dergiKodu}`,
        })
        if (res.ok) {
          const html = await res.text()
          const matches = [
            ...html.matchAll(/dergiKodu=(\d+)&amp;sayiId=(\d+)&amp;yil=(\d+)&amp;ay=(\d+)/g),
          ].map((m) => ({ sayiId: m[2], yil: m[3], ay: m[4] }))

          // TÜBİTAK son 4 sayıyı abonelere özel (/abonedergi/) tutar, önceki sayıları açık arşive (/edergi/) açar.
          const candidates = matches.slice(Math.max(0, matches.length - 6), Math.max(0, matches.length - 3)).reverse()
          for (const cand of candidates) {
            const sRes = await fetch(
              `https://e-dergi.tubitak.gov.tr/sayi.htm?dergiKodu=${t.dergiKodu}&sayiId=${cand.sayiId}&yil=${cand.yil}&ay=${cand.ay}`,
              { headers: { 'User-Agent': UA } },
            )
            if (!sRes.ok) continue
            const sHtml = await sRes.text()
            const openMatch = sHtml.match(/\/edergi\/yazi\.pdf[^"'\s]*mod=tum/i)
            if (openMatch) {
              const cleanPath = openMatch[0].replace(/;jsessionid=[^?]+/, '').replace(/&amp;/g, '&')
              pdfUrl = `https://e-dergi.tubitak.gov.tr${cleanPath}`
              yil = cand.yil
              ay = cand.ay
              sayiId = cand.sayiId
              break
            }
          }
        }
      } catch (err) {
        console.warn(`[dergiler] TUBITAK ${t.name} cekilemedi:`, String(err?.message ?? err).slice(0, 100))
      }

      const rawCoverUrl = `https://e-dergi.tubitak.gov.tr/edergi/coverImage.htm?dergi=${t.slug}&yil=${yil}&ay=${ay}`
      const thumbUrl = `https://egitim-haberleri-api.omerzen.workers.dev/api/proxy-image?url=${encodeURIComponent(rawCoverUrl)}`
      const monthName = TUBITAK_MONTH_NAMES[Number(ay)] || ay

      return {
        id: `${t.idPrefix}_${sayiId}`,
        name: t.name,
        title: `${t.name} (TÜBİTAK Açık Arşiv)`,
        date: `${monthName} ${yil} · Açık Arşiv`,
        thumb: thumbUrl,
        pdf: pdfUrl,
      }
    }),
  )
}

/** Bilimkurgu Yükseliyor dergisinin en güncel sayısını çeker. */
async function fetchBilimkurguDergisi() {
  try {
    const res = await fetch('https://yerlibilimkurguyukseliyor.com/wp-json/wp/v2/posts?per_page=6&_embed=1', {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    })
    if (!res.ok) return []
    const posts = await res.json()
    if (!Array.isArray(posts)) return []

    const sayiPost = posts.find(
      (p) => /Sayı\s*\d+/i.test(p.title?.rendered || '') || /ybky-sayi-\d+/i.test(p.slug || ''),
    )
    if (!sayiPost) return []

    const titleClean = (sayiPost.title?.rendered || 'Bilimkurgu Yükseliyor')
      .replace(/&#8211;/g, '-')
      .replace(/&amp;/g, '&')
    const matchNum = titleClean.match(/Sayı\s*(\d+)/i) || sayiPost.slug.match(/sayi-(\d+)/i)
    const issueNum = matchNum ? matchNum[1] : '104'

    const coverMedia = sayiPost._embedded?.['wp:featuredmedia']?.[0]
    const thumbUrl =
      coverMedia?.media_details?.sizes?.medium_large?.source_url ||
      coverMedia?.source_url ||
      'https://yerlibilimkurguyukseliyor.com/wp-content/uploads/2026/10/ekim_kapak_2026_104_site-768x998.jpg'

    let pdfUrl = ''
    try {
      const postPageRes = await fetch(sayiPost.link, {
        headers: { 'User-Agent': UA, Accept: 'text/html' },
      })
      if (postPageRes.ok) {
        const postHtml = await postPageRes.text()
        const m = postHtml.match(/"pdfUrl"\s*:\s*"([^"]+\.pdf)"/i) || postHtml.match(/(https?:\/\/[^"'\s<>\\]+\.pdf)/i)
        if (m) pdfUrl = m[1].replace(/\\\//g, '/')
      }
    } catch {}

    if (!pdfUrl) {
      pdfUrl = 'https://yerlibilimkurguyukseliyor.com/wp-content/uploads/2026/11/YBKY_ekim_sy_104_2.pdf'
    }

    const postDate = new Date(sayiPost.date || Date.now())
    const trMonths = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
    const dateStr = `${trMonths[postDate.getMonth()]} ${postDate.getFullYear()} · ${issueNum}. Sayı`

    return [
      {
        id: `ybky_${issueNum}`,
        name: 'Bilimkurgu Yükseliyor',
        title: `Bilimkurgu Yükseliyor - Sayı ${issueNum}`,
        date: dateStr,
        thumb: thumbUrl,
        pdf: pdfUrl,
      },
    ]
  } catch (err) {
    console.warn('[dergiler] Bilimkurgu cekilemedi:', String(err?.message ?? err).slice(0, 100))
    return []
  }
}

/** 1. Analiz gazetesinin en güncel sayısını (çoklu sayfa) çeker. */
async function fetchAnaliz() {
  try {
    const listRes = await fetch('https://www.analizgazetesi.com.tr/gazete/', {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    })
    if (!listRes.ok) return null
    const html = await listRes.text()

    const m = html.match(/href=["'](https?:\/\/www\.analizgazetesi\.com\.tr)?\/gazete\/(\d{1,2})-([a-zçğıöşü]+)-(\d{4})-(\d+)\/?["']/i)
    if (!m) return null

    const rawPath = m[0].match(/href=["']([^"']+)["']/i)[1]
    const detailUrl = rawPath.startsWith('http') ? rawPath : `https://www.analizgazetesi.com.tr${rawPath}`
    const day = String(m[2]).padStart(2, '0')
    const month = TR_MONTHS_MAP[m[3].toLowerCase()] || '01'
    const year = m[4]
    const isoDate = `${year}-${month}-${day}`

    const detRes = await fetch(detailUrl, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    })
    if (!detRes.ok) return null
    const detHtml = await detRes.text()

    const fancyMatches = [...detHtml.matchAll(/href=["'](https?:\/\/[^"']+\/modules\/gazete\/galleries\/[^"']+\.jpg)["']/gi)].map((x) => x[1])
    const uniqueImgs = [...new Set(fancyMatches)]
    if (uniqueImgs.length === 0) return null

    // Analiz gazetesinin ilk sayfasından kendi thumbmaker servisiyle thumbnail oluştur (proxy korumalı)
    const thumbRaw = `https://www.analizgazetesi.com.tr/thumbmaker.php?src=${encodeURIComponent(uniqueImgs[0])}&w=250&h=400&s=1&a=t&q=90`
    const coverThumb = `/api/proxy-image?url=${encodeURIComponent(thumbRaw)}`

    const pages = uniqueImgs.map((imgUrl, idx) => {
      const pageThumb = `https://www.analizgazetesi.com.tr/thumbmaker.php?src=${encodeURIComponent(imgUrl)}&w=250&h=400&s=1&a=t&q=90`
      return {
        page: idx + 1,
        img: `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`,
        thumb: `/api/proxy-image?url=${encodeURIComponent(pageThumb)}`,
      }
    })

    return {
      id: `analiz_${isoDate}`,
      name: 'Analiz',
      title: 'Analiz',
      date: formatTurkishDate(isoDate),
      thumb: coverThumb,
      pdf: '',
      pageCount: pages.length,
      pages,
    }
  } catch (err) {
    console.warn('[gazeteler] Analiz cekilemedi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** 2. Anayurt gazetesinin en güncel sayısını (çoklu sayfa WebP) çeker. */
async function fetchAnayurt() {
  try {
    const targetDate = getTurkeyDate(0)
    const url = `https://anayurtgazetesi.com/arsiv/${targetDate.iso}`
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    })
    if (!res.ok) return null
    const html = await res.text()

    const matches = [...html.matchAll(/(https:\/\/static\.daktilo\.com\/sites\/1165\/uploads\/[^\s"']+page-(\d{4})\.webp)/gi)]
    if (matches.length === 0) return null

    const uniqueMap = new Map()
    for (const m of matches) {
      const imgUrl = m[1]
      const pageNum = parseInt(m[2], 10)
      if (!uniqueMap.has(pageNum) || !imgUrl.includes('/large/')) {
        uniqueMap.set(pageNum, imgUrl)
      }
    }

    const sortedPages = [...uniqueMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([pNum, imgUrl]) => {
        const highRes = imgUrl.replace('/large/', '/')
        const lastSlash = highRes.lastIndexOf('/')
        const thumbUrl = highRes.slice(0, lastSlash) + '/large' + highRes.slice(lastSlash)
        return {
          page: pNum,
          img: `/api/proxy-image?url=${encodeURIComponent(highRes)}`,
          thumb: `/api/proxy-image?url=${encodeURIComponent(thumbUrl)}`,
        }
      })

    if (sortedPages.length === 0) return null

    return {
      id: `anayurt_${targetDate.iso}`,
      name: 'Anayurt',
      title: 'Anayurt',
      date: formatTurkishDate(targetDate.iso),
      thumb: sortedPages[0]?.thumb || sortedPages[0]?.img || '',
      pdf: '',
      pageCount: sortedPages.length,
      pages: sortedPages,
    }
  } catch (err) {
    console.warn('[gazeteler] Anayurt cekilemedi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** 3. Batman Sonsöz gazetesinin en güncel sayısını (çoklu sayfa WebP) çeker. */
async function fetchBatmanSonsoz() {
  try {
    const listRes = await fetch('https://www.batmansonsoz.net/galeriler/e-gazete/', {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    })
    if (!listRes.ok) return null
    const html = await listRes.text()

    const m = html.match(/href=["'](https?:\/\/www\.batmansonsoz\.net)?(\/galeri\/(\d{1,2})-([a-zçğıöşü]+)-(\d{4})-(\d+)\.html)["']/i)
    if (!m) return null

    const detailPath = m[2]
    const detailUrl = `https://www.batmansonsoz.net${detailPath}`
    const day = String(m[3]).padStart(2, '0')
    const month = TR_MONTHS_MAP[m[4].toLowerCase()] || '01'
    const year = m[5]
    const galleryId = m[6]
    const isoDate = `${year}-${month}-${day}`

    const detRes = await fetch(detailUrl, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    })
    if (!detRes.ok) return null
    const detHtml = await detRes.text()

    const regex = new RegExp(`https?://[^"'\\s]*default/${galleryId}-[^"'\\s]+\\.webp`, 'gi')
    const matchedImgs = [...detHtml.matchAll(regex)].map((x) => x[0])
    const uniqueImgs = [...new Set(matchedImgs)]
    if (uniqueImgs.length === 0) return null

    const pages = uniqueImgs.map((imgUrl, idx) => ({
      page: idx + 1,
      img: imgUrl,
      thumb: imgUrl,
    }))

    return {
      id: `batmansonsoz_${isoDate}`,
      name: 'Batman Sonsöz',
      title: 'Batman Sonsöz',
      date: formatTurkishDate(isoDate),
      thumb: pages[0]?.thumb || pages[0]?.img || '',
      pdf: '',
      pageCount: pages.length,
      pages,
    }
  } catch (err) {
    console.warn('[gazeteler] Batman Sonsoz cekilemedi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** 4. Başkent gazetesinin en güncel sayısını (PDF) çeker. */
async function fetchBaskent() {
  try {
    const listRes = await fetch('https://www.baskentgazete.com.tr/egazete', {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    })
    if (!listRes.ok) return null
    const html = await listRes.text()

    const m = html.match(/href=["'](\/egazete\/baskent-gazetesi-(\d+))["']/i)
    if (!m) return null

    const detailPath = m[1]
    const detailUrl = `https://www.baskentgazete.com.tr${detailPath}`

    const idx = html.indexOf(detailPath)
    const chunk = html.slice(Math.max(0, idx - 100), Math.min(html.length, idx + 500))
    const imgM = chunk.match(/src=["'](https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp))["']/i)
    let thumb = imgM ? imgM[1] : ''
    if (thumb) {
      thumb = thumb.replace(/\/resize\/\d+x\d+\//, '/resize/600x900/')
    }

    const detRes = await fetch(detailUrl, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    })
    if (!detRes.ok) return null
    const detHtml = await detRes.text()

    const pdfM = detHtml.match(/href=["'](https?:\/\/[^"'\s]+\.pdf)["']/i)
    const pdfUrl = pdfM ? pdfM[1] : ''
    if (!pdfUrl) return null

    let isoDate = getTurkeyDate(0).iso
    const dateM = pdfUrl.match(/uploads\/(\d{4})\/(\d{2})\/(\d{1,2})-([a-zçğıöşü]+)/i)
    if (dateM) {
      const year = dateM[1]
      const month = dateM[2]
      const day = String(dateM[3]).padStart(2, '0')
      isoDate = `${year}-${month}-${day}`
    }

    return {
      id: `baskent_${isoDate}`,
      name: 'Başkent',
      title: 'Başkent',
      date: formatTurkishDate(isoDate),
      thumb,
      pdf: pdfUrl,
    }
  } catch (err) {
    console.warn('[gazeteler] Baskent cekilemedi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** 5. Giresun Gündem gazetesinin en güncel sayısını (PDF) çeker. */
async function fetchGundem() {
  try {
    const res = await fetch('https://giresungundem.com/e-gazete/', {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    })
    if (!res.ok) return null
    const html = await res.text()

    const m = html.match(/<a[^>]+href=["'](https?:\/\/giresungundem\.com\/wp-content\/uploads\/(\d{4})\/(\d{2})\/(\d{1,2})_([a-zçğıöşü]+)_(\d{4})[^"']*\.pdf)["'][^>]*>([^<]*)<\/a>/i)
    if (!m) return null

    const pdfUrl = m[1]
    const year = m[2]
    const month = m[3]
    const day = String(m[4]).padStart(2, '0')
    const isoDate = `${year}-${month}-${day}`
    const coverUrl = pdfUrl.replace(/\.pdf$/i, '-pdf-707x1024.jpg')

    return {
      id: `gundem_${isoDate}`,
      name: 'Gündem',
      title: 'Gündem',
      date: formatTurkishDate(isoDate),
      thumb: coverUrl,
      pdf: pdfUrl,
    }
  } catch (err) {
    console.warn('[gazeteler] Gundem cekilemedi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** 6. Gazete Kadıköy haftalık gazetesinin en güncel sayısını (PDF) çeker. */
async function fetchKadikoy() {
  try {
    const res = await fetch('https://www.gazetekadikoy.com.tr/e-gazete', {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    })
    if (!res.ok) return null
    const html = await res.text()

    const itemM = html.match(/<div class="e_gazete_list_item">([\s\S]*?)<\/div>/i)
    if (!itemM) return null
    const itemContent = itemM[1]

    const pdfM = itemContent.match(/href=["']([^"']+\.pdf)["']/i)
    const imgM = itemContent.match(/src=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/i)
    const titleM = itemContent.match(/title=["']([^"']+)["']/i) || itemContent.match(/<label>([^<]+)<\/label>/i)
    const dateM = itemContent.match(/<div class="info">[\s\S]*?<i[^>]*><\/i>\s*([^<]+)/i)

    if (!pdfM || !imgM) return null

    const cleanPdf = pdfM[1].replace(/\\/g, '/').replace(/^\/+/, '')
    const cleanImg = imgM[1].replace(/\\/g, '/').replace(/^\/+/, '')

    const pdfUrl = cleanPdf.startsWith('http') ? cleanPdf : `https://www.gazetekadikoy.com.tr/${cleanPdf}`
    const thumbUrl = cleanImg.startsWith('http') ? cleanImg : `https://www.gazetekadikoy.com.tr/${cleanImg}`

    const dateText = (dateM ? dateM[1].trim() : 'Güncel Sayı')
      .replace(/&#x131;/gi, 'ı')
      .replace(/&#305;/g, 'ı')
      .replace(/&#x130;/gi, 'İ')
      .replace(/&#304;/g, 'İ')
      .replace(/&nbsp;/g, ' ')
    const rawTitle = titleM ? titleM[1].trim() : 'Kadıköy'
    const issueTitle = rawTitle
      .replace(/&#x131;/gi, 'ı')
      .replace(/&#305;/g, 'ı')
      .replace(/&#x130;/gi, 'İ')
      .replace(/&#304;/g, 'İ')
    const displayDate = `${formatTurkishDate(dateText)} · ${issueTitle}`

    const idMatch = cleanPdf.match(/(\d+)\.pdf/i)
    const idSuffix = idMatch ? idMatch[1] : Date.now()

    return {
      id: `kadikoy_${idSuffix}`,
      name: 'Kadıköy',
      title: 'Gazete Kadıköy',
      date: displayDate,
      thumb: thumbUrl,
      pdf: pdfUrl,
    }
  } catch (err) {
    console.warn('[gazeteler] Kadikoy cekilemedi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** 7. Gazete Oksijen haftalık gazetesinin en güncel sayısını (PDF) çeker. */
async function fetchOksijen(env) {
  try {
    const listRes = await fetch('https://gazeteoksijen.com/api/newspapers?page=1', {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    })
    if (!listRes.ok) return null
    const listData = await listRes.json()
    const latest = listData?.data?.find((x) => x.type === 'oksijen') || listData?.data?.[0]
    if (!latest?.id) return null

    const token =
      env?.OKSIJEN_TOKEN ||
      '0WvlG6dKFkiZqORAyJtrjLoqfkefuAudPjam1NgZBBNvA7nF3Q4N2XkWdUWKue2KBDLeeM9c0BoiyIIMghjOoYdzJ8RgYL47tEeU83y1XzYZXM41HUv7DuRM61kmphtCoWA8e299HYKGj64CtOKRZuQbLOgJEH2I0h4qUE8yVBL8mcvZAcIguca21JBiHfR36jEA8WNDtrQctimvJSJ8dKvpRcC2WIpfrFINSurkzyktMbnFBxlg54EN3sAs9MF'

    let pdfUrl = ''
    if (token) {
      const detRes = await fetch(`https://gazeteoksijen.com/api/newspapers/${latest.id}`, {
        headers: {
          'User-Agent': UA,
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          Referer: 'https://gazeteoksijen.com/e-gazete',
        },
      })
      if (detRes.ok) {
        const detData = await detRes.json()
        pdfUrl = detData?.data?.file || detData?.data?.optimized_file || ''
      }
    }

    const dateMatch = latest.title?.match(/\(([^)]+)\)/)
    const dateText = dateMatch ? dateMatch[1].trim() : formatTurkishDate(latest.date)

    return {
      id: `oksijen_${latest.id}`,
      name: 'Oksijen',
      title: latest.title || 'Gazete Oksijen',
      date: dateText,
      thumb: latest.image,
      pdf: pdfUrl,
    }
  } catch (err) {
    console.warn('[gazeteler] fetchOksijen hatasi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** 8. Evrensel gazetesinin en güncel tam sayısını (orijinal şifresiz vektörel PDF) çeker. */
async function fetchEvrensel() {
  try {
    const res = await fetch('https://app.evrensel.net/api_get_issues.php', {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const files = (Array.isArray(data) ? data : data?.issues || [])
      .map((x) => (typeof x === 'string' ? x : x.file || x.name || ''))
      .filter((x) => /EVR\d{8}\.pdf/i.test(x))

    if (!files.length) return null
    files.sort().reverse()
    const latestFile = files[0]
    const m = latestFile.match(/EVR(\d{4})(\d{2})(\d{2})\.pdf/i)
    if (!m) return null
    const [, y, mo, d] = m
    const isoDate = `${y}-${mo}-${d}`
    const formattedDate = formatTurkishDate(isoDate)

    const pdfUrl = `https://www.evrensel.net/abone/egazete/pdf/${latestFile}`
    // Evrensel resmî CDN yüksek çözünürlüklü kapak görseli
    const thumbUrl = `https://www.evrensel.net/abone/egazete/pdf/${latestFile.replace(/\.pdf$/i, '')}.jpg`

    return {
      id: `evrensel_${isoDate}`,
      name: 'Evrensel',
      title: 'Evrensel',
      date: formattedDate,
      thumb: thumbUrl,
      pdf: pdfUrl,
    }
  } catch (err) {
    console.warn('[gazeteler] fetchEvrensel hatasi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** 9. Olay gazetesinin en güncel sayısını (çoklu sayfa) çeker. */
async function fetchOlay() {
  try {
    const res = await fetch('https://e-gazete.olay.com.tr/olay-gazetesi', {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    })
    if (!res.ok) return null
    const html = await res.text()

    const thumbs = [...html.matchAll(/uploads\/thumb\/4\/(\d{4})\/(\d{2})\/(\d{2})\/(\d+)_thumb\.jpg/gi)]
    if (thumbs.length === 0) return null

    const y = thumbs[0][1]
    const m = thumbs[0][2]
    const d = thumbs[0][3]
    const isoDate = `${y}-${m}-${d}`

    const largeMatch = html.match(/publish\/image\/([a-zA-Z0-9+/=_-]+)/i)
    const largeCover = largeMatch ? `https://e-gazete.olay.com.tr/publish/image/${largeMatch[1]}` : ''

    const pageNums = [...new Set(thumbs.map((t) => parseInt(t[4], 10)))].sort((a, b) => a - b)
    const pages = pageNums.map((pNum) => {
      const thumbUrl = `https://e-gazete.olay.com.tr/uploads/thumb/4/${y}/${m}/${d}/${pNum}_thumb.jpg`
      const pageImg = (pNum === 1 && largeCover) ? largeCover : thumbUrl
      return {
        page: pNum,
        img: pageImg,
        thumb: thumbUrl,
      }
    })

    return {
      id: `olay_${isoDate}`,
      name: 'Olay',
      title: 'Olay',
      date: formatTurkishDate(isoDate),
      thumb: largeCover || pages[0]?.thumb || '',
      pdf: '',
      pageCount: pages.length,
      pages,
    }
  } catch (err) {
    console.warn('[gazeteler] fetchOlay hatasi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** 10. Dokuz Eylül gazetesinin en güncel sayısını (PDF) çeker. */
async function fetchDokuzEylul() {
  try {
    const listRes = await fetch('https://dokuzeylul.com/edergi', {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    })
    if (!listRes.ok) return null
    const html = await listRes.text()

    // En güncel gazete bağlantısını bul: /edergi/7112026-gazete-9-eylul-manset
    const m = html.match(/href=["'](\/edergi\/(\d{1,2})(\d{2})(\d{4})-gazete-9-eylul[^"']*)["']/i)
    if (!m) return null

    const detailPath = m[1]
    const d = String(m[2]).padStart(2, '0')
    const mo = String(m[3]).padStart(2, '0')
    const yr = m[4]
    const isoDate = `${yr}-${mo}-${d}`
    const formattedDate = formatTurkishDate(isoDate)

    const detailRes = await fetch(`https://dokuzeylul.com${detailPath}`, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    })
    if (!detailRes.ok) return null
    const detailHtml = await detailRes.text()

    const pdfMatch = detailHtml.match(/https?:\/\/[^"'\s<>]+\.pdf/i)
    if (!pdfMatch) return null

    const coverMatch =
      detailHtml.match(/https:\/\/dokuzeylulcom\.teimg\.com\/resize\/[^\s"']+\.jpg/i) ||
      detailHtml.match(/https?:\/\/[^"'\s<>]+\/uploads\/\d{4}\/\d{2}\/[^\s"']+-page-0001\.jpg/i)

    const thumbUrl = coverMatch
      ? coverMatch[0]
      : `https://dokuzeylulcom.teimg.com/resize/300x450/dokuzeylul-com/uploads/${yr}/${mo}/${d}${mo}${yr}-page-0001.jpg`

    return {
      id: `dokuzeylul_${isoDate}`,
      name: '9 Eylül',
      title: '9 Eylül',
      date: formattedDate,
      thumb: thumbUrl,
      pdf: pdfMatch[0],
    }
  } catch (err) {
    console.warn('[gazeteler] fetchDokuzEylul hatasi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** 11. Tünaydın gazetesinin en güncel sayısını (çoklu sayfa) çeker. */
async function fetchTunaydin() {
  try {
    const listRes = await fetch('https://www.tunaydingazetesi.com/e-gazete/', {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
    })
    if (!listRes.ok) return null
    const html = await listRes.text()

    // En güncel sayfa linki: /gazete-sayfalari/60905/8-kasim-2026/
    const m = html.match(/href=["'](\/gazete-sayfalari\/(\d+)\/(\d{1,2})-([a-zçğıöşü]+)-(\d{4})\/?)["']/i)
    if (!m) return null

    const day = String(m[3]).padStart(2, '0')
    const month = TR_MONTHS_MAP[m[4].toLowerCase()] || '01'
    const year = m[5]
    const isoDate = `${year}-${month}-${day}`
    const formattedDate = formatTurkishDate(isoDate)

    // Tünaydın gazetesi standart olarak 12 sayfadır
    const pages = []
    for (let p = 1; p <= 12; p++) {
      const pageUrl = `https://www.tunaydingazetesi.com/dosyalar/gorsel/${year}/${month}/${day}/${p}-1.jpg`
      pages.push({
        page: p,
        img: `/api/proxy-image?url=${encodeURIComponent(pageUrl)}`,
        thumb: `/api/proxy-image?url=${encodeURIComponent(pageUrl)}`,
      })
    }

    const coverThumb = pages[0]?.thumb || ''

    return {
      id: `tunaydin_${isoDate}`,
      name: 'Tünaydın',
      title: 'Tünaydın',
      date: formattedDate,
      thumb: coverThumb,
      pdf: '',
      pageCount: pages.length,
      pages,
    }
  } catch (err) {
    console.warn('[gazeteler] fetchTunaydin hatasi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** 12. Yeni Yaşam gazetesinin en güncel sayısını (PDF) çeker. */
async function fetchYeniYasam() {
  try {
    const res = await fetch('https://eyeniyasam.com/wp-json/wp/v2/media?search=pdf', {
      headers: { 'User-Agent': UA },
    })
    if (!res.ok) return null
    const items = await res.json()
    const pdfItems = items.filter((it) => it.guid?.rendered?.endsWith('.pdf') || it.source_url?.endsWith('.pdf'))
    if (!pdfItems.length) return null

    const latest = pdfItems[0]
    const pdfUrl = latest.guid?.rendered || latest.source_url
    if (!pdfUrl) return null

    const slug = latest.slug || ''
    const m = slug.match(/(\d{2})[-.](\d{2})[-.](\d{4})/)
    const d = m ? m[1] : '08'
    const mo = m ? m[2] : '11'
    const yr = m ? m[3] : '2026'
    const isoDate = `${yr}-${mo}-${d}`

    let thumbUrl = ''
    try {
      const mansetRes = await fetch('https://yeniyasamgazetesi10.com/gunun-manseti/', {
        headers: { 'User-Agent': UA },
      })
      if (mansetRes.ok) {
        const mHtml = await mansetRes.text()
        const cMatch = mHtml.match(/https?:\/\/[^"'\s<>]+\/wp-content\/uploads\/[^\s"']*page-0001[^\s"']*\.jpg/i)
        if (cMatch) thumbUrl = cMatch[0]
      }
    } catch {}

    if (!thumbUrl) {
      thumbUrl = `https://yeniyasamgazetesi10.com/wp-content/uploads/${yr}/${mo}/s1-16_page-0001-618x1024.jpg`
    }

    return {
      id: `yeniyasam_${isoDate}`,
      name: 'Yeni Yaşam',
      title: 'Yeni Yaşam',
      date: formatTurkishDate(isoDate),
      thumb: thumbUrl,
      pdf: pdfUrl,
    }
  } catch (err) {
    console.warn('[gazeteler] fetchYeniYasam hatasi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** 13. Yankı gazetesinin en güncel sayısını (çoklu sayfa) çeker. */
export async function fetchYanki() {
  try {
    const res = await fetch('https://www.yankigazetesi.com/gazete-arsiv', {
      headers: { 'User-Agent': UA },
    })
    if (!res.ok) return null
    const html = await res.text()

    const m = html.match(/href=["'](https?:\/\/www\.yankigazetesi\.com)?(\/gazete-arsiv\/(\d{1,2})(\d{2})(\d{4})\/(\d+))["']/i)
    if (!m) return null

    const detailPath = m[2]
    const d = String(m[3]).padStart(2, '0')
    const mo = String(m[4]).padStart(2, '0')
    const yr = m[5]
    const isoDate = `${yr}-${mo}-${d}`

    const detailUrl = `https://www.yankigazetesi.com${detailPath}`
    const dRes = await fetch(detailUrl, { headers: { 'User-Agent': UA } })
    if (!dRes.ok) return null
    const dHtml = await dRes.text()

    const pageNums = [...dHtml.matchAll(/sayfa=(\d+)/gi)].map((x) => parseInt(x[1], 10))
    const maxPage = pageNums.length > 0 ? Math.max(...pageNums) : 1

    function extractImg(pageHtml) {
      const match =
        pageHtml.match(/id=["']gazeteResim["'][^>]*src=["']([^"']+)["']/i) ||
        pageHtml.match(/src=["']([^"']+)["'][^>]*id=["']gazeteResim["']/i)
      return match ? match[1] : null
    }

    const rawPages = []
    const p1Img = extractImg(dHtml)
    if (p1Img) rawPages.push({ page: 1, img: p1Img })

    if (maxPage > 1) {
      const restPromises = []
      for (let p = 2; p <= maxPage; p++) {
        restPromises.push(
          fetch(`${detailUrl}?sayfa=${p}`, { headers: { 'User-Agent': UA } })
            .then(async (pRes) => {
              if (!pRes.ok) return null
              const pHtml = await pRes.text()
              const img = extractImg(pHtml)
              return img ? { page: p, img } : null
            })
            .catch((err) => {
              console.warn(`[gazeteler] Yanki sayfa ${p} alinamadi:`, err?.message)
              return null
            }),
        )
      }
      const rest = await Promise.all(restPromises)
      for (const r of rest) {
        if (r) rawPages.push(r)
      }
      rawPages.sort((a, b) => a.page - b.page)
    }

    const pages = rawPages.map((p) => ({
      page: p.page,
      img: `/api/proxy-image?url=${encodeURIComponent(p.img)}`,
      thumb: `/api/proxy-image?url=${encodeURIComponent(p.img)}`,
    }))

    return {
      id: `yanki_${isoDate}`,
      name: 'Yankı',
      title: 'Yankı',
      date: formatTurkishDate(isoDate),
      thumb: pages[0]?.thumb || '',
      pdf: '',
      pageCount: pages.length,
      pages,
    }
  } catch (err) {
    console.warn('[gazeteler] fetchYanki hatasi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** 14. Ankara Ulus gazetesinin en güncel sayısını çeker. */
export async function fetchAnkaraUlus() {
  try {
    const res = await fetch('https://ankaraulusgazetesi.com.tr/egazete', {
      headers: { 'User-Agent': UA },
    })
    if (!res.ok) return null
    const html = await res.text()
    const m = html.match(/href=["'](?:https?:\/\/ankaraulusgazetesi\.com\.tr)?\/egazete\/ankara-ulus-gazetesi\/(\d{2})(\d{2})(\d{4})-(\d+)\.htm["']/i)
    if (!m) return null
    const [, d, mo, y, issueId] = m
    const isoDate = `${y}-${mo}-${d}`

    // Ankara Ulus daima 8 sayfadır
    const pages = Array.from({ length: 8 }, (_, i) => {
      const p = i + 1
      const imgUrl = `https://cdn.ankaraulusgazetesi.com.tr/gazette/${issueId}/${p}.jpg`
      return {
        page: p,
        img: `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`,
        thumb: `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`,
      }
    })

    return {
      id: `ankara_ulus_${issueId}`,
      name: 'Ankara Ulus',
      title: 'Ankara Ulus Gazetesi',
      date: formatTurkishDate(isoDate),
      thumb: pages[0]?.thumb || '',
      pdf: '',
      pageCount: pages.length,
      pages,
    }
  } catch (err) {
    console.warn('[gazeteler] fetchAnkaraUlus hatasi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** 15. İstanbul gazetesinin en güncel sayısını çeker. */
export async function fetchIstanbulGazetesi() {
  try {
    const res = await fetch('https://istanbulegazete.com/', { headers: { 'User-Agent': UA } })
    if (!res.ok) return null
    const html = await res.text()
    const issueMatch = html.match(/href=["'](https?:\/\/istanbulegazete\.com\/e-gazete\/[a-z0-9\-]+)[\/"']/i)
    if (!issueMatch) return null
    const issueUrl = issueMatch[1].endsWith('/') ? issueMatch[1] : issueMatch[1] + '/'

    const dRes = await fetch(issueUrl, { headers: { 'User-Agent': UA } })
    if (!dRes.ok) return null
    const dHtml = await dRes.text()

    const dateMatch = issueUrl.match(/(\d{2})-(\d{2})-(\d{4})/)
    const isoDate = dateMatch ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : ''

    const pdfMatch = dHtml.match(/href=["'](https?:\/\/istanbulegazete\.com\/\?egazete_pdf_proxy=\d+)["']/i) ||
                     dHtml.match(/href=["'](\/\?egazete_pdf_proxy=\d+)["']/i)
    const pdfUrl = pdfMatch ? (pdfMatch[1].startsWith('http') ? pdfMatch[1] : `https://istanbulegazete.com${pdfMatch[1]}`) : ''

    let pages = []
    const m = dHtml.match(/data-pdf-items='([^']+)'/i) || dHtml.match(/data-pdf-items="([^"]+)"/i)
    if (m) {
      try {
        const decoded = m[1].replace(/&quot;/g, '"')
        const items = JSON.parse(decoded)
        if (Array.isArray(items)) {
          pages = items.map((it, idx) => {
            const highImg = it.img || it.url || it.original_url || ''
            return {
              page: idx + 1,
              img: `/api/proxy-image?url=${encodeURIComponent(highImg)}`,
              thumb: `/api/proxy-image?url=${encodeURIComponent(highImg)}`,
            }
          }).filter((p) => p.img)
        }
      } catch (e) {
        console.warn('[gazeteler] istanbul json parse hatasi:', e.message)
      }
    }

    if (pages.length === 0) {
      const imgMatches = [...dHtml.matchAll(/https?:\/\/istanbulegazete\.com\/wp-content\/uploads\/[^\s"']+(?:SAYFA|\d+)[^\s"']*\.jpg/gi)].map((x) => x[0])
      const unique = [...new Set(imgMatches)]
      pages = unique.map((u, i) => ({
        page: i + 1,
        img: `/api/proxy-image?url=${encodeURIComponent(u)}`,
        thumb: `/api/proxy-image?url=${encodeURIComponent(u)}`,
      }))
    }

    if (pages.length === 0 && !pdfUrl) return null

    return {
      id: `istanbul_gazetesi_${isoDate || Date.now()}`,
      name: 'İstanbul',
      title: 'İstanbul Gazetesi',
      date: formatTurkishDate(isoDate),
      thumb: pages[0]?.thumb || '',
      pdf: pdfUrl,
      pageCount: pages.length,
      pages,
    }
  } catch (err) {
    console.warn('[gazeteler] fetchIstanbulGazetesi hatasi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** 16. Güney gazetesinin en güncel sayısını çeker. */
export async function fetchGuney() {
  try {
    const res = await fetch('https://www.guneygazetesi.com/guneygazete.asp', { headers: { 'User-Agent': UA } })
    if (!res.ok) return null
    const html = await res.text()
    const optMatch = html.match(/<select[^>]+name=["']gazetesec["'][^>]*>[\s\S]*?<option[^>]+value=["'](\d+)["'][^>]*>([\s\S]*?)<\/option>/i)
    if (!optMatch) return null
    const issueId = optMatch[1]
    const rawDateText = optMatch[2].trim()

    // Güney gazetesinin 8 sayfasını on-demand proxy üzerinden sun
    const pages = Array.from({ length: 8 }, (_, i) => {
      const p = i + 1
      const proxyUrl = `/api/guney-page?issueId=${issueId}&page=${p}`
      return {
        page: p,
        img: proxyUrl,
        thumb: proxyUrl,
      }
    })

    return {
      id: `guney_${issueId}`,
      name: 'Güney',
      title: 'Güney Gazetesi',
      date: formatTurkishDate(rawDateText),
      thumb: pages[0]?.thumb || '',
      pdf: '',
      pageCount: pages.length,
      pages,
    }
  } catch (err) {
    console.warn('[gazeteler] fetchGuney hatasi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** 17. Hürses gazetesinin en güncel sayısını çeker. */
export async function fetchHurses() {
  try {
    const res = await fetch('https://www.haberantalya.com/gazete-arsivi', { headers: { 'User-Agent': UA } })
    if (!res.ok) return null
    const html = await res.text()
    const issueMatch = html.match(/href=["'](https?:\/\/www\.haberantalya\.com)?(\/gazete-arsiv\/[^"']+)["']/i)
    if (!issueMatch) return null
    const detailUrl = issueMatch[2].startsWith('http') ? issueMatch[2] : `https://www.haberantalya.com${issueMatch[2]}`

    const dRes = await fetch(detailUrl, { headers: { 'User-Agent': UA } })
    if (!dRes.ok) return null
    const dHtml = await dRes.text()

    let formattedDate = 'Bugün'
    const dm = detailUrl.match(/(\d{1,2})-([a-zçğıöşü]+)-(\d{4})/i)
    if (dm) {
      const day = String(dm[1]).padStart(2, '0')
      const mo = TR_MONTHS_MAP[dm[2].toLowerCase()] || '01'
      const yr = dm[3]
      formattedDate = formatTurkishDate(`${yr}-${mo}-${day}`)
    }

    const webpMatches = [...dHtml.matchAll(/https:\/\/images\.haberantalya\.com\/arsivgaleri\/\d{4}\/\d{2}\/hurses-[^\s"']+\.webp/gi)].map((x) => x[0])
    const unique = [...new Set(webpMatches)]
    unique.sort((a, b) => {
      const ma = a.match(/hurses-(\d+)/i)
      const mb = b.match(/hurses-(\d+)/i)
      const na = ma ? parseInt(ma[1], 10) : 0
      const nb = mb ? parseInt(mb[1], 10) : 0
      return na - nb
    })

    const pages = unique.map((u, i) => ({
      page: i + 1,
      img: `/api/proxy-image?url=${encodeURIComponent(u)}`,
      thumb: `/api/proxy-image?url=${encodeURIComponent(u)}`,
    }))

    if (pages.length === 0) return null

    return {
      id: `hurses_${detailUrl.split('/').pop()}`,
      name: 'Hürses',
      title: 'Hürses Gazetesi',
      date: formattedDate,
      thumb: pages[0]?.thumb || '',
      pdf: '',
      pageCount: pages.length,
      pages,
    }
  } catch (err) {
    console.warn('[gazeteler] fetchHurses hatasi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** 18. Haber Ekspres gazetesinin en güncel sayısını çeker. */
export async function fetchEkspres() {
  try {
    const res = await fetch('https://www.haberekspres.com.tr/egazete/', { headers: { 'User-Agent': UA } })
    if (!res.ok) return null
    const html = await res.text()
    const issueMatch = html.match(/href=["'](https?:\/\/www\.haberekspres\.com\.tr)?(\/egazete\/(?!kategori)[^"'\s]+)["']/i)
    if (!issueMatch) return null
    const detailUrl = issueMatch[2].startsWith('http') ? issueMatch[2] : `https://www.haberekspres.com.tr${issueMatch[2]}`

    const dRes = await fetch(detailUrl, { headers: { 'User-Agent': UA } })
    if (!dRes.ok) return null
    const dHtml = await dRes.text()

    const titleMatch = dHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
    let dateStr = 'Bugün'
    if (titleMatch) {
      const tm = titleMatch[1].match(/(\d{1,2})\s+([^\s\d]+)\s+(\d{4})/)
      if (tm) {
        dateStr = formatTurkishDate(`${tm[1]} ${tm[2]} ${tm[3]}`)
      }
    }

    const imgMatches = [...dHtml.matchAll(/https:\/\/habereksprescomtr\.teimg\.com\/haberekspres-com-tr\/uploads\/\d{4}\/\d{2}\/[^\s"']+\.jpe?g/gi)].map((x) => x[0])
    const unique = [...new Set(imgMatches)].filter((u) => !u.includes('logo'))

    unique.sort((a, b) => {
      const ma = a.match(/-(\d+)\.jpe?g/i)
      const mb = b.match(/-(\d+)\.jpe?g/i)
      const na = ma ? parseInt(ma[1], 10) : 0
      const nb = mb ? parseInt(mb[1], 10) : 0
      return na - nb
    })

    const pages = unique.map((u, i) => ({
      page: i + 1,
      img: `/api/proxy-image?url=${encodeURIComponent(u)}`,
      thumb: `/api/proxy-image?url=${encodeURIComponent(u)}`,
    }))

    if (pages.length === 0) return null

    return {
      id: `ekspres_${detailUrl.split('/').pop()}`,
      name: 'Ekspres',
      title: 'Haber Ekspres',
      date: dateStr,
      thumb: pages[0]?.thumb || '',
      pdf: '',
      pageCount: pages.length,
      pages,
    }
  } catch (err) {
    console.warn('[gazeteler] fetchEkspres hatasi:', String(err?.message ?? err).slice(0, 100))
    return null
  }
}

/** Eşzamanlı istek limitini aşmamak için görevleri küçük gruplar halinde çalıştırır */
async function batchAll(tasks, batchSize = 6) {
  const results = []
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize)
    const res = await Promise.all(batch.map((fn) => fn()))
    results.push(...res)
  }
  return results
}

/**
 * eGazeteleri ve eDergileri D1 önbelleğinden okur, gerekirse arka planda günceller.
 */
export async function getGazeteler(env, forceFresh = false) {
  const CACHE_KEY = 'daily_gazeteler_v30_cache'
  const TTL_MS = 30 * 60 * 1000 // 30 dakika önbellek süresi
  let cachedData = null

  try {
    const row = await env.DB.prepare('SELECT value FROM system_settings WHERE key = ?')
      .bind(CACHE_KEY)
      .first()
    if (row?.value) {
      cachedData = JSON.parse(row.value)
      const age = Date.now() - (cachedData.timestamp || 0)
      if (
        !forceFresh &&
        age < TTL_MS &&
        cachedData.data?.mansetler?.length &&
        cachedData.data?.tam_sayi?.length >= 20 &&
        cachedData.data?.dergiler?.length >= 10
      ) {
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

  const [
    aksam,
    cumhuriyet,
    evrensel,
    sozcu,
    posta,
    aydinlik,
    turkgun,
    milligazete,
    yenicag,
    sonsoz,
    fanatik,
    analiz,
    anayurt,
    batmanSonsoz,
    baskent,
    gundem,
    kadikoy,
    oksijen,
    tunaydin,
    yeniyasam,
    ankaraUlus,
    istanbulGazetesi,
    guney,
    hurses,
    ekspres,
    hakimiyet,
    corumhaber,
    mansetler,
    somuncuDergiler,
    diyanetDergiler,
    tubitakDergiler,
    bilimkurguDergi,
  ] = await batchAll([
    () => fetchAksam().catch(() => null),
    () => fetchCumhuriyet().catch(() => null),
    () => fetchEvrensel().catch(() => null),
    () => fetchSozcu().catch(() => null),
    () => fetchPosta().catch(() => null),
    () => fetchAydinlik().catch(() => null),
    () => fetchTurkgun().catch(() => null),
    () => fetchMilliGazete().catch(() => null),
    () => fetchYenicag().catch(() => null),
    () => fetchSonsoz().catch(() => null),
    () => fetchFanatik().catch(() => null),
    () => fetchAnaliz().catch(() => null),
    () => fetchAnayurt().catch(() => null),
    () => fetchBatmanSonsoz().catch(() => null),
    () => fetchBaskent().catch(() => null),
    () => fetchGundem().catch(() => null),
    () => fetchKadikoy().catch(() => null),
    () => fetchOksijen(env).catch(() => null),
    () => fetchTunaydin().catch(() => null),
    () => fetchYeniYasam().catch(() => null),
    () => fetchAnkaraUlus().catch(() => null),
    () => fetchIstanbulGazetesi().catch(() => null),
    () => fetchGuney().catch(() => null),
    () => fetchHurses().catch(() => null),
    () => fetchEkspres().catch(() => null),
    () => fetchHakimiyet().catch(() => null),
    () => fetchCorumHaber().catch(() => null),
    () => fetchMansetler(prevMap).catch(() => []),
    () => fetchSomuncuDergiler().catch(() => []),
    () => fetchDiyanetDergiler().catch(() => []),
    () => fetchTubitakDergiler().catch(() => []),
    () => fetchBilimkurguDergisi().catch(() => []),
  ], 6)

  let yanki = null
  try {
    yanki = await fetchYanki()
  } catch (err) {
    console.warn('[gazeteler] yanki fetch hatasi:', err?.message)
  }

  const tamSayiList = [
    aksam || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Akşam') || FALLBACK_AKSAM,
    cumhuriyet || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Cumhuriyet'),
    evrensel || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Evrensel'),
    sozcu || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Sözcü'),
    posta || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Posta'),
    aydinlik || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Aydınlık'),
    turkgun || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Türkgün'),
    milligazete || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Milli Gazete'),
    yenicag || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Yeniçağ'),
    sonsoz || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Sonsöz'),
    fanatik || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Fanatik'),
    analiz || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Analiz'),
    anayurt || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Anayurt'),
    batmanSonsoz || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Batman Sonsöz'),
    baskent || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Başkent'),
    gundem || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Gündem'),
    kadikoy || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Kadıköy'),
    oksijen || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Oksijen'),
    tunaydin || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Tünaydın'),
    yeniyasam || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Yeni Yaşam'),
    (yanki?.pages?.length >= 2 ? yanki : (cachedData?.data?.tam_sayi?.find((g) => g.name === 'Yankı') || FALLBACK_YANKI)),
    ankaraUlus || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Ankara Ulus'),
    istanbulGazetesi || cachedData?.data?.tam_sayi?.find((g) => g.name === 'İstanbul'),
    guney || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Güney'),
    hurses || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Hürses') || FALLBACK_HURSES,
    ekspres || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Ekspres') || FALLBACK_EKSPRES,
    hakimiyet || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Hakimiyet'),
    corumhaber || cachedData?.data?.tam_sayi?.find((g) => g.name === 'Çorum Haber') || FALLBACK_CORUMHABER,
  ].filter((g) => g && (g.pdf || (Array.isArray(g.pages) && g.pages.length > 0)))

  const dergilerList = [
    ...(somuncuDergiler || []),
    ...(diyanetDergiler || []),
    ...(tubitakDergiler || []),
    ...(bilimkurguDergi || []),
  ].filter(Boolean)

  const payload = {
    tam_sayi: tamSayiList,
    mansetler: mansetler.length ? mansetler : (cachedData?.data?.mansetler || Object.values(FALLBACK_MANSETLER)),
    dergiler: dergilerList.length ? dergilerList : (cachedData?.data?.dergiler || []),
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

