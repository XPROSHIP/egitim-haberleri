/* ==========================================================================
   STAJ DOSYASI EVRAKLARI - SAYFA ŞABLONLARI (BÖLÜM 1: SAYFA 1 - 10)
   1. Dış Kapak (Çorum MESEM Vektörel Okul Logolu)
   2. İç Kapak (İME-DOSYA/1) | 3. Öğrenci Tanıtma Kartı (FORM 5)
   4-10. İşletmelerde Mesleki Eğitim / Staj Sözleşmesi (Tam Metin Madde 1-26 & Onay)
   ========================================================================== */

window.ORNAMENT_SVG = `
<div class="frame-ornaments" aria-hidden="true">
  <svg class="ornament-corner tl" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M2 62 V14 C2 7 7 2 14 2 H62" stroke-width="2.5"/>
    <path d="M8 54 V18 C8 12.5 12.5 8 18 8 H54" stroke-width="1.2"/>
    <circle cx="16" cy="16" r="4" fill="currentColor"/>
    <path d="M2 26 C14 26 26 14 26 2" stroke-width="1.5"/>
    <path d="M16 32 C24 32 32 24 32 16" stroke-width="1.2"/>
    <polygon points="6,6 12,6 6,12" fill="currentColor"/>
  </svg>
  <svg class="ornament-corner tr" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M2 62 V14 C2 7 7 2 14 2 H62" stroke-width="2.5"/>
    <path d="M8 54 V18 C8 12.5 12.5 8 18 8 H54" stroke-width="1.2"/>
    <circle cx="16" cy="16" r="4" fill="currentColor"/>
    <path d="M2 26 C14 26 26 14 26 2" stroke-width="1.5"/>
    <path d="M16 32 C24 32 32 24 32 16" stroke-width="1.2"/>
    <polygon points="6,6 12,6 6,12" fill="currentColor"/>
  </svg>
  <svg class="ornament-corner bl" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M2 62 V14 C2 7 7 2 14 2 H62" stroke-width="2.5"/>
    <path d="M8 54 V18 C8 12.5 12.5 8 18 8 H54" stroke-width="1.2"/>
    <circle cx="16" cy="16" r="4" fill="currentColor"/>
    <path d="M2 26 C14 26 26 14 26 2" stroke-width="1.5"/>
    <path d="M16 32 C24 32 32 24 32 16" stroke-width="1.2"/>
    <polygon points="6,6 12,6 6,12" fill="currentColor"/>
  </svg>
  <svg class="ornament-corner br" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M2 62 V14 C2 7 7 2 14 2 H62" stroke-width="2.5"/>
    <path d="M8 54 V18 C8 12.5 12.5 8 18 8 H54" stroke-width="1.2"/>
    <circle cx="16" cy="16" r="4" fill="currentColor"/>
    <path d="M2 26 C14 26 26 14 26 2" stroke-width="1.5"/>
    <path d="M16 32 C24 32 32 24 32 16" stroke-width="1.2"/>
    <polygon points="6,6 12,6 6,12" fill="currentColor"/>
  </svg>
  <svg class="ornament-mid-top" viewBox="0 0 160 20" fill="none" stroke="currentColor">
    <path d="M0 10 H55 L70 3 L80 17 L90 3 L105 10 H160" stroke-width="1.5"/>
    <circle cx="80" cy="10" r="3.5" fill="currentColor"/>
  </svg>
  <svg class="ornament-mid-bottom" viewBox="0 0 160 20" fill="none" stroke="currentColor">
    <path d="M0 10 H55 L70 3 L80 17 L90 3 L105 10 H160" stroke-width="1.5"/>
    <circle cx="80" cy="10" r="3.5" fill="currentColor"/>
  </svg>
</div>
`;

/* logo.html'den alınan Çorum MESEM Vektörel Okul Logosu (Büyük 2 Renkli Saat Kuleli Amblem) */
window.MEB_EMBLEM_SVG = `
<div class="cover-logo-wrap">
  <svg class="mesem-logo-svg" width="155" height="110" viewBox="105 15 790 555" xmlns="http://www.w3.org/2000/svg" aria-label="Çorum MESEM Okul Logosu">
    <!-- Sol Turuncu Çark -->
    <path class="orange" d="M 452.0 155.4 L 452.0 109.1 A 228 228 0 0 0 431.4 114.6 L 411.6 81.1 L 372.7 98.5 L 384.3 135.6 A 228 228 0 0 0 348.9 161.2 L 317.2 138.7 L 288.7 170.4 L 314.4 199.6 A 228 228 0 0 0 292.5 237.4 L 254.4 229.8 L 241.2 270.4 L 276.6 286.5 A 228 228 0 0 0 272.0 330.0 L 234.1 338.5 L 238.5 380.9 L 277.4 381.3 A 228 228 0 0 0 290.9 422.9 L 277.0 420.0 L 280.0 428.0 L 345.5 430.0 A 183 183 0 0 1 452.0 155.4 Z" />
    <!-- Sağ Lacivert Çark -->
    <path class="navy" d="M 548.0 155.4 L 548.0 109.1 A 228 228 0 0 1 568.6 114.6 L 588.4 81.1 L 627.3 98.5 L 615.7 135.6 A 228 228 0 0 1 651.1 161.2 L 682.8 138.7 L 711.3 170.4 L 685.6 199.6 A 228 228 0 0 1 707.5 237.4 L 745.6 229.8 L 758.8 270.4 L 723.4 286.5 A 228 228 0 0 1 728.0 330.0 L 765.9 338.5 L 761.5 380.9 L 722.6 381.3 A 228 228 0 0 1 709.1 422.9 L 723.0 420.0 L 720.0 428.0 L 654.5 430.0 A 183 183 0 0 0 548.0 155.4 Z" />
    <!-- Sol Turuncu İç Yay -->
    <path class="orange" d="M 452.0 176.2 A 163 163 0 0 0 371.3 432.0 L 417.7 439.0 A 135 135 0 0 1 452.0 205.8 Z" />
    <!-- Sağ Lacivert İç Yay -->
    <path class="navy" d="M 548.0 176.2 A 163 163 0 0 1 628.7 432.0 L 582.3 439.0 A 135 135 0 0 0 548.0 205.8 Z" />
    <!-- Sol Turuncu Kanat (3 tüy) -->
    <path class="orange" d="M 222 392 C 185 386, 150 366, 118 338 C 148 348, 186 364, 224 377 Z" />
    <path class="orange" d="M 215 411 C 182 407, 154 392, 130 371 C 156 378, 186 390, 217 398 Z" />
    <path class="orange" d="M 206 427 C 180 425, 160 416, 144 401 C 164 406, 185 413, 208 417 Z" />
    <!-- Sağ Turuncu Kanat (3 tüy) -->
    <path class="orange" d="M 778 392 C 815 386, 850 366, 882 338 C 852 348, 814 364, 776 377 Z" />
    <path class="orange" d="M 785 411 C 818 407, 846 392, 870 371 C 844 378, 814 390, 783 398 Z" />
    <path class="orange" d="M 794 427 C 820 425, 840 416, 856 401 C 836 406, 815 413, 792 417 Z" />
    <!-- Merkez Saat Kulesi -->
    <path class="navy" fill-rule="evenodd" d="
      M 500 25 L 498 55 L 494.5 57.5 L 494.5 60.5
      C 478 67, 470 81, 468 95
      L 466 95 L 466 158 L 460 158 L 460 170
      L 469 170 L 465 308 L 453 308 L 453 324
      L 461 324 L 456 498
      L 483 498 L 483 392 A 17 17 0 0 1 517 392 L 517 498
      L 544 498 L 539 324 L 547 324 L 547 308
      L 535 308 L 531 170 L 540 170 L 540 158
      L 534 158 L 534 95 L 532 95
      C 530 81, 522 67, 505.5 60.5 L 505.5 57.5 L 502 55 Z
      M 520 126 A 20 20 0 1 0 480 126 A 20 20 0 1 0 520 126 Z
      M 489 266 L 489 209 A 11 11 0 0 1 511 209 L 511 266 Z
    " />
    <!-- Saat Akrep & Yelkovan -->
    <circle class="navy" cx="500" cy="126" r="3" />
    <path class="navy-stroke" stroke-width="3.6" stroke-linecap="round" d="M 494.2 115.2 L 500 126" />
    <path class="navy-stroke" stroke-width="3.1" stroke-linecap="round" d="M 500 126 L 510.8 135.2" />
    <!-- Açık Kitap -->
    <path class="navy" d="M 444 466 C 380 444, 290 436, 186 452 L 196 476 C 290 456, 380 464, 444 480 Z" />
    <path class="navy" d="M 556 466 C 620 444, 710 436, 814 452 L 804 476 C 710 456, 620 464, 556 480 Z" />
    <path class="navy" d="M 444 489 C 375 470, 290 468, 201 486 L 207 498 C 290 480, 375 482, 444 501 Z" />
    <path class="navy" d="M 556 489 C 625 470, 710 468, 799 486 L 793 498 C 710 480, 625 482, 556 501 Z" />
    <path class="navy" d="M 213 508 C 300 491, 390 495, 500 522 C 610 495, 700 491, 787 508 L 781 519 C 700 502, 610 506, 500 532 C 390 506, 300 502, 219 519 Z" />
    <path class="navy" d="M 204 526 L 474 538 L 500 543 L 526 538 L 796 526 A 7 7 0 0 1 796 540 L 528 550 C 516 565, 484 565, 472 550 L 204 540 A 7 7 0 0 1 204 526 Z" />
  </svg>
</div>
`;

function renderIbanBoxes() {
  let html = `<div class="iban-grid">`;
  for (let i = 0; i < 26; i++) {
    const ch = i === 0 ? "T" : i === 1 ? "R" : "";
    html += `<div class="iban-box" contenteditable="true">${ch}</div>`;
  }
  html += `</div>`;
  return html;
}

