/* ==========================================================================
   STAJ DOSYASI EVRAKLARI - SAYFA ŞABLONLARI (BÖLÜM 2: SAYFA 11 - 20)
   11. Veli İzin Belgesi | 12. Ücretli/Ücretsiz İzin Dilekçesi
   13-17. İş Güvenliği Talimatı ve Tutanağı (EK_2 - 5 Sayfa Tam Metin)
   18. Proje / Resim / Rapor / Deney Formu (Gerçek Taranabilir QR Kodlu)
   19-20. MEB-İMES Staj ve Mesleki Eğitim Süreçleri Kılavuzu & Raporu
   ========================================================================== */

function renderSignListRows30() {
  let rows = "";
  for (let i = 1; i <= 30; i++) {
    rows += `
      <tr>
        <td style="text-align:center; font-weight:700; padding:2.5px 4px; font-size:9.8px;">${i}</td>
        <td style="padding:2.5px 6px;" contenteditable="true"></td>
        <td style="padding:2.5px 6px;" contenteditable="true"></td>
        <td style="padding:2.5px 6px;" contenteditable="true"></td>
        <td style="padding:2.5px 6px;" contenteditable="true"></td>
        <td style="padding:2.5px 6px;" contenteditable="true"></td>
      </tr>
    `;
  }
  return rows;
}

/* https://corummesem.meb.k12.tr/ adresine yönlendiren gerçek ISO 18004 (Version 3-L) Karekod */
window.CORUM_MESEM_QR_SVG = `
<a href="https://corummesem.meb.k12.tr/" target="_blank" rel="noopener noreferrer" title="https://corummesem.meb.k12.tr/ adresini aç" style="display:inline-block; color:inherit; text-decoration:none;">
  <svg width="76" height="76" viewBox="0 0 33 33" shape-rendering="crispEdges" style="display:block; border:1px solid var(--doc-table-border); border-radius:4px; background:#ffffff;">
    <rect width="33" height="33" fill="#ffffff"/>
    <path fill="#000000" d="M2,2h1v1h-1z M3,2h1v1h-1z M4,2h1v1h-1z M5,2h1v1h-1z M6,2h1v1h-1z M7,2h1v1h-1z M8,2h1v1h-1z M11,2h1v1h-1z M14,2h1v1h-1z M15,2h1v1h-1z M18,2h1v1h-1z M19,2h1v1h-1z M20,2h1v1h-1z M21,2h1v1h-1z M22,2h1v1h-1z M24,2h1v1h-1z M25,2h1v1h-1z M26,2h1v1h-1z M27,2h1v1h-1z M28,2h1v1h-1z M29,2h1v1h-1z M30,2h1v1h-1z M2,3h1v1h-1z M8,3h1v1h-1z M12,3h1v1h-1z M13,3h1v1h-1z M14,3h1v1h-1z M16,3h1v1h-1z M17,3h1v1h-1z M18,3h1v1h-1z M20,3h1v1h-1z M21,3h1v1h-1z M24,3h1v1h-1z M30,3h1v1h-1z M2,4h1v1h-1z M4,4h1v1h-1z M5,4h1v1h-1z M6,4h1v1h-1z M8,4h1v1h-1z M10,4h1v1h-1z M11,4h1v1h-1z M12,4h1v1h-1z M14,4h1v1h-1z M15,4h1v1h-1z M16,4h1v1h-1z M18,4h1v1h-1z M20,4h1v1h-1z M21,4h1v1h-1z M22,4h1v1h-1z M24,4h1v1h-1z M26,4h1v1h-1z M27,4h1v1h-1z M28,4h1v1h-1z M30,4h1v1h-1z M2,5h1v1h-1z M4,5h1v1h-1z M5,5h1v1h-1z M6,5h1v1h-1z M8,5h1v1h-1z M11,5h1v1h-1z M12,5h1v1h-1z M13,5h1v1h-1z M15,5h1v1h-1z M16,5h1v1h-1z M17,5h1v1h-1z M20,5h1v1h-1z M21,5h1v1h-1z M24,5h1v1h-1z M26,5h1v1h-1z M27,5h1v1h-1z M28,5h1v1h-1z M30,5h1v1h-1z M2,6h1v1h-1z M4,6h1v1h-1z M5,6h1v1h-1z M6,6h1v1h-1z M8,6h1v1h-1z M12,6h1v1h-1z M16,6h1v1h-1z M19,6h1v1h-1z M20,6h1v1h-1z M21,6h1v1h-1z M24,6h1v1h-1z M26,6h1v1h-1z M27,6h1v1h-1z M28,6h1v1h-1z M30,6h1v1h-1z M2,7h1v1h-1z M8,7h1v1h-1z M11,7h1v1h-1z M15,7h1v1h-1z M21,7h1v1h-1z M22,7h1v1h-1z M24,7h1v1h-1z M30,7h1v1h-1z M2,8h1v1h-1z M3,8h1v1h-1z M4,8h1v1h-1z M5,8h1v1h-1z M6,8h1v1h-1z M7,8h1v1h-1z M8,8h1v1h-1z M10,8h1v1h-1z M12,8h1v1h-1z M14,8h1v1h-1z M16,8h1v1h-1z M18,8h1v1h-1z M20,8h1v1h-1z M22,8h1v1h-1z M24,8h1v1h-1z M25,8h1v1h-1z M26,8h1v1h-1z M27,8h1v1h-1z M28,8h1v1h-1z M29,8h1v1h-1z M30,8h1v1h-1z M10,9h1v1h-1z M11,9h1v1h-1z M12,9h1v1h-1z M14,9h1v1h-1z M15,9h1v1h-1z M16,9h1v1h-1z M18,9h1v1h-1z M19,9h1v1h-1z M20,9h1v1h-1z M21,9h1v1h-1z M22,9h1v1h-1z M2,10h1v1h-1z M3,10h1v1h-1z M4,10h1v1h-1z M6,10h1v1h-1z M7,10h1v1h-1z M8,10h1v1h-1z M9,10h1v1h-1z M10,10h1v1h-1z M12,10h1v1h-1z M13,10h1v1h-1z M16,10h1v1h-1z M17,10h1v1h-1z M19,10h1v1h-1z M20,10h1v1h-1z M22,10h1v1h-1z M23,10h1v1h-1z M24,10h1v1h-1z M28,10h1v1h-1z M3,11h1v1h-1z M6,11h1v1h-1z M9,11h1v1h-1z M12,11h1v1h-1z M13,11h1v1h-1z M16,11h1v1h-1z M17,11h1v1h-1z M19,11h1v1h-1z M20,11h1v1h-1z M22,11h1v1h-1z M23,11h1v1h-1z M24,11h1v1h-1z M27,11h1v1h-1z M30,11h1v1h-1z M2,12h1v1h-1z M4,12h1v1h-1z M5,12h1v1h-1z M8,12h1v1h-1z M11,12h1v1h-1z M15,12h1v1h-1z M20,12h1v1h-1z M23,12h1v1h-1z M25,12h1v1h-1z M26,12h1v1h-1z M28,12h1v1h-1z M29,12h1v1h-1z M30,12h1v1h-1z M2,13h1v1h-1z M3,13h1v1h-1z M4,13h1v1h-1z M5,13h1v1h-1z M9,13h1v1h-1z M13,13h1v1h-1z M17,13h1v1h-1z M19,13h1v1h-1z M20,13h1v1h-1z M21,13h1v1h-1z M22,13h1v1h-1z M29,13h1v1h-1z M2,14h1v1h-1z M3,14h1v1h-1z M4,14h1v1h-1z M8,14h1v1h-1z M10,14h1v1h-1z M14,14h1v1h-1z M18,14h1v1h-1z M19,14h1v1h-1z M20,14h1v1h-1z M21,14h1v1h-1z M22,14h1v1h-1z M23,14h1v1h-1z M24,14h1v1h-1z M25,14h1v1h-1z M27,14h1v1h-1z M29,14h1v1h-1z M30,14h1v1h-1z M4,15h1v1h-1z M13,15h1v1h-1z M14,15h1v1h-1z M15,15h1v1h-1z M17,15h1v1h-1z M18,15h1v1h-1z M19,15h1v1h-1z M20,15h1v1h-1z M22,15h1v1h-1z M23,15h1v1h-1z M24,15h1v1h-1z M27,15h1v1h-1z M30,15h1v1h-1z M2,16h1v1h-1z M3,16h1v1h-1z M4,16h1v1h-1z M5,16h1v1h-1z M8,16h1v1h-1z M10,16h1v1h-1z M11,16h1v1h-1z M12,16h1v1h-1z M13,16h1v1h-1z M14,16h1v1h-1z M16,16h1v1h-1z M17,16h1v1h-1z M18,16h1v1h-1z M19,16h1v1h-1z M20,16h1v1h-1z M22,16h1v1h-1z M23,16h1v1h-1z M27,16h1v1h-1z M29,16h1v1h-1z M30,16h1v1h-1z M3,17h1v1h-1z M5,17h1v1h-1z M10,17h1v1h-1z M11,17h1v1h-1z M14,17h1v1h-1z M15,17h1v1h-1z M16,17h1v1h-1z M18,17h1v1h-1z M19,17h1v1h-1z M22,17h1v1h-1z M25,17h1v1h-1z M27,17h1v1h-1z M29,17h1v1h-1z M2,18h1v1h-1z M3,18h1v1h-1z M5,18h1v1h-1z M6,18h1v1h-1z M7,18h1v1h-1z M8,18h1v1h-1z M9,18h1v1h-1z M11,18h1v1h-1z M12,18h1v1h-1z M13,18h1v1h-1z M16,18h1v1h-1z M17,18h1v1h-1z M19,18h1v1h-1z M20,18h1v1h-1z M21,18h1v1h-1z M22,18h1v1h-1z M23,18h1v1h-1z M24,18h1v1h-1z M25,18h1v1h-1z M27,18h1v1h-1z M29,18h1v1h-1z M30,18h1v1h-1z M4,19h1v1h-1z M6,19h1v1h-1z M7,19h1v1h-1z M12,19h1v1h-1z M13,19h1v1h-1z M16,19h1v1h-1z M17,19h1v1h-1z M23,19h1v1h-1z M24,19h1v1h-1z M27,19h1v1h-1z M28,19h1v1h-1z M30,19h1v1h-1z M2,20h1v1h-1z M4,20h1v1h-1z M6,20h1v1h-1z M8,20h1v1h-1z M12,20h1v1h-1z M15,20h1v1h-1z M19,20h1v1h-1z M23,20h1v1h-1z M24,20h1v1h-1z M25,20h1v1h-1z M29,20h1v1h-1z M30,20h1v1h-1z M3,21h1v1h-1z M5,21h1v1h-1z M7,21h1v1h-1z M9,21h1v1h-1z M10,21h1v1h-1z M11,21h1v1h-1z M13,21h1v1h-1z M17,21h1v1h-1z M19,21h1v1h-1z M21,21h1v1h-1z M22,21h1v1h-1z M26,21h1v1h-1z M27,21h1v1h-1z M29,21h1v1h-1z M2,22h1v1h-1z M7,22h1v1h-1z M8,22h1v1h-1z M9,22h1v1h-1z M10,22h1v1h-1z M11,22h1v1h-1z M14,22h1v1h-1z M18,22h1v1h-1z M19,22h1v1h-1z M21,22h1v1h-1z M22,22h1v1h-1z M23,22h1v1h-1z M24,22h1v1h-1z M25,22h1v1h-1z M26,22h1v1h-1z M10,23h1v1h-1z M11,23h1v1h-1z M13,23h1v1h-1z M14,23h1v1h-1z M15,23h1v1h-1z M17,23h1v1h-1z M18,23h1v1h-1z M19,23h1v1h-1z M20,23h1v1h-1z M21,23h1v1h-1z M22,23h1v1h-1z M26,23h1v1h-1z M28,23h1v1h-1z M29,23h1v1h-1z M30,23h1v1h-1z M2,24h1v1h-1z M3,24h1v1h-1z M4,24h1v1h-1z M5,24h1v1h-1z M6,24h1v1h-1z M7,24h1v1h-1z M8,24h1v1h-1z M10,24h1v1h-1z M11,24h1v1h-1z M12,24h1v1h-1z M13,24h1v1h-1z M14,24h1v1h-1z M16,24h1v1h-1z M17,24h1v1h-1z M18,24h1v1h-1z M21,24h1v1h-1z M22,24h1v1h-1z M24,24h1v1h-1z M26,24h1v1h-1z M27,24h1v1h-1z M29,24h1v1h-1z M30,24h1v1h-1z M2,25h1v1h-1z M8,25h1v1h-1z M10,25h1v1h-1z M14,25h1v1h-1z M15,25h1v1h-1z M16,25h1v1h-1z M18,25h1v1h-1z M19,25h1v1h-1z M22,25h1v1h-1z M26,25h1v1h-1z M27,25h1v1h-1z M29,25h1v1h-1z M30,25h1v1h-1z M2,26h1v1h-1z M4,26h1v1h-1z M5,26h1v1h-1z M6,26h1v1h-1z M8,26h1v1h-1z M10,26h1v1h-1z M12,26h1v1h-1z M13,26h1v1h-1z M16,26h1v1h-1z M17,26h1v1h-1z M18,26h1v1h-1z M19,26h1v1h-1z M22,26h1v1h-1z M23,26h1v1h-1z M24,26h1v1h-1z M25,26h1v1h-1z M26,26h1v1h-1z M29,26h1v1h-1z M2,27h1v1h-1z M4,27h1v1h-1z M5,27h1v1h-1z M6,27h1v1h-1z M8,27h1v1h-1z M12,27h1v1h-1z M13,27h1v1h-1z M16,27h1v1h-1z M17,27h1v1h-1z M19,27h1v1h-1z M20,27h1v1h-1z M25,27h1v1h-1z M26,27h1v1h-1z M28,27h1v1h-1z M2,28h1v1h-1z M4,28h1v1h-1z M5,28h1v1h-1z M6,28h1v1h-1z M8,28h1v1h-1z M10,28h1v1h-1z M11,28h1v1h-1z M15,28h1v1h-1z M19,28h1v1h-1z M20,28h1v1h-1z M21,28h1v1h-1z M22,28h1v1h-1z M23,28h1v1h-1z M25,28h1v1h-1z M26,28h1v1h-1z M27,28h1v1h-1z M30,28h1v1h-1z M2,29h1v1h-1z M8,29h1v1h-1z M10,29h1v1h-1z M11,29h1v1h-1z M13,29h1v1h-1z M18,29h1v1h-1z M19,29h1v1h-1z M21,29h1v1h-1z M22,29h1v1h-1z M23,29h1v1h-1z M26,29h1v1h-1z M29,29h1v1h-1z M2,30h1v1h-1z M3,30h1v1h-1z M4,30h1v1h-1z M5,30h1v1h-1z M6,30h1v1h-1z M7,30h1v1h-1z M8,30h1v1h-1z M10,30h1v1h-1z M14,30h1v1h-1z M17,30h1v1h-1z M18,30h1v1h-1z M19,30h1v1h-1z M20,30h1v1h-1z M21,30h1v1h-1z M22,30h1v1h-1z M23,30h1v1h-1z M26,30h1v1h-1z M29,30h1v1h-1z M30,30h1v1h-1z"/>
  </svg>
</a>
`;

