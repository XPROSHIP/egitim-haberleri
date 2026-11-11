/* ==========================================================================
   ÇORUM MESLEKİ EĞİTİM MERKEZİ - STAJ DOSYASI UYGULAMA MOTORU (app.js)
   Tema, Monokrom Lamba, Font Seçimi, Yuvarlatılmış Çerçeve, Ses & Pan-Zoom
   ========================================================================== */

const THEME_PRESETS = {
  klasik: {
    name: "1. Klasik Resmi (Yuvarlatılmış)",
    frame: "rounded",
    headerStyle: "standard",
    headingFont: "'Montserrat', sans-serif",
    bodyFont: "'Noto Sans', sans-serif",
    headingScale: 1.0
  },
  akademik: {
    name: "2. Akademik Prestij (Çift Çerçeve)",
    frame: "double",
    headerStyle: "standard",
    headingFont: "'DM Serif Text', serif",
    bodyFont: "'Scope One', serif",
    headingScale: 1.04
  },
  oriental: {
    name: "3. Oriental & Selçuklu Süslü",
    frame: "oriental",
    headerStyle: "royal",
    headingFont: "'Fraunces', serif",
    bodyFont: "'EB Garamond', 'Apple Garamond', Georgia, serif",
    headingScale: 1.05
  },
  artistik: {
    name: "4. Artistik Modern (Büyük Başlıklar)",
    frame: "single",
    headerStyle: "artistic",
    headingFont: "'Space Grotesk', sans-serif",
    bodyFont: "'Prompt', sans-serif",
    headingScale: 1.12
  },
  premium: {
    name: "5. Diplomatik Lüks & Kolej",
    frame: "diplomatic",
    headerStyle: "royal",
    headingFont: "'Cinzel', 'Trajan Pro', serif",
    bodyFont: "'Crimson Pro', Georgia, serif",
    headingScale: 1.05
  }
};

const FONT_CATALOG = [
  // Kullanıcının Özel İstediği Fontlar
  { label: "Space Grotesk (Modern Teknik)", value: "'Space Grotesk', sans-serif", group: "İstenen Fontlar" },
  { label: "Montserrat (Kurumsal Güçlü)", value: "'Montserrat', sans-serif", group: "İstenen Fontlar" },
  { label: "Fraunces (Artistik & Prestij Serif)", value: "'Fraunces', serif", group: "İstenen Fontlar" },
  { label: "Prompt (Geometrik & Dengeli)", value: "'Prompt', sans-serif", group: "İstenen Fontlar" },
  { label: "Sansation (Modern Fütüristik)", value: "'Sansation', 'Outfit', sans-serif", group: "İstenen Fontlar" },
  { label: "Scope One (Zarif Akademik)", value: "'Scope One', serif", group: "İstenen Fontlar" },
  { label: "DM Serif Text (Klasik Manşet)", value: "'DM Serif Text', serif", group: "İstenen Fontlar" },
  { label: "Cocoon / Comfortaa (Yumuşak Artistik)", value: "'Comfortaa', 'Plus Jakarta Sans', cursive", group: "İstenen Fontlar" },
  { label: "Kite One (Akıcı Hümanist)", value: "'Kite One', sans-serif", group: "İstenen Fontlar" },
  { label: "Apple Garamond / EB Garamond (Klasik)", value: "'Apple Garamond', 'EB Garamond', Georgia, serif", group: "İstenen Fontlar" },
  { label: "Arial (Standart Resmi)", value: "Arial, Helvetica, sans-serif", group: "İstenen Fontlar" },
  { label: "Times New Roman (Geleneksel Resmi)", value: "'Times New Roman', Times, serif", group: "İstenen Fontlar" },
  { label: "Noto Sans (Kusursuz Okunabilirlik)", value: "'Noto Sans', sans-serif", group: "İstenen Fontlar" },
  { label: "Noto Serif (Resmi Evrak Serif)", value: "'Noto Serif', serif", group: "İstenen Fontlar" },

  // Önerilen Premium Fontlar
  { label: "★ Cinzel (Diplomatik & Oriental Başlık)", value: "'Cinzel', serif", group: "Önerilen Premium Fontlar" },
  { label: "★ Playfair Display (Lüks Editoryal Başlık)", value: "'Playfair Display', serif", group: "Önerilen Premium Fontlar" },
  { label: "★ Cormorant Garamond (Zarif Saray Stili)", value: "'Cormorant Garamond', serif", group: "Önerilen Premium Fontlar" },
  { label: "★ Crimson Pro (Akademik Kitap Stili)", value: "'Crimson Pro', serif", group: "Önerilen Premium Fontlar" },
  { label: "★ Plus Jakarta Sans (Yeni Nesil Kurumsal)", value: "'Plus Jakarta Sans', sans-serif", group: "Önerilen Premium Fontlar" },
  { label: "★ Outfit (Temiz & Modern Geometrik)", value: "'Outfit', sans-serif", group: "Önerilen Premium Fontlar" },
  { label: "★ Spectral (Resmi Mevzuat & Rapor)", value: "'Spectral', serif", group: "Önerilen Premium Fontlar" },
  { label: "★ Libre Baskerville (Kolej & Sertifika)", value: "'Libre Baskerville', serif", group: "Önerilen Premium Fontlar" }
];

