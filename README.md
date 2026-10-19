# Eğitim Haberleri

Mesleki eğitim, MESEM, MEB, Çorum eğitim gündemi ve eğitim haberleri için
yapay zekâ destekli haber platformu. **Hazırlayan: OMERZEN © 2026**

Haberler 20 farklı Google News sorgusundan otomatik toplanır, tekrar eden
kaynaklar kümelendirilir, ardından Gemini ile Türkçe özet, başlık, etiket ve
kategori üretilip veritabanına kaydedilir.

---

## Hızlı başlangıç

```bash
npm install
npm run dev          # site: http://localhost:5173
npm run collect      # güncel haberleri çek (gerçek Gemini çağrısı yapar)
```

`npm run collect` her çalıştırmada yeni haberleri `src/data/collected.json`
dosyasına ekler. Site bu dosyayı okur; dosya boşsa demo veriye düşer.

---

## Klasör yapısı

```
egitim-haberleri/
├─ src/                     React arayüzü (Vite + TypeScript + Tailwind)
│  ├─ components/           üst bar, kartlar, çekmece, asistan, yorumlar
│  ├─ pages/                ana sayfa, haber, kategori, arama, ayarlar, yasal
│  ├─ data/collected.json   ← toplayıcının ürettiği gerçek haberler
│  └─ lib/api.ts            veri katmanı (canlı API → toplama → demo sırası)
├─ worker/                  Cloudflare Worker (API + cron toplayıcı)
│  ├─ index.js              /api/* uç noktaları + zamanlanmış görev
│  ├─ src/collect.js        toplama hattı
│  ├─ src/rss.js            RSS ayrıştırıcı
│  ├─ src/classify.js       eğitim alaka filtresi, kategori, puanlama
│  ├─ src/gemini.js         çoklu anahtar rotasyonlu özetleme
│  ├─ src/store.js          D1 / JSON / bellek depoları
│  ├─ migrations/           D1 şeması
│  └─ wrangler.jsonc        30 dakikalık cron tanımı
```

---

## Yayına alma (tamamı ücretsiz)

### 1. Cloudflare hesabı

1. https://dash.cloudflare.com → ücretsiz hesap aç (kart gerekmez)
2. Workers & Pages → Create → D1 → `egitim-haberleri` adıyla veritabanı oluştur
3. Proje kimliğini `worker/wrangler.jsonc` içindeki `database_id` alanına yaz

### 2. Worker'ı kur

```bash
npm i -D wrangler
npx wrangler login
npm run dev:worker        # yerelde dene
npx wrangler d1 migrations apply egitim-haberleri --remote --config worker/wrangler.jsonc
```

Sırları tanımla (kod içine yazılmaz, Cloudflare'da saklanır):

```bash
npx wrangler secret put GEMINI_API_KEYS --config worker/wrangler.jsonc
npx wrangler secret put COLLECT_SECRET --config worker/wrangler.jsonc
npm run deploy:worker
```

Worker her **30 dakikada bir** otomatik çalışır, yeni haberleri toplar.
Elle tetiklemek için:

```bash
curl -X POST https://egitim-haberleri-api.<sizin-subdomain>.workers.dev/api/collect \
  -H "x-collect-secret: COLLECT_SECRET"
```

### 3. Siteyi yayına al

```bash
npm run build
npx wrangler pages deploy dist --project-name egitim-haberleri
```

Adres: `https://egitim-haberleri.pages.dev` (ücretsiz, kart gerekmez)

### 4. Siteyi canlı API'ye bağla

`dist` içine `.env.production` yerine, derlemeden önce:

```bash
# .env.production
VITE_API_URL=https://egitim-haberleri-api.<sizin-subdomain>.workers.dev
```

Sonra `npm run build` ve yeniden deploy et.

### 5. Google ile giriş (isteğe bağlı)

Supabase'de ücretsiz proje aç → Authentication → Google sağlayıcısını etkinleştir
(redirect URI: `https://<proje>.supabase.co/auth/v1/callback`). Anahtarları
`VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` ile ver. Kayıt/yorum özellikleri
bu aşamada demo hesapla çalışır.

---

## Alan adı

Ücretsiz seçenekler:

| Seçenek | Süre | Not |
|---|---|---|
| `egitimhaberleri.pages.dev` | hemen | Cloudflare'ın kendi adresi, kart gerekmez |
| DuckDNS (`egitimhaberleri.duckdns.org`) | hemen | Gerçek ".org" görünümü, DNS'i DuckDNS yönetir |
| `eu.org` | 1–4 hafta | Onay süreci uzun, süresiz ücretsiz |
| `is-a.dev` | hemen | Yalnızca geliştirme amaçlı |

`netlify.app` / `onrender.com` adreslerine gerek yok; proje Cloudflare'da
çalışıyor. Netlify/Render eklemek yalnızca yönlendirme (redirect) olurdu.

---

## Toplayıcı nasıl çalışır

1. **Kaynak** — İki tür kaynak birlikte okunur:
   - *Doğrudan beslemeler*: Anadolu Ajansı (eğitim + gündem), Sözcü (eğitim), Habertürk, Dünya, Ege Haber. Gerçek makale adresi verirler.
   - *Google News RSS*: 18 anahtar kelime sorgusu (Çorum, fen lisesi, Maarif Modeli, MESEM…) — kapsamı genişletir, anahtar gerektirmez.
2. **Alaka filtresi** — eğitimle ilgisi olmayan içerik (trafik kazası, spor, ekonomi) elenir; puanlanır: kategori sinyalleri, Çorum ağırlığı, tazelik, kaynak güvenilirliği.
3. **Tekrar temizliği** — benzer başlıklar Jaccard benzerliğiyle kümelenir, aynı haberin farklı kaynaklardaki kopyaları tek kayda indirgenir.
4. **Görsel ve tam metin** — her haberin sayfası açılır, `og:image` indirilip `public/img/` altına kaydedilir, gövde metni çıkarılır. Doğrudan kaynaklarda tam metin, Google News'te özet kullanılır.
5. **Gemini** — tek istekte 18 haber işlenir: Türkçe başlık, 2 cümlelik özet, etiketler, kategori, il. Üç anahtar sırayla denenir; 429/5xx alınca diğerine geçilir.
6. **Kayıt** — 5 puan ve üzeri otomatik yayına geçer, altı yönetim onayına bekler.

`worker/.env` içindeki anahtarlar yalnızca toplayıcıda kullanılır; arayüze sızmaz. Üretimde aynı değerler Cloudflare Secrets'a girilir.

## Google girişi

`src/lib/auth.ts` Supabase Auth PKCE akışını SDK kullanmadan uygular. Şu ortam değişkenleri tanımlandığında giriş düğmesi kendiliğinden çalışır:

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Tanımlı değilken arayüz dürüstçe bu durumu söyler ve yalnızca demo hesabı sunar. Yorum yazmak için giriş zorunludur.

---

## Özellikler

Arayüz: koyu/açık tema, yazı boyutu ölçekleme, TR/EN dil desteği, kategori
şeridi ve dairesel kategori çubuğu, akış modları (Güncel / Seçilmiş / Takip /
Sana Özel), okunanları gizleme, arama, etiket ve il sayfaları, kaydetme ve
beğeni, yorumlar ve yanıtlar, haber detayında sesli özet (tarayıcı TTS),
kaynak bağlantısı, benzer haberler, PWA manifesti, KVKK/gizlilik/çerez
sayfaları, mobil uyumlu çekmece menü.

Toplayıcı: RSS → alaka filtresi → tekrar kümeleme → Gemini → D1, 30 dakikalık
cron ve site açılışında arka plan tazeleme.
