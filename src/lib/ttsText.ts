/**
 * Seslendirme (TTS) metin temizleme — Python tarafının TypeScript karşılığı.
 *
 * Tarayıcının seslendirmesi bazı noktalama işaretlerini sesli okuyor
 * ("nokta", "virgül") ve tam büyük harfli kısaltmaları harf harf söylüyor
 * (MESEM -> "Me Se E Me"). Bu modül metni okunur hâle getirir.
 */

const PRONUNCIATIONS: Record<string, string> = {
  karekökü: 'kare kökü',
  karekök: 'kare kök',
  karekökler: 'kare kökler',
  youtube: 'youtub',
  whatsapp: 'vatsap',
  't.c.': 'T C',
  'a.v.': 'A V',
  'vs.': 've benzeri',
  'vb.': 've benzeri',
  'örn.': 'örneğin',
  'bkz.': 'bakınız',
  'dr.': 'doktor',
  'doç.': 'doçent',
  'prof.': 'profesör',
  'drl.': 'doktor',
  'sn.': 'saniye',
  'dk.': 'dakika',
  'sa.': 'saat',
  'gb': 'gigabayt',
  'mb': 'megabayt',
  'kb': 'kilobayt',
  'tb': 'terabayt',
  'tl': 'lira',
  'usd': 'dolar',
  'eur': 'euro',
  'öğr.': 'öğrenci',
  meb: 'Meb',
  mesem: 'Mesem',
  yök: 'Yök',
  kpss: 'Kpss',
  ösym: 'Ösym',
  ales: 'Ales',
  tyt: 'Tyt',
  ayt: 'Ayt',
  lgs: 'Lgs',
  yks: 'Yks',
  sks: 'Sks',
  obn: 'Obn',
  aime: 'Aime',
  aöf: 'Aöf',
  bilsem: 'Bilsem',
  tübitak: 'Tübitak',
  tubitak: 'Tübitak',
}

const SYMBOLS: [string, string][] = [
  ['%', ' yüzde '],
  ['&', ' ve '],
  ['+', ' artı '],
  ['=', ' eşittir '],
  ['@', ' at '],
  ['#', ' numara '],
  ['€', ' avro '],
  ['$', ' dolar '],
  ['£', ' sterlin '],
  ['°', ' derece '],
  ['½', ' yarım '],
  ['¼', ' çeyrek '],
  ['×', ' çarpı '],
  ['÷', ' bölü '],
  ['±', ' artı eksi '],
  ['→', ' yönünde '],
]

const ROMAN = new Set(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'])

/** Tam büyük harfli kısaltmaları tek sözcük hâline getirir (MESEM -> Mesem). */
function acronyms(text: string): string {
  return text.replace(/[A-ZÇĞİÖŞÜ]{2,}/g, (word) => {
    if (ROMAN.has(word)) return word
    if (word.includes('-')) {
      return word
        .split('-')
        .map((p) => (p.length > 1 ? p.charAt(0) + p.slice(1).toLowerCase() : p))
        .join('-')
    }
    return word.charAt(0) + word.slice(1).toLowerCase()
  })
}

/** Metni seslendirme için temizler: noktalama yok, kısaltmalar okunur. */
export function cleanForTts(text: string): string {
  if (!text) return ''
  let out = text.toLocaleLowerCase('tr')
  for (const [needle, rep] of Object.entries(PRONUNCIATIONS)) {
    if (out.includes(needle)) out = out.split(needle).join(rep)
  }
  for (const [sym, rep] of SYMBOLS) out = out.split(sym).join(rep)
  out = acronyms(out)
  // Noktalama ve tırnak işaretleri kaldırılır.
  out = out.replace(/["“”„«»'‘’]/g, ' ')
  out = out.replace(/[.,;:!?()[\]{}…/\\|]/g, ' ')
  out = out.replace(/[-\u2013\u2014]+/g, ' ')
  return out.replace(/\s+/g, ' ').trim()
}