// Uygulama Durumu
const state = {
  theme: "klasik",
  frame: "rounded",
  headerStyle: "standard",
  monochrome: false,
  headingFont: "'Montserrat', sans-serif",
  bodyFont: "'Noto Sans', sans-serif",
  headingScale: 1.0,
  bodyScale: 1.0,
  editMode: false,
  panX: 0,
  panY: 20,
  zoom: 0.75,
  currentPageIndex: 0
};

/* ==========================================================================
   WEB AUDIO API TIKLAMA SES MOTORU (Harici Ses Dosyası Gerektirmez)
   ========================================================================== */
let audioCtx = null;

function playUISound(type = "click") {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === "theme") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.065);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "lamp") {
      osc.type = "sine";
      const startFreq = state.monochrome ? 680 : 440;
      const endFreq = state.monochrome ? 380 : 880;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.08);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.095);
    } else if (type === "print") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.06);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.17);
    } else {
      // Standart mekanik/dokunsal düğme sesi
      osc.type = "sine";
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.028);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);
      osc.start(now);
      osc.stop(now + 0.035);
    }
  } catch (_) {
    // Ses engellenirse sessizce devam et
  }
}

function initGlobalClickSounds() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button, .doc-item, input[type='checkbox']");
    if (!btn) return;
    if (btn.classList.contains("trigger-print")) {
      playUISound("print");
    } else if (btn.classList.contains("theme-lamp-btn")) {
      // Lamba sesi kendi dinleyicisinde çalınır
    } else if (btn.classList.contains("theme-card")) {
      playUISound("theme");
    } else {
      playUISound("click");
    }
  });

  document.querySelectorAll("select").forEach((sel) => {
    sel.addEventListener("change", () => playUISound("click"));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initGlobalClickSounds();
  initFontSelectors();
  renderAllPages();
  initDocFilterList();
  initThemeAndStyleControls();
  initSmartFormBinding();
  initPanAndZoom();
  initDrawerAndMobileNav();
  fitViewportInitial();

  window.addEventListener("resize", () => {
    updateStageTransform();
  });

  window.addEventListener("beforeprint", () => {
    autoFitPageContents();
  });
});

/* ==========================================================================
   1. FONT SEÇİCİLERİNİ DOLDURMA (BAŞLIK VE METİN AYRI AYRI)
   ========================================================================== */
function initFontSelectors() {
  const headingSelect = document.getElementById("select-heading-font");
  const bodySelect = document.getElementById("select-body-font");
  if (!headingSelect || !bodySelect) return;

  const groups = {};
  FONT_CATALOG.forEach((f) => {
    if (!groups[f.group]) groups[f.group] = [];
    groups[f.group].push(f);
  });

  [headingSelect, bodySelect].forEach((selectEl) => {
    selectEl.innerHTML = "";
    Object.keys(groups).forEach((groupName) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = groupName;
      groups[groupName].forEach((font) => {
        const opt = document.createElement("option");
        opt.value = font.value;
        opt.textContent = font.label;
        opt.style.fontFamily = font.value;
        optgroup.appendChild(opt);
      });
      selectEl.appendChild(optgroup);
    });
  });

  headingSelect.value = state.headingFont;
  bodySelect.value = state.bodyFont;

  headingSelect.addEventListener("change", (e) => {
    state.headingFont = e.target.value;
    applyTypography();
  });

  bodySelect.addEventListener("change", (e) => {
    state.bodyFont = e.target.value;
    applyTypography();
  });
}

