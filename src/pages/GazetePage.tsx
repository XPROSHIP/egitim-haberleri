import { useState, useEffect, useMemo, useRef } from 'react'
import clsx from 'clsx'
import { Icon } from '../components/Icon'
import { useGazeteler, fetchGztMansetler, type TamSayiGazete, type MansetGazete } from '../lib/api'

const TR_MONTHS_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return 'Bugün'
  const m = dateStr.match(/^0?(\d{1,2})\s+([^\s\d]+)\s+(\d{4})/)
  if (m) {
    return `${parseInt(m[1], 10)} ${m[2]} ${m[3]}`
  }
  if (dateStr.includes('.')) {
    const [d, mo, y] = dateStr.split('.')
    const mIdx = parseInt(mo, 10) - 1
    if (mIdx >= 0 && mIdx < 12) {
      return `${parseInt(d, 10)} ${TR_MONTHS_NAMES[mIdx]} ${y}`
    }
  }
  if (dateStr.includes('-')) {
    const [y, mo, d] = dateStr.split('-')
    const mIdx = parseInt(mo, 10) - 1
    if (mIdx >= 0 && mIdx < 12) {
      return `${parseInt(d, 10)} ${TR_MONTHS_NAMES[mIdx]} ${y}`
    }
  }
  return dateStr
}

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
    pages?: { page: number; img: string; thumb: string }[]
    pageIndex?: number
  } | null>(null)

  function openLightboxForGazete(g: TamSayiGazete, idx: number) {
    resetZoomAndPan()
    const cleanName = g.name.replace(/\s+Gazetesi?$/i, '')
    const cleanDate = formatDisplayDate(g.date)
    if (g.pages && g.pages.length > 0) {
      setActiveCover({
        name: cleanName,
        date: cleanDate,
        fullUrl: g.pages[0].img,
        index: idx,
        listType: 'tam',
        pages: g.pages,
        pageIndex: 0,
      })
    } else {
      setActiveCover({
        name: cleanName,
        date: cleanDate,
        fullUrl: g.thumb,
        pdfUrl: g.pdf,
        index: idx,
        listType: 'tam',
      })
    }
  }

  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ startX: number; startY: number; initialPanX: number; initialPanY: number }>({
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
  })

  const resetZoomAndPan = () => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
    setIsDragging(false)
  }

  const zoomIn = () => setZoomLevel((z) => Math.min(+(z + 0.35).toFixed(2), 3.5))
  const zoomOut = () =>
    setZoomLevel((z) => {
      const next = Math.max(+(z - 0.35).toFixed(2), 0.75)
      if (next <= 1) setPanOffset({ x: 0, y: 0 })
      return next
    })
  const zoomReset = () => resetZoomAndPan()

  const [searchTerm, setSearchTerm] = useState('')

  // GZT PDF Birleştirici Durumları
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'loading' | 'ready'>('idle')
  const [pdfProgress, setPdfProgress] = useState('')
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
  const [pdfFileName, setPdfFileName] = useState('ZEN Gazete Manşetleri.pdf')

  const handlePdfAction = async () => {
    // Hazırsa doğrudan indir
    if (pdfStatus === 'ready' && pdfBlobUrl) {
      const a = document.createElement('a')
      a.href = pdfBlobUrl
      a.download = pdfFileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      return
    }

    if (pdfStatus === 'loading') return

    try {
      setPdfStatus('loading')
      setPdfProgress('Hazırlanıyor, lütfen bekleyiniz... (1/32)')

      // 1. GZT manşet listesini çek
      const gztData = await fetchGztMansetler()
      const total = gztData.newspapers?.length || 0
      if (!total) throw new Error('Gazete listesi alınamadı')

      const dateStr = gztData.formattedDate || 'Bugün'
      const finalFileName = gztData.fileName || `ZEN Gazete Manşetleri - ${dateStr}.pdf`
      setPdfFileName(finalFileName)

      // 2. pdf-lib'i dinamik olarak yükle (ilk açılış boyutunu şişirmemek için)
      const { PDFDocument } = await import('pdf-lib')
      const pdfDoc = await PDFDocument.create()

      // 3. Görselleri paralel indir (concurrency = 6)
      const downloadedBuffers: { arrayBuffer: ArrayBuffer }[] = new Array(total)
      let loadedCount = 0
      const concurrency = 6
      const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

      for (let i = 0; i < total; i += concurrency) {
        const chunkIndices = []
        for (let c = i; c < Math.min(i + concurrency, total); c++) chunkIndices.push(c)

        await Promise.all(
          chunkIndices.map(async (idx) => {
            const item = gztData.newspapers[idx]
            try {
              let ab: ArrayBuffer | null = null
              try {
                const res = await fetch(item.imgSrc)
                if (res.ok) ab = await res.arrayBuffer()
              } catch {}
              if (!ab) {
                // Fallback via worker proxy (CORS engelini aşar)
                const proxyUrl = `${BASE}/api/proxy-image?url=${encodeURIComponent(item.imgSrc)}`
                const pRes = await fetch(proxyUrl)
                if (pRes.ok) ab = await pRes.arrayBuffer()
              }
              if (ab) downloadedBuffers[idx] = { arrayBuffer: ab }
            } catch (err) {
              console.warn(`[PDF] ${item.name} atlandı:`, err)
            } finally {
              loadedCount++
              setPdfProgress(`Hazırlanıyor, lütfen bekleyiniz... (${loadedCount}/${total})`)
            }
          }),
        )
      }

      setPdfProgress('Sayfalar birleştiriliyor...')

      // 4. Görselleri PDF sayfalarına dönüştür
      for (const entry of downloadedBuffers) {
        if (!entry?.arrayBuffer) continue
        try {
          const jpg = await pdfDoc.embedJpg(entry.arrayBuffer)
          const page = pdfDoc.addPage([jpg.width, jpg.height])
          page.drawImage(jpg, { x: 0, y: 0, width: jpg.width, height: jpg.height })
        } catch (embedErr) {
          console.warn('[PDF] Embed hatası:', embedErr)
        }
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      setPdfBlobUrl(url)
      setPdfStatus('ready')

      // İlk tıklamada hazır olur olmaz hemen indirmeyi tetikle
      const a = document.createElement('a')
      a.href = url
      a.download = finalFileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[PDF] Oluşturma hatası:', err)
      setPdfStatus('idle')
      alert(`PDF hazırlanamadı: ${msg || 'Bilinmeyen hata'}`)
    }
  }

  // Çok Sayfalı Gazeteler (Posta, Sözcü vb.) PDF Birleştirici Durumları
  interface MultiPdfState {
    status: 'idle' | 'loading' | 'ready'
    progress: string
    blobUrl: string | null
    pageCount: number
  }
  const [multiPdfStates, setMultiPdfStates] = useState<Record<string, MultiPdfState>>({})

  const getGazetePdfState = (name: string): MultiPdfState => {
    return multiPdfStates[name] || { status: 'idle', progress: '', blobUrl: null, pageCount: 0 }
  }

  const handleDownloadPagesPdf = async (g: TamSayiGazete) => {
    const pages = g.pages || []
    if (pages.length === 0) return

    const key = g.name
    const currentState = getGazetePdfState(key)

    const cleanName = g.name.replace(/\s+Gazetesi?$/i, '')
    const cleanDate = formatDisplayDate(g.date)

    // Eğer daha önce eksiksiz olarak (tüm sayfalar) oluşturulmuşsa doğrudan indir
    if (currentState.status === 'ready' && currentState.blobUrl && currentState.pageCount === pages.length) {
      const a = document.createElement('a')
      a.href = currentState.blobUrl
      a.download = `${cleanName} - ${cleanDate}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      return
    }

    if (currentState.status === 'loading') return

    try {
      setMultiPdfStates((prev) => ({
        ...prev,
        [key]: { status: 'loading', progress: `(0/${pages.length})`, blobUrl: null, pageCount: pages.length },
      }))

      const { PDFDocument } = await import('pdf-lib')
      const pdfDoc = await PDFDocument.create()

      const downloadedBuffers: (ArrayBuffer | null)[] = new Array(pages.length).fill(null)
      let loaded = 0
      const concurrency = 3
      const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

      const fetchPageBuffer = async (imgUrl: string, maxRetries = 2): Promise<ArrayBuffer> => {
        // CDN CORS engellerini aşmak için worker proxy kullanılır
        const proxyUrl = `${BASE}/api/proxy-image?url=${encodeURIComponent(imgUrl)}`
        let lastErr: unknown = null
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const controller = new AbortController()
            const timer = setTimeout(() => controller.abort(), 20000)
            const res = await fetch(proxyUrl, { signal: controller.signal })
            clearTimeout(timer)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const buf = await res.arrayBuffer()
            if (buf && buf.byteLength > 1000) return buf
            throw new Error('Eksik görsel içeriği')
          } catch (e) {
            lastErr = e
            if (attempt < maxRetries) {
              await new Promise((r) => setTimeout(r, 600 * (attempt + 1)))
            }
          }
        }
        throw lastErr || new Error('Görsel indirilemedi')
      }

      for (let i = 0; i < pages.length; i += concurrency) {
        const chunkIndices: number[] = []
        for (let c = i; c < Math.min(i + concurrency, pages.length); c++) {
          chunkIndices.push(c)
        }

        await Promise.all(
          chunkIndices.map(async (idx) => {
            const p = pages[idx]
            try {
              const buf = await fetchPageBuffer(p.img)
              downloadedBuffers[idx] = buf
            } catch (err) {
              console.warn(`[${g.name} PDF] Sayfa ${idx + 1} indirilemedi:`, err)
            } finally {
              loaded++
              setMultiPdfStates((prev) => ({
                ...prev,
                [key]: {
                  ...(prev[key] || { status: 'loading', blobUrl: null, pageCount: pages.length }),
                  status: 'loading',
                  progress: `(${loaded}/${pages.length})`,
                },
              }))
            }
          }),
        )
      }

      // Tüm sayfaların eksiksiz indirildiğini doğrula!
      const successfulBuffers = downloadedBuffers.filter((b): b is ArrayBuffer => Boolean(b))
      if (successfulBuffers.length < pages.length) {
        throw new Error(
          `${pages.length} sayfanın yalnızca ${successfulBuffers.length} tanesi indirilebildi. Eksik PDF oluşturulmadı; lütfen tekrar deneyiniz.`
        )
      }

      setMultiPdfStates((prev) => ({
        ...prev,
        [key]: {
          ...(prev[key] || { status: 'loading', blobUrl: null, pageCount: pages.length }),
          progress: 'Sayfalar birleştiriliyor...',
        },
      }))

      for (let i = 0; i < downloadedBuffers.length; i++) {
        const buf = downloadedBuffers[i]
        if (!buf) continue
        try {
          const jpg = await pdfDoc.embedJpg(buf)
          const page = pdfDoc.addPage([jpg.width, jpg.height])
          page.drawImage(jpg, { x: 0, y: 0, width: jpg.width, height: jpg.height })
        } catch (embedErr) {
          console.warn(`[${g.name} PDF] Sayfa ${i + 1} embed hatası:`, embedErr)
          throw new Error(`Sayfa ${i + 1} PDF'e dönüştürülemedi`)
        }
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      setMultiPdfStates((prev) => ({
        ...prev,
        [key]: {
          status: 'ready',
          progress: 'Hazır',
          blobUrl: url,
          pageCount: pages.length,
        },
      }))

      const a = document.createElement('a')
      a.href = url
      a.download = `${cleanName} - ${cleanDate}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[${g.name} PDF] Hata:`, err)
      setMultiPdfStates((prev) => ({
        ...prev,
        [key]: { status: 'idle', progress: '', blobUrl: null, pageCount: 0 },
      }))
      alert(`${g.name} PDF hazırlanamadı: ${msg || 'Bilinmeyen hata'}`)
    }
  }

  function stepPage(delta: number) {
    if (!activeCover?.pages) return
    const cur = activeCover.pageIndex ?? 0
    const next = cur + delta
    if (next < 0 || next >= activeCover.pages.length) return
    resetZoomAndPan()
    setActiveCover({
      ...activeCover,
      pageIndex: next,
      fullUrl: activeCover.pages[next].img,
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsDragging(true)
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: panOffset.x,
      initialPanY: panOffset.y,
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStartRef.current.startX
    const dy = e.clientY - dragStartRef.current.startY
    setPanOffset({
      x: dragStartRef.current.initialPanX + dx,
      y: dragStartRef.current.initialPanY + dy,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      dragStartRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        initialPanX: panOffset.x,
        initialPanY: panOffset.y,
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return
    const dx = e.touches[0].clientX - dragStartRef.current.startX
    const dy = e.touches[0].clientY - dragStartRef.current.startY
    setPanOffset({
      x: dragStartRef.current.initialPanX + dx,
      y: dragStartRef.current.initialPanY + dy,
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.25 : 0.25
      setZoomLevel((z) => {
        const next = Math.max(0.75, Math.min(3.5, +(z + delta).toFixed(2)))
        if (next <= 1) setPanOffset({ x: 0, y: 0 })
        return next
      })
    } else if (zoomLevel > 1) {
      e.preventDefault()
      setPanOffset((p) => ({
        x: p.x - (e.shiftKey ? e.deltaY : e.deltaX),
        y: p.y - (e.shiftKey ? 0 : e.deltaY),
      }))
    }
  }

  const handleDoubleClick = () => {
    if (zoomLevel > 1.1) {
      zoomReset()
    } else {
      setZoomLevel(1.85)
    }
  }

  // Klavyeden gezinme ve kapatma (Sol/Sağ ok ve Escape)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!activeCover) return
      if (e.key === 'Escape') {
        setActiveCover(null)
        resetZoomAndPan()
      } else if (e.key === 'ArrowRight') {
        if (activeCover.pages && typeof activeCover.pageIndex === 'number') {
          stepPage(1)
        } else {
          goNext()
        }
      } else if (e.key === 'ArrowLeft') {
        if (activeCover.pages && typeof activeCover.pageIndex === 'number') {
          stepPage(-1)
        } else {
          goPrev()
        }
      } else if (e.key === '+' || e.key === '=') {
        zoomIn()
      } else if (e.key === '-') {
        zoomOut()
      } else if (e.key === '0') {
        zoomReset()
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
    resetZoomAndPan()
    if (activeCover.listType === 'tam') {
      const g = item as TamSayiGazete
      setActiveCover({
        name: g.name.replace(/\s+Gazetesi?$/i, ''),
        date: formatDisplayDate(g.date),
        fullUrl: g.pages?.[0]?.img || g.thumb,
        pdfUrl: g.pdf,
        index: nextIdx,
        listType: 'tam',
        pages: g.pages,
        pageIndex: g.pages && g.pages.length > 0 ? 0 : undefined,
      })
    } else {
      const m = item as MansetGazete
      setActiveCover({
        name: m.name.replace(/\s+Gazetesi?$/i, ''),
        date: formatDisplayDate(m.date),
        fullUrl: m.full || m.thumb,
        index: nextIdx,
        listType: 'manset',
      })
    }
  }

  function goPrev() {
    if (!activeCover || !data) return
    const list = activeCover.listType === 'tam' ? tamSayiList : (data.mansetler ?? [])
    const prevIdx = (activeCover.index - 1 + list.length) % list.length
    const item = list[prevIdx]
    resetZoomAndPan()
    if (activeCover.listType === 'tam') {
      const g = item as TamSayiGazete
      setActiveCover({
        name: g.name.replace(/\s+Gazetesi?$/i, ''),
        date: formatDisplayDate(g.date),
        fullUrl: g.pages?.[0]?.img || g.thumb,
        pdfUrl: g.pdf,
        index: prevIdx,
        listType: 'tam',
        pages: g.pages,
        pageIndex: g.pages && g.pages.length > 0 ? 0 : undefined,
      })
    } else {
      const m = item as MansetGazete
      setActiveCover({
        name: m.name.replace(/\s+Gazetesi?$/i, ''),
        date: formatDisplayDate(m.date),
        fullUrl: m.full || m.thumb,
        index: prevIdx,
        listType: 'manset',
      })
    }
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

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {tamSayiList.map((g, idx) => {
                  const cleanName = g.name.replace(/\s+Gazetesi?$/i, '')
                  const cleanDate = formatDisplayDate(g.date)
                  const pdfState = getGazetePdfState(g.name)

                  return (
                    <div
                      key={g.id || g.name}
                      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface p-3.5 shadow-2xs transition duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg"
                    >
                      {/* Üst Bilgi Barı: Gazete Adı, Tarih ve Rozet */}
                      <div>
                        <div className="mb-1.5 flex items-center justify-between gap-1.5">
                          <h3 className="truncate text-base font-extrabold tracking-tight text-fg group-hover:text-accent">
                            {cleanName}
                          </h3>
                          <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[0.68rem] font-bold tracking-wide text-accent uppercase">
                            Tam Baskı
                          </span>
                        </div>

                        <div className="mb-2.5 flex items-center justify-between text-xs text-muted">
                          <span className="truncate">{cleanDate}</span>
                          {g.pages && g.pages.length > 0 && (
                            <span className="shrink-0 text-[0.7rem] font-medium text-faint">
                              {g.pages.length} Sayfa
                            </span>
                          )}
                        </div>

                        {/* Dikey Kapak Görseli: Gerçek Gazete Oranı (aspect-[1/1.42]) */}
                        <div
                          className="relative aspect-[1/1.42] w-full cursor-pointer overflow-hidden rounded-xl border border-line-soft bg-surface-2 shadow-xs"
                          onClick={() => openLightboxForGazete(g, idx)}
                          title="Büyütmek için tıklayın"
                        >
                          <img
                            src={g.thumb}
                            alt={cleanName}
                            className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-103"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[1px] transition duration-200 group-hover:opacity-100">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-neutral-900 shadow-md">
                              <Icon name="Maximize2" size={13} />
                              <span>Büyüt</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Alt İşlem Düğmeleri: Oku ve İndir (Yan Yana, Sabit ve Dengeli) */}
                      <div className="mt-3.5 flex items-center gap-2 border-t border-line-soft pt-3">
                        {/* Oku Düğmesi */}
                        {g.pages && g.pages.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => openLightboxForGazete(g, idx)}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-2 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-accent/90"
                            title="Gazeteyi Sayfa Sayfa Oku"
                          >
                            <Icon name="BookOpen" size={13} />
                            <span className="truncate">Oku ({g.pages.length} Syf)</span>
                          </button>
                        ) : g.pdf ? (
                          <a
                            href={g.pdf}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-2 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-accent/90"
                            title="Resmi PDF Oku"
                          >
                            <Icon name="BookOpen" size={13} />
                            <span>Oku</span>
                          </a>
                        ) : (
                          <span className="flex-1 text-center text-xs text-faint">Hazırlanıyor</span>
                        )}

                        {/* İndir Düğmesi */}
                        {g.pages && g.pages.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleDownloadPagesPdf(g)}
                            disabled={pdfState.status === 'loading'}
                            className={clsx(
                              'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold transition',
                              pdfState.status === 'ready'
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-surface-2 text-fg hover:bg-surface-3',
                            )}
                            title="Tüm Sayfaları PDF Olarak İndir"
                          >
                            <Icon
                              name={
                                pdfState.status === 'loading'
                                  ? 'Clock'
                                  : pdfState.status === 'ready'
                                    ? 'CheckCircle'
                                    : 'Download'
                              }
                              size={13}
                            />
                            <span>
                              {pdfState.status === 'idle' && 'İndir'}
                              {pdfState.status === 'loading' && pdfState.progress}
                              {pdfState.status === 'ready' && 'İndir'}
                            </span>
                          </button>
                        ) : g.pdf ? (
                          <a
                            href={g.pdf}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs font-semibold text-fg transition hover:bg-surface-3"
                            title="PDF İndir"
                          >
                            <Icon name="Download" size={13} />
                            <span>İndir</span>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
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
                  <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handlePdfAction}
                      disabled={pdfStatus === 'loading'}
                      className={clsx(
                        'inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-xs transition active:scale-98',
                        pdfStatus === 'idle' &&
                          'bg-accent text-white hover:bg-accent/90',
                        pdfStatus === 'loading' &&
                          'bg-accent/80 text-white cursor-wait animate-pulse',
                        pdfStatus === 'ready' &&
                          'bg-emerald-600 hover:bg-emerald-700 text-white',
                      )}
                      title="Bugünün tüm ulusal gazete manşetlerini tek PDF olarak indirin"
                    >
                      <Icon
                        name={
                          pdfStatus === 'loading'
                            ? 'Clock'
                            : pdfStatus === 'ready'
                              ? 'CheckCircle'
                              : 'Download'
                        }
                        size={14}
                      />
                      <span>
                        {pdfStatus === 'idle' &&
                          'Bugünün tüm gazete manşetlerini PDF olarak indirin'}
                        {pdfStatus === 'loading' && pdfProgress}
                        {pdfStatus === 'ready' &&
                          'Günün Manşetleri Hazır! Tıklayıp PDF indirebilirsiniz.'}
                      </span>
                    </button>
                    <span className="text-[0.7rem] text-faint hidden sm:inline">
                      (Büyütmek için kapağa tıklayın)
                    </span>
                  </div>
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
                  onClick={() => {
                    resetZoomAndPan()
                    setActiveCover({
                      name: m.name,
                      date: m.date,
                      fullUrl: m.full || m.thumb,
                      index: idx,
                      listType: 'manset',
                    })
                  }}
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
          {/* Üst Bar: Başlık, Sayfa Göstergesi, Yakınlaştırma ve Kapatma */}
          <div className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between border-b border-white/10 bg-black/60 px-4 py-3 text-white backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-bold tracking-wide text-white uppercase">
                {activeCover.name.replace(/\s+Gazetesi?$/i, '')}
              </span>
              <span className="text-xs text-white/70">{formatDisplayDate(activeCover.date)}</span>
              {activeCover.pages && (
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
                  Sayfa {(activeCover.pageIndex ?? 0) + 1} / {activeCover.pages.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeCover.pages && (
                <div className="mr-2 flex items-center gap-1 rounded-lg bg-white/10 p-1">
                  <button
                    type="button"
                    onClick={() => stepPage(-1)}
                    disabled={(activeCover.pageIndex ?? 0) <= 0}
                    className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-40"
                    title="Önceki Sayfa (Sol Ok)"
                  >
                    <Icon name="ChevronLeft" size={16} />
                  </button>
                  <span className="px-1 text-xs font-medium">
                    {(activeCover.pageIndex ?? 0) + 1} / {activeCover.pages.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => stepPage(1)}
                    disabled={(activeCover.pageIndex ?? 0) >= activeCover.pages.length - 1}
                    className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-40"
                    title="Sonraki Sayfa (Sağ Ok)"
                  >
                    <Icon name="ChevronRight" size={16} />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={zoomOut}
                className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
                title="Uzaklaştır (-)"
              >
                <Icon name="Minus" size={16} />
              </button>
              <button
                type="button"
                onClick={zoomReset}
                className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white transition hover:bg-white/20"
                title="Sıfırla"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={zoomIn}
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
                title="Bu Sayfayı İndir (JPG)"
              >
                <Icon name="Download" size={16} />
              </a>

              {activeCover.pages && activeCover.pages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const currentGazete = tamSayiList.find(
                      (g) => g.name.replace(/\s+Gazetesi?$/i, '') === activeCover.name || g.name === activeCover.name,
                    )
                    if (currentGazete) handleDownloadPagesPdf(currentGazete)
                  }}
                  disabled={getGazetePdfState(activeCover.name).status === 'loading'}
                  className={clsx(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition',
                    getGazetePdfState(activeCover.name).status === 'ready'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-accent hover:bg-accent/90',
                  )}
                  title="Tüm Sayfaları PDF Olarak İndir"
                >
                  {getGazetePdfState(activeCover.name).status === 'loading'
                    ? `İndiriliyor ${getGazetePdfState(activeCover.name).progress}`
                    : getGazetePdfState(activeCover.name).status === 'ready'
                      ? 'PDF İndirildi (Tekrar İndir)'
                      : 'Tam PDF İndir'}
                </button>
              )}

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
                  resetZoomAndPan()
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
            onClick={activeCover.pages ? () => stepPage(-1) : goPrev}
            className="absolute left-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-md transition hover:bg-black/90 hover:scale-105"
            title={activeCover.pages ? 'Önceki Sayfa (Sol Ok)' : 'Önceki Gazete (Sol Ok)'}
          >
            <Icon name="ChevronLeft" size={24} />
          </button>

          <button
            type="button"
            onClick={activeCover.pages ? () => stepPage(1) : goNext}
            className="absolute right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-md transition hover:bg-black/90 hover:scale-105"
            title={activeCover.pages ? 'Sonraki Sayfa (Sağ Ok)' : 'Sonraki Gazete (Sağ Ok)'}
          >
            <Icon name="ChevronRight" size={24} />
          </button>

          {/* Manşet Görseli (Kaydırılabilir & Yakınlaştırılabilir & Tutup Sürüklenebilir) */}
          <div
            className="relative flex h-full w-full select-none items-center justify-center overflow-hidden pt-16 pb-8"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDragging) {
                setActiveCover(null)
                resetZoomAndPan()
              }
            }}
            style={{
              cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            }}
          >
            {zoomLevel > 1 && (
              <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/75 px-3 py-1 text-[0.7rem] font-medium text-white/90 shadow-lg backdrop-blur-md">
                Tutup sürükleyerek veya fare tekerleğiyle sayfada gezinebilirsiniz
              </div>
            )}
            <div
              style={{
                transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.12s ease-out',
                willChange: 'transform',
              }}
              className="flex items-center justify-center"
              onDoubleClick={handleDoubleClick}
            >
              <img
                src={activeCover.fullUrl}
                alt={`${activeCover.name} Gazete Manşeti`}
                draggable={false}
                style={{
                  maxWidth: '92vw',
                  maxHeight: '85vh',
                }}
                className="pointer-events-none select-none rounded-md object-contain shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