window.DOC_PAGES_PART2 = [
  /* ========================================================================
     SAYFA 11: VELİ İZİN BELGESİ (VELİ İZİN BELGESİ.pdf)
     ======================================================================== */
  {
    id: "veli-izin",
    docGroup: "veli-izin",
    docTitle: "11. Veli İzin Belgesi (İşletmelerde Mesleki Eğitim)",
    pageNumber: 11,
    html: `
      <div class="doc-header">
        <span class="doc-code-badge" contenteditable="true">VELİ İZİN FORMU</span>
        <div class="doc-ministry" data-bind="egitimYili" contenteditable="true">2026 / 2027 EĞİTİM ÖĞRETİM YILI İŞLETMELERDE MESLEKİ EĞİTİM</div>
        <div class="doc-title" contenteditable="true">VELİ İZİN VE MUVAFAKAT BELGESİ</div>
        <div class="doc-subtitle" contenteditable="true">ÇORUM MESLEKİ EĞİTİM MERKEZİ MÜDÜRLÜĞÜNE</div>
      </div>

      <div style="flex:1; display:flex; flex-direction:column; justify-content:space-between; gap:10px; margin: 6px 0;">
        <div style="background:var(--doc-accent-soft); border:1.5px solid var(--doc-primary); border-radius:8px; padding:16px 20px; font-size:12px; line-height:1.65; text-align:justify;" contenteditable="true">
          <p style="text-indent:28px; margin-bottom:10px;">
            Okulumuz öğrencilerinden velisi bulunduğum öğrencimin aşağıda belirtilen işletme veya usta/usta öğreticisinin gözetiminde işletme dışındaki iş yapılan yerlerde aşağıda belirtilen tarihler arasında staj / mesleki eğitim çalışmasını yapmasında bir sakınca görmüyorum.
          </p>
          <p style="text-indent:28px;">
            Ayrıca aşağıda verilen bilgilerin doğruluğunu beyan eder, bilgilerimizde herhangi bir değişiklik olması durumunda okul idaresine hemen bilgi vereceğimi,
          </p>
          <p style="margin-top:8px; font-weight:700;">
            Saygılarımla arz ederim.
          </p>

          <div style="display:flex; justify-content:flex-end; margin-top:14px;">
            <div style="width:240px; text-align:center; border:1px solid var(--doc-table-border); border-radius:8px; background:#fff; padding:10px;">
              <div style="font-weight:700; margin-bottom:4px;">..... / ..... / 202...</div>
              <div style="font-family:var(--font-heading); font-weight:800; color:var(--doc-primary);">ÖĞRENCİ VELİSİ</div>
              <div style="font-size:11px; margin:4px 0;" data-bind="veliAdSoyad">Adı Soyadı:</div>
              <div style="height:38px; display:flex; align-items:flex-end; justify-content:center; color:var(--doc-muted); font-size:10px;">İmza</div>
            </div>
          </div>
        </div>

        <div>
          <div class="section-bar"><span>1. ÖĞRENCİ VELİSİNİN İLETİŞİM BİLGİLERİ</span></div>
          <table class="doc-table">
            <tbody>
              <tr>
                <td class="field-label">Velinin Adı Soyadı</td>
                <td class="field-value" data-bind="veliAdSoyad" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">Yakınlık Derecesi</td>
                <td class="field-value" contenteditable="true">Anne / Baba / Yasal Vasi</td>
              </tr>
              <tr>
                <td class="field-label">Velinin Açık Adresi</td>
                <td class="field-value" style="height:40px;" data-bind="veliAdres" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">Veli Telefon Numarası</td>
                <td class="field-value" data-bind="veliTel" contenteditable="true"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <div class="section-bar"><span>2. İŞLETME VE STAJ DÖNEMİ BİLGİLERİ</span></div>
          <table class="doc-table">
            <tbody>
              <tr>
                <td class="field-label">Staj Tarihleri</td>
                <td class="field-value" contenteditable="true">........../........../202... &nbsp;&mdash;&nbsp; ........../........../202... &nbsp; <strong>(Yıl Boyunca)</strong></td>
              </tr>
              <tr>
                <td class="field-label">İşletmenin Adı</td>
                <td class="field-value" data-bind="isletmeAdi" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">İşletmenin Adresi</td>
                <td class="field-value" style="height:40px;" data-bind="isletmeAdres" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">İşletme Telefon</td>
                <td class="field-value" data-bind="isletmeTel" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">İşletme Faks / E-Posta</td>
                <td class="field-value" contenteditable="true"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <div class="section-bar"><span>3. ÖĞRENCİNİN KİŞİSEL BİLGİLERİ</span></div>
          <table class="doc-table">
            <tbody>
              <tr>
                <td class="field-label">Adı Soyadı</td>
                <td class="field-value" data-bind="ogrenciAdSoyad" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">T.C. Kimlik Numarası</td>
                <td class="field-value" data-bind="tcKimlik" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">Sınıfı / Şubesi / Okul No</td>
                <td class="field-value" data-bind="okulNo" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">Alanı / Dalı</td>
                <td class="field-value" data-bind="alanDal" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">Öğrenci Telefonu</td>
                <td class="field-value" data-bind="ogrenciTel" contenteditable="true"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="sig-grid" style="grid-template-columns: 1fr 1fr;">
          <div class="sig-box" style="min-height:76px;">
            <div class="sig-title">KOORDİNATÖR ÖĞRETMEN KONTROLÜ</div>
            <div data-bind="koordinatorAdSoyad">Adı Soyadı:</div>
            <div class="sig-stamp">İmza / Tarih</div>
          </div>
          <div class="sig-box" style="min-height:76px;">
            <div class="sig-title">OKUL İDARESİ KAYIT ONAYI</div>
            <div>Çorum Mesleki Eğitim Merkezi</div>
            <div class="sig-stamp">Koordinatör Müdür Yardımcısı • İmza</div>
          </div>
        </div>
      </div>

      <div class="doc-footer">
        <span>Çorum Mesleki Eğitim Merkezi • Veli İzin Belgesi</span>
        <span>3308 Sayılı Mesleki Eğitim Kanunu</span>
        <span>Sayfa 11 / 20</span>
      </div>
    `
  },

  /* ========================================================================
     SAYFA 12: ÜCRETLİ / ÜCRETSİZ İZİN DİLEKÇESİ (Corum_Mesleki_Egitim_Merkezi_ögrenci_Izin_Dilekcesi_v2.pdf)
     ======================================================================== */
  {
    id: "izin-dilekcesi",
    docGroup: "izin-dilekcesi",
    docTitle: "12. Öğrenci Ücretli / Ücretsiz İzin Dilekçesi",
    pageNumber: 12,
    html: `
      <div class="doc-header">
        <span class="doc-code-badge" contenteditable="true">İZİN DİLEKÇESİ</span>
        <div class="doc-ministry" contenteditable="true">İŞLETMELERDE MESLEK EĞİTİMİ GÖREN ÖĞRENCİLER</div>
        <div class="doc-title" contenteditable="true">ÜCRETLİ / ÜCRETSİZ İZİN DİLEKÇESİ</div>
        <div class="doc-subtitle" contenteditable="true">ÇORUM MESLEKİ EĞİTİM MERKEZİ MÜDÜRLÜĞÜNE • ÇORUM / MERKEZ</div>
      </div>

      <div style="flex:1; display:flex; flex-direction:column; justify-content:space-between; gap:12px; margin: 8px 0;">
        <div>
          <div class="section-bar"><span>İŞLETME BİLGİLERİ</span></div>
          <table class="doc-table">
            <tbody>
              <tr>
                <td class="field-label" style="width:26%;">İŞLETMENİN ADI</td>
                <td class="field-value" data-bind="isletmeAdi" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">ADRESİ</td>
                <td class="field-value" style="height:44px;" data-bind="isletmeAdres" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">TELEFON NO</td>
                <td class="field-value" data-bind="isletmeTel" contenteditable="true"></td>
              </tr>
              <tr>
                <td class="field-label">E-POSTA</td>
                <td class="field-value" contenteditable="true"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="background:var(--doc-accent-soft); border:1.5px solid var(--doc-primary); border-radius:8px; padding:18px 22px; font-size:12.2px; line-height:1.85; text-align:justify;" contenteditable="true">
          <div style="font-family:var(--font-heading); font-weight:800; font-size:13px; color:var(--doc-primary); text-align:center; margin-bottom:12px;">
            ÇORUM MESLEKİ EĞİTİM MERKEZİ MÜDÜRLÜĞÜNE<br>ÇORUM / MERKEZ
          </div>
          <p style="text-indent:30px;">
            Yukarıda adı ve adresi yazılı işletmede meslek eğitimi gören <span class="dotted-line" data-bind="sinifSube">........................</span> Sınıfı, <span class="dotted-line" data-bind="okulNo">...................................</span> numaralı öğrencisi <span class="dotted-line" data-bind="ogrenciAdSoyad">....................................................................................</span>’a <strong>....../....../202...</strong> tarihinden başlayarak <strong>........</strong> gün <strong>ücretli / ücretsiz</strong> izin verilmesini ve bu iznin öğrencinin senelik ücretli / ücretsiz izin hakkından sayılacağını bildirdiğimi saygı ile arz ederim.
          </p>

          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:20px; padding-top:10px; border-top:1px dashed var(--doc-accent-mid);">
            <div style="font-size:11px;">
              <div><strong>İzin Türü Seçimi:</strong></div>
              <div>☐ Yıllık Ücretli İzin (Madde 26 - 30 Gün)</div>
              <div>☐ Mazerete Dayalı Ücretsiz İzin</div>
            </div>
            <div style="text-align:right; min-width:250px;">
              <div style="font-weight:700; margin-bottom:6px;">........ / ........ / 202...</div>
              <div style="font-family:var(--font-heading); font-weight:800; color:var(--doc-primary); margin-bottom:6px;">Öğrenci Velisi</div>
              <div data-bind="veliAdSoyad">Adı, Soyadı : .........................................................</div>
              <div style="margin-top:8px;">İmza : .........................................................</div>
            </div>
          </div>
        </div>

        <div>
          <div style="text-align:center; font-family:var(--font-heading); font-weight:900; font-size:14px; color:var(--doc-primary); margin-bottom:8px; letter-spacing:1px;">
            UYGUNDUR.
          </div>
          <div class="sig-grid" style="grid-template-columns: 1fr 1fr; gap:16px;">
            <div class="sig-box" style="min-height:150px; padding:12px;">
              <div class="sig-title" style="font-size:12px;">İŞLETME YETKİLİSİ</div>
              <div style="font-weight:700; margin:6px 0;" contenteditable="true">....../....../202...</div>
              <div style="font-weight:600;" contenteditable="true">Adı Soyadı</div>
              <div class="sig-stamp" style="margin-top:36px; font-size:11px; font-weight:700;">İmza<br>(Kaşe)</div>
            </div>
            <div class="sig-box" style="min-height:150px; padding:12px;">
              <div class="sig-title" style="font-size:12px;">OKUL MÜDÜRÜ</div>
              <div style="font-weight:700; margin:6px 0;" contenteditable="true">....../....../202...</div>
              <div style="font-weight:600;" contenteditable="true">Adı Soyadı</div>
              <div class="sig-stamp" style="margin-top:36px; font-size:11px; font-weight:700;">İmza<br>(Mühür)</div>
            </div>
          </div>
        </div>

        <div style="background:var(--doc-accent-mid); border:1.5px solid var(--doc-primary); border-radius:8px; padding:12px 14px; font-size:10.8px; line-height:1.48; text-align:justify;" contenteditable="true">
          <strong>Açıklama:</strong> 3308 Sayılı Mesleki Eğitim Kanunu; <u>Madde 26</u> – Aday çırak, çırak ve işletmelerde mesleki eğitim gören öğrencilere işletmelerce her yıl tatil aylarında bir ay ücretli izin verilir. Ayrıca mazeretleri kabul edilenlere okul müdürlüğünün görüşü alınarak bir aya kadar ücretsiz izin de verilebilir.<br>
          <u style="font-weight:700; color:var(--doc-primary);">(Ücretsiz izin hakkı olan 30 güne dahil olan süreler okul devamsızlıkları, işletme devamsızlıkları ve sağlık raporları da eklenmektedir. 30 gün ücretsiz izin hakkını tamamlayan öğrenci sınıf tekrarına kalmaktadır.)</u>
        </div>
      </div>

      <div class="doc-footer">
        <span>Çorum Mesleki Eğitim Merkezi • Öğrenci İzin Dilekçesi</span>
        <span>3308 Sayılı Kanun Madde 26</span>
        <span>Sayfa 12 / 20</span>
      </div>
    `
  },

  /* ========================================================================
     SAYFA 13: İŞ GÜVENLİĞİ TALİMATI VE TUTANAĞI - EK_2 SAYFA 1/5
     ======================================================================== */
  {
    id: "isg-1",
    docGroup: "isg",
    docTitle: "13. İş Güvenliği Talimatı ve Tutanağı (EK_2 - Sayfa 1/5)",
    pageNumber: 13,
    html: `
      <div class="doc-header">
        <span class="doc-code-badge" contenteditable="true">EK_2</span>
        <div class="doc-ministry" data-bind="egitimYili" contenteditable="true">2026 / 2027 EĞİTİM ÖĞRETİM YILI</div>
        <div class="doc-title" contenteditable="true">İŞ GÜVENLİĞİ TALİMATI VE TUTANAĞI</div>
        <div class="doc-subtitle" contenteditable="true">ÇORUM MESLEKİ EĞİTİM MERKEZİ MÜDÜRLÜĞÜ</div>
      </div>

      <table class="doc-table" style="margin-bottom:8px;">
        <thead>
          <tr>
            <th colspan="4">ÖĞRENCİ / ÇIRAK KİMLİK VE ATÖLYE BİLGİLERİ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th style="width:22%;">Adı ve Soyadı</th>
            <td style="width:28%;" data-bind="ogrenciAdSoyad" contenteditable="true"></td>
            <th style="width:20%;">Baba Adı</th>
            <td style="width:30%;" data-bind="babaAdi" contenteditable="true"></td>
          </tr>
          <tr>
            <th>Doğum Yeri ve Yılı</th>
            <td data-bind="dogumYeriTarihi" contenteditable="true"></td>
            <th>Sınıfı / No:</th>
            <td data-bind="okulNo" contenteditable="true"></td>
          </tr>
          <tr>
            <th>Alan / Bölüm</th>
            <td colspan="3" data-bind="alanDal" contenteditable="true"></td>
          </tr>
        </tbody>
      </table>

      <div class="section-bar" style="justify-content:center; margin-bottom:6px;"><span>ÖZEL ŞARTLAR (MADDE 1 - 15)</span></div>

      <div class="clause-list" style="font-size:10.5px; line-height:1.38;" contenteditable="true">
        <div class="clause-item">
          <strong>1)</strong> Yukarıda bilgileri yazılı <span class="dotted-line" data-bind="ogrenciAdSoyad">........................................................</span>’nin, <span class="dotted-line" data-bind="alanDal">................................................</span> Alanı/Bölümü <span class="dotted-line">................................................</span> Atölye/Laboratuvarında aşağıda belirtilen şartlara muhakkak surette uyarak çalışacağına dair işbu talimat ve tutanak serbest arzu ve iradesi ile aşağıdaki şekilde düzenlenerek imza edilmiştir.
        </div>
        <div class="clause-item">
          <strong>2)</strong> Yetkim, bilgim ve görevim dışında iş yapmayacağım, verilen görevi uygulayıp bunun dışında başka bir iş yapmayacağım.
        </div>
        <div class="clause-item">
          <strong>3)</strong> Her türlü arıza ve aksaklığı derhal öğretmenlerime bildireceğim.
        </div>
        <div class="clause-item">
          <strong>4)</strong> Atölyemden ve çalışma sahamdan izinsiz ayrılmayacağım ve asla izinsiz laboratuvarda tek başıma çalışmayacağım.
        </div>
        <div class="clause-item">
          <strong>5)</strong> Elektrik, ağ kablolama, kabin ve kablo aksamına dokunmayacağım. Elektrik motorları, cihazları ve kabloları ile sigortaları kurcalamayacağım, dokunmayacağım. Kimya ve gıda laboratuvarlarında sorumlu öğretmen izin vermedikçe hiçbir deney düzeneğine, kimyasala, otoklava, kül fırınına, benzeri cihaz ve diğer malzemelere dokunmayacağım. Laboratuvarlarda üretilen malzeme ve mikroorganizmalara izinsiz dokunmayacağım.
        </div>
        <div class="clause-item">
          <strong>6)</strong> Kesme, delme, zımba, perçin v.b. gibi işlerle, asit, baz gibi maddelerle yapılan işlerde, taşlama cihaz ve tezgahları gibi göze çapak veya parça kaçması ihtimali olan bütün işlerde, iş gözlüğünü muhakkak takacağım, asla gözlüksüz çalışmaya başlamayacağım. Laboratuvarda çalışıldığı sürece deneylerin özelliğine göre gözlük, maske, eldiven vb. koruyucu ekipmanlarını kullanacağım.
        </div>
        <div class="clause-item">
          <strong>7)</strong> Yük ve personel asansörüne gereği dışında binmeyeceğim, yangın merdivenlerini hizmetin gereği dışında kullanmayacağım.
        </div>
        <div class="clause-item">
          <strong>8)</strong> Atölyede muhtelif yerlerde, ilan panosunda asılmış bulunan ve öğretmenlerimizin anlatarak açıkladıkları İş Güvenliği Talimat ve İkazlarını tam anlamı ile eksiksiz okuyup, anlayıp öğrendim. Tatbik edeceğim ve ettireceğim. Öğretmenlerimizin verdiği iş güvenliğine ait sözlü ve özel talimatları da aksatmadan yerine getireceğim.
        </div>
        <div class="clause-item">
          <strong>9)</strong> Çalışma alanıma misafir ve burada çalışmayan kişileri kabul etmeyeceğim ve girmelerine müsaade etmeyeceğim, uymayanları öğretmenlerime bildireceğim. Laboratuvarda yemek ve içmek vb. arkadaşlarla şakalaşmak, koşmak, oyun oynamak gibi eylemlerde bulunmayacağım.
        </div>
        <div class="clause-item">
          <strong>10)</strong> Çalıştığım makine, tezgâh ve cihazı öğretilen bilgiler dışında, gerekli bütün koruyucu önlemleri aldığımı öğretmenlerimce doğrulamadan çalıştırmayacağım.
        </div>
        <div class="clause-item">
          <strong>11)</strong> Atölyede, eğitim süresince sürekli iş elbisesi ile çalışacağım, iş elbisemi yırtık ve sökük bulundurmayacağım. Laboratuvarda önlük giymeden çalışmayacağım ve laboratuvara izinsiz girip çıkmayacağım.
        </div>
        <div class="clause-item">
          <strong>12)</strong> Anahtarlık, zincir, madalyon, şapka vb. sarkan ve düşebilen aksesuar bulundurmayacağım. Uzun saçlar, sallantılı takılar tehlikeye yol açacağından dikkatli olacağım.
        </div>
        <div class="clause-item">
          <strong>13)</strong> Çalışırken üzerimde yüzük, bilezik ve kol saati gibi metal eşya bulundurmayacağım.
        </div>
        <div class="clause-item">
          <strong>14)</strong> Koruyucu araç ve gereçler ile yangın söndürme cihazlarını kullandıktan sonra yine aldığım yere koyacağım.
        </div>
        <div class="clause-item">
          <strong>15)</strong> El aletlerini, diğer araç ve gereçleri işlevine özgü işlerde kullanacağım.
        </div>
      </div>

      <div class="doc-footer">
        <span>EK_2 • İş Güvenliği Talimatı ve Tutanağı (Bölüm 1/5)</span>
        <span>Çorum Mesleki Eğitim Merkezi</span>
        <span>Sayfa 13 / 20</span>
      </div>
    `
  },

  /* ========================================================================
     SAYFA 14: İŞ GÜVENLİĞİ TALİMATI VE TUTANAĞI - EK_2 SAYFA 2/5
     ======================================================================== */
  {
    id: "isg-2",
    docGroup: "isg",
    docTitle: "14. İş Güvenliği Talimatı ve Tutanağı (EK_2 - Sayfa 2/5)",
    pageNumber: 14,
    html: `
      <div class="doc-header">
        <span class="doc-code-badge" contenteditable="true">EK_2</span>
        <div class="doc-ministry" data-bind="egitimYili" contenteditable="true">2026 / 2027 EĞİTİM ÖĞRETİM YILI</div>
        <div class="doc-title" contenteditable="true">İŞ GÜVENLİĞİ TALİMATI VE TUTANAĞI</div>
        <div class="doc-subtitle" contenteditable="true">ÖZEL ŞARTLAR DEVAMI (MADDE 16 - 33) VE İMZA TUTANAĞI</div>
      </div>

      <div class="clause-list" style="font-size:10.3px; line-height:1.34;" contenteditable="true">
        <div class="clause-item">
          <strong>16)</strong> Çekiç, keski gibi el aletlerinin bozulan ve çapaklanan başlarını taşlamadan kullanmayacağım. Kimya ve gıda laboratuvarlarında deneylerde kullanacağımız cam malzemeleri deneyden önce yıkayıp temizledikten sonra kullanacağım.
        </div>
        <div class="clause-item">
          <strong>17)</strong> Eli zedeleyebilecek kadar hasara uğramış, saplı veya arızalı el alet ve takımları kullanmayacağım.
        </div>
        <div class="clause-item">
          <strong>18)</strong> Atölyede yapacağım işe uygun kişisel koruyucu araç ve gereçleri sağlam olarak, kullanılmak üzere takımhaneden teslim alacağım. Arızalı olanları yenisi ile değiştireceğim.
        </div>
        <div class="clause-item">
          <strong>19)</strong> Sağlam ve düşmeye mani olacak korkulukları bulunmayan geçit ve platformlardan geçmeyeceğim.
        </div>
        <div class="clause-item">
          <strong>20)</strong> Talimat ve ikaz levhalarının yerlerini değiştirmeyeceğim.
        </div>
        <div class="clause-item">
          <strong>21)</strong> Makine çalışırken yağlamayacağım, tamirat yapmayacağım ve bakım için yerlerinden çıkarılan muhafazalar yerlerine takılmadan makineyi çalıştırmayacağım ve makinede çalışmayacağım.
        </div>
        <div class="clause-item">
          <strong>22)</strong> Atölyede iş disiplini ve ciddiyeti ile çalışacağım.
        </div>
        <div class="clause-item">
          <strong>23)</strong> Ambar, malzeme, depo, takımhane yetkilisinin izni ve çıkış emri olmadan hiçbir malzeme, araç, gereç v.s. almayacağım.
        </div>
        <div class="clause-item">
          <strong>24)</strong> Deneylerden önce deney föyünü dikkatle okuyarak deneye hazır olacağım. Laboratuvar çalışmalarından sonra arkadaşlarıma, yüzüme ve/veya vücudumun herhangi bir bölümüne dokunmadan önce, ellerimi su ve sabunla yıkayacağım. Laboratuvarda kimyasal maddelere çıplak elle dokunmayacağım ve koklamayacağım.
        </div>
        <div class="clause-item">
          <strong>25)</strong> Laboratuvarda ve okulda bulunan bütün kimyasalları kullanmadan önce etiketlerini dikkatle okuyacağım. Etiketsiz olanları sorumlu kişilere bildireceğim.
        </div>
        <div class="clause-item">
          <strong>26)</strong> Şişesinden aldığım kimyasalı tekrar orijinal şişesine koymayacağım ve orijinal şişeye pipet daldırmayacağım.
        </div>
        <div class="clause-item">
          <strong>27)</strong> Asitleri suya azar azar ilave edeceğim. Kesinlikle asidin üzerine su ilave etmeyeceğim.
        </div>
        <div class="clause-item">
          <strong>28)</strong> Pipet ile sıvı çekerken ağız kullanmayacağım, puar kullanacağım.
        </div>
        <div class="clause-item">
          <strong>29)</strong> Alev alıcı sıvıları kullanana kadar kapalı ve ısı kaynaklarından uzak tutacağım.
        </div>
        <div class="clause-item">
          <strong>30)</strong> Kimyasal ve biyolojik atıklarımı kesinlikle ortama döküp, bulaştırmayacağım.
        </div>
        <div class="clause-item">
          <strong>31)</strong> Zehirli buhar ve gazları kontrolsüz solumayacağım.
        </div>
        <div class="clause-item">
          <strong>32)</strong> Kimyasal maddeleri taşırken dikkatli ve güvenli taşıyacağım. Kimyasalları hiçbir zaman laboratuvar dışına çıkarmayacağım.
        </div>
        <div class="clause-item">
          <strong>33)</strong> Yukarıdaki maddeleri tamamen okuyup anladım, atölye ve laboratuvardaki uygulamalı eğitim ile ilgili hususlarda gerekenleri uygulayıp, kurallara uygun davranacağım. Öğretmenlerimin özel talimatları dışına çıkmadan, her türlü aksaklıklar için öğretmenlerime danışarak hareket edeceğim. Aksi takdirde doğabilecek her türlü hukuki ve cezai sorumluluklar ile tazminatlar çırak/öğrenci ve velisine ait olacaktır.
        </div>
      </div>

      <div style="margin-top:6px;">
        <div style="background:var(--doc-accent-mid); border:1.5px solid var(--doc-primary); border-radius:6px; padding:6px 10px; font-size:10.5px; font-weight:800; text-align:center; color:var(--doc-primary); margin-bottom:6px;" contenteditable="true">
          İşbu talimat tutanağı 33 (Otuzüç) maddeden ibaret olup, tamamen okuyup anlayarak ve İş Güvenliği kaidelerine ve talimatlarına harfiyen riayet edeceğimi bildirerek Velim ile birlikte imza ediyorum.
        </div>

        <table class="doc-table" style="text-align:center; font-size:9.8px;">
          <thead>
            <tr>
              <th style="width:20%;">EĞİTİMİ VEREN YETKİLİNİN</th>
              <th style="width:20%;">ÖĞRENCİ / ÇIRAK</th>
              <th style="width:20%;">VELİ</th>
              <th style="width:20%;">ATÖLYE / LABORATUVAR ALAN ŞEFİ</th>
              <th style="width:20%;">OKUL / MERKEZ MÜDÜRÜ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="height:125px; vertical-align:space-between; text-align:left; padding:6px;" contenteditable="true">
                <div>Adı:</div>
                <div style="margin-bottom:18px;">Soyadı:</div>
                <div style="text-align:center; font-weight:700; margin-bottom:24px;">İMZA</div>
                <div style="text-align:center;">...../...../202...</div>
              </td>
              <td style="height:125px; vertical-align:space-between; text-align:left; padding:6px;" contenteditable="true">
                <div data-bind="ogrenciAdSoyad">Adı Soyadı:</div>
                <div style="margin-bottom:18px;"></div>
                <div style="text-align:center; font-weight:700; margin-bottom:24px;">İMZA</div>
                <div style="text-align:center;">...../...../202...</div>
              </td>
              <td style="height:125px; vertical-align:space-between; text-align:left; padding:6px;" contenteditable="true">
                <div data-bind="veliAdSoyad">Adı Soyadı:</div>
                <div style="margin-bottom:18px;"></div>
                <div style="text-align:center; font-weight:700; margin-bottom:24px;">İMZA</div>
                <div style="text-align:center;">...../...../202...</div>
              </td>
              <td style="height:125px; vertical-align:space-between; text-align:left; padding:6px;" contenteditable="true">
                <div>Adı:</div>
                <div style="margin-bottom:18px;">Soyadı:</div>
                <div style="text-align:center; font-weight:700; margin-bottom:24px;">İMZA</div>
                <div style="text-align:center;">...../...../202...</div>
              </td>
              <td style="height:125px; vertical-align:space-between; text-align:left; padding:6px;" contenteditable="true">
                <div>Adı:</div>
                <div style="margin-bottom:18px;">Soyadı:</div>
                <div style="text-align:center; font-weight:700; margin-bottom:24px;">İMZA</div>
                <div style="text-align:center;">...../...../202...</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="doc-footer">
        <span>EK_2 • İş Güvenliği Talimatı ve Tutanağı (Bölüm 2/5)</span>
        <span>33 Maddelik Taahhütname ve Onay</span>
        <span>Sayfa 14 / 20</span>
      </div>
    `
  },

  /* ========================================================================
     SAYFA 15: İŞ GÜVENLİĞİ TALİMATI VE TUTANAĞI - EK_2 SAYFA 3/5
     ======================================================================== */
  {
    id: "isg-3",
    docGroup: "isg",
    docTitle: "15. İş Güvenliği Talimatı ve Tutanağı (EK_2 - Sayfa 3/5)",
    pageNumber: 15,
    html: `
      <div class="doc-header">
        <span class="doc-code-badge" contenteditable="true">EK_2</span>
        <div class="doc-ministry" data-bind="egitimYili" contenteditable="true">2026 / 2027 EĞİTİM ÖĞRETİM YILI</div>
        <div class="doc-title" contenteditable="true">İŞ GÜVENLİĞİ TALİMATI VE TUTANAĞI</div>
        <div class="doc-subtitle" contenteditable="true">ATÖLYE DÜZENİ, DİSİPLİN, KORUNMA VE İŞ GÜVENLİĞİ TEDBİRLERİ</div>
      </div>

      <div class="clause-list" style="font-size:10.5px; line-height:1.38;" contenteditable="true">
        <div class="section-bar-soft">İŞ GÜVENLİĞİ GENEL ESASLARI</div>
        <div class="clause-item">
          Atölyelerde çalışırken öğrencilerin uymaları gereken birçok husus vardır. Bunların koruma, düzen, temizlik, disiplin ve işbirliğine ilişkin olanları aşağıda belirtilmiştir. Çalışmalarınızda bu hususlarla tam bir uyum içerisinde bulunmanız gerekir.
        </div>

        <div class="sub-heading">1- DÜZEN VE TEMİZLİK:</div>
        <div class="clause-item">
          <strong>a-</strong> Atölyeye vaktinde geliniz. Bu vakit; ders zili çalmasından 10 dakika önce hazırlık zili ile başlar. Öğretmeninizin yoklama yapması için sıraya geçiniz.<br>
          <strong>b-</strong> Yüksek sesle konuşmak, gürültü yapmak diğer öğrencileri rahatsız edecektir. Bu da işlerin aksamasına yol açacaktır. Bu nedenle gerektiğinde alçak sesle konuşunuz.<br>
          <strong>c-</strong> Çantanızı; kitap ve defterinizi dolabınıza koyunuz. Eşyanızı düzenli bulundurunuz. Çekmece ve dolabınızın temiz ve tertipli olmasına dikkat ediniz.<br>
          <strong>d-</strong> İş önlüğünüzü giyiniz (İş önlüksüz çalışılamayacaktır). İş önlüğünüzün önünü daima kapalı bulundurunuz. İş önlüğünüz yırtık veya kirli, düğmesi kopuk olmayacaktır. İş önlüğünüzün sol üst (göğüs) cebi üzerine numaranızı işletiniz.<br>
          <strong>e-</strong> Atölyenizde temizlik paydosu verildiği zaman, çalıştığınız yeri temizleyiniz. Çekmece ve dolaplarınızı temiz ve düzenli tutunuz. Aygıtlarınızı, araç ve gereçlerinizi yerlerine koyunuz veya geri veriniz.<br>
          <strong>f-</strong> Atölye temizliği (programına göre) gruplar halinde yapılacaktır. Nöbetçi bulunduğunuzda görevinizi eksiksiz yapınız. Kirletilen yerin temizlenmesi size temiz ve tertipli çalışma alışkanlıkları kazandırır.
        </div>

        <div class="sub-heading">2- DİSİPLİN VE İŞBİRLİĞİ:</div>
        <div class="clause-item">
          <strong>a-</strong> Atölye ödevleriniz için yeter derecede hazırlıklı olunuz. Atölyeye zamanında geliniz. Ders kitabı, ders notu ve atölye defterinizi yanınızda bulundurunuz.<br>
          <strong>b-</strong> Öğretmeninizin verdiği işi kendiniz yapınız. Görev verilmedikçe başka bir öğrencinin işi ile ilgilenmeyiniz. Atölye öğretmeniniz işinizi kontrol ederken veya sizi izlerken daima işinizin başında bulununuz.<br>
          <strong>c-</strong> Çalışmalarınızda işlem yapraklarında gösterilen işlem basamakları sırasına uyunuz. Gerekli şema ve diyagramları dikkatle izleyiniz. Devre çizimlerinde anlamadığınız hususları öğretmeninize sorup öğreniniz.<br>
          <strong>d-</strong> İşinize enerji vermeden son kontrollerinizi yapınız ve öğretmeninize haber veriniz. İşinize habersiz akım vermeyiniz.<br>
          <strong>e-</strong> Arkadaşlarınızla saygı, sevgi ve görgü kurallarına dayalı iyi ilişkiler kurunuz. Hoşgörü sahibi olunuz. Öğretmeninize her zaman saygılı olunuz. Bu hareketlerinizin öğretmeniniz tarafından değerlendirileceğini unutmayınız.
        </div>

        <div class="sub-heading">3- KORUNMA:</div>
        <div class="clause-item">
          <strong>a-</strong> Elektrik enerjisi ile çalışmada, her an çarpılma tehlikesi ile karşı karşıya bulunduğunuzu unutmayınız. İşinize akım verildikten sonra yalnız sağ elinizi kullanınız, sol elinizi kullanmayınız.<br>
          <strong>b-</strong> Atölyede kaza ve yaralanmalar olduğu zaman derhal öğretmeninize haber veriniz. Telaşlanıp vakit geçirmeyiniz.<br>
          <strong>c-</strong> İşlem yapraklarında yazılı gerekli aygıt, takım ve gereçleri alınız. Dikkatle muayene ediniz. Arızalı ve kırık olanları kullanmayınız ve öğretmeninize haber veriniz.<br>
          <strong>d-</strong> Atölyede hiçbir zaman koşmayınız. Yüksek sesle konuşmayınız. Şaka yapmayınız. El şakası kesin olarak affedilemez.<br>
          <strong>e-</strong> Bir takımla çalışırken, ikinci bir takımı elinizde bulundurmayınız. Takımlarınızı işlem basamaklarına göre sırayla kullanınız. Özellikle kesici takımları kullandıktan sonra ağzını kapatınız.
        </div>

        <div class="section-bar-soft">İŞ GÜVENLİĞİ TEDBİRLERİ:</div>
        <div class="clause-item">
          Endüstriyel çalışmalarda işçi sağlığının korunması ve çalışan aygıtların sürekliliği için öncelikle uygulanan eğitim işçinin kendisi, işverenin işi ve malı yönünden büyük önem taşır. Ülkelerin iş hayatını düzenleyen kanunlar ve yönetmelikler bu konuda uyulması gereken prensipleri getirmektedir.<br>
          İş güvenliğini zedeleyen en önemli etken iş kazalarıdır. İş kazaları, kişinin çeşitli nedenlerle dikkatinin azaldığı veya çalıştığı iş düzenindeki aksamalar ile ortaya çıkar. Bu kazaların önlenmesi de <strong>İŞ GÜVENLİĞİ TEDBİRLERİ</strong> ile gerçekleştirilmektedir. Her iş yerinde bu ön tedbirler çalışanlara iyice öğretilmeli ve sık sık hatırlatılmalıdır.
        </div>

        <div style="background:var(--doc-accent-soft); border:1.5px solid var(--doc-primary); border-radius:6px; padding:6px 10px; font-weight:800; font-size:10px; color:var(--doc-primary);">
          NOT : HER ALAN/BÖLÜM ŞEFİ KENDİ LABORATUVAR VE ATÖLYESİ İÇİN, AYRI GÜVENLİK ÖNLEMLERİNİ VE TALİMATLARINI ÖĞRENCİLERE SÖZLÜ OLARAK ANLATACAKTIR.
        </div>

        <div class="sub-heading">1- İŞ KAZALARI NEDENLERİ:</div>
        <div class="clause-item">
          Kazalar, kişinin çalıştığı ortamda, alınan önleyici tedbirlere rağmen meydana gelen üzücü olaylardır. Her ne kadar makine veya sistemlerdeki zararlar giderilebilirse de kişideki zararlar daima üzücü sonuçlar vermektedir.
        </div>
      </div>

      <div class="doc-footer">
        <span>EK_2 • İş Güvenliği Talimatı ve Tutanağı (Bölüm 3/5)</span>
        <span>Atölye Kuralları ve Korunma</span>
        <span>Sayfa 15 / 20</span>
      </div>
    `
  },

  /* ========================================================================
     SAYFA 16: İŞ GÜVENLİĞİ TALİMATI VE TUTANAĞI - EK_2 SAYFA 4/5
     ======================================================================== */
  {
    id: "isg-4",
    docGroup: "isg",
    docTitle: "16. İş Güvenliği Talimatı ve Tutanağı (EK_2 - Sayfa 4/5)",
    pageNumber: 16,
    html: `
      <div class="doc-header">
        <span class="doc-code-badge" contenteditable="true">EK_2</span>
        <div class="doc-ministry" data-bind="egitimYili" contenteditable="true">2026 / 2027 EĞİTİM ÖĞRETİM YILI</div>
        <div class="doc-title" contenteditable="true">İŞ GÜVENLİĞİ TALİMATI VE TUTANAĞI</div>
        <div class="doc-subtitle" contenteditable="true">KAZA NEDENLERİ, ÖNLEYİCİ TEDBİRLER, MESLEK HASTALIKLARI VE İLK YARDIM</div>
      </div>

      <div class="clause-list" style="font-size:10.5px; line-height:1.38;" contenteditable="true">
        <div class="clause-item" style="font-weight:700; color:var(--doc-primary);">
          Bu nedenle kazaların oluş nedenlerini açıklayalım:
        </div>
        <div class="clause-item" style="padding-left:10px;">
          <strong>a- Dikkatsizlik:</strong> Çalışan kişinin çeşitli nedenlerle işine gereken dikkati sarf etmemesi kaza nedenlerinin başında yer alır.<br>
          <strong>b- Uykusuzluk:</strong> Dikkatin dağılma sebebidir.<br>
          <strong>c- Devamlı çalışma:</strong> Dikkatin dağılma nedenlerindendir.<br>
          <strong>d- Tedbirsizlik:</strong> "Ben kaza yapmam", "Kaza olmaz" veya "Bana bir şey olmaz" düşüncelerinden herhangi biri başlıca kaza nedenlerindendir.<br>
          <strong>e- Kurallara uymama:</strong> İşyerindeki işin niteliğine göre belirlenmiş kurallara uymamak kaza nedenidir.<br>
          <strong>f- Bilgisizlik:</strong> Cihazların kullanımına ait bilgisizlik önemli kaza nedenlerindendir.<br>
          <strong>g- Bakım Eksikliği:</strong> Cihazların, araç ve gereçlerin bakımı zamanında yapılmalıdır, yapılmazsa kaza nedeni olabilir.
        </div>

        <div class="sub-heading">2- ÖNLEYİCİ TEDBİRLER:</div>
        <div class="clause-item">
          <strong>a- Yalıtma:</strong> Elektrik enerjisinin bulunduğu iletken devresinin çevreye karşı yalıtılmasıdır. İletken donanımında ve araçlarında bu amaca yönelik kauçuk, plastik, kâğıt, yalıtkan bez, porselen v.b. gibi gereçler kullanılır.
        </div>
        <div class="clause-item">
          <strong>b- Küçük Gerilim Kullanma:</strong> İnsan vücudunda hayati tehlikeyi ortaya koyan gerilim daima değişir. Gerilimin vücut üzerinden geçirdiği akım tehlikeyi arttıran bir unsurdur. Bilindiği gibi, gerilim yükseldikçe insan derisi üzerinde yanıklar, akımın değeri büyüdükçe de ölüme kadar giden önemli etkiler ortaya çıkar. Yapılan deneylerle ve insanların karşılaştığı kazalardan alınan sonuçlarda tehlikeli gerilimlerin alt sınırı <strong>42 volt</strong> olarak tespit edilmiştir. Bu nedenle insanın elektrik enerjisine yakın bulunduğu devrelerde 42 volta kadar küçük gerilimlerin kullanılması tavsiye edilmektedir.
        </div>
        <div class="clause-item">
          <strong>c- Topraklama:</strong> Yalıtımı üst düzeyde yapılan, gerilimi küçültülemeyen aygıtlarda yalıtmanın arızalanabileceği düşünülerek topraklama yapılır. Topraklama aygıt ve makinaların madeni gövdelerinin toprak içine gömülen madeni plaklara bağlanmasıdır.
        </div>
        <div class="clause-item">
          <strong>d- Sıfırlama:</strong> Topraklamada olduğu gibi aygıt ve makinalarda yalıtkanlığın bozulması nedeni ile gövdenin toprağa karşı taşıyacağı gerilimi sıfır değerine indirmek için yapılır. Sıfırlama makina gövdesinin enerji şebekesini besleyen alternatörün sıfır noktasından bağlanmasıdır. Güvenlik için alternatörlerin sıfır noktasından alınan iletken sıfır hattı olarak dağıtım boyunca çekilir ve sıfırlama hattı adı verilir. Şebeke çalışmasında daha güvenilir olmak için bu hat sık sık topraklanır ve nötr hattı adını alır.
        </div>

        <div class="sub-heading">3- MESLEK HASTALIKLARI:</div>
        <div class="clause-item">
          Yapılan iş çeşidi, çalışılan yer, işin yoğunluğu gibi faktörler de iş kazalarından farklı olarak kısa veya uzun süreler içerisinde çalışılan kişinin hastalanmasına neden olabilir. Gerekli tedbirleri almak işyerinin ve çalışanın ortak görevidir.
        </div>

        <div class="sub-heading">4- İLK YARDIM:</div>
        <div class="clause-item">
          Herhangi bir nedenle üzerinden akım geçen kimse bundan etkilenir. Bu etki hafif sıçrama şeklinde olduğu gibi tehlikeli kasılmalara da sebep olur. Etkinin derecesi ne olursa olsun, yapılacak ilk iş kazaya uğrayanı elektrik şebekesi etkisinden kurtarmaktır. Bu iş, o anda çevrede bulunacak herhangi bir kuru yalıtkan gereçle yapılmalıdır. Tahta parçası, sopa, baston, giyim eşyası, ayakkabı v.b. gibi yalıtkan bir madde ile.<br>
          Kazayı hemen bir doktora haber verirken, kazaya uğrayanı kuru bir yere yatırınız. Şok etkisi ile dili boğazına kaydığından, ağzını açarak dilini dışarıya çekiniz. Ağzında ne varsa çıkarınız. Aksi halde kazazede boğulabilir. Sonra doktor gelinceye kadar sun'i solunuma başlayınız.
        </div>

        <div class="section-bar-soft">SUN'İ SOLUNUM UYGULAMA BASAMAKLARI:</div>
        <div class="clause-item" style="font-size:10px;">
          Sun'i solunum çeşitli şekilde yapılmaktadır. Fakat burada geliştirilen en son şeklinin uygulanışını açıklayacağız:
        </div>
        <div class="clause-item" style="padding-left:10px;">
          <strong>1.</strong> Kazaya uğrayanı yüz üstü yatırarak, başını çaprazladığınız kolları üzerine yatırınız. (Ağız açık bulunmalıdır).<br>
          <strong>2.</strong> Kazazedenin başucunda bir diziniz üzerine çökünüz ve ellerinizi kazazedenin ciğerlerini iki yandan kavrayacak şekilde sırtına koyunuz.<br>
          <strong>3.</strong> Dizinizin üstüne kalkarken ellerinizle kazazedenin ciğerlerine basarak, basınç yapınız. Bu basınç ile ciğerlerdeki hava dışarıya çıkartılmaktadır (Bu işi yaparken dirseklerini bükmeyiniz).<br>
          <strong>4.</strong> Ayak topuğunuzun üstüne oturunuz ve kazazedenin kol dirseklerini çaprazlama kendinize doğru çekiniz. Bu hareketle ciğerler genişletilerek hava alması sağlanmış olur.<br>
          <strong>5.</strong> Ciğerlere basınç yapma ve dirseklerden çekerek hava alması işlemini dakikada on iki (12) defa yapınız (Ya da her iki işlem yavaş yavaş 1-2 sayılarak da sürdürülebilir).<br>
          <strong>6.</strong> Kazazedenin kendi kendine nefes almasından sonra bir süre daha bu hareketlere devam ediniz.<br>
          <strong>7.</strong> Gelen doktorun yapacağı tedavi ile önerilerine uymayı unutmayınız.
        </div>
      </div>

      <div class="doc-footer">
        <span>EK_2 • İş Güvenliği Talimatı ve Tutanağı (Bölüm 4/5)</span>
        <span>İlk Yardım ve Elektrik Güvenliği</span>
        <span>Sayfa 16 / 20</span>
      </div>
    `
  },

  /* ========================================================================
     SAYFA 17: İŞ GÜVENLİĞİ TALİMATI VE TUTANAĞI - EK_2 SAYFA 5/5 (1-30 İMZA LİSTESİ)
     ======================================================================== */
  {
    id: "isg-5",
    docGroup: "isg",
    docTitle: "17. İş Güvenliği Talimatı İmza Çizelgesi (EK_2 - Sayfa 5/5)",
    pageNumber: 17,
    html: `
      <div class="doc-header" style="padding-bottom:6px; margin-bottom:6px;">
        <span class="doc-code-badge" contenteditable="true">EK_2</span>
        <div class="doc-ministry" data-bind="egitimYili" contenteditable="true">2026 / 2027 EĞİTİM ÖĞRETİM YILI</div>
        <div class="doc-title" style="font-size:15px;" contenteditable="true">İŞ GÜVENLİĞİ TALİMATI VE TUTANAĞI • SINIF İMZA ÇİZELGESİ</div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; background:var(--doc-accent-soft); border:1px solid var(--doc-primary); border-radius:6px; padding:5px 10px; margin-bottom:6px; font-size:10.8px;">
        <div style="font-weight:700;" contenteditable="true">
          "İş güvenliği talimatları öğretmenim tarafından okundu ve anlatıldı, gerekli bilgileri aldım."
        </div>
        <div style="font-family:var(--font-heading); font-weight:800; color:var(--doc-primary);" contenteditable="true">
          SINIF / ŞUBE : <span data-bind="sinifSube">........ / ........</span>
        </div>
      </div>

      <div style="flex:1; display:flex; flex-direction:column;">
        <table class="doc-table" style="flex:1;">
          <thead>
            <tr>
              <th style="width:7%;">SIRA NO</th>
              <th style="width:12%;">OKUL NO</th>
              <th style="width:27%;">ÖĞRENCİ ADI SOYADI</th>
              <th style="width:15%;">ÖĞRENCİ İMZA</th>
              <th style="width:24%;">VELİ ADI SOYADI</th>
              <th style="width:15%;">VELİ İMZA</th>
            </tr>
          </thead>
          <tbody>
            ${renderSignListRows30()}
          </tbody>
        </table>
      </div>

      <div class="doc-footer">
        <span>EK_2 • İş Güvenliği Talimatı ve Tutanağı (Bölüm 5/5)</span>
        <span>Sınıf / Grup Tebellüğ Çizelgesi</span>
        <span>Sayfa 17 / 20</span>
      </div>
    `
  },

  /* ========================================================================
     SAYFA 18: PROJE / RESİM / RAPOR / DENEY FORMU (Proje Resim Rapor Deney Formu.pdf)
     ======================================================================== */
  {
    id: "proje-formu",
    docGroup: "proje",
    docTitle: "18. Proje / Resim / Rapor / Deney Değerlendirme Formu",
    pageNumber: 18,
    html: `
      <table class="doc-table" style="border:2px solid var(--doc-primary);">
        <tbody>
          <tr>
            <th style="width:74%; font-size:13px; padding:7px 10px; background:var(--doc-table-header-bg); color:#fff;" contenteditable="true">
              İŞİN ADI :
            </th>
            <th style="width:26%; font-size:12px; padding:7px 10px; background:var(--doc-accent-mid); color:var(--doc-primary); text-align:left;" contenteditable="true">
              İŞİN RESİM NO :
            </th>
          </tr>
          <tr>
            <td colspan="2" style="background:var(--doc-accent-soft); font-family:var(--font-heading); font-weight:800; font-size:11.5px; color:var(--doc-primary); padding:5px 10px; letter-spacing:0.5px;" contenteditable="true">
              PROJE / RESİM / RAPOR / DENEY UYGULAMA VE ÇİZİM ALANI
            </td>
          </tr>
        </tbody>
      </table>

      <!-- GENİŞ PROJE / ÇİZİM / RAPOR ALANI -->
      <div style="flex:1; border-left:2px solid var(--doc-primary); border-right:2px solid var(--doc-primary); position:relative; padding:14px; background-image: radial-gradient(rgba(100,116,139,0.22) 1px, transparent 1px); background-size: 18px 18px;" contenteditable="true">
      </div>

      <!-- ALT DEĞERLENDİRME VE SÜRE TABLOSU -->
      <table class="doc-table" style="border:2px solid var(--doc-primary); font-size:10px;">
        <thead>
          <tr>
            <th style="width:21%;">İŞE BAŞLAMA</th>
            <th style="width:21%;">İŞ BİTİRME</th>
            <th colspan="12" style="width:58%;">DEĞERLENDİRME TABLOSU</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowspan="3" style="vertical-align:top; padding:6px; line-height:1.55;" contenteditable="true">
              <div><strong>Tarihi :</strong> ....../....../202...</div>
              <div><strong>Saati :</strong> ....... : .......</div>
              <div style="margin-top:6px; border-top:1px dotted var(--doc-muted); padding-top:4px;">
                <strong style="color:var(--doc-primary);">Verilen Süre</strong><br>
                .................... Saat<br>
                .................... Dakika
              </div>
            </td>
            <td rowspan="3" style="vertical-align:top; padding:6px; line-height:1.55;" contenteditable="true">
              <div><strong>Tarihi :</strong> ....../....../202...</div>
              <div><strong>Saati :</strong> ....... : .......</div>
              <div style="margin-top:6px; border-top:1px dotted var(--doc-muted); padding-top:4px;">
                <strong style="color:var(--doc-primary);">Kullanılan Süre</strong><br>
                .................... Saat<br>
                .................... Dakika
              </div>
            </td>
            <th style="width:18%; font-size:9.3px;">Değerlendirmeye Esas Kriterler</th>
            <td style="width:3%; text-align:center;" contenteditable="true">1</td>
            <td style="width:3%; text-align:center;" contenteditable="true">2</td>
            <td style="width:3%; text-align:center;" contenteditable="true">3</td>
            <td style="width:3%; text-align:center;" contenteditable="true">4</td>
            <td style="width:3%; text-align:center;" contenteditable="true">5</td>
            <td style="width:3%; text-align:center;" contenteditable="true">6</td>
            <td style="width:3%; text-align:center;" contenteditable="true">7</td>
            <td style="width:3%; text-align:center;" contenteditable="true">8</td>
            <td style="width:3%; text-align:center;" contenteditable="true">9</td>
            <td style="width:3%; text-align:center;" contenteditable="true">10</td>
            <th rowspan="2" style="width:13%; text-align:center; font-size:9.5px; background:var(--doc-accent-soft);">Takdir Edilen Toplam Puan</th>
          </tr>
          <tr>
            <th style="font-size:9.3px;">Değerlendirmeye Tam Puan</th>
            <td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td>
            <td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td>
          </tr>
          <tr>
            <th style="font-size:9.3px;">İşe Verilen Puan</th>
            <td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td>
            <td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td><td contenteditable="true"></td>
            <td style="font-size:9px; padding:4px;" contenteditable="true">
              <strong>Rakam ile:</strong><br>
              <strong>Yazı ile:</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- İMZA VE GERÇEK QR KOD ALANI -->
      <div style="display:flex; border:2px solid var(--doc-primary); border-top:none; border-radius: 0 0 8px 8px; overflow:hidden;">
        <div style="flex:1; display:grid; grid-template-columns: repeat(3, 1fr);">
          <div style="border-right:1px solid var(--doc-table-border); padding:7px; text-align:center; min-height:82px;" contenteditable="true">
            <div style="font-family:var(--font-heading); font-weight:800; font-size:10.5px; color:var(--doc-primary);">ÖĞRENCİNİN</div>
            <div style="font-size:9.5px; color:var(--doc-muted);" data-bind="ogrenciAdSoyad">Adı Soyadı – İmza</div>
          </div>
          <div style="border-right:1px solid var(--doc-table-border); padding:7px; text-align:center; min-height:82px;" contenteditable="true">
            <div style="font-family:var(--font-heading); font-weight:800; font-size:10px; color:var(--doc-primary);">USTA ÖĞRETİCİ / EĞİTİCİ PERSONELİN</div>
            <div style="font-size:9.5px; color:var(--doc-muted);" data-bind="ustaAdSoyad">Adı Soyadı – İmza</div>
          </div>
          <div style="border-right:1px solid var(--doc-table-border); padding:7px; text-align:center; min-height:82px;" contenteditable="true">
            <div style="font-family:var(--font-heading); font-weight:800; font-size:10.2px; color:var(--doc-primary);">KOORDİNATÖR ÖĞRETMENİN</div>
            <div style="font-size:9.5px; color:var(--doc-muted);" data-bind="koordinatorAdSoyad">Adı Soyadı – İmza</div>
          </div>
        </div>
        <div style="padding:4px 8px; display:flex; align-items:center; justify-content:center; background:var(--doc-accent-soft);">
          ${window.CORUM_MESEM_QR_SVG}
        </div>
      </div>

      <div class="doc-footer" style="margin-top:4px;">
        <span>Bu formun orijinal kopyasına ulaşmak için <strong>https://corummesem.meb.k12.tr/</strong> adresini ziyaret ediniz.</span>
        <span>Sayfa 18 / 20</span>
      </div>
    `
  },

  /* ========================================================================
     SAYFA 19: MEB-İMES STAJ DOSYASI RAPORU - SAYFA 1/2
     ======================================================================== */
  {
    id: "meb-imes-1",
    docGroup: "imes",
    docTitle: "19. MEB-İMES Staj ve Mesleki Eğitim Süreçleri (Sayfa 1/2)",
    pageNumber: 19,
    html: `
      <div class="doc-header">
        <span class="doc-code-badge" contenteditable="true">MEB-İMES • S.1</span>
        <div class="doc-ministry" contenteditable="true">T.C. MİLLÎ EĞİTİM BAKANLIĞI • DİJİTAL MESLEKİ EĞİTİM SİSTEMİ</div>
        <div class="doc-title" contenteditable="true">İŞLETMELERDE MESLEKİ EĞİTİM VE STAJ MOBİL UYGULAMASI (MEB-İMES)</div>
        <div class="doc-subtitle" contenteditable="true">Staj ve Mesleki Eğitim Süreçleri Uygulama Kılavuzu</div>
      </div>

      <div style="flex:1; display:flex; flex-direction:column; justify-content:space-between; gap:10px; font-size:11.2px; line-height:1.48; text-align:justify;" contenteditable="true">
        <div>
          <div class="section-bar" style="margin-bottom:8px;"><span>1. UYGULAMANIN DAYANAĞI VE AMACI</span></div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div style="background:var(--doc-accent-soft); border-left:4px solid var(--doc-primary); border-radius:4px; padding:9px 12px;">
              <strong style="color:var(--doc-primary);">Yasal Dayanak:</strong> 9 Ağustos 2024 tarihli ve 32628 sayılı Resmî Gazete’de yayımlanan <strong>2024/10 sayılı Cumhurbaşkanlığı Genelgesi</strong> ile yürürlüğe konulan <em>Mesleki ve Teknik Eğitim Politika Belgesi</em>’nin 3.1.2 maddesi kapsamında, mesleki eğitim ve staj süreçlerinin dijitalleştirilmesi amacıyla <strong>MEB-İMES</strong> mobil uygulaması kullanıma açılmıştır.
            </div>
            <div style="background:var(--doc-accent-soft); border-left:4px solid var(--doc-accent); border-radius:4px; padding:9px 12px;">
              <strong style="color:var(--doc-primary);">Uygulamanın Amacı:</strong> İşletmelerde mesleki eğitim ve staj süreçlerinde öğrenci, öğretmen, okul yönetimi ve işletme yetkilileri arasında etkin bir köprü kurmak; karşılıklı değerlendirme, takip ve denetim mekanizmalarını dijital ortama taşımaktır.
            </div>
            <div style="background:var(--doc-accent-soft); border-left:4px solid var(--doc-secondary); border-radius:4px; padding:9px 12px;">
              <strong style="color:var(--doc-primary);">Temel İşlevi:</strong> Öğrencilerin işletmelerdeki mesleki eğitim ve staj süreçlerinin planlanması, izlenmesi, devamsızlık takibi ve değerlendirilmesine destek olmaktır. Koordinatör öğretmenler görevlerini MEB-İMES üzerinden <strong>QR kod doğrulamasıyla</strong> gerçekleştirecek olup, fiziki form doldurma zorunluluğu ortadan kalkmıştır.
            </div>
          </div>
        </div>

        <div>
          <div class="section-bar" style="margin-bottom:8px;"><span>2. KULLANICI ROLLERİ VE İŞLEYİŞ ESASLARI</span></div>
          <p style="margin-bottom:8px;">
            MEB-İMES sistemi, farklı paydaşların yetki ve sorumluluklarına göre yapılandırılmış modüller içermektedir:
          </p>

          <div class="section-bar-soft" style="margin-bottom:6px;">A. Okul Yönetimi ve Öğretmen İşlemleri</div>
          <ul style="padding-left:20px; display:flex; flex-direction:column; gap:6px; margin-bottom:10px;">
            <li><strong>Öğrenci ve Sınıf Takibi:</strong> Öğretmenler sınıf işlemlerini, ders ve işletme notu işlemlerini sistem üzerinden takip eder.</li>
            <li><strong>Devamsızlık Yönetimi:</strong> Okul yönetimi ve öğretmenler tarafından günlük veya aylık olarak okul ve işletme devamsızlıkları kayıt altına alınır; devamsızlık bilgileri anlık olarak velilere bildirilir.</li>
            <li><strong>İşletme Ziyaretleri ve Koordinatörlük:</strong> Öğretmenlere haftalık ve aylık ziyaret listeleri atanır. Ziyaretler esnasında öğrencinin durumu incelenir ve öğretmen ile işletme yetkilisi mobil cihazları üzerinden <strong>120 saniye içinde karşılıklı QR kod okutarak</strong> ziyareti doğrular.</li>
            <li><strong>Alternatif Onay Süreci:</strong> QR kodun kullanılamadığı durumlarda haftalık görev formu kullanılır ve bu form müdür yardımcısı tarafından sistem üzerinden onaylanır.</li>
          </ul>

          <div class="section-bar-soft" style="margin-bottom:6px;">B. İşletme Yetkilisi ve Usta Öğretici İşlemleri</div>
          <ul style="padding-left:20px; display:flex; flex-direction:column; gap:6px;">
            <li><strong>Eğitim Süreci Takibi:</strong> Usta öğreticiler, öğrencilerin işletmede kazandıkları becerileri, yaptıkları işleri ve puanlarını sisteme kaydeder.</li>
            <li><strong>Öğrenci Arama ve Talep Oluşturma:</strong> İşletmeler kurum tarafından tanımlanan kontenjanlar doğrultusunda il veya Türkiye geneline öğrenci arama talebi oluşturabilir.</li>
            <li><strong>Günlük Devamsızlık Bildirimi:</strong> Öğrencinin işletmedeki devam durumu günlük olarak sisteme girilerek anlık paylaşılır.</li>
          </ul>
        </div>

        <div style="border:1.5px solid var(--doc-primary); border-radius:8px; padding:10px 14px; background:#fff;">
          <div style="font-family:var(--font-heading); font-weight:800; font-size:11.5px; color:var(--doc-primary); margin-bottom:4px;">
            MEB-İMES MOBİL DOĞRULAMA PRENSİBİ (120 SANİYE KURALI)
          </div>
          <div style="font-size:10.5px; color:var(--doc-muted);">
            Koordinatör öğretmen işletme ziyaretinde bulunduğunda, MEB-İMES mobil uygulaması üzerinden üretilen dinamik karekod (QR) 120 saniye süreyle geçerlidir. İşletme yetkilisi / usta öğretici ve koordinatör öğretmenin eş zamanlı doğrulaması ile denetim kaydı konum ve zaman damgalı olarak MEB sunucularına işlenir.
          </div>
        </div>
      </div>

      <div class="doc-footer">
        <span>MEB-İMES Staj ve Mesleki Eğitim Süreçleri</span>
        <span>Rapor Sayfa 1 / 2</span>
        <span>Sayfa 19 / 20</span>
      </div>
    `
  },

  /* ========================================================================
     SAYFA 20: MEB-İMES STAJ DOSYASI RAPORU - SAYFA 2/2
     ======================================================================== */
  {
    id: "meb-imes-2",
    docGroup: "imes",
    docTitle: "20. MEB-İMES Staj ve Mesleki Eğitim Süreçleri (Sayfa 2/2)",
    pageNumber: 20,
    html: `
      <div class="doc-header">
        <span class="doc-code-badge" contenteditable="true">MEB-İMES • S.2</span>
        <div class="doc-ministry" contenteditable="true">T.C. MİLLÎ EĞİTİM BAKANLIĞI • DİJİTAL MESLEKİ EĞİTİM SİSTEMİ</div>
        <div class="doc-title" contenteditable="true">MEB-İMES PAYDAŞ İŞLEMLERİ VE SİSTEM İŞLEYİŞ AKIŞ ÖZETİ</div>
      </div>

      <div style="flex:1; display:flex; flex-direction:column; justify-content:space-between; gap:10px; font-size:11.2px; line-height:1.48; text-align:justify;" contenteditable="true">
        <div>
          <div class="section-bar-soft" style="margin-bottom:6px;">C. Veli ve Öğrenci İşlemleri</div>
          <ul style="padding-left:20px; display:flex; flex-direction:column; gap:6px; margin-bottom:10px;">
            <li><strong>Süreç İzleme:</strong> Veli ve öğrenciler; okul, ders ve işletme devamsızlıklarını, dönem notlarını, işletme eğitim puanlarını ve kazanım bilgilerini anlık olarak görüntüleyebilir.</li>
            <li><strong>İşletme Onayı:</strong> Kurumlar tarafından kaydedilen işletme bilgilerini inceleyerek uygun bulmaları durumunda onay verebilirler.</li>
            <li><strong>İşletme Arama:</strong> Öğrenciler, kendi dallarına ve cinsiyetlerine uygun olarak il genelindeki onaylı işletme kontenjanlarını listeleyebilir.</li>
          </ul>

          <div class="section-bar-soft" style="margin-bottom:6px;">D. Kalfalık, Ustalık ve Usta Öğreticilik Sınav Adayı İşlemleri</div>
          <p style="padding-left:4px;">
            Sınav adayları sistem üzerinden e-Sınav ve uygulama sınavı giriş belgelerine erişebilir, sınav sonuçlarını (e-Sınav ve yüz yüze beceri sınavları) detaylı olarak takip edebilir ve belgelerini görüntüleyebilir.
          </p>
        </div>

        <div>
          <div class="section-bar" style="margin-bottom:8px;"><span>3. SONUÇ VE DEĞERLENDİRME</span></div>
          <div style="background:var(--doc-accent-soft); border-left:5px solid var(--doc-primary); padding:12px 16px; border-radius:0 6px 6px 0;">
            MEB-İMES uygulaması ile staj ve mesleki eğitim süreçlerindeki bürokratik işlemler minimuma indirilmiş, evrak süreçleri dijitalleştirilmiş ve tüm paydaşların <strong>(Okul, Öğretmen, İşletme, Veli, Öğrenci)</strong> eş zamanlı ve şeffaf bir şekilde iletişim kurması sağlanmıştır. QR kod tabanlı doğrulama mekanizması denetimlerin güvenilirliğini artırmıştır.
          </div>
        </div>

        <div>
          <div class="section-bar" style="margin-bottom:6px;"><span>SİSTEM İŞLEYİŞ AKIŞ ÖZETİ TABLOSU</span></div>
          <table class="doc-table">
            <thead>
              <tr>
                <th style="width:24%;">Rol / Paydaş</th>
                <th style="width:36%;">Temel Sorumluluk</th>
                <th style="width:40%;">MEB-İMES Üzerindeki İşlemi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Öğretmen / Koordinatör</th>
                <td>Stajyer ve öğrenci takibi, işletme ziyaretleri</td>
                <td>QR kod ile ziyaret doğrulama, devamsızlık ve ders notu girişi</td>
              </tr>
              <tr>
                <th>İşletme / Usta Öğretici</th>
                <td>Pratik eğitim, kazanım aktarımı, puanlama</td>
                <td>Günlük devamsızlık girişi, kazanım ve performans puanı kaydı</td>
              </tr>
              <tr>
                <th>Veli / Öğrenci</th>
                <td>Eğitim ve devamsızlık takibi</td>
                <td>Not, karne, devamsızlık ve işletme arama/onay işlemleri</td>
              </tr>
              <tr>
                <th>Okul Yönetimi</th>
                <td>Genel onay, denetim ve organizasyon</td>
                <td>Form onayları, devamsızlık raporlama ve koordinatörlük takibi</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- SAYFAYI TAM DOLDURAN BİLGİLENDİRME VE TEBELLÜĞ KUTUSU -->
        <div style="border:1.5px solid var(--doc-primary); border-radius:8px; padding:10px 12px; background:var(--doc-accent-soft);">
          <div style="font-family:var(--font-heading); font-weight:800; font-size:11px; color:var(--doc-primary); text-align:center; margin-bottom:6px;">
            MEB-İMES UYGULAMA KILAVUZU BİLGİLENDİRME VE DOSYA KONTROL ONAYI
          </div>
          <div style="font-size:10px; margin-bottom:8px; text-align:center;">
            İşletmelerde Mesleki Eğitim ve Staj Mobil Uygulaması (MEB-İMES) süreçleri hakkında öğrenci, veli ve işletme yetkilisi bilgilendirilmiştir.
          </div>
          <div class="sig-grid" style="grid-template-columns: repeat(3, 1fr);">
            <div class="sig-box" style="min-height:68px; padding:5px;">
              <div class="sig-title">ÖĞRENCİ</div>
              <div data-bind="ogrenciAdSoyad">Adı Soyadı / İmza</div>
            </div>
            <div class="sig-box" style="min-height:68px; padding:5px;">
              <div class="sig-title">İŞLETME / USTA ÖĞRETİCİ</div>
              <div data-bind="ustaAdSoyad">Adı Soyadı / İmza</div>
            </div>
            <div class="sig-box" style="min-height:68px; padding:5px;">
              <div class="sig-title">KOORDİNATÖR ÖĞRETMEN</div>
              <div data-bind="koordinatorAdSoyad">Adı Soyadı / İmza</div>
            </div>
          </div>
        </div>
      </div>

      <div class="doc-footer">
        <span>MEB-İMES Staj ve Mesleki Eğitim Süreçleri</span>
        <span>Rapor Sayfa 2 / 2</span>
        <span>Sayfa 20 / 20</span>
      </div>
    `
  }
];

window.ALL_DOC_PAGES = [...window.DOC_PAGES_PART1, ...window.DOC_PAGES_PART2];
