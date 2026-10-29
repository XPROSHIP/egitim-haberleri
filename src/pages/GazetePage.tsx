import { useState, useEffect, useMemo } from 'react'
import { Icon } from '../components/Icon'
import { useGazeteler, type TamSayiGazete, type MansetGazete } from '../lib/api'

export function GazetePage() {
  const { data, isLoading, isError, refetch } = useGazeteler()

  // Lightbox state
  const [activeCover, setActiveCover] = useState<{
    name: string
    date: string
    fullUrl: string
    pdfUrl?: string
    index: number
    listType: 'tam' | 'manset'
  } | null>(null)

  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [searchTerm, setSearchTerm] = useState('')

  // Klavyeden gezinme ve kapatma (Sol/Sağ ok ve Escape)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!activeCover) return
      if (e.key === 'Escape') {
        setActiveCover(null)
        setZoomLevel(1)
      } else if (e.key === 'ArrowRight') {
        goNext()
      } else if (e.key === 'ArrowLeft') {
        goPrev()
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel((z) => Math.min(z + 0.25, 2.5))
      } else if (e.key === '-') {
        setZoomLevel((z) => Math.max(z - 0.25, 0.75))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeCover, data])

  const tamSayiList = data?.tam_sayi ?? []
  const mansetList = useMemo(() => {
    const list = data?.mansetler ?? []
    if (!searchTerm.trim()) return list
    const q = searchTerm.toLowerCase()
    return list.filter((m) => m.name.toLowerCase().includes(q) || m.date.toLowerCase().includes(q))
  }, [data?.mansetler, searchTerm])

  function goNext() {
    if (!activeCover || !data) return
    const list = activeCover.listType === 'tam' ? tamSayiList : (data.mansetler ?? [])
    const nextIdx = (activeCover.index + 1) % list.length
    const item = list[nextIdx]
    if (activeCover.listType === 'tam') {
      const g = item as TamSayiGazete
      setActiveCover({
        name: g.name,
        date: g.date,
        fullUrl: g.thumb,
        pdfUrl: g.pdf,
        index: nextIdx,
        listType: 'tam',
      })
    } else {
      const m = item as MansetGazete
      setActiveCover({
        name: m.name,
        date: m.date,
        fullUrl: m.full || m.thumb,
        index: nextIdx,
        listType: 'manset',
      })
    }
    setZoomLevel(1)
  }

  function goPrev() {
    if (!activeCover || !data) return
    const list = activeCover.listType === 'tam' ? tamSayiList : (data.mansetler ?? [])
    const prevIdx = (activeCover.index - 1 + list.length) % list.length
    const item = list[prevIdx]
    if (activeCover.listType === 'tam') {
      const g = item as TamSayiGazete
      setActiveCover({
        name: g.name,
        date: g.date,
        fullUrl: g.thumb,
        pdfUrl: g.pdf,
        index: prevIdx,
        listType: 'tam',
      })
    } else {
      const m = item as MansetGazete
      setActiveCover({
        name: m.name,
        date: m.date,
        fullUrl: m.full || m.thumb,
        index: prevIdx,
        listType: 'manset',
      })
    }
    setZoomLevel(1)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Üst Başlık & Bilgi */}
      <div className="mb-8 border-b border-line pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-accent uppercase">
              <Icon name="Newspaper" size={16} />
              <span>Günlük Basın & Arşiv</span>
            </div>
            <h1 className="mt-1.5 font-display text-2xl font-black tracking-tight text-fg sm:text-3xl lg:text-4xl">
              e-Gazete & Günün Manşetleri
            </h1>
            <p className="mt-2 text-sm text-muted">
              Türkiye ulusal basınının en güncel sayıları, tam sayfa PDF sürümleri ve yüksek çözünürlüklü ilk sayfa manşetleri.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-fg shadow-xs transition hover:bg-surface-2"
              title="Yenile"
            >
              <Icon name="RotateCw" size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Yenile</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-muted">Günün gazeteleri ve manşetler yükleniyor...</p>
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-sm text-red-600 dark:text-red-400">
          <p>Gazeteler yüklenirken bir sorun oluştu.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-md bg-accent px-4 py-1.5 text-xs font-medium text-white shadow-xs"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-12">
          {/* BÖLÜM 1: TAM SAYI e-GAZETELER (PDF) */}
          {tamSayiList.length > 0 && (
            <section>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-white">
                    <Icon name="FileText" size={14} />
                  </span>
                  <h2 className="text-lg font-bold tracking-tight text-fg sm:text-xl">
                    Tam Sayı e-Gazeteler (PDF)
                  </h2>
                </div>
                <span className="text-xs font-medium text-muted">Tam baskı, tüm sayfalar</span>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
                {tamSayiList.map((g, idx) => (
                  <div
                    key={g.id || g.name}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xs transition duration-200 hover:border-accent/40 hover:shadow-lg sm:flex-row"
                  >
                    {/* Dikey Kapak Görseli */}
                    <div
                      className="relative aspect-3/4 w-full cursor-pointer overflow-hidden bg-surface-2 sm:w-48 sm:shrink-0"
                      onClick={() =>
                        setActiveCover({
                          name: g.name,
                          date: g.date,
                          fullUrl: g.thumb,
                          pdfUrl: g.pdf,
                          index: idx,
                          listType: 'tam',
                        })
                      }
                    >
                      <img
                        src={g.thumb}
                        alt={`${g.name} Gazetesi`}
                        className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition group-hover:opacity-100 flex items-end p-3">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-white">
                          <Icon name="Maximize2" size={13} /> Kapağı Büyüt
                        </span>
                      </div>
                    </div>

                    {/* Bilgi & İşlem Düğmeleri */}
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[0.7rem] font-bold tracking-wide text-accent uppercase">
                            Tam Baskı PDF
                          </span>
                          <span className="text-xs text-faint">{g.date}</span>
                        </div>
                        <h3 className="mt-2 text-xl font-extrabold text-fg group-hover:text-accent">
                          {g.title || `${g.name} Gazetesi`}
                        </h3>
                        <p className="mt-1.5 text-xs text-muted">
                          Günün en son çıkan tam nüshası. Tüm sayfalarıyla yüksek çözünürlüklü dijital baskıyı tarayıcınızda okuyabilir veya PDF olarak indirebilirsiniz.
                        </p>
                      </div>

                      <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-line-soft pt-4">
                        {g.pdf ? (
                          <>
                            <a
                              href={g.pdf}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-accent/90"
                            >
                              <Icon name="BookOpen" size={14} />
                              <span>Gazeteyi Oku</span>
                            </a>
                            <a
                              href={g.pdf}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs font-semibold text-fg transition hover:bg-surface-3"
                              title="PDF İndir"
                            >
                              <Icon name="Download" size={14} />
                              <span className="hidden sm:inline">İndir</span>
                            </a>
                          </>
                        ) : (
                          <span className="text-xs text-faint">PDF hazırlanıyor...</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* BÖLÜM 2: GÜNÜN MANŞETLERİ (15 GAZETE) */}
          <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line-soft pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-fg">
                  <Icon name="Layers" size={14} />
                </span>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-fg sm:text-xl">
                    Günün Gazete Manşetleri
                  </h2>
                  <span className="text-xs text-muted">
                    İlk sayfa manşetleri (büyütmek için kapağa tıklayın)
                  </span>
                </div>
              </div>

              {/* Arama Kutusu */}
              <div className="relative w-full sm:w-64">
                <Icon
                  name="Search"
                  size={14}
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-muted"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Gazete ara..."
                  className="w-full rounded-lg border border-line bg-surface py-1.5 pr-3 pl-9 text-xs text-fg placeholder-muted focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Manşet Kartları Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {mansetList.map((m, idx) => (
                <div
                  key={m.slug || m.name}
                  onClick={() =>
                    setActiveCover({
                      name: m.name,
                      date: m.date,
                      fullUrl: m.full || m.thumb,
                      index: idx,
                      listType: 'manset',
                    })
                  }
                  className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-line bg-surface p-2 shadow-2xs transition duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg"
                >
                  <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg bg-surface-2">
                    <img
                      src={m.thumb}
                      alt={`${m.name} Manşeti`}
                      className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-104"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 transition group-hover:opacity-100 flex items-center justify-center">
                      <span className="rounded-full bg-white/90 p-2 text-neutral-900 shadow-md">
                        <Icon name="Maximize2" size={16} />
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 px-1 pb-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-xs font-bold text-fg group-hover:text-accent">
                        {m.name}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[0.7rem] text-faint truncate">{m.date}</div>
                  </div>
                </div>
              ))}
            </div>

            {mansetList.length === 0 && (
              <div className="rounded-xl border border-line bg-surface p-8 text-center text-sm text-muted">
                "{searchTerm}" aramasına uygun gazete bulunamadı.
              </div>
            )}
          </section>
        </div>
      )}

      {/* LIGHTBOX / MANŞET BÜYÜTÜCÜ MODAL */}
      {activeCover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 backdrop-blur-xs sm:p-4">
          {/* Üst Bar: Başlık, Yakınlaştırma ve Kapatma */}
          <div className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between border-b border-white/10 bg-black/60 px-4 py-3 text-white backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-bold tracking-wide text-white uppercase">
                {activeCover.name}
              </span>
              <span className="text-xs text-white/70">{activeCover.date}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
                className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
                title="Uzaklaştır (-)"
              >
                <Icon name="Minus" size={16} />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white transition hover:bg-white/20"
                title="Sıfırla"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
                className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
                title="Yakınlaştır (+)"
              >
                <Icon name="Plus" size={16} />
              </button>

              <a
                href={activeCover.fullUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
                title="Resmi İndir / Yeni Sekmede Aç"
              >
                <Icon name="Download" size={16} />
              </a>

              {activeCover.pdfUrl && (
                <a
                  href={activeCover.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-accent/90"
                >
                  Tam PDF Aç
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  setActiveCover(null)
                  setZoomLevel(1)
                }}
                className="ml-2 rounded-lg bg-white/20 p-2 text-white transition hover:bg-white/30"
                title="Kapat (Escape)"
              >
                <Icon name="X" size={18} />
              </button>
            </div>
          </div>

          {/* Sol / Sağ Gezinme Düğmeleri */}
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-md transition hover:bg-black/90 hover:scale-105"
            title="Önceki Gazete (Sol Ok)"
          >
            <Icon name="ChevronLeft" size={24} />
          </button>

          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-md transition hover:bg-black/90 hover:scale-105"
            title="Sonraki Gazete (Sağ Ok)"
          >
            <Icon name="ChevronRight" size={24} />
          </button>

          {/* Manşet Görseli (Kaydırılabilir & Yakınlaştırılabilir) */}
          <div
            className="relative flex h-full w-full items-center justify-center overflow-auto pt-16 pb-8"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveCover(null)
                setZoomLevel(1)
              }
            }}
          >
            <img
              src={activeCover.fullUrl}
              alt={`${activeCover.name} Gazete Manşeti`}
              style={{
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.15s ease-out',
                maxWidth: '92vw',
                maxHeight: '85vh',
              }}
              className="rounded-md object-contain shadow-2xl select-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}