function applyTypography() {
  document.documentElement.style.setProperty("--font-heading", state.headingFont);
  document.documentElement.style.setProperty("--font-body", state.bodyFont);
  document.documentElement.style.setProperty("--heading-scale", state.headingScale);
  document.documentElement.style.setProperty("--body-scale", state.bodyScale);
  requestAnimationFrame(autoFitPageContents);
}

/* ==========================================================================
   2. 20 A4 SAYFASINI OLUŞTURMA VE SAYFA NUMARALANDIRMA
   ========================================================================== */
function renderAllPages() {
  const stage = document.getElementById("canvas-stage");
  if (!stage) return;
  stage.innerHTML = "";

  window.ALL_DOC_PAGES.forEach((pageData, idx) => {
    const pageEl = createPageElement(pageData, idx);
    stage.appendChild(pageEl);
  });

  renumberVisiblePages();
  requestAnimationFrame(autoFitPageContents);
}

function createPageElement(pageData, idx) {
  const article = document.createElement("article");
  article.className = "a4-page";
  article.id = `page-${pageData.id}`;
  article.dataset.pageId = pageData.id;
  article.dataset.docGroup = pageData.docGroup;
  article.dataset.index = idx;

  article.innerHTML = `
    <div class="screen-page-badge">
      <span>${pageData.docTitle}</span>
      <span class="badge-page-num">A4 • Sayfa ${idx + 1}</span>
    </div>
    ${window.ORNAMENT_SVG}
    <div class="page-frame">
      ${pageData.html}
    </div>
  `;
  return article;
}

function renumberVisiblePages() {
  const visiblePages = Array.from(document.querySelectorAll(".a4-page:not(.hidden-doc)"));
  const total = visiblePages.length;
  visiblePages.forEach((pageEl, i) => {
    const num = i + 1;
    const badgeNum = pageEl.querySelector(".badge-page-num");
    if (badgeNum) badgeNum.textContent = `A4 (210×297mm) • Sayfa ${num} / ${total}`;
    const footerSpans = pageEl.querySelectorAll(".doc-footer span:last-child");
    footerSpans.forEach((sp) => {
      sp.textContent = `Sayfa ${num} / ${total}`;
    });
  });

  const pageCounter = document.getElementById("hud-page-indicator");
  if (pageCounter) {
    const curr = Math.min(state.currentPageIndex + 1, Math.max(1, total));
    pageCounter.textContent = `${curr} / ${total}`;
  }
}

/* Sayfa içeriğinin A4 çerçevesine kusursuz oturmasını sağlayan akıllı ölçekleyici */
function autoFitPageContents() {
  const pages = document.querySelectorAll(".a4-page:not(.hidden-doc)");
  pages.forEach((page) => {
    const frame = page.querySelector(".page-frame");
    if (!frame) return;
    frame.style.transform = "none";
    frame.style.width = "100%";
    frame.style.height = "100%";

    const availableH = page.clientHeight - 56;
    const actualH = frame.scrollHeight;
    if (actualH > availableH + 4) {
      const ratio = availableH / actualH;
      frame.style.transformOrigin = "top center";
      frame.style.transform = `scale(${Math.max(0.84, ratio)})`;
      frame.style.height = `${100 / Math.max(0.84, ratio)}%`;
    }
  });
}

/* ==========================================================================
   3. TEMA, LAMBA (MONOKROM), ÇERÇEVE VE BAŞLIK STİLİ KONTROLLERİ
   ========================================================================== */
