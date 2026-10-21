import { useEffect } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { categories } from '../data/categories'
import { CategoryMark } from '../components/CategoryMark'
import { Icon } from '../components/Icon'
import { useStore } from '../lib/store'

const CONTENT: Record<string, { title: string; updated: string; body: string[] }> = {
  hakkimizda: {
    title: 'Hakkımızda',
    updated: '1 Ekim 2026',
    body: [
      'Eğitim Haberleri, mesleki eğitimden okul öncesine, MEB gündeminden Çorum yerel haberlerine kadar eğitim ekosisteminin güncel gelişmelerini tek bir yerde toplayan bir haber platformudur.',
      'Sitedeki haberler, güvenilir kurumların ve yayıncıların kendi sitelerinden otomatik olarak derlenir. Her haberin başlığı ve özeti yeniden düzenlenir, haber metni kaynak sayfadan alınır ve haberin altında asıl kaynağa bağlantı verilir. Böylece okuyucu hızlı bir özetle birlikte doğrulayabileceği asıl kaynağa ulaşır.',
      'İçerikler her üç saatte bir yenilenir. Site reklamsızdır ve okuyucu verileri yalnızca hizmetin işletilmesi için, açık rıza çerçevesinde işlenir.',
    ],
  },
  kurumsal: {
    title: 'Kurumsal ve Editoryal Politika',
    updated: '21 Ekim 2026',
    body: [
      'Yayıncı: Eğitim Haberleri (OMERZEN). Eğitim gündemine odaklanan, Türkçe, bağımsız bir haber platformudur. Yayıncı kimliği ve iletişim bilgileri sitenin alt bilgisinde yer alır.',
      'Kaynaklar: haberler doğrudan kurumların ve yayıncıların kendi sitelerinden alınır. Başlıca kaynaklar arasında Milli Eğitim Bakanlığı ve il müdürlükleri, Anadolu Ajansı, Sözcü, Hürriyet, Cumhuriyet ve eğitim gündemini izleyen yerel ve ulusal yayıncılar yer alır.',
      'Derleme yöntemi: kaynak sitelerdeki haber dizinleri ve RSS beslemeleri düzenli aralıklarla taranır. Yalnızca eğitim gündemine giren, görseli bulunan ve okunabilir metni olan kayıtlar değerlendirmeye alınır. Aynı olayın farklı kaynaklardaki anlatımları tek başlık altında birleştirilir.',
      'Düzenleme: başlıklar ve özetler, kaynağın ifadesini koruyarak yeniden yazılır. Metinde yer alan sayı, tarih, kurum adı ve kişi adları kaynaktan alınır; doğrulanamayan bilgi eklenmez. Yayınlanan metin kaynak sayfadaki tam metinden alınır ve kısaltılmaz.',
      'Hata düzeltme: kaynak metinlerinde görülen hatalar kaynağa ait olur. Eğitim Haberleri kendi düzenlemesinden kaynaklanan hataları düzeltir; düzeltme talepleri site üzerinden iletilebilir.',
      'Yorumlar: yorum yazan okuyucu, yorumunun kendisine ait olduğunu kabul eder. Yorumlar saygılı dil ve doğrulanabilir bilgi çerçevesinde yayınlanır; kişisel veri ve hakaret içeren yorumlar yayınlanmaz.',
      'İletişim: haber kaynaklarıyla ilgili bildirimler, düzeltme talepleri ve her türlü geri bildirim site üzerinden iletilebilir.',
    ],
  },
  gizlilik: {
    title: 'Gizlilik Politikası',
    updated: '1 Ekim 2026',
    body: [
      'Bu politika, Eğitim Haberleri ("Site") üzerinde hangi kişisel verilerin hangi amaçlarla işlendiğini açıklar.',
      'Toplanan veriler: hesap oluşturduğunuzda ad-soyad ve e-posta bilgisi; hizmetin işletilmesi için cihaz ve tarayıcı bilgisi; okuma geçmişi, kaydetme ve beğeni kayıtları.',
      'İşleme amaçları: yorum ve etkileşim özelliklerinin çalıştırılması, kişiselleştirilmiş akışın oluşturulması, hizmet güvenliğinin sağlanması.',
      'Analitik: hangi sayfaların okunduğunu ölçmek için yalnızca sayfa adresi ve tarih tutulur. Çerez kullanılmaz, kimlik tutulmaz ve veriler toplu hâlde saklanır.',
      'Üçüncü taraf paylaşımı: verileriniz yalnızca veri işleme amacıyla hizmet sağlayıcılarıyla paylaşılır, satılmaz. Yasal zorunluluk hâlleri dışında üçüncü kişilerle paylaşılmaz.',
      'Haklarınız: KVKK kapsamında verilerinize erişme, düzeltilmesini veya silinmesini talep etme haklarına sahipsiniz. Taleplerinizi site üzerinden iletebilirsiniz.',
      'Saklama: hesabınız açık kaldığı sürece veriler işlenir; hesabınız silindiğinde veriler yasal saklama süreleri dışında hemen silinir.',
    ],
  },
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    updated: '1 Ekim 2026',
    body: [
      '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında, veri sorumlusu sıfatıyla Eğitim Haberleri tarafından aşağıdaki bilgilendirme yapılmaktadır.',
      'İşlenen kişisel veriler: ad-soyad, e-posta adresi, kullanıcı parolası (şifrelenmiş), oturum kayıtları, yorum ve beğeni kayıtları, okuma geçmişi.',
      'İşleme amaçları ve hukuki sebep: hesabın oluşturulması ve hizmetin sunulması, talep hâlinde sözleşmenin kurulması ve ifası, mevzuatta öngörülen yükümlülüklerin yerine getirilmesi.',
      'Aktarım: veriler, yurt içinde veya yurt dışındaki hizmet sağlayıcılara yalnızca veri işleme amacıyla aktarılabilir.',
      'Saklama süresi: veriler, işleme amacının ortadan kalkması ve yasal saklama süreleri dolduktan sonra silinir veya anonim hâle getirilir.',
      'İlgili kişinin hakları: kanunun 11. maddesi uyarınca verilerinize erişme, düzeltilmesini, silinmesini veya anonimleştirilmesini isteme haklarına sahipsiniz.',
      'Başvuru: taleplerinizi site üzerinden veya belirtilen iletişim adresine iletebilirsiniz. Başvurular en geç 30 gün içinde sonuçlandırılır.',
    ],
  },
  'kullanim-sartlari': {
    title: 'Kullanım Şartları',
    updated: '1 Ekim 2026',
    body: [
      'Siteyi kullanarak bu şartları kabul etmiş olursunuz.',
      'İçerikler bilgilendirme amaçlıdır; eğitim mevzuatı veya resmi duyuru yerine geçmez. Resmî işlemler için ilgili kurumların kendi sitelerini esas alın.',
      'Haberlerin kaynaklarına haber başlığında ve haber detayında bağlantı verilir. Kaynak içeriklerin telif hakları ilgili kuruluşlara aittir.',
      'Haber metinleri kaynak sitelerden alınır, kısaltılmaz; özetler kaynağın ifadesini koruyarak yeniden yazılır. Doğrulama için asıl kaynağa başvurmanız önerilir.',
      'Yorumlarda kişisel veri paylaşılmaması, saygılı bir dil kullanılması ve yasa dışı içerik paylaşılmaması esastır. Yorumlar önceden inceleme amacıyla yayınlanabilir.',
      'Site üzerinden yapılan otomatik veri kopyalama, yük yoğunluk oluşturma ve hizmeti aksatacak biçimde kullanım yasaktır.',
    ],
  },
  'cerez-politikasi': {
    title: 'Çerez Politikası',
    updated: '1 Ekim 2026',
    body: [
      'Çerezler, tarayıcınıza kaydedilen küçük metin dosyalarıdır. Sitede yalnızca hizmetin çalışması için gerekli çerezler ve rızanızla kullanılan anonim istatistik çerezleri yer alır.',
      'Zorunlu çerezler: tema tercihi, yazı tipi boyutu, dil seçimi, oturum durumu gibi ayarlar. Bunlar tarayıcınızın yerel deposunda tutulur ve kapatılamaz.',
      'İstatistik çerezleri: hangi sayfaların okunduğunu ve hizmetin nasıl kullanıldığını anonim olarak ölçmek için kullanılır. Bu ölçüm çerezsiz ve kimliksizdir.',
      'Çerez tercihinizi dilediğiniz zaman Ayarlar bölümünden veya tarayıcınızın ayarlarından değiştirebilirsiniz.',
    ],
  },
}

