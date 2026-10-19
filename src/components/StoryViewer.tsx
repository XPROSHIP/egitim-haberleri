import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { getCategory } from '../data/categories'
import { formatDate } from '../lib/format'
import type { NewsItem } from '../types'
import { CategoryBadge } from './NewsCard'
import { Cover } from './Cover'
import { Icon } from './Icon'

/** Bir haberin ekranda kalma süresi */
const SLIDE_MS = 6000

/** eh-fade-up animasyonunun süre/eğri ayarları (keyframe src/index.css içinde) */
const fadeUp: CSSProperties = {
  animationDuration: '420ms',
  animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
  animationFillMode: 'both',
}

/**
 * Instagram hikâyeleri benzeri tam ekran haber oynatıcı.
 *
 * Kontroller: sağ/sol yarıya tıklama, ok tuşları, boşluk (sonraki), Esc (kapat).
 * Her haber 6 saniye sonra kendiliğinden ilerler; son habere gelince kapanır.
 */
export function StoryViewer({
  open,
  items,
  startIndex,
  onClose,
}: {
  open: boolean
  items: NewsItem[]
  startIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const indexRef = useRef(startIndex)

  const clamp = useCallback((i: number, len: number) => Math.min(Math.max(i, 0), Math.max(len - 1, 0)), [])

  /** Belirtilen sıraya git; sonun dışındaysa hikâyeleri kapat */
  const goTo = useCallback(
    (target: number) => {
      if (target >= items.length) {
        onClose()
        return
      }
      const next = clamp(target, items.length)
      indexRef.current = next
      setIndex(next)
    },
    [clamp, items.length, onClose],
  )

  const step = useCallback((delta: number) => goTo(indexRef.current + delta), [goTo])

  /* index'in aynası: geri çağrılar (klavye, tıklama, zamanlayıcı) render dışında okur */
  useEffect(() => {
    indexRef.current = index
  }, [index])

  /* Yeni açılışta ya da başlangıç değiştiğinde sıfırla (render sırasında düzeltme) */
  const [lastOpen, setLastOpen] = useState(open)
  const [lastStart, setLastStart] = useState(startIndex)
  if (open !== lastOpen || startIndex !== lastStart) {
    setLastOpen(open)
    setLastStart(startIndex)
    setIndex(open ? clamp(startIndex, items.length) : 0)
  }

  /* Otomatik ilerleme */
  useEffect(() => {
    if (!open || items.length === 0) return
    const timer = window.setInterval(() => step(1), SLIDE_MS)
    return () => window.clearInterval(timer)
  }, [open, items.length, step])

  /* Klavye kontrolleri */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault()
        step(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        step(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, step, onClose])

  /* Arkadaki sayfa kaymasın */
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open || items.length === 0) return null

  const item = items[clamp(index, items.length)]
  const cat = getCategory(item.category)
  // Bir önceki kart arkada kalıp hafif küçülerek "destek" hissi verir.
  const prev = index > 0 ? items[index - 1] : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${cat.name} hikâyeleri — ${index + 1} / ${items.length}`}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur"
    >
      {/* 9:16'ya yakın, ortalanmış hikâye karesi */}
      <div className="relative mx-auto h-full w-full max-w-[480px] overflow-hidden bg-black">
        {/* Arka kart (önceki haber) — kart desteği efekti */}
        {prev && (
          <div
            key={`prev-${prev.id}`}
            aria-hidden="true"
            className="animate-[eh-fade-up] absolute inset-0 origin-top scale-[0.94] opacity-0 transition-all duration-300"
            style={{ ...fadeUp, transform: 'translateY(2.5%) scale(0.94)', opacity: 0.45 }}
          >
            <Cover
              id={prev.id}
              category={prev.category}
              image={prev.source.image}
              className="absolute inset-0 size-full"
            />
            <div className="absolute inset-0 bg-black/70" />
          </div>
        )}

        {/* Görsel + karartma; haber değişince yeniden mount olup animasyona girer */}
        <div
          key={item.id}
          className="animate-[eh-fade-up] absolute inset-0 transition-transform duration-300 ease-out"
          style={fadeUp}
        >
          <Cover
            id={item.id}
            category={item.category}
            image={item.source.image}
            className="absolute inset-0 size-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/80" />
        </div>

        {/* Ekranın sol/sağ yarısı: önceki / sonraki haber */}
        <button
          type="button"
          aria-label="Önceki haber"
          onClick={() => step(-1)}
          className="absolute inset-y-0 left-0 z-20 w-1/2 cursor-w-resize"
        />
        <button
          type="button"
          aria-label="Sonraki haber"
          onClick={() => step(1)}
          className="absolute inset-y-0 right-0 z-20 w-1/2 cursor-e-resize"
        />

        {/* Üst bar: kategori adı, sayaç, ilerleme çubukları, kapatma */}
        <div className="absolute inset-x-0 top-0 z-30 px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <span
              className="grid size-7 shrink-0 place-items-center rounded-full"
              style={{ background: cat.color }}
            >
              <Icon name="Newspaper" size={14} className="text-white" />
            </span>

            <span className="truncate text-[13px] font-semibold text-white">{cat.name}</span>

            <span className="tnum ml-auto shrink-0 text-[12px] font-medium text-white/60">
              {index + 1} / {items.length}
            </span>

            <button
              type="button"
              aria-label="Hikâyeleri kapat"
              onClick={onClose}
              className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition hover:bg-white/20"
            >
              <Icon name="X" size={18} />
            </button>
          </div>

          {/* Her haber için bir segment */}
          <div className="mt-3 flex gap-1" aria-hidden="true">
            {items.map((n, i) => (
              <span
                key={n.id}
                className={clsx(
                  'h-[3px] flex-1 rounded-full transition duration-500',
                  i === index ? 'bg-white' : i < index ? 'bg-white/30' : 'bg-white/15',
                )}
              />
            ))}
          </div>
        </div>

        {/* Alt bilgi: rozet, başlık, özet, tarih ve "Habere Git" */}
        <div
          key={`${item.id}-meta`}
          className="animate-[eh-fade-up] pointer-events-none absolute inset-x-0 bottom-0 z-30 p-5"
          style={fadeUp}
        >
          <CategoryBadge slug={item.category} size="sm" />

          <h2 className="mt-3 text-[26px] leading-[1.18] font-extrabold tracking-tight text-white">
            {item.title}
          </h2>

          <p className="mt-2.5 line-clamp-3 text-[13.5px] leading-relaxed text-white/75">
            {item.excerpt}
          </p>

          <p className="tnum mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-white/50">
            <span className="truncate">{item.source.name}</span>
            <span>·</span>
            <span>{formatDate(item.publishedAt, 'tr')}</span>
          </p>

          <div className="pointer-events-auto mt-4 flex items-center gap-2">
            <Link
              to={`/haber/${item.slug}`}
              onClick={onClose}
              className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black transition hover:bg-white/90"
            >
              Habere Git
            </Link>
            <span className="text-[10.5px] text-white/40">
              Sağ/sol yarıya ya da ok tuşlarına bas · Boşluk: sonraki · Esc: kapat
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}