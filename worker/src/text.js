/** Türkçe metin normalizasyonu, benzerlik ve tekrar tespiti. */

const TR_MAP = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  İ: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
  Ç: 'c',
  Ğ: 'g',
  Ö: 'o',
  Ş: 's',
  Ü: 'u',
}

export function fold(str = '') {
  return str
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, (m) => TR_MAP[m] ?? m)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function slugify(str = '') {
  const map = {
    ç: 'c',
    ğ: 'g',
    ı: 'i',
    İ: 'i',
    ö: 'o',
    ş: 's',
    ü: 'u',
    Ç: 'c',
    Ğ: 'g',
    Ö: 'o',
    Ş: 's',
    Ü: 'u',
  }
  return str
    .toLowerCase()
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, (m) => map[m] ?? m)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
}

/** FNV-1a — kısa, kararlı karma. */
export function hash(str = '') {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

/** Başlıktan tekrar tespiti için kararlı anahtar. */
export function dedupeKey(title = '') {
  const words = fold(title)
    .split(' ')
    .filter((w) => w.length > 2)
    .sort()
    .slice(0, 12)
  return hash(words.join(' '))
}

function trigrams(s) {
  const p = `  ${s} `
  const set = new Set()
  for (let i = 0; i < p.length - 2; i++) set.add(p.slice(i, i + 3))
  return set
}

/** Jaccard benzerliği, 0–1. */
export function similarity(a = '', b = '') {
  const A = trigrams(fold(a))
  const B = trigrams(fold(b))
  if (A.size === 0 || B.size === 0) return 0
  let inter = 0
  for (const g of A) if (B.has(g)) inter++
  return inter / (A.size + B.size - inter)
}

/** İki haberin aynı kaynaktan birebir aynı olup olmadığını kontrol eder. */
export function sameLink(a = {}, b = {}) {
  if (!a.link || !b.link) return false
  const clean = (u) => u.split('?').sort().join('?')
  return clean(a.link) === clean(b.link)
}

/** Başlıkta büyük harf korunacak özel adlar ve kısaltmalar. */
const KEEP_UPPER = new Set(
  [
    'meb', 'mesem', 'yks', 'kpss', 'ayt', 'tyt', 'oabt', 'osym', 'ab', 'tubitak', 'aof', 'ales',
    'türkiye', 'cumhuriyet', 'ottoman', 'bakan', 'bakanlığı', 'millî', 'milli',
    'üniversite', 'üniversitesi', 'üniversitesinin', 'üniversitesinde', 'maarif', 'modeli',
    'yaygın', 'veli', 'veliler', 'kurul', 'şubesi',
  ].map(foldWord),
)

const ACRONYMS = new Set(
  [
    'meb', 'mesem', 'yks', 'kpss', 'ayt', 'tyt', 'oabt', 'ales', 'osym', 'ab', 'tubitak',
    'aof', 'yds', 'lgs', 'cyos', 'yke', 'ohs', 'ales', 'meb', 'obn', 'sks', 'eml', 'aime',
  ].map(foldWord),
)

/** "TÜBİTAK'ın" gibi kesme ekli kısaltmaları da yakalar. */
function isAcronym(word) {
  const k = foldWord(word).replace(/['’].*$/, '')
  return ACRONYMS.has(k)
}

/** Korunan ifade içinde büyük harf almayan bağlaçlar. */
const LOWERS = new Set(['ve', 'veya', 'ile', 'yada', 'ic', 'icin', 'da', 'de', 'ta', 'te'])

const PROVINCES = [
  'çorum', 'ankara', 'istanbul', 'izmir', 'bursa', 'antalya', 'adana', 'konya', 'gaziantep',
  'kayseri', 'eskişehir', 'diyarbakır', 'şanlıurfa', 'malatya', 'samsun', 'denizli', 'kocaeli',
  'aydın', 'balıkesir', 'muğla', 'trabzon', 'erzurum', 'van', 'zonguldak', 'ordu', 'rize', 'bolu',
  'çankırı', 'sinop', 'amasya', 'tokat', 'yozgat', 'sivas', 'kırıkkale', 'mersin', 'kütahya',
  'aksaray', 'niğde', 'karaman', 'batman', 'şırnak', 'mardin', 'adıyaman', 'gaziantep',
]

for (const p of PROVINCES) KEEP_UPPER.add(foldWord(p))

/** "Milli Eğitim Bakanlığı", "Fen Lisesi" gibi çoklu kelimeli özel adlar korunur. */
const PROTECTED_PHRASES = [
  'milli eğitim',
  'il milli eğitim müdürlüğü',
  'milli eğitim bakanlığı',
  'milli eğitim müdürlüğü',
  'eğitim ve öğretim yılı',
  'eğitim öğretim yılı',
  'fen lisesi',
  'fen liseleri',
  'anadolu lisesi',
  'anadolu liseleri',
  'anadolu etiğim lisesi',
  'mesleki ve teknik',
  'mesleki ve teknik anadolu lisesi',
  'mesleki ve teknik anadolu liseleri',
  'meslek lisesi',
  'mesleki eğitim merkezi',
  'mesleki eğitim ve öğretim',
  'ortak yazılı sınav',
  'maarif modeli',
  'öğretmen odası',
  'yükseköğretim kurumu',
  'üniversitesi rektörlüğü',
]

export function foldWord(w) {
  return w
    .toLocaleLowerCase('tr')
    // "İ" küçültmede "i" + birleşen nokta (U+0307) olur; nokta atılır
    // yoksa "MESLEKİ" ile "mesleki" eşleşmez.
    .replace(/̈/g, '')
    .replace(/[çğıöşüâîû]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' })[c])
}

/** Ek ad bağlaçlarını ayıklar: "Ekim'de" -> "ekim" */
function stripSuffixes(word) {
  return foldWord(word).replace(/['’](d[ae]|de|da|t[ae]|te|ta|ye|ya|le|la|n[ae])$/g, '')
}

/** Türkçe kurallı ilk harfi büyütür: "ihtisas" -> "İhtisas" */
function capitalizeFirst(word) {
  if (!word) return word
  const head = word[0] === 'i' ? 'İ' : word[0]
  return head.toLocaleUpperCase('tr') + word.slice(1)
}

/**
 * Model bazen Title Case üretir. Türkçe haber standardına göre
 * cümle başı büyük, özel adlar korunur, kalanı küçük harfe çevrilir.
 * `sourceTitle` verilirse kaynak başlığında büyük harfle yazan kelimeler korunur
 * (kişi adları, kurum adları gibi kaynaktan gelen özel adlar).
 */
/** Sık kullanılan ortak kelimeler; kaynakta büyük harfle geçse de küçük yazılır. */
const COMMON_WORDS = new Set(
  [
    'eğitim', 'egitim', 'okul', 'okullar', 'ogrenci', 'oğrenci', 'ogrenciler', 'oğrenciler',
    'ogretmen', 'öğretmen', 'ogretmenler', 'öğretmenler', 'sinif', 'sınıf', 'sinavi', 'sınavı',
    'bakanlik', 'bakanlığı', 'bakani', 'bakanı', 'haber', 'haberler', 'duyuru', 'aciklama', 'açıklama',
    'program', 'proje', 'calisma', 'çalışma', 'toplanti', 'toplantı', 'etkinlik', 'zaman',
    'ilk', 'son', 'yeni', 'her', 'bu', 'bir', 've', 'ile', 'icin', 'için', 'kadar', 'sonra',
    'once', 'önce', 'da', 'de', 'ta', 'te', 'ya', 'veya', 'gibi', 'kadar', 'olan', 'oldu',
    'yer', 'is', 'iş', 'yapildi', 'yapıldı', 'aciklan', 'açıklan', 'duyurul', 'gercekles',
    'milli', 'millî', 'ozel', 'özel', 'resmi', 'resmî', 'yeni', 'devam', 'ilk', 'son',
  ].map(foldWord),
)

/** Unvanlar: bunların ardından gelen kelime kişi adıdır ve büyük harfle yazılır. */
const HONORIFICS = new Set(
  [
    'bakan', 'bakani', 'bakanlik', 'genel mudur', 'mudur', 'muduru', 'vali', 'valisi',
    'rektor', 'rektoru', 'dekan', 'dekani', 'baskan', 'baskani', 'ogretmen', 'ogretmeni',
    'docent', 'profesor', 'avukat', 'muhendis', 'uzman', 'milletvekili', 'kaymakam',
    'bakan yardimcisi', 'yardimcisi', 'sozcu', 'yazici', 'sanatci', 'kultur muzigi',
  ].map(foldWord),
)

export function normalizeTitleCase(title = '', sourceTitle = '', opts = {}) {
  if (!title) return title

  // Yayıncının eklediği çöp ekler: " - son dakika eğitim haberleri", " | haber"
  const cleaned = title
    .replace(/\s*[-–—|]\s*son\s+dakika\b.*$/i, '')
    .replace(/\s*[-–—|]\s*(haber|news)\s*haberleri\s*$/i, '')
    .replace(/\s*[-–—|]\s*\S+\s+haberleri\s*$/i, '')
    .replace(/\s*[-–—|]\s*haberler?\s*$/i, '')
    .trim()
  if (cleaned) title = cleaned

  // Kaynak başlık tamamen büyük harfse (ör. MEB RSS) veya Title Case yazılmışsa
  // her kelime büyük harfle görünür; bu durumda kaynağa güvenmek yanlış büyük harf
  // üretir ("Uygulamalı Eğitim Alan"), o yüzden kaynak kelimeleri yok sayılır.
  const srcWords = (sourceTitle ?? '').split(/[\s,.:;()"']+/).filter(Boolean)
  const srcTail = srcWords.slice(1)
  const srcCapTail = srcTail.filter((w) => /^[A-ZÇĞİÖŞÜ]/.test(w)).length
  const sourceIsAllCaps =
    (sourceTitle ?? '').length > 12 &&
    (sourceTitle ?? '').replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, '') ===
      (sourceTitle ?? '')
        .replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, '')
        .toLocaleUpperCase('tr')
  const sourceIsTitleCase = srcTail.length >= 3 && srcCapTail / srcTail.length > 0.6
  const sourceIsReliable = !sourceIsAllCaps && !sourceIsTitleCase

  // Kaynakta büyük harfle yazılmış kelimeler gerçek özel ad olabilir; küçük harfle
  // de geçmişse o kelime ortak kelimedir ("tatil"). Ayrı iki küme tutulur.
  // Cümle başındaki kelimeler özel ad işareti sayılmaz: "Bakan Tekin: Okullarda ..."
  // içindeki "Okullarda" özel ad değildir.
  const srcUpper = new Set()
  const srcLower = new Set()
  {
    const parts = (sourceTitle ?? '').split(/(?<=[.!?:;])\s+/)
    for (const part of parts) {
      const words = part.split(/[\s,.;:()"]+/).filter(Boolean)
      words.forEach((w, i) => {
        const f = foldWord(w)
        if (/^[A-ZÇĞİÖŞÜ]/.test(w)) {
          if (i > 0) srcUpper.add(f)
        } else {
          srcLower.add(f)
        }
      })
    }
  }
  const properInSource = (key) => srcUpper.has(key) && !srcLower.has(key)

  // Güvenilmeyen kaynaklarda (tamamen büyük harf / Title Case) yalnızca gerçek özel adlar
  // korunur. Haberin kendi gövdesi doğal Türkçe prose olduğu için küçük harf gördüğü
  // kelime ortak kelimedir: "sonuçları" küçük harfle, "Dumlupınar" yalnızca büyük harfle.
  const bodyLower = new Set()
  if (Array.isArray(opts.bodyText)) {
    for (const w of opts.bodyText.join(' ').split(/\s+/)) {
      if (!w || /^[A-ZÇĞİÖŞÜ0-9]/.test(w)) continue
      bodyLower.add(foldWord(w))
    }
  }

  // Model başlığı Title Case yazdıysa büyük harfleri kaynaktan doğrulamak anlamsız:
  // normal bir Türkçe cümle biçimine indirilir.
  const aiWords = title.split(' ')
  const aiCapTail = aiWords.slice(1).filter((w) => /^[A-ZÇĞİÖŞÜ]/.test(w)).length
  const aiIsTitleCase = aiWords.length >= 5 && aiCapTail / (aiWords.length - 1) > 0.5

  const trusted = (key) => {
    if (aiIsTitleCase) return false
    if (sourceIsReliable) return properInSource(key)
    if (bodyLower.size === 0) return false // doğrulayacak gövde yok: güvenme
    return !bodyLower.has(key)
  }


  const words = title.split(' ')

  // Çoklu kelimeli özel adlar ("Milli Eğitim Bakanlığı") kelime sınırlarında eşleştirilir.
  // fold() aksanları attığı için ifadeler de fold ile karşılaştırılmalıdır.
  const foldedWords = words.map((w) => stripSuffixes(w))
  const protectedIdx = new Set()
  for (const phrase of PROTECTED_PHRASES) {
    const needle = phrase.split(' ')
    for (let s = 0; s + needle.length <= words.length; s++) {
      let ok = true
      for (let k = 0; k < needle.length; k++) {
        const got = foldWord(foldedWords[s + k])
        const want = foldWord(needle[k])
        // Son kelime ek alabilir: "lisesi" -> "lisesinin", "müdürlüğü" -> "müdürlüğünü"
        const last = k === needle.length - 1
        if (last ? !(got.startsWith(want) && want.length >= 4) : got !== want) {
          ok = false
          break
        }
      }
      if (ok) for (let w = s; w < s + needle.length; w++) protectedIdx.add(w)
    }
  }

  return words
    .map((word, i) => {
      // Cümle başı korunur; ama korunan bir ifadenin parçasıysa büyük harf
      // dayatılır ("Mesleki Eğitim Merkezi ...").
      if (i === 0 && !protectedIdx.has(i)) return word
      const key = stripSuffixes(word)
      // "Bakanı yusuf" -> "Bakanı Yusuf": unvan sonrası kelime kişi adıdır.
      const prev = i > 0 ? stripSuffixes(words[i - 1]) : ''
      if (
        word.length >= 3 &&
        !/^[A-ZÇĞİÖŞÜ]/.test(word) &&
        HONORIFICS.has(prev)
      ) {
        return capitalizeFirst(word)
      }
      // Kısaltmalar (MEB, YKS, KPSS) her zaman büyük harf kalır.
      if (isAcronym(word)) return word
      // Korunan ifadeler özel addır: büyük harf dayatılır (bağlaçlar hariç).
      if (protectedIdx.has(i)) {
        return LOWERS.has(key) ? word.toLocaleLowerCase('tr') : capitalizeFirst(word.toLocaleLowerCase('tr'))
      }
      if (!/^[A-ZÇĞİÖŞÜ]/.test(word)) {
        // "çorum" -> "Çorum", "meb" -> "MEB"
        if (ACRONYMS.has(key)) return key.toLocaleUpperCase('tr')
        if (KEEP_UPPER.has(key)) return capitalizeFirst(word)
        // Kaynakta büyük harfle geçen özgün kelime ("Dumlupınar", "Tekin").
        // Cümle biçimindeki kaynakta büyük harf özel ad işaretidir. Title Case
        // kaynakta ise her kelime büyük harfli olduğundan gövde metni
        // doğrulayıcı olarak kullanılır: gövdede küçük harfle geçen kelime
        // ortak kelimedir. Tamamen büyük harfli kaynakta hiçbir çıkarım yapılmaz.
        const properInSource =
          sourceIsReliable
            ? srcUpper.has(key) && !srcLower.has(key) && !COMMON_WORDS.has(key)
            : sourceIsTitleCase &&
              srcUpper.has(key) &&
              !bodyLower.has(key) &&
              !COMMON_WORDS.has(key)
        if (word.length >= 3 && properInSource) {
          return capitalizeFirst(word)
        }
        return word
      }
      if (KEEP_UPPER.has(key)) return word
      if (trusted(key)) return word
      return word.toLocaleLowerCase('tr')
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}