window.DOC_PAGES_PART1 = [
  /* ========================================================================
     SAYFA 1: DIŞ KAPAK (Çorum Mesleki Eğitim Merkezi Staj Dosyası Kapağı)
     ======================================================================== */
  {
    id: "kapak-dis",
    docGroup: "kapak",
    docTitle: "1. Staj Dosyası Dış Kapağı",
    pageNumber: 1,
    html: `
      <div class="cover-hero">
        ${window.MEB_EMBLEM_SVG}
        <div class="doc-ministry" contenteditable="true">T.C. MİLLÎ EĞİTİM BAKANLIĞI • ÇORUM VALİLİĞİ</div>
        <div class="cover-main-title" contenteditable="true">ÇORUM MESLEKİ EĞİTİM MERKEZİ</div>
        <div class="cover-sub-title" contenteditable="true">STAJ UYGULAMASI • ÖĞRENCİ İŞ DOSYASI</div>
        <div class="cover-year-badge" data-bind="egitimYili" contenteditable="true">2026 / 2027 EĞİTİM ÖĞRETİM YILI</div>
      </div>

      <div style="display:flex; flex-direction:column; gap:10px; flex:1; justify-content:space-evenly; margin: 8px 0;">
        <div>
          <div class="section-bar"><span>ÖĞRENCİNİN BİLGİLERİ</span><span>BÖLÜM I</span></div>
          <table class="doc-table">
            <tbody>
              <tr>
                <td class="field-label">Adı - Soyadı</td>
                <td class="field-value" data-bind="ogrenciAdSoyad" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">Alanı / Bölümü</td>
                <td class="field-value" data-bind="alanDal" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">Sınıfı / Okul Numarası</td>
                <td class="field-value" data-bind="okulNo" contenteditable="true"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <div class="section-bar"><span>İŞLETMENİN BİLGİLERİ</span><span>BÖLÜM II</span></div>
          <table class="doc-table">
            <tbody>
              <tr>
                <td class="field-label">İşletmenin Adı</td>
                <td class="field-value" data-bind="isletmeAdi" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">İşletmenin Adresi</td>
                <td class="field-value" data-bind="isletmeAdres" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">Telefon / İletişim</td>
                <td class="field-value" data-bind="isletmeTel" contenteditable="true"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
          <div>
            <div class="section-bar"><span>USTA ÖĞRETİCİ / EĞİTİCİ PERSONEL</span></div>
            <table class="doc-table">
              <tbody>
                <tr>
                  <td class="field-label" style="width:38%;">Adı - Soyadı</td>
                  <td class="field-value" data-bind="ustaAdSoyad" contenteditable="true"></td>
                </tr>
                <tr>
                  <td class="field-label">Unvanı / İmza</td>
                  <td class="field-value" style="height:34px;" contenteditable="true"></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <div class="section-bar"><span>KOORDİNATÖR ÖĞRETMEN</span></div>
            <table class="doc-table">
              <tbody>
                <tr>
                  <td class="field-label" style="width:38%;">Adı - Soyadı</td>
                  <td class="field-value" data-bind="koordinatorAdSoyad" contenteditable="true"></td>
                </tr>
                <tr>
                  <td class="field-label">Branşı / İmza</td>
                  <td class="field-value" style="height:34px;" contenteditable="true"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style="background:var(--doc-accent-soft); border:1.5px solid var(--doc-primary); border-radius:8px; padding:11px 14px;">
          <div style="font-family:var(--font-heading); font-weight:800; font-size:12px; color:var(--doc-primary); text-align:center; margin-bottom:5px; border-bottom:1px solid var(--doc-accent-mid); padding-bottom:4px;">
            AÇIKLAMALAR VE YÖNETMELİK ESASLARI
          </div>
          <ol style="padding-left:18px; font-size:11px; line-height:1.48; color:var(--doc-text);">
            <li contenteditable="true">İşletme tarafından her öğrenciye iş dosyası tutturulur.</li>
            <li contenteditable="true">Bu dosyaya öğrenciye yaptırılan iş, proje, deney ve hizmetle ilgili; resimler, projeler ve değerlendirme çizelgeleri konulur.</li>
            <li contenteditable="true">Dosyadaki her resim, projede değerlendirme çizelgesi <strong>Usta Öğretici / Öğrenci</strong> tarafından imzalanır.</li>
            <li contenteditable="true">Dosya, <strong>Yıl Sonu Beceri Sınavı</strong> sırasında sınav komisyonu üyelerine ibraz edilir.</li>
            <li contenteditable="true">Yıl sonu beceri sınavı başarı puanının hesaplanmasında, 100 puan üzerinden iş dosyasının ağırlığı <strong>%20</strong>'dir.</li>
          </ol>
        </div>
      </div>

      <div class="doc-footer">
        <span>Çorum Mesleki Eğitim Merkezi - Staj Dosyası</span>
        <span>Bölüm 1 • Dış Kapak</span>
        <span>Sayfa 1 / 20</span>
      </div>
    `
  },

  /* ========================================================================
     SAYFA 2: İÇ KAPAK (İME-DOSYA/1 - OGRENCI ISDOSYASI.pdf)
     ======================================================================== */
  {
    id: "kapak-ic",
    docGroup: "kapak-ic",
    docTitle: "2. Öğrenci İş Dosyası İç Kapağı (İME-DOSYA/1)",
    pageNumber: 2,
    html: `
      <div class="doc-header">
        <span class="doc-code-badge" contenteditable="true">İME-DOSYA/1</span>
        <div class="doc-ministry" contenteditable="true">T.C. MİLLÎ EĞİTİM BAKANLIĞI • MESLEKİ VE TEKNİK EĞİTİM GENEL MÜDÜRLÜĞÜ</div>
        <div class="doc-title" contenteditable="true">İŞLETMELERDE MESLEK EĞİTİMİ<br>ÖĞRENCİ İŞ DOSYASI</div>
        <div class="doc-subtitle" data-bind="egitimYili" contenteditable="true">2026-2027 ÖĞRETİM YILI</div>
      </div>

      <div style="display:flex; flex-direction:column; justify-content:space-between; flex:1; gap:10px; margin: 6px 0;">
        <div>
          <div class="section-bar"><span>ÖĞRENCİNİN KİMLİK VE OKUL BİLGİLERİ</span><span>İME-DOSYA/1</span></div>
          <table class="doc-table">
            <tbody>
              <tr>
                <td class="field-label">ADI SOYADI</td>
                <td class="field-value" data-bind="ogrenciAdSoyad" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">OKUL / KURUMU</td>
                <td class="field-value" data-bind="okulAdi" contenteditable="true">Çorum Mesleki Eğitim Merkezi Müdürlüğü</td>
              </tr>
              <tr>
                <td class="field-label">NUMARASI</td>
                <td class="field-value" data-bind="okulNo" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">SINIFI / ŞUBESİ</td>
                <td class="field-value" data-bind="sinifSube" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">ALAN / DALI</td>
                <td class="field-value" data-bind="alanDal" contenteditable="true"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <div class="section-bar"><span>İŞLETMENİN BİLGİLERİ</span></div>
          <table class="doc-table">
            <tbody>
              <tr>
                <td class="field-label">ADI</td>
                <td class="field-value" data-bind="isletmeAdi" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">ADRESİ</td>
                <td class="field-value" style="height:44px;" data-bind="isletmeAdres" contenteditable="true"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <div class="section-bar"><span>USTA ÖĞRETİCİNİN / EĞİTİM PERSONELİNİN</span></div>
          <table class="doc-table">
            <tbody>
              <tr>
                <td class="field-label">ADI SOYADI</td>
                <td class="field-value" data-bind="ustaAdSoyad" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">GÖREVİ / UNVANI VE İMZASI</td>
                <td class="field-value" style="height:38px;" contenteditable="true"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <div class="section-bar"><span>KOORDİNATÖR ÖĞRETMENİN</span></div>
          <table class="doc-table">
            <tbody>
              <tr>
                <td class="field-label">ADI SOYADI</td>
                <td class="field-value" data-bind="koordinatorAdSoyad" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">ALAN / BRANŞI VE İMZASI</td>
                <td class="field-value" style="height:38px;" contenteditable="true"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="background:var(--doc-accent-soft); border:1.5px solid var(--doc-primary); border-radius:8px; padding:12px 14px;">
          <div style="font-family:var(--font-heading); font-weight:800; font-size:12px; color:var(--doc-primary); margin-bottom:6px; text-decoration:underline;">
            AÇIKLAMALAR
          </div>
          <ol style="padding-left:18px; font-size:11px; line-height:1.5; color:var(--doc-text);">
            <li contenteditable="true">İşletme tarafından her öğrenciye iş dosyası tutturulur.</li>
            <li contenteditable="true">Bu dosyaya, öğrenciye yaptırılan temrin, iş, proje, deney ve hizmetlerle ilgili; resimler, projeler ve değerlendirme çizelgeleri konulur. <strong>(Orta Öğretim Yönetmeliği, madde 124/1)</strong></li>
            <li contenteditable="true">Dosyadaki her resim, proje veya değerlendirme çizelgesi, <strong>USTA ÖĞRETİCİ - EĞİTİCİ PERSONEL</strong> ve <strong>ÖĞRENCİ</strong> tarafından imzalanır.</li>
            <li contenteditable="true">Dosya, yıl sonu beceri sınavı sırasında sınav komisyonu üyelerine ibraz edilir.</li>
            <li contenteditable="true">Yıl sonu beceri sınavı başarı puanının hesaplanmasında, iş dosyasının ağırlığı 100 puan üzerinden <strong>%20</strong>'dir. <strong>(Orta Öğretim Yönetmeliği, madde 46/5)</strong></li>
          </ol>
        </div>

        <div class="sig-grid" style="grid-template-columns: repeat(3, 1fr);">
          <div class="sig-box">
            <div class="sig-title">ÖĞRENCİNİN</div>
            <div>Adı Soyadı / İmza</div>
            <div class="sig-stamp">....../....../202...</div>
          </div>
          <div class="sig-box">
            <div class="sig-title">USTA ÖĞRETİCİNİN</div>
            <div>Adı Soyadı / İmza</div>
            <div class="sig-stamp">....../....../202...</div>
          </div>
          <div class="sig-box">
            <div class="sig-title">OKUL MÜDÜRLÜĞÜ ONAYI</div>
            <div>Koordinatör Md. Yrd.</div>
            <div class="sig-stamp">İmza / Mühür</div>
          </div>
        </div>
      </div>

      <div class="doc-footer">
        <span>İME-DOSYA/1 • Öğrenci İş Dosyası İç Kapağı</span>
        <span>Ortaöğretim Yönetmeliği Md. 124/1 & 46/5</span>
        <span>Sayfa 2 / 20</span>
      </div>
    `
  },

  /* ========================================================================
     SAYFA 3: ÖĞRENCİ TANITMA KARTI (FORM 5 - Ogrenci Tanitim Karti.pdf)
     ======================================================================== */
  {
    id: "tanitma-karti",
    docGroup: "tanitma",
    docTitle: "3. Öğrenci Tanıtma Kartı (FORM 5)",
    pageNumber: 3,
    html: `
      <div style="display:flex; gap:12px; align-items:stretch; border-bottom:2px solid var(--doc-primary); padding-bottom:8px;">
        <div style="flex:1; display:flex; flex-direction:column; justify-content:center; text-align:center; position:relative;">
          <span class="doc-code-badge" style="left:0; right:auto;" contenteditable="true">FORM 5</span>
          <div class="doc-ministry" contenteditable="true">T.C. ÇORUM MESLEKİ EĞİTİM MERKEZİ MÜDÜRLÜĞÜ</div>
          <div class="doc-title" style="font-size:15.5px; margin-top:6px;" contenteditable="true">
            3308 SAYILI KANUNA GÖRE İŞLETMELERDE MESLEK EĞİTİMİ<br>GÖREN ÖĞRENCİLER İÇİN TANITMA KARTI
          </div>
          <div class="doc-subtitle" contenteditable="true">ÖĞRENCİ KİMLİK, NÜFUS VE İŞLETME TESCİL FORMU</div>
        </div>
        <div class="photo-box" contenteditable="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="margin-bottom:4px;">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7 21v-2a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v2"/>
          </svg>
          FOTOĞRAF<br><span style="font-size:9px; font-weight:500;">(Son 6 Ay İçinde Çekilmiş Vesikalık)</span>
        </div>
      </div>

      <div style="flex:1; display:flex; flex-direction:column; justify-content:space-between; margin: 6px 0;">
        <table class="doc-table" style="flex:1;">
          <thead>
            <tr>
              <th colspan="2" style="width:50%;">ÖĞRENCİ VE VELİ BİLGİLERİ</th>
              <th colspan="2" style="width:50%;">NÜFUSA KAYITLI OLDUĞU YER VE İŞLETME BİLGİLERİ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th style="width:21%;">ADI SOYADI</th>
              <td style="width:29%;" data-bind="ogrenciAdSoyad" contenteditable="true"></td>
              <th style="width:22%;">İL</th>
              <td style="width:28%;" contenteditable="true"></td>
            </tr>
            <tr>
              <th>ALANI / DALI</th>
              <td data-bind="alanDal" contenteditable="true"></td>
              <th>İLÇE</th>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <th>SINIF / ŞUBESİ</th>
              <td data-bind="sinifSube" contenteditable="true"></td>
              <th>MAHALLE / KÖY</th>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <th>OKUL NO</th>
              <td data-bind="okulNo" contenteditable="true"></td>
              <th>CİLT NO</th>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <th>T.C. KİMLİK NO</th>
              <td data-bind="tcKimlik" contenteditable="true"></td>
              <th>SIRA NO</th>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <th>BABA ADI</th>
              <td data-bind="babaAdi" contenteditable="true"></td>
              <th>AİLE SIRA NO</th>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <th>ANA ADI</th>
              <td data-bind="anaAdi" contenteditable="true"></td>
              <th>CÜZDAN KAYIT NO</th>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <th>DOĞUM YERİ / TARİHİ</th>
              <td data-bind="dogumYeriTarihi" contenteditable="true"></td>
              <th>VERİLDİĞİ YER</th>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <th>KAN GRUBU</th>
              <td contenteditable="true"></td>
              <th>N. KAYITLI OLDUĞU YER</th>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <th rowspan="2">İKAMETGAH ADRESİ</th>
              <td rowspan="2" data-bind="ogrenciAdres" contenteditable="true"></td>
              <th>CÜZDAN SERİ NO</th>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <th>VERİLİŞ TARİHİ</th>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <th>ÖĞRENCİ İMZASI</th>
              <td style="height:32px;" contenteditable="true"></td>
              <th>İŞLETME ADI</th>
              <td data-bind="isletmeAdi" contenteditable="true"></td>
            </tr>
            <tr>
              <th>VELİ ADI SOYADI</th>
              <td data-bind="veliAdSoyad" contenteditable="true"></td>
              <th>İŞLETME ADRES / TEL</th>
              <td data-bind="isletmeAdres" contenteditable="true"></td>
            </tr>
            <tr>
              <th>VELİ ADRESİ</th>
              <td data-bind="veliAdres" contenteditable="true"></td>
              <th>İŞLETME TELEFON</th>
              <td data-bind="isletmeTel" contenteditable="true"></td>
            </tr>
            <tr>
              <th>VELİ TELEFON</th>
              <td data-bind="veliTel" contenteditable="true"></td>
              <th>EĞİTİME BAŞLAMA TARİHİ</th>
              <td data-bind="baslamaTarihi" contenteditable="true"></td>
            </tr>
            <tr>
              <td colspan="2" rowspan="2" style="vertical-align:top; padding:8px;">
                <div style="font-family:var(--font-heading); font-weight:800; color:var(--doc-primary); margin-bottom:4px;">AÇIKLAMALAR :</div>
                <div style="min-height:110px; font-size:10.5px; color:var(--doc-muted);" contenteditable="true"></div>
              </td>
              <th>SGK SİCİL / GİRİŞ NO</th>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <td colspan="2" style="text-align:center; padding:14px 10px; background:var(--doc-accent-soft);">
                <div style="font-family:var(--font-heading); font-weight:800; font-size:12px; color:var(--doc-primary); margin-bottom:8px;">
                  KAYITLARIMIZA UYGUNDUR
                </div>
                <div style="font-weight:700; margin-bottom:24px;" contenteditable="true">..... / ..... / 202...</div>
                <div style="font-family:var(--font-heading); font-weight:800; color:var(--doc-secondary);">
                  Koordinatör Müdür Yardımcısı
                </div>
                <div style="font-size:10px; color:var(--doc-muted); margin-top:4px;">Adı Soyadı / İmza / Mühür</div>
              </td>
            </tr>
          </tbody>
        </table>

        <div style="background:var(--doc-accent-mid); border-left:4px solid var(--doc-primary); border-radius:4px; padding:6px 10px; font-size:10.5px; font-weight:700; color:var(--doc-primary); margin-top:6px;">
          AÇIKLAMA: Bu form, öğrenci tarafından eksiksiz olarak doldurulacak ve iş dosyasında muhafaza edilecektir.
        </div>
      </div>

      <div class="doc-footer">
        <span>FORM 5 • 3308 Sayılı Kanun Öğrenci Tanıtma Kartı</span>
        <span>Çorum Mesleki Eğitim Merkezi</span>
        <span>Sayfa 3 / 20</span>
      </div>
    `
  },

  /* ========================================================================
     SAYFA 4: STAJ SÖZLEŞMESİ - SAYFA 1/7 (Taraf Bilgileri & IBAN & İlk Onay)
     ======================================================================== */
  {
    id: "sozlesme-1",
    docGroup: "sozlesme",
    docTitle: "4. Staj Sözleşmesi (Sayfa 1 - Taraf Bilgileri)",
    pageNumber: 4,
    html: `
      <div class="doc-header" style="padding-bottom:5px; margin-bottom:4px;">
        <span class="doc-code-badge" contenteditable="true">SÖZLEŞME • S.1</span>
        <div class="doc-ministry" contenteditable="true">T.C. MİLLÎ EĞİTİM BAKANLIĞI</div>
        <div class="doc-title" style="font-size:15px;" contenteditable="true">İŞLETMELERDE MESLEKİ EĞİTİM / STAJ SÖZLEŞMESİ</div>
      </div>

      <div style="flex:1; display:flex; flex-direction:column; justify-content:space-between; gap:4px;">
        <!-- ÖĞRENCİNİN BİLGİLERİ -->
        <div>
          <div class="section-bar" style="padding:3px 8px; font-size:10.5px;"><span>ÖĞRENCİNİN BİLGİLERİ</span></div>
          <table class="doc-table" style="font-size:10.2px;">
            <tbody>
              <tr>
                <th style="width:20%;">Adı Soyadı</th>
                <td style="width:30%;" data-bind="ogrenciAdSoyad" contenteditable="true"></td>
                <th style="width:22%;">Kayıtlı Olduğu Okul Adı</th>
                <td style="width:28%;" data-bind="okulAdi" contenteditable="true">Çorum Mesleki Eğitim Merkezi</td>
              </tr>
              <tr>
                <th>T.C. Kimlik No</th>
                <td data-bind="tcKimlik" contenteditable="true"></td>
                <th>Okul Numarası</th>
                <td data-bind="okulNo" contenteditable="true"></td>
              </tr>
              <tr>
                <th>Baba Adı</th>
                <td data-bind="babaAdi" contenteditable="true"></td>
                <th>Sınıfı / Şubesi</th>
                <td data-bind="sinifSube" contenteditable="true"></td>
              </tr>
              <tr>
                <th>Ana Adı</th>
                <td data-bind="anaAdi" contenteditable="true"></td>
                <th>Alanı / Dalı</th>
                <td data-bind="alanDal" contenteditable="true"></td>
              </tr>
              <tr>
                <th>Doğum Yeri</th>
                <td data-bind="dogumYeri" contenteditable="true"></td>
                <th>Telefonu</th>
                <td data-bind="ogrenciTel" contenteditable="true"></td>
              </tr>
              <tr>
                <th>Doğum Tarihi (G/A/Y)</th>
                <td data-bind="dogumTarihi" contenteditable="true"></td>
                <th style="font-size:9px; line-height:1.15;">İşletmelerde Mesleki Eğitim / Tamamlayıcı Eğitim / Staja Başlama Tarihi</th>
                <td data-bind="baslamaTarihi" contenteditable="true"></td>
              </tr>
              <tr>
                <th>ÖĞRENCİ İBAN NO:</th>
                <td colspan="3" style="padding:3px 5px;">${renderIbanBoxes()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- KOORDİNATÖR MÜDÜR YARDIMCISI -->
        <div>
          <div class="section-bar" style="padding:3px 8px; font-size:10.5px;"><span>OKUL/KURUMDA İRTİBAT SAĞLANACAK KOORDİNATÖR MÜDÜR YARDIMCISININ</span></div>
          <table class="doc-table" style="font-size:10.2px;">
            <tbody>
              <tr>
                <th style="width:20%;">Adı Soyadı</th>
                <td style="width:30%;" contenteditable="true"></td>
                <th style="width:15%;">İş Telefonu:</th>
                <td style="width:35%;" contenteditable="true"></td>
              </tr>
              <tr>
                <th>Görev Unvanı</th>
                <td contenteditable="true">Koordinatör Müdür Yardımcısı</td>
                <th>Cep Telefonu:</th>
                <td contenteditable="true"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- VELİ VE 18 YAŞ ÜSTÜ İRTİBAT -->
        <table class="doc-table" style="font-size:10.2px;">
          <thead>
            <tr>
              <th colspan="2" style="width:50%;">ÖĞRENCİ VELİSİNİN / YASAL TEMSİLCİSİNİN</th>
              <th colspan="2" style="width:50%; font-size:9.5px;">ÖĞRENCİNİN 18 YAŞINDAN BÜYÜK OLMASI HALİNDE İRTİBAT SAĞLANACAK KİŞİNİN</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th style="width:18%;">Adı Soyadı</th>
              <td style="width:32%;" data-bind="veliAdSoyad" contenteditable="true"></td>
              <th style="width:18%;">Adı Soyadı</th>
              <td style="width:32%;" contenteditable="true"></td>
            </tr>
            <tr>
              <th>Yakınlığı</th>
              <td contenteditable="true">☐ Anne &nbsp; ☐ Baba &nbsp; ☑ Diğer (Belirtiniz)</td>
              <th style="font-size:9px;">Yakınlığı (Öncelikle 1. derece yakını)</th>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <th>Adresi</th>
              <td data-bind="veliAdres" contenteditable="true"></td>
              <th>Adresi</th>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <th>Telefon No.</th>
              <td data-bind="veliTel" contenteditable="true"></td>
              <th>Telefon No.</th>
              <td contenteditable="true"></td>
            </tr>
            <tr>
              <th>E-Posta Adresi</th>
              <td contenteditable="true"></td>
              <th>E-Posta Adresi</th>
              <td contenteditable="true"></td>
            </tr>
          </tbody>
        </table>

        <!-- İŞLETMENİN BİLGİLERİ -->
        <div>
          <div class="section-bar" style="padding:3px 8px; font-size:10.5px;"><span>İŞLETMENİN BİLGİLERİ</span></div>
          <table class="doc-table" style="font-size:10.2px;">
            <tbody>
              <tr>
                <th style="width:22%;">İşletmenin Adı</th>
                <td colspan="3" data-bind="isletmeAdi" contenteditable="true"></td>
              </tr>
              <tr>
                <th rowspan="2">Adresi</th>
                <td rowspan="2" style="width:28%;" data-bind="isletmeAdres" contenteditable="true"></td>
                <th style="width:24%;">İşletme Temsilcisinin Adı Soyadı</th>
                <td style="width:26%;" contenteditable="true"></td>
              </tr>
              <tr>
                <th style="font-size:9.2px;">Eğitici Personel / Usta Öğreticinin Adı Soyadı / Kimlik No.</th>
                <td data-bind="ustaAdSoyad" contenteditable="true"></td>
              </tr>
              <tr>
                <th>Yasal Durumu</th>
                <td contenteditable="true">☐ Kamu &nbsp;&nbsp;&nbsp;&nbsp; ☑ Özel</td>
                <th>Telefon Numarası</th>
                <td data-bind="isletmeTel" contenteditable="true"></td>
              </tr>
              <tr>
                <th>Çalışan Personel Sayısı</th>
                <td contenteditable="true"></td>
                <th>E-Posta Adresi</th>
                <td contenteditable="true"></td>
              </tr>
              <tr>
                <th>Vergi No</th>
                <td contenteditable="true"></td>
                <th>Gerçek Kişi ise Kimlik No</th>
                <td contenteditable="true"></td>
              </tr>
              <tr>
                <th>SGK SİCİL / BAĞ-KUR NO:</th>
                <td colspan="3" contenteditable="true"></td>
              </tr>
              <tr>
                <th>İŞ YERİ İBAN NO:</th>
                <td colspan="3" style="padding:3px 5px;">${renderIbanBoxes()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ÖZEL BEYAN KUTUSU -->
        <div style="border:1px solid var(--doc-table-border); border-radius:6px; background:var(--doc-accent-soft); padding:5px 8px; font-size:9.7px; line-height:1.35;">
          <div contenteditable="true">• Öğrencinin özel eğitim (Bireyselleştirilmiş Eğitim Programına (BEP) Raporu) ve sağlık durumuna dair belge var ise aşağıya belirtiniz:</div>
          <div contenteditable="true" style="border-bottom:1px dotted var(--doc-muted); height:15px; margin-bottom:2px;">Yazınız: </div>
          <div contenteditable="true">• Öğrencinin işletmede görevlendirildiği birim: ............................................................................................................</div>
          <div contenteditable="true">• Öğrenci velisi, öğrencisinin işletmenin başka birimlerinde veya iş için gidilen uygulama alanlarında eğitim almasına izin verip vermediğini el yazısı ile yazmalıdır. <strong>(İzin veriyorum / İzin vermiyorum)</strong> Yazınız: ........................................................</div>
        </div>

        <!-- SAYFA 1 İMZA TABLOSU -->
        <div class="sig-grid" style="grid-template-columns: repeat(3, 1fr);">
          <div class="sig-box" style="min-height:66px; padding:4px 6px;">
            <div class="sig-title">Okul/Kurum Müdürünün</div>
            <div class="sig-stamp">İmza / Mühür</div>
          </div>
          <div class="sig-box" style="min-height:66px; padding:4px 6px;">
            <div class="sig-title">İşveren veya Vekilinin</div>
            <div class="sig-stamp">İmza / Kaşe</div>
          </div>
          <div class="sig-box" style="min-height:66px; padding:4px 6px;">
            <div class="sig-title" style="font-size:9.2px;">Öğrencinin / 18 Yaşından Küçükse Yasal Temsilcisinin</div>
            <div class="sig-stamp">İmza</div>
          </div>
        </div>
      </div>

      <div class="doc-footer">
        <span>T.C. MEB İşletmelerde Mesleki Eğitim / Staj Sözleşmesi</span>
        <span>Sözleşme Sayfa 1 / 7</span>
        <span>Sayfa 4 / 20</span>
      </div>
    `
  },

  /* ========================================================================
     SAYFA 5: STAJ SÖZLEŞMESİ - SAYFA 2/7 (GENEL HÜKÜMLER MADDE 1 - 4/6)
     ======================================================================== */
  {
    id: "sozlesme-2",
    docGroup: "sozlesme",
    docTitle: "5. Staj Sözleşmesi (Sayfa 2 - Genel Hükümler Md. 1-4)",
    pageNumber: 5,
    html: `
      <div class="doc-header">
        <span class="doc-code-badge" contenteditable="true">SÖZLEŞME • S.2</span>
        <div class="doc-ministry" contenteditable="true">İŞLETMELERDE MESLEKİ EĞİTİM SÖZLEŞMESİ</div>
        <div class="doc-title" style="font-size:15px;" contenteditable="true">GENEL HÜKÜMLER</div>
      </div>

      <div class="clause-list" contenteditable="true">
        <div class="sub-heading">Dayanak</div>
        <div class="clause-item">
          <strong>MADDE 1-</strong> Bu sözleşme, 3308 sayılı Mesleki Eğitim Kanunu ile Millî Eğitim Bakanlığı Ortaöğretim Kurumları Yönetmeliğine dayanılarak hazırlanmıştır.
        </div>

        <div class="sub-heading">Sözleşmenin tarafları</div>
        <div class="clause-item">
          <strong>MADDE 2-</strong> Bu sözleşme işletmede yapılacak mesleki eğitim / tamamlayıcı eğitim / stajın esaslarını düzenlemek amacıyla okul / kurum müdürü, işveren veya işveren vekili ile öğrenci reşit ise kendisi, değilse yasal temsilcisi arasında üç nüsha düzenlenir, imzalanan sözleşmenin birer nüshası taraflarda bulunur.
        </div>

        <div class="sub-heading">Tanımlar</div>
        <div class="clause-item">
          <strong>MADDE 3-</strong> (1) Bu Sözleşmede geçen;
        </div>
        <div class="clause-item" style="padding-left:12px;">
          <strong>a) Eğitici personel:</strong> Mesleki yeterliğe sahip, öğrencilerin işyerindeki eğitiminden sorumlu, iş pedagojisi eğitimi almış, mesleki eğitim yöntem ve tekniklerini bilen ve uygulayan veya mesleki ve teknik eğitim okul ve kurumlarında atölye ve laboratuvar öğretmenliği yapabilme yetkisine sahip kişiyi,
        </div>
        <div class="clause-item" style="padding-left:12px;">
          <strong>b) İşletme:</strong> Öğrencinin Kanun kapsamında mesleki eğitim gördüğü;<br>
          &nbsp;&nbsp;1) Özel sektöre ait kurum ve kuruluşları,<br>
          &nbsp;&nbsp;2) Kamu kurum ve kuruluşlarını (İl/ilçe millî eğitim müdürlükleri, okul öncesi eğitim kurumları, ilköğretim ve ortaöğretim kurumları dâhil),<br>
          &nbsp;&nbsp;3) Bünyesinde döner sermaye işletmesi bulunan okul ve kurumlar için döner sermaye işletmesini,
        </div>
        <div class="clause-item" style="padding-left:12px;">
          <strong>c) İşletmelerde mesleki eğitim:</strong> Mesleki ve teknik eğitim okul ve kurumları öğrencilerinin beceri eğitimlerini işletmelerde, teorik eğitimlerini ise mesleki ve teknik eğitim okul ve kurumlarında veya işletme veya kurumlarca tesis edilen eğitim birimlerinde yaptıkları eğitim uygulamalarını,
        </div>
        <div class="clause-item" style="padding-left:12px;">
          <strong>ç) Mesleki ve teknik ortaöğretim kurumu:</strong> Mesleki ve teknik Anadolu lisesi, mesleki ve teknik eğitim merkezi, çok programlı Anadolu lisesi, özel eğitim meslek lisesi ile mesleki eğitim merkezini,
        </div>
        <div class="clause-item" style="padding-left:12px;">
          <strong>d) Okul / Kurum:</strong> Millî Eğitim Bakanlığına bağlı her derece ve türdeki okul, merkez, pansiyon, uygulama oteli, öğretmen akademisi ve hizmet içi eğitim enstitüsü, olgunlaşma enstitüsü ile sosyal tesisleri,
        </div>
        <div class="clause-item" style="padding-left:12px;">
          <strong>e) Öğrenci:</strong> Mesleki ve teknik ortaöğretim kurumlarında örgün eğitim görenler ile mesleki eğitim merkezlerinde kalfalık ve ustalık eğitimi görenler ve mesleki açık öğretim liselerinde öğrenim görenleri,
        </div>
        <div class="clause-item" style="padding-left:12px;">
          <strong>f) Staj:</strong> İşletmelerde mesleki eğitime gönderilemeyen öğrencilerin öğretim programlarıyla kazandırılması öngörülen mesleki bilgi, beceri, tutum ve davranışlarını geliştirmeleri, sektörü tanımaları, iş hayatına uyumları, gerçek üretim ve hizmet ortamında yetişmeleri amacıyla işletmede yaptıkları toplam 40 iş günü süreli mesleki çalışmayı,
        </div>
        <div class="clause-item" style="padding-left:12px;">
          <strong>g) Usta öğretici:</strong> Ustalık yeterliğini kazanmış; aday çırak, çırak, kalfa ile mesleki ve teknik eğitim okul ve kurumları öğrencilerinin işyerindeki eğitiminden sorumlu; mesleki eğitim tekniklerini bilen ve uygulayan kişiyi,
        </div>
        <div class="clause-item" style="padding-left:12px;">
          <strong>ğ) Tamamlayıcı Eğitim:</strong> Açık öğretim yoluyla eğitimi yapılamayan alan veya dallarda, mesleki ve teknik ortaöğretim programlarını tamamlayamadan okuldan ayrılanlar ile yurtdışında öğrenim görenlerin denklik işlemleri sonucunda tespit edilen eksik meslek alan veya dal derslerini işletmelerde mesleki eğitim esaslarına göre tamamlamalarına imkân sağlayan eğitimi,
        </div>
        <div class="clause-item" style="padding-left:12px;">
          <strong>h) Yönetmelik:</strong> Millî Eğitim Bakanlığı Ortaöğretim Kurumları Yönetmeliğini, ifade eder.
        </div>

        <div class="sub-heading">İşletmelerde mesleki eğitim ve staj</div>
        <div class="clause-item">
          <strong>MADDE 4-</strong> (1) İşletmede mesleki eğitim / tamamlayıcı eğitim / staj süresince öğrencinin teorik eğitimi okul, kurum veya iş yerinin eğitim biriminde yapılır. Teorik eğitim ve işletmede mesleki eğitim programın özelliği ve sınıflar itibarıyla haftalık ders çizelgelerinde belirtilen süre kadardır (Yönetmelik Madde 123/1).
        </div>
        <div class="clause-item">
          (2) Sektörün özelliği, çalışma ve kapasite durumu ile okul ve iklim şartları da dikkate alınarak yılın belli zamanlarında faal olan yiyecek içecek hizmetleri, konaklama ve seyahat hizmetleri ve eğlence hizmetleri, denizcilik, hayvan yetiştiriciliği ve sağlığı, tarım alanları ile Bakanlıkça uygun bulunan diğer alan/dallarda 10’uncu sınıfta meslek derslerinin eğitimini tamamlayan öğrenciler, 11 ve 12’nci sınıfın dal derslerinin eğitimini işletmelerde yoğunlaştırılmış olarak görebilirler. Mesleki eğitim merkezi öğrencilerinin okulda almaları gereken dersler, işletmelerle yapılacak iş birliği çerçevesinde yoğunlaştırılarak okutulabilir (Yönetmelik Madde 63 ve 121).
        </div>
        <div class="clause-item">
          (3) İşletmedeki mesleki eğitim, il millî eğitim müdürlüklerince hazırlanan ilgili öğretim yılı çalışma takvimine göre yapılır (Millî Eğitim Bakanlığı Ortaöğretim Kurumları Yönetmeliği, madde 15).
        </div>
        <div class="clause-item">
          (4) Mesleki eğitim merkezi programı öğrencileri, 3308 sayılı Kanun hükümlerine göre işletmelerle olan sözleşmeleri devam ettiği sürece, ücretli ve ücretsiz izin süreleri dışında eğitim ve öğretim yılı boyunca işletmede mesleki eğitime devam eder (Yönetmelik Madde 15/3).
        </div>
        <div class="clause-item">
          (5) Teorik ve uygulamalı eğitimlerinin tamamını okulda yapan Anadolu teknik programı öğrencileri ile çeşitli nedenlerle işletmelerde mesleki eğitime gönderilemeyen öğrenciler, yarıyıl ve yaz tatillerinde staj yapar. Staj süresi toplam 40 iş günü olup bunun 10 gününe kadarı 9’uncu sınıfın sonunda yapılabilir. Stajın 11’inci sınıf sonuna kadar tamamlanması için öğrencilere okul müdürlüğünce gerekli rehberlik ve yönlendirme yapılır. Öğrenim süresi içerisinde stajını tamamlamayan öğrencilere diploma düzenlenmez (Yönetmelik Madde 69, 126 ve 127).
        </div>
        <div class="clause-item">
          (6) Tamamlayıcı eğitim kapsamında eğitimlerine devam eden öğrencilerin eksik meslek alan veya dal dersleri işletmelerde mesleki eğitim esaslarına göre işletmelerde yapılır (3308 sayılı Kanun Madde 18).
        </div>
      </div>

      <div class="doc-footer">
        <span>T.C. MEB İşletmelerde Mesleki Eğitim / Staj Sözleşmesi</span>
        <span>Sözleşme Sayfa 2 / 7</span>
        <span>Sayfa 5 / 20</span>
      </div>
    `
  },

  /* ========================================================================
     SAYFA 6: STAJ SÖZLEŞMESİ - SAYFA 3/7 (MADDE 4/7 - MADDE 9)
     ======================================================================== */
  {
    id: "sozlesme-3",
    docGroup: "sozlesme",
    docTitle: "6. Staj Sözleşmesi (Sayfa 3 - İzin, Ücret ve Kesinti Hükümleri)",
    pageNumber: 6,
    html: `
      <div class="doc-header">
        <span class="doc-code-badge" contenteditable="true">SÖZLEŞME • S.3</span>
        <div class="doc-ministry" contenteditable="true">İŞLETMELERDE MESLEKİ EĞİTİM SÖZLEŞMESİ</div>
        <div class="doc-title" style="font-size:15px;" contenteditable="true">ÇALIŞMA DÜZENİ, İŞ KAZASI, İZİN VE ÜCRET HÜKÜMLERİ</div>
      </div>

      <div class="clause-list" contenteditable="true">
        <div class="clause-item">
          (7) İşletmelerdeki mesleki eğitim / tamamlayıcı eğitim / stajın gündüz yapılması esastır. Ancak 22/5/2003 tarihli ve 4857 sayılı İş Kanunu’nun 73’üncü maddesine göre sanayiye ait işlerin dışındaki diğer sektörlerde mesleki eğitim, sektör ve program türünün özelliği ile iklim şartları ve yılın belli zamanlarında çalışan işletmeler dikkate alınarak il istihdam ve mesleki eğitim kurulunun kararıyla günde 8 saati ve saat 22.00’yi geçmemek üzere gece de yapılabilir. Ayrıca yoğunlaştırılmış eğitim programına göre işletmelerde mesleki eğitim haftalık azami çalışma saatini geçmemek şartıyla velinin veya reşit ise öğrencinin isteği doğrultusunda haftada 6 gün olarak da planlanabilir.
        </div>

        <div class="sub-heading">İş Kazası ve Meslek Hastalığı Hali</div>
        <div class="clause-item">
          <strong>MADDE 5-</strong> (1) Öğrencinin işletmede mesleki eğitim / tamamlayıcı eğitim / stajı sırasında meydana gelebilecek iş kazaları ve meslek hastalıklarından ve süresi içerisinde Sosyal Güvenlik Kurumuna gerekli bildirimde bulunulmasından iş yeri işverenleri / işveren vekili sorumludur (3308 sayılı Kanun Madde 25, 5510 sayılı Kanun Madde 13, Yönetmelik Madde 144, Sosyal Güvenlik Kurumu Emeklilik Hizmetleri Genel Müdürlüğü 29/09/2016 tarihli ve 2016/21 sayılı Genelge).
        </div>

        <div class="sub-heading">Programlara uygunluk</div>
        <div class="clause-item">
          <strong>MADDE 6-</strong> İşletmelerde mesleki eğitim / tamamlayıcı eğitim / staj, Yönetmelik hükümleri ve ilgili alan / dal çerçeve öğretim programlarına uygun olarak yürütülür.
        </div>

        <div class="sub-heading">İzin</div>
        <div class="clause-item">
          <strong>MADDE 7-</strong> (1) Öğrenim gördüğü program türü esas alınarak işletmelerde mesleki eğitim / tamamlayıcı eğitim / staj süresinde öğrenciye ara tatil, yarıyıl ve yaz tatili süresince toplam bir ay ücretli izin verilir. Ayrıca mazeretleri kabul edilenlere okul / kurum müdürlüğünün görüşü alınarak bir aya kadar ücretsiz mazeret izni de verilebilir (3308 sayılı Kanun Madde 26 ve Yönetmelik Madde 134).
        </div>
        <div class="clause-item">
          (2) Öğrenciler, teorik eğitim günleri ile eğitime erişimlerinin mümkün olmadığı mahallî mülki idare amirince tespit edilen günlerde ücretli izinli sayılır (Yönetmelik Madde 36/10 ve 123).
        </div>
        <div class="clause-item">
          (3) Öğrencilere telâfi eğitimi süresince ve okul / kurumda yapılacak sınavlar için belirtilen günlerde ücretli izin verilir (Yönetmelik Madde 144).
        </div>
        <div class="clause-item">
          (4) Staj süresi toplam 40 iş günü olup izinli ve raporlu olunan sürelerin fiilen tamamlanması gerekir (Yönetmelik Madde 127).
        </div>

        <div class="sub-heading">Ödenecek ücret</div>
        <div class="clause-item">
          <strong>MADDE 8-</strong> (1) İşletmelerde mesleki eğitim / tamamlayıcı eğitim / staj gören öğrenciler ile mesleki ve teknik ortaöğretim okul ve kurumlarında staj veya tamamlayıcı eğitim gören öğrencilere asgari ücret net tutarının yirmi ve üzerinde personel çalıştıran iş yerlerinde yüzde otuzundan, yirmiden az personel çalıştıran iş yerlerinde yüzde on beşinden, mesleki eğitim merkezi öğrencilerine (aday çırak ve çırağa) asgari ücretin yüzde otuzundan, kalfalık yeterliğini kazanan mesleki eğitim merkezi 12’nci sınıf öğrencilerine asgari ücretin yüzde ellisinden aşağı ücret ödenemez. Ders dışı zamanlarda yoğunlaştırılmış eğitime devam eden öğrencilerin ücretleri çalışma gün sayısı dikkate alınarak asgari ücretin yüzde ellisinden aşağı olmamak kaydıyla taraflarca belirlenir. Ücret, başlangıçta <strong>(8.422,65) TL</strong>’dir. Öğrenciye ödenecek ücret her türlü vergiden muaftır (3308 sayılı Kanun Madde 25).
        </div>
        <div class="clause-item" style="font-style:italic; font-size:10px; color:var(--doc-muted);">
          * 3308 sayılı Kanun’un Geçici 12’nci maddesi yürürlükte kaldığı sürece birinci fıkra yerine aşağıdaki (1/a) fıkrası uygulanacaktır.
        </div>
        <div class="clause-item">
          <strong>(1/a)</strong> İşletmelerde mesleki eğitim gören öğrenciler ile mesleki ve teknik ortaöğretim okul ve kurumlarında staj veya tamamlayıcı eğitim gören öğrencilere mesleki eğitim devam ettiği sürece yürürlükteki asgari ücretin net tutarının %30’undan az olmamak üzere ücret ödenir. Ücret, başlangıçta <strong>(8.422,65) TL</strong>’dir. Öğrenciye ödenecek ücret her türlü vergiden muaftır (3308 sayılı Kanunun Geçici 12’nci Maddesi).
        </div>
        <div class="clause-item">
          (2) Sözleşmenin geçerlilik süresi içinde asgari ücrette artış olması halinde bu artışlar aynı oranda öğrencinin ücretine yansıtılır (3308 sayılı Kanun Madde 25).
        </div>

        <div class="sub-heading">Devamsızlık yapan öğrencinin ücretinden kesinti yapma</div>
        <div class="clause-item">
          <strong>MADDE 9-</strong> (1) Öğrenci mesleki eğitim için işletmeye devam etmek zorundadır. İşletmede mesleki eğitimine ve teorik eğitimine özürsüz devam etmeyen veya ücretsiz izin kullanan öğrencinin bu günlerdeki ücreti kesilir.
        </div>
        <div class="clause-item">
          (2) Ücret kesilerek yapılacak ödeme miktarı;
        </div>
        <div class="formula-box">
          a) 20 ve daha fazla personel çalıştıran işletmelerce:<br>
          Ödenecek ücret = (Net Asg. Ücret x %30) - (Net Asg. Ücret x %30 x Devamsız Gün Sayısı) / 30
        </div>
        <div class="formula-box">
          b) 20’den az (19 ve altında) personel çalıştıran işletmelerce:<br>
          Ödenecek ücret = (Net Asg. Ücret x %15) - (Net Asg. Ücret x %15 x Devamsız Gün Sayısı) / 30<br>
          <span style="font-weight:400; font-size:9.5px;">* 3308 sayılı Kanunun Geçici 12’nci maddesi yürürlükte kaldığı sürece bu fıkranın (b) bendi yerine (2/a) fıkrası uygulanacaktır:</span><br>
          (2/a) Ödenecek ücret = (Net Asg. Ücret x %30) - (Net Asg. Ücret x %30 x Devamsız Gün Sayısı) / 30
        </div>
        <div class="formula-box">
          c) Mesleki eğitim merkezi programı 9, 10 ve 11. sınıf öğrencilerine eğitim veren işletmelerce:<br>
          Ödenecek ücret = (Net Asg. Ücret x %30) - (Net Asg. Ücret x %30 x Devamsız Gün Sayısı) / 30
        </div>
        <div class="formula-box">
          d) Mesleki eğitim merkezi programında kalfalık yeterliliğini kazanmış 12. sınıf öğrencilerine eğitim veren işletmelerce:<br>
          Ödenecek ücret = (Net Asg. Ücret x %50) - (Net Asg. Ücret x %50 x Devamsız Gün Sayısı) / 30
        </div>
      </div>

      <div class="doc-footer">
        <span>T.C. MEB İşletmelerde Mesleki Eğitim / Staj Sözleşmesi</span>
        <span>Sözleşme Sayfa 3 / 7</span>
        <span>Sayfa 6 / 20</span>
      </div>
    `
  },

  /* ========================================================================
     SAYFA 7: STAJ SÖZLEŞMESİ - SAYFA 4/7 (MADDE 10 - MADDE 17/b)
     ======================================================================== */
  {
    id: "sozlesme-4",
    docGroup: "sozlesme",
    docTitle: "7. Staj Sözleşmesi (Sayfa 4 - Sigortalılık, Devam, Beceri Sınavı)",
    pageNumber: 7,
    html: `
      <div class="doc-header">
        <span class="doc-code-badge" contenteditable="true">SÖZLEŞME • S.4</span>
        <div class="doc-ministry" contenteditable="true">İŞLETMELERDE MESLEKİ EĞİTİM SÖZLEŞMESİ</div>
        <div class="doc-title" style="font-size:15px;" contenteditable="true">SİGORTALILIK, DEVAM-DİSİPLİN DURUMU VE BECERİ SINAVI</div>
      </div>

      <div class="clause-list" contenteditable="true">
        <div class="sub-heading">Öğrencilerin sigortalılığı</div>
        <div class="clause-item">
          <strong>MADDE 10-</strong> (1) Okul / kurum müdürlüğünce bu sözleşmenin akdedilmesi ile öğrencinin işletmede mesleki eğitim / tamamlayıcı eğitim / staja devam ettiği sürece 5510 sayılı Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu’nun iş kazaları ve meslek hastalıkları ile hastalık sigortası hükümlerine göre tüm aylar için gün sayısına bakılmaksızın 30 gün olarak sigortalanır. Bunlardan bakmakla yükümlü olunan kişi durumunda olmayanlar için ayrıca genel sağlık sigortası primi ödenir. Staj yapan öğrenciler ise iş kazası ve meslek hastalığı yönünden sigortalanır (5510 sayılı Kanun Madde 5).
        </div>

        <div class="sub-heading">SGK primlerinin ödenmesi</div>
        <div class="clause-item">
          <strong>MADDE 11-</strong> (1) Bakanlıkça ödenmesi gereken sigorta primleri, 4857 sayılı İş Kanunu’nun 39’uncu maddesine göre belirlenen yürürlükteki asgari ücretin %50’si üzerinden hesap edilerek okul / kurum müdürlüğünce Sosyal Güvenlik Kurumuna ödenir veya bu Kurumun hesabına aktarılır (3308 sayılı Kanun Madde 25).
        </div>

        <div class="sub-heading">Sigortalılıkla ilgili belgelerin muhafazası</div>
        <div class="clause-item">
          <strong>MADDE 12-</strong> (1) Sigorta ve prim ödeme ile ilgili belgeler okul/kurum müdürlüğünce süresiz muhafaza edilir (Yönetmelik Madde 76).
        </div>

        <div class="section-bar-soft">ÖĞRENCİNİN DEVAM VE DİSİPLİN DURUMU</div>

        <div class="sub-heading">Eğitime devam edemeyen öğrenciler</div>
        <div class="clause-item">
          <strong>MADDE 13-</strong> (1) Mesleki eğitimi / tamamlayıcı eğitimi / stajını işletmede gören öğrencilerde uzun süreli tedaviyi gerektiren bir hastalık, yangın, deprem gibi doğal afetlerden dolayı eğitime devam edemeyen öğrenciler hakkında Millî Eğitim Bakanlığının ilgili mevzuat hükümleri uygulanır. İlçe, il veya ülke genelinde genel hayatı etkileyen salgın hastalık, doğal afet, elverişsiz hava koşulları gibi olağanüstü haller ile işletmeden kaynaklanan durumlar veya öğrencinin uzun süreli tedaviyi gerektiren bir hastalığı, disiplin cezası, tutuklu/hükümlülüğü ve benzeri nedenlerle işletmelerde mesleki eğitime / tamamlayıcı eğitime / stajına devam edemeyen öğrenciler hakkında Millî Eğitim Bakanlığının ilgili mevzuat hükümleri uygulanır (Yönetmelik Madde 36, Ek Madde 2, Ek Madde 3).
        </div>

        <div class="sub-heading">İşletmeye özürsüz devamsızlık</div>
        <div class="clause-item">
          <strong>MADDE 14-</strong> (1) İşletme yetkilileri, özürsüz olarak aralıksız iki iş günü mesleki eğitimine gelmeyen öğrenciyi en geç iki iş günü içinde okul / kurum müdürlüğüne elektronik ortamda veya yazılı olarak bildirmek zorundadır (Yönetmelik Madde 144).
        </div>

        <div class="sub-heading">Disiplin</div>
        <div class="clause-item">
          <strong>MADDE 15-</strong> (1) Öğrencinin işletmede disiplin soruşturmasını gerektirecek davranışta bulunması hâlinde bu durum işletme tarafından okul / kurum müdürlüğüne raporla bildirilir. Disiplin işlemi okul / kurum müdürlüğü tarafından mevzuatına göre yürütülür. Sonuç işletmeye yazılı olarak bildirilir (Yönetmelik Madde 165).
        </div>

        <div class="sub-heading">Beceri sınavı</div>
        <div class="clause-item">
          <strong>MADDE 16-</strong> (1) İşletmelerde mesleki eğitimi / tamamlayıcı eğitimi / stajını tamamlayan öğrenciler Yönetmelik’in 46’ncı maddesi hükümlerine göre beceri eğitiminin değerlendirilmesi amacıyla ders yılının son haftasında beceri sınavına alınırlar. Mesleki açık öğretim lisesi öğrencileri her dönemin son haftasında beceri sınavına alınırlar. Öğrenciler bu süre içerisinde ücretli izinli sayılırlar. Bu sınav, dersin özelliğine göre komisyonca alınacak karar doğrultusunda uygulamalı ve / veya yazılı olarak yapılır. Mesleki eğitim merkezi programına kayıtlı 11 ve 12’nci sınıf öğrencilerinin beceri sınavı; Bakanlıkça hazırlanan, kalfalık / ustalık beceri sınavı değerlendirme kriterleri doğrultusunda uygulamalı olarak yapılır ve kamera kaydına alınır.
        </div>
        <div class="clause-item">
          (2) İşletmelerde beceri eğitiminde dönem puanı, işletmedeki eğitim süresince öğretmen, eğitici personel / usta öğretici tarafından temrin, proje, iş, deney ve hizmet değerlendirmesinden verilen puanlar, varsa telafi eğitimi süresince okulda temrin, proje, iş ve hizmetlerden aldıkları puanlar ve alanıyla ilgili yarışmalarda alınan ve işletmeye bildirilen puanların aritmetik ortalamasıdır.
        </div>
        <div class="clause-item">
          (3) İşletmelerde beceri eğitiminde yılsonu puanı birinci ve ikinci dönem puanlarının aritmetik ortalaması ile yılsonu beceri sınavı puanının aritmetik ortalamasıdır.
        </div>
        <div class="clause-item">
          (4) İşletmelerde mesleki eğitime konu olan ders / derslerin öğrencilerin başarılı sayılabilmesi için beceri sınavı puanı en az 50 olmak kaydıyla birinci ve ikinci dönem puanları ile beceri sınavı puanının aritmetik ortalamasının en az 50 veya beceri sınav puanının en az 70 olması gerekir (Yönetmelik Madde 46, 51, 53, 56).
        </div>

        <div class="section-bar-soft">TARAFLARIN DİĞER GÖREV VE SORUMLULUKLARI</div>

        <div class="sub-heading">İşletmelerin görev ve sorumlulukları</div>
        <div class="clause-item">
          <strong>MADDE 17-</strong> (1) Yönetmelik’in 144 ve 146’ncı maddelerine göre mesleki eğitim yaptıracak işletmelerin görev ve sorumlulukları:<br>
          <strong>a)</strong> Öğrencilerin işletmede yapacakları mesleki eğitim, tamamlayıcı eğitim ve staj, bu eğitime katılacak öğrenci sayısı ve eğitimin uygulanışıyla ilgili esasları düzenleyen tutanağı işletme belirleme komisyonuyla birlikte imzalar ve eğitimi, çalışma takvimine uygun olarak yaptırır.<br>
          <strong>b)</strong> Mesleki eğitimin, işletme belirleme komisyonunca belirlenen yerlerde ilgili meslek alan / dallarının öğretim programlarına uygun olarak yapılmasını sağlar. İşletmeler, 3308 sayılı Kanunun 21’inci maddesine göre öğrencilerin, iş yerlerinin şartlarına ve çalışma düzenine uygun olarak işletme bölümlerini, alanlarını, aynı işletmenin başka birimlerinde de yapılacak mesleki eğitim yerlerini belirler. Öğrencinin aynı işletmenin başka birimlerinde veya iş için gidilen uygulama alanlarında eğitim almasına izin verilenlerin eğitimlerini sağlar.
        </div>
      </div>

      <div class="doc-footer">
        <span>T.C. MEB İşletmelerde Mesleki Eğitim / Staj Sözleşmesi</span>
        <span>Sözleşme Sayfa 4 / 7</span>
        <span>Sayfa 7 / 20</span>
      </div>
    `
  },

  /* ========================================================================
     SAYFA 8: STAJ SÖZLEŞMESİ - SAYFA 5/7 (MADDE 17/c - MADDE 18/d)
     ======================================================================== */
  {
    id: "sozlesme-5",
    docGroup: "sozlesme",
    docTitle: "8. Staj Sözleşmesi (Sayfa 5 - İşletme ve Okul Görevleri)",
    pageNumber: 8,
    html: `
      <div class="doc-header">
        <span class="doc-code-badge" contenteditable="true">SÖZLEŞME • S.5</span>
        <div class="doc-ministry" contenteditable="true">İŞLETMELERDE MESLEKİ EĞİTİM SÖZLEŞMESİ</div>
        <div class="doc-title" style="font-size:15px;" contenteditable="true">İŞLETMELERİN VE OKUL / KURUMLARIN GÖREV VE SORUMLULUKLARI</div>
      </div>

      <div class="clause-list" contenteditable="true">
        <div class="clause-item">
          <strong>c)</strong> İşletmede mesleki eğitim, tamamlayıcı eğitim ve staj yapılacak alan / dalların her biri için öğrencilerin beceri eğitiminden sorumlu olmak üzere öğrencinin eğitim aldığı aynı alanda ustalık veya mesleki yeterliğe sahip ve iş pedagojisi eğitimi almış yeterli sayıda ve nitelikte eğitici personel veya usta öğretici görevlendirir. Özel eğitim ihtiyacı olan öğrenciler için Bireyselleştirilmiş Eğitim Programına (BEP) göre okulla iş birliği yaparak gerekli tedbirleri alır. İşletmenin uygun yerinde mesleki eğitim almasını sağlar.
        </div>
        <div class="clause-item">
          <strong>ç)</strong> Yeterli sayıda ve nitelikte eğitici personel / usta öğretici bulunmaması durumunda, okul müdürlükleriyle koordineli olarak açılacak iş pedagojisi kurslarına ilgili personelin katılımını sağlar.
        </div>
        <div class="clause-item">
          <strong>d)</strong> Öğrencinin eğitiminden sorumlu eğitici personel / usta öğreticinin çeşitli nedenlerle ayrılması hâlinde üç iş günü içerisinde okul müdürlüğüne yazılı olarak bildirir.
        </div>
        <div class="clause-item">
          <strong>e)</strong> Mesleki eğitim için gerekli olan temrin malzemesiyle araç gereci temin eder.
        </div>
        <div class="clause-item">
          <strong>f)</strong> İşletmede mesleki eğitim, staj ve tamamlayıcı eğitim gören öğrenciye, 3308 sayılı Kanun’un 25’inci maddesinde belirtilen miktardan az olmamak üzere ödenecek ücret tutarı, ücret artışı ve diğer olanakları kapsayan eğitim sözleşmesini, öğrenci veya velisi okul müdürüyle birlikte imzalar.
        </div>
        <div class="clause-item">
          <strong>g)</strong> Öğrencilerin devam durumlarını izleyerek devamsızlıklarını ve hastalık izinlerini iki iş günü içinde elektronik ortamda veya yazılı olarak ilgili okul müdürlüğüne bildirir.
        </div>
        <div class="clause-item">
          <strong>ğ)</strong> Öğrencilerin ilgili döneme ait puan çizelgelerini, dönem sonundan beş gün önce kapalı zarf içinde ilgili okul müdürlüğüne teslim eder (Zarf öğrenciye verilmez).
        </div>
        <div class="clause-item">
          <strong>h)</strong> Öğrenciler tarafından tutulan iş dosyasını, istenmesi durumunda veya beceri sınavından önce puan çizelgesiyle birlikte ilgili okul müdürlüğüne teslim eder.
        </div>
        <div class="clause-item">
          <strong>ı)</strong> Öğrencilerin iş kazaları ve meslek hastalıklarından korunması, teşhis ve tedavileri için 6331 sayılı Kanun ve ilgili diğer mevzuat kapsamında gerekli önlemleri alır.
        </div>
        <div class="clause-item">
          <strong>i)</strong> Öğrencilere telafi eğitimi süresince ve okulda yapılacak sınavlar için belirtilen günlerde ücretli izin verir.
        </div>
        <div class="clause-item">
          <strong>j)</strong> Öğrencilere ara tatil, yarıyıl ve yaz tatili süresince toplam bir ay ücretli izin verir.
        </div>
        <div class="clause-item">
          <strong>k)</strong> Öğrencilere bir ders yılı içinde devamsızlıktan sayılmak ve en çok devamsızlık süresini geçmemek üzere, ilgili okul müdürlüğünün de görüşünü alarak ücretsiz mazeret izni verir.
        </div>
        <div class="clause-item">
          <strong>l)</strong> İşletmede mesleki eğitimi / tamamlayıcı eğitimi / staj başladıktan sonra personel sayısının azalması durumunda da eğitime alınmış olan öğrencileri, mezun oluncaya kadar işletmede eğitime devam ettirir.
        </div>
        <div class="clause-item">
          <strong>m)</strong> Öğrencilerin işletmelerdeki mesleki eğitim, tamamlayıcı eğitim ve staj süresince bulunabileceği işletme bölümleri ve alanları, aynı işletmenin başka birimlerinde de eğitim alabileceği ve eğitim alanının dışına çıkılıp çıkılmayacağı sözleşmede belirlenir. Öğrencinin işletmenin farklı bir şubesi / biriminde eğitim görmek üzere eğitim yerinin değişmesi hâlinde okul müdürlüğünü işletme bilgilendirir.
        </div>
        <div class="clause-item">
          <strong>n)</strong> Eğitimi yapılan meslek alan / dallarının öğretim programlarında bulunduğu hâlde işletmedeki olanaksızlıklar nedeniyle işlenemeyen konuların öğretimi için okul müdürlüğüyle iş birliği yapar.
        </div>
        <div class="clause-item">
          <strong>o)</strong> Koordinatör olarak görevlendirilen öğretmenlerin görevlerini yerine getirmesinde gerekli kolaylığı sağlar, belirlenen tarihte görevine gelmeyen veya görevini usulüne göre yürütmeyen öğretmenleri okul müdürlüğüne bildirir.
        </div>
        <div class="clause-item">
          <strong>ö)</strong> Öğrencileri, günde sekiz saatten fazla, meslekleri dışındaki işlerle bağımsız olarak 6/4/2004 tarihli ve 25425 sayılı Resmî Gazete’de yayımlanan Çocuk ve Genç İşçilerin Çalıştırılma Usul ve Esasları Hakkında Yönetmelik hükümlerine aykırı işlerde çalıştırmaz.
        </div>
        <div class="clause-item">
          <strong>p)</strong> Öğrenci ve öğretmenleri, işletmenin personeline sağladığı ulaşım, yemek ve diğer imkânlardan, il dışında mesleki eğitim / tamamlayıcı eğitim / staj yapılması durumunda ise ayrıca barınma imkânlarından yararlandırır (Yönetmelik Madde 144/2).
        </div>
        <div class="clause-item">
          <strong>r)</strong> 15/05/2013 tarih ve 28648 sayılı Resmî Gazete’de yayımlanan Çalışanların İş Sağlığı ve Güvenliği Eğitimlerinin Usul ve Esasları Hakkında Yönetmelik esaslarına göre işletmelerde mesleki eğitim / tamamlayıcı eğitim / staja başlayacak öğrencilere, eğitici personel / usta öğreticilerin katılımıyla işletme tarafından iş sağlığı ve güvenliği eğitimi ile iş yerine özgü tanıtım ve güvenlik eğitimleri verilir.
        </div>
        <div class="clause-item">
          <strong>s)</strong> İşletmelerde mesleki eğitimde görev alacak eğitici personel / usta öğreticiye görev ve sorumluluklarını bildirir (Yönetmelik Madde 146).
        </div>
        <div class="clause-item">
          <strong>ş)</strong> Öğrenciye, iş sağlığı ve güvenliği tedbirleri çerçevesinde öğrencinin işletmede bulunduğu sürece kullanılmak üzere çalışandan farklı özellikte yaka kartı, iş kıyafeti ve benzeri tedbirleri alır.
        </div>

        <div class="sub-heading">Okul / Kurumların Görev ve Sorumlulukları</div>
        <div class="clause-item">
          <strong>MADDE 18-</strong> (1) Yönetmelik’in 78, 82 ve 88’inci maddelerine göre okul / kurumların işletmelerdeki mesleki eğitimde iş yerlerinin belirlenmesi, eğitimin planlanması, koordinasyonu, uygulanması ve izlenmesi kapsamındaki görev ve sorumlulukları şunlardır:<br>
          <strong>a)</strong> Öğrenci veya yasal temsilcileri ile birlikte işletmelerde mesleki eğitim / tamamlayıcı eğitim / staj sözleşmesini imzalar.<br>
          <strong>b)</strong> Okulda atölye, laboratuvar kurulamaması veya yeterli donanım bulunmaması hâlinde sektörle iş birliği çerçevesinde yapılan protokol kapsamında işletmelerin eğitim birimlerinde meslek / alan / dal derslerinin eğitim ve öğretimi için ilgili alanın atölye ve laboratuvar öğretmeni görevlendirir. Ayrıca uygulamalı derslerin eğitiminin işletmelerde yapılması hâlinde yüz yüze eğitim kapsamında ders okutmak üzere bu işletmelerde öğretmen görevlendirir.<br>
          <strong>c)</strong> Eğitimi yapılacak meslek alan / dallarıyla ilgili öğretim programlarının ve öğrencilerin işletmede yaptıkları etkinliklerle ilgili formların ders yılı başında işletmelere verilmesini sağlar.<br>
          <strong>ç)</strong> İşletmelerdeki mesleki eğitimin eğitici personel / usta öğretici tarafından yapılmasını sağlar.<br>
          <strong>d)</strong> İşletmelerdeki mesleki eğitimin ilgili meslek alan / dalı çerçeve öğretim programlarına uygun olarak yapılmasını sağlar.
        </div>
      </div>

      <div class="doc-footer">
        <span>T.C. MEB İşletmelerde Mesleki Eğitim / Staj Sözleşmesi</span>
        <span>Sözleşme Sayfa 5 / 7</span>
        <span>Sayfa 8 / 20</span>
      </div>
    `
  },

  /* ========================================================================
     SAYFA 9: STAJ SÖZLEŞMESİ - SAYFA 6/7 (MADDE 18/e - MADDE 23)
     ======================================================================== */
  {
    id: "sozlesme-6",
    docGroup: "sozlesme",
    docTitle: "9. Staj Sözleşmesi (Sayfa 6 - Öğrenci Görevleri ve Sosyal Haklar)",
    pageNumber: 9,
    html: `
      <div class="doc-header">
        <span class="doc-code-badge" contenteditable="true">SÖZLEŞME • S.6</span>
        <div class="doc-ministry" contenteditable="true">İŞLETMELERDE MESLEKİ EĞİTİM SÖZLEŞMESİ</div>
        <div class="doc-title" style="font-size:15px;" contenteditable="true">OKUL VE ÖĞRENCİ SORUMLULUKLARI İLE SOSYAL HAKLAR</div>
      </div>

      <div class="clause-list" contenteditable="true">
        <div class="clause-item">
          <strong>e)</strong> İşletmelerde mesleki eğitim / tamamlayıcı eğitim / staj yapan öğrencilerin ücretli ve ücretsiz mazeret izinleri ile devam-devamsızlık durumlarının izlenmesini ve kayıtlarının tutulmasını sağlar.
        </div>
        <div class="clause-item">
          <strong>f)</strong> İşletmelerde mesleki eğitimi / tamamlayıcı eğitim / staj yapan öğrencilerin sigorta primlerine ait işlemlerin mevzuatına göre yürütülmesini sağlar.
        </div>
        <div class="clause-item">
          <strong>g)</strong> İşletmelerle iş birliği yaparak öğrencilerin mesleki eğitiminden sorumlu eğitici personel / usta öğreticinin yetiştirilmesi için iş pedagojisi kursları açar, başarılı olanlara "Usta Öğretici" belgesi verir, bununla ilgili kayıtları tutar.
        </div>
        <div class="clause-item">
          <strong>ğ)</strong> İşletmelerde görevli eğitici personel / usta öğreticinin hizmet içi eğitiminde okul / kurumun personel ve diğer imkânlarıyla yardımcı olur.
        </div>
        <div class="clause-item">
          <strong>h)</strong> İşletmelerde yapılan mesleki eğitimde amaçlanan hedeflere ulaşılması için işletme yetkilileri ile sürekli iş birliği yaparak eğitimle ilgili gerekli önlemleri alır.
        </div>
        <div class="clause-item">
          <strong>ı)</strong> Okul müdürü, koordinatör müdür yardımcısı ve koordinatör öğretmenin değişmesi durumunda ilgili işletmeyi bilgilendirir.
        </div>
        <div class="clause-item">
          <strong>i)</strong> Eğitimde amaçlanan hedeflere ulaşılması için işletme yetkilileriyle iş birliği yaparak gerekli önlemleri alır. İşletme yetkilileriyle yapılan toplantılara başkanlık eder.
        </div>
        <div class="clause-item">
          <strong>j)</strong> 15/05/2013 tarih ve 28648 sayılı Resmî Gazete’de yayımlanan Çalışanların İş Sağlığı ve Güvenliği Eğitimlerinin Usul ve Esasları Hakkında Yönetmelik esaslarına göre işletmelerde mesleki eğitimi / tamamlayıcı eğitimi / staja başlayacak öğrencilere temel iş sağlığı ve güvenliği eğitimlerini verir.
        </div>

        <div class="sub-heading">Öğrencilerin görev ve sorumlulukları</div>
        <div class="clause-item">
          <strong>MADDE 19-</strong> (1) Yönetmelik’in 36, 124, 126 ve 147’nci maddelerine göre işletmede mesleki eğitimi / tamamlayıcı eğitimi / staj yapan öğrencinin görev ve sorumlulukları:<br>
          <strong>a)</strong> İş yerinin şartlarına, çalışma düzenine ve kılık-kıyafet kurallarına uyar.<br>
          <strong>b)</strong> Üretim ve hizmetle ilgili gizlilik gerektiren konular ile kişilere ait özel bilgileri başkalarıyla paylaşmaz.<br>
          <strong>c)</strong> Sendikal etkinliklere katılmaz.<br>
          <strong>ç)</strong> Eğitime düzenli olarak devam eder.<br>
          <strong>d)</strong> Mesleki eğitim ile ilgili iş dosyası tutar ve zamanında koordinatör öğretmenine teslim eder.<br>
          <strong>e)</strong> İşletmelerde mesleki eğitim / tamamlayıcı eğitim / staj gördüğü günlerde devamsızlık yaptığı süreye ilişkin özür belgesi veya yazılı veli beyanını özür gününü takip eden en geç beş iş günü içinde okul / kurum müdürlüğüne teslim eder.<br>
          <strong>f)</strong> 15/05/2013 tarih ve 28648 sayılı Resmî Gazete’de yayımlanan Çalışanların İş Sağlığı ve Güvenliği Eğitimlerinin Usul ve Esasları Hakkında Yönetmelik esaslarına göre işletmelerde mesleki eğitim, tamamlayıcı eğitim ve staja başlayacak öğrenciler, okul müdürlüğü tarafından verilecek temel iş sağlığı ve güvenliği eğitimleri ile işletme tarafından verilecek alanına özgü iş sağlığı ve güvenliği eğitimlerine katılır.
        </div>

        <div class="section-bar-soft">DİĞER HUSUSLAR</div>

        <div class="sub-heading">Hüküm Bulunmayan Hâller</div>
        <div class="clause-item">
          <strong>MADDE 20-</strong> (1) İşletmelerde mesleki eğitim / tamamlayıcı eğitimi / staj süresince öğrenciler hakkında bu sözleşmede yer almayan diğer hususlarda Yönetmelik ve ilgili diğer mevzuat hükümlerine göre işlem yapılır.
        </div>

        <div class="sub-heading">İşverenin değişmesi</div>
        <div class="clause-item">
          <strong>MADDE 21-</strong> (1) İşverenin değişmesi hâlinde yeni işveren aynı mesleği / üretimi sürdürüyorsa sözleşme yenilenir.
        </div>

        <div class="sub-heading">Öğrencinin okul/kurumunun değişmesi</div>
        <div class="clause-item">
          <strong>MADDE 22-</strong> (1) Öğrencinin okul / kurum değiştirmesi durumunda okul / kurum müdürlüğünce sözleşmenin yenilenmesi sağlanır.
        </div>

        <div class="sub-heading">Öğrenciye Sağlanacak Hak ve İmkânlar</div>
        <div class="clause-item">
          <strong>MADDE 23-</strong> (1) İşletme tarafından öğrenci aşağıdaki sosyal haklardan yararlandırılacaktır:
        </div>

        <table class="doc-table" style="margin-top:4px;">
          <tbody>
            <tr>
              <td style="width:25%; font-weight:700;">☐ Öğle Yemeği</td>
              <td style="width:25%; font-weight:700;">☐ Ulaşım / Servis</td>
              <td style="width:25%; font-weight:700;">☐ Barınma</td>
              <td style="width:25%; font-weight:700;">☑ Kişisel Koruyucu Donanım</td>
            </tr>
            <tr>
              <td colspan="4" style="padding:8px; height:54px; vertical-align:top;">
                <strong>☐ Diğer (Belirtiniz):</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="doc-footer">
        <span>T.C. MEB İşletmelerde Mesleki Eğitim / Staj Sözleşmesi</span>
        <span>Sözleşme Sayfa 6 / 7</span>
        <span>Sayfa 9 / 20</span>
      </div>
    `
  },

  /* ========================================================================
     SAYFA 10: STAJ SÖZLEŞMESİ - SAYFA 7/7 (MADDE 24 - 26 VE NİHAİ ONAY TABLOSU)
     ======================================================================== */
  {
    id: "sozlesme-7",
    docGroup: "sozlesme",
    docTitle: "10. Staj Sözleşmesi (Sayfa 7 - Fesih, Yürürlük ve Resmi İmzalar)",
    pageNumber: 10,
    html: `
      <div class="doc-header">
        <span class="doc-code-badge" contenteditable="true">SÖZLEŞME • S.7</span>
        <div class="doc-ministry" contenteditable="true">T.C. MİLLÎ EĞİTİM BAKANLIĞI</div>
        <div class="doc-title" style="font-size:15px;" contenteditable="true">İŞLETMELERDE MESLEKİ EĞİTİM SÖZLEŞMESİ<br>FESİH, YÜRÜRLÜK VE TARAFLARIN ONAYI</div>
      </div>

      <div class="clause-list" style="flex:1;" contenteditable="true">
        <div class="sub-heading">Sözleşmenin feshi</div>
        <div class="clause-item">
          <strong>MADDE 24-</strong> (1) Sözleşme;
        </div>
        <div class="clause-item" style="padding-left:12px;">
          <strong>a)</strong> İş yerinin çeşitli sebeplerle kapatılması,<br>
          <strong>b)</strong> İşletmelerde grev ve lokavt uygulaması olması,<br>
          <strong>c)</strong> Deprem, yangın ve sel gibi afetler veya taraflardan birinin yükümlülüklerini yerine getirmemesi,<br>
          <strong>ç)</strong> İş yerindeki eğitici personel / usta öğretici ünvanlı personelin işten ayrılması ve iş yerinde öğrencinin eğitim aldığı aynı alanda başka eğitici personel / usta öğretici bulunmaması,<br>
          <strong>d)</strong> İş yeri sahibinin değişmesi,<br>
          <strong>e)</strong> Sağlık durumunun işletmedeki eğitimden olumsuz etkilenmesi,<br>
          <strong>f)</strong> Öğrencinin okul değiştirme veya örgün eğitim dışına çıkarma cezası alarak okul/kurumla ilişiğinin kesilmesi,<br>
          <strong>g)</strong> Öğrencinin okula veya işletmeye devamsızlığı nedeniyle başarısızlığının söz konusu olması,<br>
          <strong>ğ)</strong> Öğrenciye bakmakla yükümlü olanın ikametini değiştirmesi nedeniyle öğrencinin ulaşımını sağlayamayacağına dair yazılı beyanı,<br>
          <strong>h)</strong> Öğrencinin nakil yoluyla okul değiştirmesi,<br>
          durumlarında Yönetmelik’in 143’üncü maddesine göre tek taraflı veya karşılıklı olarak feshedilir.
        </div>
        <div class="clause-item">
          (2) Fesih durumu, sözleşmenin feshi tarihinden itibaren üç iş günü içinde ilgili okul / kurum müdürlüğüne ve işletmeye yazılı olarak bildirilir (3308 sayılı Kanun Madde 22, Yönetmelik Madde 143).
        </div>

        <div class="sub-heading">Yürürlük</div>
        <div class="clause-item">
          <strong>MADDE 25-</strong> <span data-bind="sozlesmeTarihi">10/11/2026</span> tarihinde yürürlüğe girmek üzere taraflarca imzalanan bu sözleşme öğrencinin işletmelerde mesleki eğitim / tamamlayıcı eğitim / stajını tamamladığı tarihe kadar geçerlidir.
        </div>

        <div class="sub-heading">Saklanma süresi</div>
        <div class="clause-item">
          <strong>MADDE 26-</strong> Sözleşme, okul / kurum müdürlüklerince öğrenci dosyasında süresiz saklanır (Yönetmelik Madde 76).
        </div>

        <div style="border-top:3px solid var(--doc-primary); margin:8px 0 4px 0; padding-top:8px;">
          <div style="text-align:center; font-family:var(--font-heading); font-weight:800; font-size:13px; color:var(--doc-primary); margin-bottom:8px;">
            T.C. MİLLÎ EĞİTİM BAKANLIĞI • İŞLETMELERDE MESLEKİ EĞİTİM SÖZLEŞMESİ ONAY TABLOSU
          </div>

          <table class="doc-table" style="text-align:center;">
            <thead>
              <tr>
                <th style="width:33.3%;">Okul / Kurumun Adı</th>
                <th style="width:33.3%;">İşletme Adı</th>
                <th style="width:33.3%;">Öğrencinin / 18 Yaşından Küçükse Yasal Temsilcisinin</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="height:52px; font-weight:700; text-align:center;" data-bind="okulAdi">Çorum Mesleki Eğitim Merkezi Müdürlüğü</td>
                <td style="height:52px; font-weight:700; text-align:center;" data-bind="isletmeAdi"></td>
                <td style="height:52px; font-weight:700; text-align:center;" data-bind="ogrenciAdSoyad"></td>
              </tr>
              <tr>
                <th style="text-align:center; background:var(--doc-accent-mid);">Okul / Kurum Müdürünün</th>
                <th style="text-align:center; background:var(--doc-accent-mid);">İşveren veya Vekilinin</th>
                <th style="text-align:center; background:var(--doc-accent-mid);">Velinin / Öğrencinin Adı Soyadı</th>
              </tr>
              <tr>
                <td style="height:36px; text-align:center;">Adı Soyadı:</td>
                <td style="height:36px; text-align:center;">Adı Soyadı:</td>
                <td style="height:36px; text-align:center;" data-bind="veliAdSoyad"></td>
              </tr>
              <tr>
                <td style="font-weight:700; text-align:center;" data-bind="sozlesmeTarihi">10.11.2026</td>
                <td style="font-weight:700; text-align:center;" data-bind="sozlesmeTarihi">10.11.2026</td>
                <td style="font-weight:700; text-align:center;" data-bind="sozlesmeTarihi">10.11.2026</td>
              </tr>
              <tr>
                <td style="height:115px; vertical-align:top; padding-top:10px; text-align:center;">
                  <strong>İmza - Mühür</strong>
                </td>
                <td style="height:115px; vertical-align:top; padding-top:10px; text-align:center;">
                  <strong>İmza - Mühür / Kaşe</strong>
                </td>
                <td style="height:115px; vertical-align:top; padding-top:10px; text-align:center;">
                  <strong>İmza</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="background:var(--doc-accent-soft); border:1px solid var(--doc-table-border); border-radius:6px; padding:6px 10px; font-size:9.8px; text-align:center; color:var(--doc-muted);">
          İşbu sözleşme 3308 sayılı Mesleki Eğitim Kanunu hükümleri uyarınca 3 (üç) asıl nüsha olarak tanzim edilmiş olup, taraflarca okunarak imza altına alınmıştır.
        </div>
      </div>

      <div class="doc-footer">
        <span>T.C. MEB İşletmelerde Mesleki Eğitim / Staj Sözleşmesi</span>
        <span>Sözleşme Sayfa 7 / 7</span>
        <span>Sayfa 10 / 20</span>
      </div>
    `
  }
];