function initThemeAndStyleControls() {
  // Tema kartları
  document.querySelectorAll(".theme-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".theme-lamp-btn")) return;
      const themeKey = card.dataset.themeChoice;
      applyThemePreset(themeKey);
    });
  });

  // Her temanın üzerindeki Lamba (Monokrom Siyah-Beyaz / Renkli) Düğmesi
  document.querySelectorAll(".theme-lamp-btn").forEach((lampBtn) => {
    lampBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const parentCard = lampBtn.closest(".theme-card");
      const themeKey = parentCard?.dataset.themeChoice;

      // Başka bir temanın lambasına basıldıysa önce o temayı seç
      if (themeKey && state.theme !== themeKey) {
        applyThemePreset(themeKey);
      }

      state.monochrome = !state.monochrome;
      document.body.setAttribute("data-monochrome", state.monochrome ? "true" : "false");
      playUISound("lamp");
    });
  });

  // Çerçeve seçenekleri
  document.querySelectorAll(".frame-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const frameKey = btn.dataset.frameChoice;
      state.frame = frameKey;
      document.body.setAttribute("data-frame", frameKey);
      document.querySelectorAll(".frame-option").forEach((b) =>
        b.classList.toggle("active", b.dataset.frameChoice === frameKey)
      );
      requestAnimationFrame(autoFitPageContents);
    });
  });

  // Başlık Stili seçici
  const headerStyleSelect = document.getElementById("select-header-style");
  if (headerStyleSelect) {
    headerStyleSelect.addEventListener("change", (e) => {
      state.headerStyle = e.target.value;
      document.body.setAttribute("data-header-style", state.headerStyle);
      requestAnimationFrame(autoFitPageContents);
    });
  }

  // Başlık & Metin Boyutu Ölçekleyiciler
  const headingScaleInput = document.getElementById("range-heading-scale");
  if (headingScaleInput) {
    headingScaleInput.addEventListener("input", (e) => {
      state.headingScale = parseFloat(e.target.value);
      const lbl = document.getElementById("val-heading-scale");
      if (lbl) lbl.textContent = `${Math.round(state.headingScale * 100)}%`;
      applyTypography();
    });
  }

  const bodyScaleInput = document.getElementById("range-body-scale");
  if (bodyScaleInput) {
    bodyScaleInput.addEventListener("input", (e) => {
      state.bodyScale = parseFloat(e.target.value);
      const lbl = document.getElementById("val-body-scale");
      if (lbl) lbl.textContent = `${Math.round(state.bodyScale * 100)}%`;
      applyTypography();
    });
  }
}

function applyThemePreset(themeKey) {
  const preset = THEME_PRESETS[themeKey];
  if (!preset) return;

  state.theme = themeKey;
  state.frame = preset.frame;
  state.headerStyle = preset.headerStyle;
  state.headingFont = preset.headingFont;
  state.bodyFont = preset.bodyFont;
  state.headingScale = preset.headingScale;

  document.body.setAttribute("data-theme", state.theme);
  document.body.setAttribute("data-frame", state.frame);
  document.body.setAttribute("data-header-style", state.headerStyle);

  document.querySelectorAll(".theme-card").forEach((c) =>
    c.classList.toggle("active", c.dataset.themeChoice === themeKey)
  );
  document.querySelectorAll(".frame-option").forEach((b) =>
    b.classList.toggle("active", b.dataset.frameChoice === state.frame)
  );

  const headingSelect = document.getElementById("select-heading-font");
  const bodySelect = document.getElementById("select-body-font");
  if (headingSelect) headingSelect.value = state.headingFont;
  if (bodySelect) bodySelect.value = state.bodyFont;

  const headerStyleSelect = document.getElementById("select-header-style");
  if (headerStyleSelect) headerStyleSelect.value = state.headerStyle;

  const headingScaleInput = document.getElementById("range-heading-scale");
  if (headingScaleInput) {
    headingScaleInput.value = state.headingScale;
    const lbl = document.getElementById("val-heading-scale");
    if (lbl) lbl.textContent = `${Math.round(state.headingScale * 100)}%`;
  }

  applyTypography();
}

/* ==========================================================================
   4. EVRAK LİSTESİ, FİLTRELEME VE YENİ PROJE SAYFASI EKLEME
   ========================================================================== */
