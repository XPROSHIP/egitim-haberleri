/** Yeni besleme adaylarını sınar: kaç haber geliyor? */
import { fetchFeed } from '../src/rss.js'

const CANDIDATES = [
  ['Çorum İl MEB duyuru', 'https://corum.meb.gov.tr/meb_iys_dosyalar/xml/rss_duyurular.xml'],
  ['AA eğitim', 'https://www.aa.com.tr/tr/rss/default?cat=egitim'],
  ['AA öğretmen', 'https://www.aa.com.tr/tr/rss/default?cat=egitim-ogretmen'],
  ['Sözcü eğitim', 'https://www.sozcu.com.tr/feeds-rss-category-egitim'],
  ['KPSS Haber', 'https://www.kpsshaber.com/rss'],
  ['Habertürk', 'https://www.haberturk.com/rss'],
  ['Dünya', 'https://www.dunya.com/rss'],
  ['Ege Haber', 'https://www.egehaber.com/rss'],
  ['Hürriyet eğitim', 'https://www.hurriyet.com.tr/rss/egitim'],
  ['Milliyet eğitim', 'https://www.milliyet.com.tr/rss/rssnew/egitimhaberleri_rss.xml'],
  ['Cumhuriyet eğitim', 'https://www.cumhuriyet.com.tr/rss/egitim'],
  ['Habertürk eğitim', 'https://www.haberturk.com/rss/egitim'],
  ['NTV eğitim', 'https://www.ntv.com.tr/egitim.rss'],
  ['CNN Türk eğitim', 'https://www.cnturk.com/feed/rss'],
  ['Star eğitim', 'https://www.star.com.tr/rss/egitim'],
  ['A Haber eğitim', 'https://www.ahaber.com.tr/rss/egitim'],
  ['Takvim eğitim', 'https://www.takvim.com.tr/rss/egitim'],
  ['Sabah eğitim', 'https://www.sabah.com.tr/rss/egitim'],
  ['Beyaz TV eğitim', 'https://www.beyaztv.com.tr/rss/egitim'],
  ['Kanal 7 eğitim', 'https://www.kanal7.com/rss/egitim'],
  ['Eğitim Portalı', 'https://www.egitimportali.com.tr/rss'],
  ['Eğitim Bilim', 'https://www.egitimbilim.com.tr/rss'],
  ['YÖK', 'https://www.yok.gov.tr/rss/announcement.xml'],
  ['TÜBİTAK eğitim', 'https://tubitak.gov.tr/tr/rss/1.xml'],
  ['TÜRK Eğitim', 'https://www.turkegitim.com/rss'],
  ['Çorum haber', 'https://www.hititpost.com/rss'],
  ['Çorum bozkurt', 'https://www.bozkurtdergisi.com/rss'],
  ['Çorum bölgesel', 'https://www.haberler.com/rss/egitim'],
  ['Dünya eğitim', 'https://www.dunya.com/rss/egitim'],
  ['İHA eğitim', 'https://www.iha.com.tr/rss/egitim'],
  ['TRT haber eğitim', 'https://www.trthaber.com/rss/egitim.xml'],
  ['Beyaz Gündem', 'https://www.beyazgundem.com/rss'],
  ['Eğitim Dünyası', 'https://www.egitimdunyasi.com/rss'],
  ['Mesleki Eğitim', 'https://www.meslekiegitim.com/rss'],
  ['Öğretmenler', 'https://www.ogretmenler.com/rss'],
  ['Okul Öncesi', 'https://www.okuloncesi.org/rss'],
  ['Meb News', 'https://www.mebnews.com/rss'],
  ['Eğitime Öğret', 'https://www.egitimeogret.com/rss'],
  ['Yabancı Eğitim TR', 'https://www.yabanciegitimtercume.com/rss'],
]

for (const [name, url] of CANDIDATES) {
  try {
    const items = await fetchFeed(url)
    const t = items[0]?.title ?? ''
    console.log(
      `${String(items.length).padStart(3)} haber  ${name.padEnd(22)} ${t.slice(0, 58)}`,
    )
  } catch (err) {
    console.log(`  hata      ${name.padEnd(22)} ${String(err?.message ?? err).slice(0, 50)}`)
  }
}
