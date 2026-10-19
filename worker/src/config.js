/**
 * Kaynak tanımları.
 *
 * Kural: yalnızca gerçek makale adresi verebilen kaynaklar kullanılır.
 * Google News yalnızca kümeleme (tekrar tespiti) için işe yarar; oradan
 * gelen kayıtların görseli Google'ın boş yer tutucusudur, bu yüzden
 * yayına giremezler.
 */

/** Doğrudan RSS beslemeleri. */
export const RSS_FEEDS = [
  { name: 'Çorum İl MEB', url: 'https://corum.meb.gov.tr/meb_iys_dosyalar/xml/rss_haberler.xml', weight: 6, province: 'Çorum', category: 'corum' },
  { name: 'Çorum İl MEB', url: 'https://corum.meb.gov.tr/meb_iys_dosyalar/xml/rss_duyurular.xml', weight: 4, province: 'Çorum', category: 'corum' },  { name: 'Anadolu Ajansı', url: 'https://www.aa.com.tr/tr/rss/default?cat=egitim', weight: 4 },
  { name: 'Anadolu Ajansı', url: 'https://www.aa.com.tr/tr/rss/default?cat=guncel', weight: 1 },
  { name: 'Sözcü', url: 'https://www.sozcu.com.tr/feeds-rss-category-egitim', weight: 3 },
  { name: 'KPSS Haber', url: 'https://www.kpsshaber.com/rss', weight: 3 },
  { name: 'Habertürk', url: 'https://www.haberturk.com/rss', weight: 1 },
  { name: 'Dünya', url: 'https://www.dunya.com/rss', weight: 1 },
  { name: 'Ege Haber', url: 'https://www.egehaber.com/rss', weight: 1 },
]

/**
 * Bölüm sayfası taraması.
 * `prefix` verilirse yalnızca o yolla başlayan bağlantılar alınır.
 */
export const SECTION_PAGES = [
  { name: 'Milli Eğitim Bakanlığı', url: 'https://www.meb.gov.tr/', prefix: '', weight: 3 },
  {
    name: 'MEB Haber Dizini',
    url: 'https://www.meb.gov.tr/meb_haberindex.php',
    prefix: '',
    weight: 3,
  },
  {
    name: 'Hürriyet',
    url: 'https://www.hurriyet.com.tr/egitim/',
    prefix: '/egitim/',
    weight: 4,
  },
  {
    name: 'Cumhuriyet',
    url: 'https://www.cumhuriyet.com.tr/egitim/',
    prefix: '/egitim/',
    weight: 4,
  },
  {
    name: 'Milliyet',
    url: 'https://www.milliyet.com.tr/egitim/',
    prefix: '/egitim/',
    weight: 3,
  },
  {
    name: 'Takvim',
    url: 'https://www.takvim.com.tr/egitim',
    prefix: '/egitim/',
    weight: 3,
  },
  {
    name: 'Star',
    url: 'https://www.star.com.tr/egitim/',
    prefix: '/egitim/',
    weight: 3,
  },
  {
    name: 'A Haber',
    url: 'https://www.ahaber.com.tr/egitim/',
    prefix: '/egitim/',
    weight: 3,
  },
  {
    name: 'NTV',
    url: 'https://www.ntv.com.tr/egitim',
    prefix: '/egitim/',
    weight: 3,
  },
  { name: 'Sözcü', url: 'https://www.sozcu.com.tr/egitim', prefix: '', weight: 3 },
  { name: 'Yeni Çağrı', url: 'https://www.yenicagri.com/', prefix: '', weight: 3 },
  { name: 'Yeni Çağrı', url: 'https://www.yenicagri.com/egitim', prefix: '', weight: 3 },
]

/** Google News — yalnızca tekrar tespiti ve kapsam genişletme, yayın yok. */
export const GOOGLE_NEWS_QUERIES = [
  { q: 'mesleki eğitim when:2d', cat: 'mesleki', w: 3 },
  { q: 'MESEM çıraklık when:3d', cat: 'mesem', w: 3 },
  { q: 'mesleki ve teknik anadolu lisesi when:5d', cat: 'liseler', w: 3 },
  { q: 'Milli Eğitim Bakanlığı MEB when:1d', cat: 'meb', w: 3 },
  { q: 'Çorum okul öğretmen when:3d', cat: 'corum', w: 4 },
  { q: 'Çorum Milli Eğitim Müdürlüğü when:5d', cat: 'corum', w: 4 },
  { q: 'öğretmen ataması when:7d', cat: 'meb', w: 3 },
  { q: 'Maarif Modeli when:7d', cat: 'maarif', w: 4 },
  { q: 'YKS KPSS sınav when:3d', cat: 'sinav', w: 3 },
  { q: 'okul öncesi eğitim when:7d', cat: 'ilkogretim', w: 2 },
  { q: 'fen lisesi anadolu lisesi when:5d', cat: 'liseler', w: 3 },
]

/** Yayıncı olarak işe yaramayan kaynaklar. */
export const BLOCK_SOURCES = ['sponsor', 'google haberler']