export function LegalPage() {
  const { slug } = useParams()
  const { t } = useTranslation()
  const key = slug ?? 'hakkimizda'
  const doc = CONTENT[key]

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-20">
      <nav className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pt-6">
        {Object.entries(CONTENT).map(([k, v]) => (
          <Link
            key={k}
            to={`/${k}`}
            className={
              k === key
                ? 'shrink-0 rounded-full bg-fg px-3.5 py-1.5 text-[0.75rem] font-semibold text-bg'
                : 'shrink-0 rounded-full border border-line px-3.5 py-1.5 text-[0.75rem] text-muted transition hover:bg-surface-2 hover:text-fg'
            }
          >
            {v.title}
          </Link>
        ))}
      </nav>

      {doc ? (
        <>
          <h1 className="text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">{doc.title}</h1>
          <p className="mt-1.5 text-[0.75rem] text-faint">Son güncelleme: {doc.updated}</p>
          <div className="mt-6 space-y-4">
            {doc.body.map((p, i) => (
              <p key={i} className="text-[0.875rem] leading-[1.85] text-fg/85">
                {p}
              </p>
            ))}
          </div>
        </>
      ) : (
        <p className="py-20 text-center text-sm text-muted">{t('news.notFound')}</p>
      )}

      <footer className="mt-12 border-t border-line pt-6">
        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 6).map((c) => (
            <Link
              key={c.slug}
              to={`/kategori/${c.slug}`}
              className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[0.75rem] text-muted transition hover:bg-surface-2 hover:text-fg"
            >
              <CategoryMark mark={c.mark} color={c.color} size={13} strokeWidth={1.8} />
              {c.name}
            </Link>
          ))}
        </div>
        <p className="mt-6 text-center text-[0.6875rem] text-faint">
          © 2026 Eğitim Haberleri · {t('legal.preparedBy')} <span className="font-semibold">OMERZEN</span> ·{' '}
          {t('legal.rights')}
        </p>
      </footer>
    </div>
  )
}

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-lg px-4 py-28 text-center">
      <p className="text-6xl font-black text-faint/30">404</p>
      <h1 className="mt-4 text-xl font-bold text-fg">{t('news.notFound')}</h1>
      <p className="mt-2 text-sm text-muted">{t('news.notFoundDesc')}</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-fg"
      >
        {t('nav.latest')}
      </Link>
    </div>
  )
}