function initDocFilterList() {
  const listEl = document.getElementById("doc-filter-list");
  if (!listEl) return;
  listEl.innerHTML = "";

  window.ALL_DOC_PAGES.forEach((p, idx) => {
    const item = document.createElement("div");
    item.className = "doc-item";
    item.innerHTML = `
      <label class="doc-item-left" onclick="event.stopPropagation()">
        <input type="checkbox" checked data-target-page="${p.id}">
        <span class="doc-item-title">${p.docTitle}</span>
      </label>
      <span class="doc-item-badge">S.${idx + 1}</span>
    `;

    item.addEventListener("click", () => {
      scrollToPageById(p.id);
    });

    const cb = item.querySelector("input[type='checkbox']");
    cb.addEventListener("change", (e) => {
      const pageEl = document.getElementById(`page-${p.id}`);
      if (pageEl) {
        pageEl.classList.toggle("hidden-doc", !e.target.checked);
        renumberVisiblePages();
      }
    });

    listEl.appendChild(item);
  });

  const btnAll = document.getElementById("btn-select-all-docs");
  const btnNone = document.getElementById("btn-select-none-docs");
  if (btnAll) {
    btnAll.addEventListener("click", () => {
      listEl.querySelectorAll("input[type='checkbox']").forEach((cb) => {
        cb.checked = true;
      });
      document.querySelectorAll(".a4-page").forEach((p) => p.classList.remove("hidden-doc"));
      renumberVisiblePages();
    });
  }
  if (btnNone) {
    btnNone.addEventListener("click", () => {
      listEl.querySelectorAll("input[type='checkbox']").forEach((cb, i) => {
        cb.checked = i === 0;
      });
      document.querySelectorAll(".a4-page").forEach((p, i) =>
        p.classList.toggle("hidden-doc", i !== 0)
      );
      renumberVisiblePages();
    });
  }

  const btnAddProje = document.getElementById("btn-add-proje-page");
  if (btnAddProje) {
    btnAddProje.addEventListener("click", () => {
      const template = window.ALL_DOC_PAGES.find((d) => d.id === "proje-formu");
      if (!template) return;
      const newIndex = window.ALL_DOC_PAGES.length;
      const cloneData = {
        ...template,
        id: `proje-formu-${newIndex + 1}`,
        docTitle: `${newIndex + 1}. Ek Proje / Resim / Rapor / Deney Formu`,
        pageNumber: newIndex + 1
      };
      window.ALL_DOC_PAGES.push(cloneData);
      const stage = document.getElementById("canvas-stage");
      const newEl = createPageElement(cloneData, newIndex);
      stage.appendChild(newEl);
      initDocFilterList();
      renumberVisiblePages();
      scrollToPageById(cloneData.id);
    });
  }
}

/* ==========================================================================
   5. AKILLI FORM DOLDURMA (TÜM SAYFALARA OTOMATİK YANSITMA)
   ========================================================================== */
function initSmartFormBinding() {
  const inputs = document.querySelectorAll("[data-form-field]");
  inputs.forEach((inp) => {
    inp.addEventListener("input", () => {
      const key = inp.dataset.formField;
      const val = inp.value.trim();
      document.querySelectorAll(`[data-bind="${key}"]`).forEach((target) => {
        target.textContent = val;
      });
      if (key === "dogumYeri" || key === "dogumTarihi") {
        const dy = document.querySelector('[data-form-field="dogumYeri"]')?.value.trim() || "";
        const dt = document.querySelector('[data-form-field="dogumTarihi"]')?.value.trim() || "";
        const combined = [dy, dt].filter(Boolean).join(" / ");
        document.querySelectorAll('[data-bind="dogumYeriTarihi"]').forEach((el) => {
          el.textContent = combined;
        });
      }
    });
  });

  const btnToggleEdit = document.getElementById("btn-toggle-edit");
  if (btnToggleEdit) {
    btnToggleEdit.addEventListener("click", () => {
      state.editMode = !state.editMode;
      document.body.classList.toggle("editing-enabled", state.editMode);
      document.getElementById("viewport").classList.toggle("edit-mode", state.editMode);
      btnToggleEdit.classList.toggle("active", state.editMode);
    });
  }
}

/* ==========================================================================
   6. 2D PAN (HER YÖNE SÜRÜKLEME) & PINCH-TO-ZOOM MOTORU (MOBİL + MASAÜSTÜ)
   ========================================================================== */