/**
 * Mesleki Eğitim Merkezi (MESEM) ile ilgili terimler.
 *
 * Türkiye'de "Mesleki Eğitim Merkezi" haberleri esas olarak yerel basında
 * çıkıyor ve erişilebilir tek bir ulusal kaynak yok. Bu yüzden MESEM kategorisi
 * mesleki eğitimin tümünü kapsar: çıraklık, ustalık, işbaşı eğitimi, meslek
 * liseleri, atölye ve branş dalları. Kategori, okul bünyesindeki kişilerin
 * (öğretmen, öğrenci, işbaşı eğitimi öğrencisi) ilgilendiği haberlerin toplandığı
 * yerdir.
 */
export const MESEM_TERMS = [
  'mesem',
  'mesleki eğitim merkezi',
  'mesleki eğitim merkezleri',
  'teknik eğitim merkezi',
  'çırak',
  'çıraklık',
  'ustalık belgesi',
  'ustalık sınavı',
  'işbaşı eğitimi',
  'işbaşı',
  'kalifiye',
  'sözleşmeli öğretmen',
  'uzman öğretmen',
  'mesleki eğitim danışmanı',
  'meslek öğretmeni',
  'öğretmenlik belgesi',
  'mesleki eğitim',
  'mesleki ve teknik',
  'meslek lisesi',
  'mesleki anadolu',
  'mtal',
  'atölye',
  'bilişim teknolojileri',
  'elektrik tesisat',
  'makine teknolojisi',
  'mobilya',
  'gıda teknolojisi',
  'otomotiv',
  'kaynakçılık',
  'nitelikli eleman',
  'iş gücü',
]

/**
 * Yabancı dilde eğitim haberi kaynakları.
 * "Yabancı Eğitim" kategorisi bu kaynaklardan beslenir; haberler hızlı modelle
 * Türkçeye çevrilerek yayınlanır. Okuma, sınav, üniversite, politika gibi
 * eğitim gündemini kapsayan yayınlar seçildi.
 */
export const FOREIGN_FEEDS = [
  { name: 'The Guardian', url: 'https://www.theguardian.com/education/rss', weight: 4 },
  { name: 'The Guardian Dünya', url: 'https://www.theguardian.com/world/education/rss', weight: 3 },
  { name: 'Education Dive', url: 'https://www.educationdive.com/feeds/news/', weight: 4 },
  { name: 'K-12 Dive', url: 'https://www.k12dive.com/feeds/news/', weight: 4 },
  { name: 'EdSurge', url: 'https://www.edsurge.com/articles_rss', weight: 4 },
  { name: 'Inside Higher Ed', url: 'https://www.insidehighered.com/rss.xml', weight: 4 },
  { name: 'NPR Education', url: 'https://feeds.npr.org/1013/rss.xml', weight: 3 },
  { name: 'eCampus News', url: 'https://www.ecampusnews.com/feed/', weight: 3 },
  { name: 'The Conversation', url: 'https://theconversation.com/us/education/articles.atom', weight: 4 },
  { name: 'Hechinger Report', url: 'https://hechingerreport.org/feed/', weight: 4 },
  { name: 'Education Next', url: 'https://www.educationnext.org/feed/', weight: 3 },
]

/** İngilizce başlıklarda eğitim haberi ayırt etmek için kullanılan terimler. */
export const FOREIGN_EDU_TERMS = [
  'school', 'student', 'teacher', 'education', 'college', 'university', 'classroom',
  'curriculum', 'learning', 'district', 'enrollment', 'degree', 'preschool', 'kindergarten',
  'academic', 'scholarship', 'tuition', 'principal', 'educator', 'literacy', 'graduation',
  'campus', 'teaching', 'class', 'pupil', 'headteacher', 'chancellor', 'tests',
  'boarding', 'vocational', 'apprentice', 'college', 'campus', 'undergraduate',
]

/** Çeviri için kullanılan hızlı model. */
export const TRANSLATE_MODEL = 'gemini-3.5-flash-lite'

/** Bir turda kaç yabancı haber çevrilsin. */
export const MAX_FOREIGN_PER_RUN = 6

