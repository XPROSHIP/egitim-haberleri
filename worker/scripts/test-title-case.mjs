import { normalizeTitleCase } from '../src/text.js'

const cases = [
  [
    'Milli Eğitim Bakanı yusuf Tekin mesleki lise açılışına katıldı',
    'BAKANIMIZ YUSUF TEKİN, DİŞ TİCARET MESLEKİ VE TEKNİK ANADOLU LİSESİNİN AÇILIŞINA KATILDI',
  ],
  [
    'Kars’ta Eğitim gören öğrenciler kentin köklü tarihini yerinde öğrenmek için yolculuğa çıkıyor',
    'KARS’TA EĞİM ÖĞRENCİLERİ',
  ],
  [
    'Milli Eğitim Bakanlığı 2027 yılı pansiyon ücretlerini belirledi',
    'Milli Eğitim Bakanlığı Pansiyon Ücretlerini Belirledi',
  ],
  [
    'Çorum özel eğitim kurumları okul öncesi hedefleri yayımlandı',
    'Çorum Özel Eğitim Kurumları Okul Öncesi Hedefleri Yayımlandı',
  ],
  [
    'Karadeniz MÖZEM izleme heyeti çorum İl Milli Eğitim müdürlüğünü ziyaret et',
    'KARADENİZ MÖZEM HEYETİNDEN İL MİLLÎ EĞİTİM MÜDÜRÜMÜZE ZİYARET',
  ],
]

for (const [ai, src] of cases) console.log('->', normalizeTitleCase(ai, src))