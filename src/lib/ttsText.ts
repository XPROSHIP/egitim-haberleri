/**
 * Seslendirme (TTS) metin hazırlığı — Python tarafının TypeScript karşılığı.
 *
 * EMA Lightning'in metin ön işleyicisi (normalizer_tr) davranışı:
 *  · virgül, nokta, iki nokta, noktalı virgül, ünlem, soru işareti, tırnak,
 *    parantez OLDUĞU GİBİ bırakılır — model bunları prozodi (duraklama)
 *    için kullanır. Bunlar SİLİNMEZ.
 *  · tire ("tire"), eğik çizgi ("eğik çizgi") gibi işaretleri SESLİ okur;
 *    onlar sessiz karşılıklarıyla değiştirilir.
 *  · sayı, tarih, saat, para, yüzde doğru okunur.
 *  · kısaltmaları (ALES, KPSS...) harf harf okur; açılımlarıyla değiştirilir.
 */

/** Kısaltmalar: sesli okunabilir açılımları. */
const ACRONYMS: Record<string, string> = {
  MESEM: 'Mesleki Eğitim Merkezi',
  MEB: 'Milli Eğitim Bakanlığı',
  'YÖK': 'Yükseköğretim Kurulu',
  'ÖSYM': 'Öğrenci Seçme ve Yerleştirme Merkezi',
  ALES: 'Akademik Personel ve Lisans Sınavı',
  KPSS: 'Kamu Personeli Seçme Sınavı',
  YKS: 'Yükseköğretim Kurulu Sınavı',
  TYT: 'Temel Yerleştirme Testi',
  AYT: 'Alan Yeterlilik Testi',
  LGS: 'Liseye Geçiş Sınavı',
  'AÖF': 'Açıköğretim Fakültesi',
  'TYT/AYT': 'Temel ve Alan Yeterlilik Testleri',
  'T.C.': 'Türkiye Cumhuriyeti',
  SGK: 'Sosyal Güvenlik Kurumu',
}

/** Yanlış telaffüz düzeltmeleri. */
const PRONUNCIATIONS: Record<string, string> = {
  karekökü: 'kare kökü',
  karekök: 'kare kök',
  karekökler: 'kare kökler',
  karekok: 'kare kök',
  youtube: 'youtub',
  whatsapp: 'vatsap',
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
  'sf.': 'sanfiyye',
  gb: 'gigabayt',
  mb: 'megabayt',
  kb: 'kilobayt',
  tb: 'terabayt',
  tl: 'lira',
  usd: 'dolar',
  eur: 'euro',
}

/** Modelin SESLİ okuduğu işaretler: sessiz karşılıkları. */
const READ_ALOUD: [string, string][] = [
  ['-', ' '],
  ['–', ' '],
  ['—', ' '],
  ['−', ' '],
  ['/', ' '],
  ['\\', ' '],
  ['|', ' '],
  ['•', ', '],
  ['·', ', '],
  ['*', ' '],
  ['#', ' numara '],
  ['@', ' at '],
  ['_', ' '],
  ['…', '...'],
  ['“', '"'],
  ['”', '"'],
  ['„', '"'],
  ['«', '"'],
  ['»', '"'],
  ['‘', "'"],
  ['’', "'"],
]

/** Metni seslendirme için hazırlar. Noktalama korunur. */
export function cleanForTts(text: string): string {
  if (!text) return ''
  let out = String(text)

  // 1) Kısaltmalar (büyük harfli hâliyle aranır)
  for (const key of Object.keys(ACRONYMS).sort((a, b) => b.length - a.length)) {
    if (!out.includes(key)) continue
    const name = ACRONYMS[key]
    // "Milli Eğitim Bakanlığı (MEB)" -> "Milli Eğitim Bakanlığı"
    const re = new RegExp(
      `([\\wÇĞİÖŞÜçğıöşü ,.'-]{0,80}?)\\s*\\(${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`,
      'g',
    )
    out = out.replace(re, (m, before: string) => {
      const head = name.split(' ')[0].toLocaleLowerCase('tr')
      return head && before.toLocaleLowerCase('tr').includes(head) ? before : m
    })
    out = out.split(key).join(name)
  }

  // 2) Modelin sesli okuduğu işaretler
  for (const [ch, rep] of READ_ALOUD) out = out.split(ch).join(rep)

  // 3) Telaffüz düzeltmeleri (metni küçük harfe indirir)
  let low = out.toLocaleLowerCase('tr')
  for (const [needle, rep] of Object.entries(PRONUNCIATIONS)) {
    if (low.includes(needle)) low = low.split(needle).join(rep)
  }
  out = low

  // 4) Sayı sonrası nokta ("1. madde" -> "bir. madde" okunmasın)
  out = out.replace(/(?<=\d)\.(?=\s|$)/g, ' ')

  return out.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}