export function LoginPage({ onOpen }: { onOpen: () => void }) {
  const { t } = useTranslation()
  const { signedIn } = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  // Giriş artık pop-up ile yapılıyor; bu sayfa yalnızca geri gelen bağlantıları
  // karşılar ve pencereyi açıp ana sayfaya döner.
  useEffect(() => {
    if (signedIn) {
      const next = params.get('next')
      navigate(next && next.startsWith('/') ? next : '/', { replace: true })
      return
    }
    // Dönüşte "?code=" varsa sayfadan ayrılma: kod değişimi tamamlanmadan
    // adres çubuğu temizlenirse oturum açılamaz.
    if (params.get('code')) return
    onOpen()
    const timer = setTimeout(() => navigate('/', { replace: true }), 50)
    return () => clearTimeout(timer)
  }, [signedIn, navigate, onOpen, params])

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-gradient-to-br from-accent to-primary text-white">
        <Icon name="User" size={26} />
      </span>
      <h1 className="mt-5 text-xl font-bold text-fg">{t('auth.title')}</h1>
      <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">{t('auth.subtitle')}</p>
      <button
        type="button"
        onClick={onOpen}
        className="mt-6 w-full rounded-full bg-fg px-5 py-3 text-sm font-semibold text-bg"
      >
        {t('nav.signIn')}
      </button>
    </div>
  )
}