function initPanAndZoom() {
  const viewport = document.getElementById("viewport");
  if (!viewport) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialPanX = 0;
  let initialPanY = 0;

  let isPinching = false;
  let initialPinchDist = 0;
  let initialZoom = 1;
  let pinchCenterX = 0;
  let pinchCenterY = 0;

  viewport.addEventListener("mousedown", (e) => {
    if (state.editMode && e.target.closest("[contenteditable='true']")) return;
    if (e.button !== 0 && e.button !== 1) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialPanX = state.panX;
    initialPanY = state.panY;
    viewport.classList.add("grabbing");
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    state.panX = initialPanX + dx;
    state.panY = initialPanY + dy;
    updateStageTransform();
  });

  window.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      viewport.classList.remove("grabbing");
      updateCurrentPageFromScroll();
    }
  });

  viewport.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const rect = viewport.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.12 : 0.89;
        zoomAtPoint(state.zoom * factor, mouseX, mouseY);
      } else {
        state.panX -= e.deltaX;
        state.panY -= e.deltaY;
        updateStageTransform();
        updateCurrentPageFromScroll();
      }
    },
    { passive: false }
  );

  viewport.addEventListener(
    "touchstart",
    (e) => {
      if (state.editMode && e.target.closest("[contenteditable='true']")) return;

      if (e.touches.length === 1) {
        isDragging = true;
        isPinching = false;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        initialPanX = state.panX;
        initialPanY = state.panY;
      } else if (e.touches.length === 2) {
        isDragging = false;
        isPinching = true;
        initialPinchDist = getTouchDistance(e.touches[0], e.touches[1]);
        initialZoom = state.zoom;
        const rect = viewport.getBoundingClientRect();
        pinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        pinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      }
    },
    { passive: true }
  );

  viewport.addEventListener(
    "touchmove",
    (e) => {
      if (state.editMode && e.target.closest("[contenteditable='true']")) return;
      e.preventDefault();

      if (isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;
        state.panX = initialPanX + dx;
        state.panY = initialPanY + dy;
        updateStageTransform();
      } else if (isPinching && e.touches.length === 2) {
        const dist = getTouchDistance(e.touches[0], e.touches[1]);
        if (initialPinchDist > 10) {
          const newZoom = initialZoom * (dist / initialPinchDist);
          zoomAtPoint(newZoom, pinchCenterX, pinchCenterY);
        }
      }
    },
    { passive: false }
  );

  viewport.addEventListener("touchend", (e) => {
    if (e.touches.length === 0) {
      isDragging = false;
      isPinching = false;
      updateCurrentPageFromScroll();
    } else if (e.touches.length === 1) {
      isPinching = false;
      isDragging = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      initialPanX = state.panX;
      initialPanY = state.panY;
    }
  });

  document.getElementById("btn-zoom-in")?.addEventListener("click", () => {
    const rect = viewport.getBoundingClientRect();
    zoomAtPoint(state.zoom * 1.18, rect.width / 2, rect.height / 2);
  });

  document.getElementById("btn-zoom-out")?.addEventListener("click", () => {
    const rect = viewport.getBoundingClientRect();
    zoomAtPoint(state.zoom * 0.84, rect.width / 2, rect.height / 2);
  });

  document.getElementById("btn-zoom-fit")?.addEventListener("click", () => {
    fitViewportInitial();
  });

  document.getElementById("hud-zoom-label")?.addEventListener("click", () => {
    if (Math.abs(state.zoom - 1) < 0.05) {
      fitViewportInitial();
    } else {
      const rect = viewport.getBoundingClientRect();
      zoomAtPoint(1.0, rect.width / 2, 80);
    }
  });

  document.getElementById("btn-prev-page")?.addEventListener("click", () => {
    jumpToPageOffset(-1);
  });

  document.getElementById("btn-next-page")?.addEventListener("click", () => {
    jumpToPageOffset(1);
  });
}

function getTouchDistance(t1, t2) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.hypot(dx, dy);
}

function zoomAtPoint(targetZoom, pointX, pointY) {
  const clamped = Math.min(2.8, Math.max(0.28, targetZoom));
  const scaleChange = clamped / state.zoom;
  state.panX = pointX - (pointX - state.panX) * scaleChange;
  state.panY = pointY - (pointY - state.panY) * scaleChange;
  state.zoom = clamped;
  updateStageTransform();
}