/** Kategori tespiti: hangi başlık hangi kategoriye gider. */
export const CATEGORY_RULES = [
  {
    slug: 'mesem',
    weight: 8,
    terms: MESEM_TERMS,
  },
  {
    slug: 'corum',
    weight: 7,
    terms: ['çorum', 'boğazkale', 'alaca', 'ortaköy', 'mecitözü', 'uğurludağ', 'kargı', 'sungurlu'],
  },
  {
    slug: 'mesleki',
    weight: 6,
    terms: [
      'mesleki eğitim', 'mesleki ve teknik', 'mesleki anadolu', 'meslek lisesi', 'mtal',
      'atölye', 'laboratuvar', 'beceri', 'mesleki gelişim',
    ],
  },
  {
    slug: 'maarif',
    weight: 7,
    terms: ['maarif modeli', 'maarif', 'öğretmen eğitimi programı'],
  },
  {
    slug: 'sinav',
    weight: 6,
    terms: ['yks', 'kpss', 'ayt', 'tyt', 'oabt', 'ales', 'yds', 'sınav', 'yerleştirme', 'sonuçlar açıklandı', 'başvuru'],
  },
  {
    slug: 'universite',
    weight: 5,
    terms: ['üniversite', 'yükseköğretim', 'rektörlük', 'öğrenci yurdu', 'burs', 'kyk'],
  },
  {
    slug: 'liseler',
    weight: 6,
    terms: ['anadolu lisesi', 'fen lisesi', 'mesleki anadolu', 'lise öğrencisi', 'proje yarışması', 'lgs'],
  },
  {
    slug: 'ilkogretim',
    weight: 5,
    terms: ['ilkokul', 'ilköğretim', 'okul öncesi', 'ana sınıfı', 'sınıf öğretmeni', 'sınıf öğretmenleri'],
  },
  {
    slug: 'ortaogretim',
    weight: 4,
    terms: ['ortaöğretim', 'ortaokul', 'ders programı', 'eğitim öğretim yılı', 'karne', 'devamsızlık', 'pansiyon'],
  },
  {
    slug: 'meb',
    weight: 5,
    terms: ['milli eğitim bakanlığı', 'meb', 'bakanlık', 'eğitim bakanı', 'öğretmen ataması', 'genelge'],
  },
  {
    slug: 'yabanci',
    weight: 5,
    terms: ['almanya', 'japonya', 'ingiltere', 'hollanda', 'kanada', 'yurt dışı', 'uluslararası', 'erasmus'],
  },
]

/** Yayınlanmayacak bölümler (haber adresindeki yola göre). */
export const BLOCKED_PATH =
  /\/(spor|kultur-sanat|kultur|kultur-miras|sanat|ekonomi|finans|borsa|saglik|dunya|yasam|gundem|video|video-haber|foto-galeri|galeri|rss|yazarlar|kolon|seyret|canli-yayin|kose-yazisi|infografik)(?:\/|$|-)/i

/** Başlıkta geçerse haber eğitim sayılmaz. */
export const NOISE_TITLE =
  /(futbol|basketbol|volleyball|voleybol|handbol|atletiz|swim|tenis|motor yarış|formula|transfer|lig maç|maç sonuc|maç sonras|derbi|şampiyonkaza|kazalar|canaveri|yangın|deprem|bölgesel yangın|hava durumu|dolar|euro|borsa|altın|faiz|enflasyon|kurumlar|piyasa|tiyatro|opera|bale|sinema|aktör|sanatçı|show|reality|lanet|fal|horoskop|yemek tarifi|şifreli|yemek|g astroloji)/i

/** Eğitim sinyali taşıyan kelimeler. */
export const EDUCATION_TERMS = [
  'egitim', 'öğretmen', 'öğretmenler', 'öğrenci', 'öğrenciler', 'okul', 'okullar', 'ders',
  'müfredat', 'öğretim', 'mesleki eğitim', 'meslek', 'çırak', 'staj', 'bakanlık', 'meb',
  'maarif', 'lise', 'liseler', 'ilkokul', 'ortaokul', 'ortaöğretim', 'ilköğretim',
  'üniversite', 'yükseköğretim', 'rektörlük', 'yks', 'kpss', 'ayt', 'tyt', 'oabt', 'ales',
  'sınav', 'puan', 'kontenjan', 'yurt', 'pansiyon', 'atölye', 'laboratuvar', 'branş',
  'veli', 'karne', 'devamsızlık', 'burs', 'öğretmenlik', 'hizmet içi', 'meb personeli',
  'öğretmen odası', 'sendika', 'eğitim öğretim yılı', 'ders kitabı', 'kütüphane',
  'öğretim üyesi', 'mezun', 'ders programı', 'yaz tatili', 'yarıyıl', 'not ortalaması',
]

/** Mesleki eğitim öncelik terimleri — puanı yükseltir. */
export const VOCATIONAL_TERMS = [
  'mesleki eğitim', 'mesleki ve teknik', 'mesleki anadolu', 'mtal', 'mesem',
  'meslek lisesi', 'mesleki gelişim', 'atölye', 'çırak', 'staj', 'işbaşı',
  'bilişim teknolojileri', 'elektrik tesisat', 'makine teknolojisi', 'mobilya ve doğrama',
  'gıda teknolojisi', 'bina tesisat', 'otomotiv', 'kaynakçılık', 'güzellik', 'çoğrafya',
  'sağlık bilgisi', 'tarım teknolojileri', 'mesleki eğitim merkezi', 'bilişim',
]

export const GEMINI_MODEL = 'gemini-3.8-flash'

/**
 * Model yedekleme zinciri.
 * Gemini zaman zaman "high demand" (503) döndürüyor; bu durumda bir sonraki
 * modele geçiliyor. Anahtar döndürme tek başına yetmiyor çünkü tüm anahtarlar
 * aynı aşırı yüklü modele gidiyor.
 */
export const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
]
export const MAX_AI_PER_RUN = 18
export const AUTO_PUBLISH_SCORE = 4