function fitViewportInitial() {
  const viewport = document.getElementById("viewport");
  if (!viewport) return;
  const vw = viewport.clientWidth;
  const isMobile = window.innerWidth <= 960;

  const pageWidthWithMargin = isMobile ? 830 : 914;
  const fittedZoom = Math.min(1.05, Math.max(0.34, vw / pageWidthWithMargin));
  state.zoom = fittedZoom;

  const stageWidth = (794 + 120) * state.zoom;
  state.panX = (vw - stageWidth) / 2;
  state.panY = 16;
  updateStageTransform();
}

function updateStageTransform() {
  const stage = document.getElementById("canvas-stage");
  if (!stage) return;
  stage.style.transform = `translate3d(${state.panX}px, ${state.panY}px, 0) scale(${state.zoom})`;

  const zoomLbl = document.getElementById("hud-zoom-label");
  if (zoomLbl) {
    zoomLbl.textContent = `${Math.round(state.zoom * 100)}%`;
  }
}

function scrollToPageById(pageId) {
  const pageEl = document.getElementById(`page-${pageId}`);
  const viewport = document.getElementById("viewport");
  if (!pageEl || !viewport) return;

  const offsetTop = pageEl.offsetTop;
  const vw = viewport.clientWidth;
  const stageWidth = (794 + 120) * state.zoom;
  state.panX = (vw - stageWidth) / 2;
  state.panY = -offsetTop * state.zoom + 28;
  updateStageTransform();
  updateCurrentPageFromScroll();

  if (window.innerWidth <= 960) {
    document.getElementById("control-drawer")?.classList.add("closed");
  }
}

function jumpToPageOffset(delta) {
  const visiblePages = Array.from(document.querySelectorAll(".a4-page:not(.hidden-doc)"));
  if (!visiblePages.length) return;
  const nextIdx = Math.min(visiblePages.length - 1, Math.max(0, state.currentPageIndex + delta));
  state.currentPageIndex = nextIdx;
  const target = visiblePages[nextIdx];
  if (target) {
    scrollToPageById(target.dataset.pageId);
  }
}

function updateCurrentPageFromScroll() {
  const visiblePages = Array.from(document.querySelectorAll(".a4-page:not(.hidden-doc)"));
  if (!visiblePages.length) return;

  const viewTopInStage = (-state.panY + 180) / state.zoom;
  let bestIdx = 0;
  visiblePages.forEach((p, i) => {
    if (p.offsetTop <= viewTopInStage) {
      bestIdx = i;
    }
  });
  state.currentPageIndex = bestIdx;
  const pageCounter = document.getElementById("hud-page-indicator");
  if (pageCounter) {
    pageCounter.textContent = `${bestIdx + 1} / ${visiblePages.length}`;
  }
}

/* ==========================================================================
   7. ÇEKMECE SEKME GEÇİŞLERİ VE MOBİL ALT MENÜ
   ========================================================================== */
function initDrawerAndMobileNav() {
  const drawer = document.getElementById("control-drawer");
  const viewport = document.getElementById("viewport");
  const btnToggleDrawer = document.getElementById("btn-toggle-drawer");

  if (window.innerWidth <= 960 && drawer) {
    drawer.classList.add("closed");
  }

  btnToggleDrawer?.addEventListener("click", () => {
    drawer.classList.toggle("closed");
    viewport.classList.toggle("full-width", drawer.classList.contains("closed"));
    setTimeout(fitViewportInitial, 300);
  });

  document.querySelectorAll("[data-tab-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.tabTarget;
      openDrawerTab(targetId);
    });
  });

  document.querySelectorAll(".trigger-print").forEach((btn) => {
    btn.addEventListener("click", () => {
      autoFitPageContents();
      setTimeout(() => {
        window.print();
      }, 120);
    });
  });
}

function openDrawerTab(tabId) {
  const drawer = document.getElementById("control-drawer");
  const viewport = document.getElementById("viewport");
  if (drawer && drawer.classList.contains("closed")) {
    drawer.classList.remove("closed");
    viewport?.classList.remove("full-width");
  }

  document.querySelectorAll(".drawer-tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.tabTarget === tabId)
  );
  document.querySelectorAll(".drawer-section").forEach((sec) =>
    sec.classList.toggle("active", sec.id === tabId)
  );
}
