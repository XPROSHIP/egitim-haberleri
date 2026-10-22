import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { Icon } from '../components/Icon'
import { formatDate } from '../lib/format'

const API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export type PodcastEpisode = {
  id: string
  title: string
  description: string
  duration: number | null
  published_at: string
}

/** ZENPOD Eğitim bölümleri. */
export function usePodcastEpisodes() {
  return useQuery({
    queryKey: ['podcast', 'episodes'],
    queryFn: async (): Promise<PodcastEpisode[]> => {
      if (!API) return []
      const res = await fetch(`${API}/api/podcast/episodes`)
      if (!res.ok) return []
      const data = (await res.json()) as { episodes?: PodcastEpisode[] }
      return data.episodes ?? []
    },
    staleTime: 10 * 60_000,
  })
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

/** Tek bir bölüm oynatıcısı: play/pause, ilerleme çubuğu, indirme. */
function EpisodePlayer({ episode }: { episode: PodcastEpisode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(episode.duration ?? 0)
  const src = `https://egitim-haberleri.omerzen.workers.dev/podcast/${episode.id}.mp3`
  // İndirme adresi API Worker'dan: SPA yedeğine düşme ihtimali yok,
  // sunucu ayrıca doğru dosya adını gönderiyor.
  const downloadSrc = `${API}/api/audio/${episode.id}`

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onTime = () => setCurrent(el.currentTime)
    const onMeta = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) setDuration(el.duration)
    }
    const onEnd = () => {
      setPlaying(false)
      setCurrent(0)
    }
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onMeta)
    el.addEventListener('ended', onEnd)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onMeta)
      el.removeEventListener('ended', onEnd)
      el.pause()
    }
  }, [])

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
      setPlaying(false)
    } else {
      // Aynı anda tek bölüm çalsın.
      document.querySelectorAll('audio').forEach((a) => {
        if (a !== el) a.pause()
      })
      void el.play()
      setPlaying(true)
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current
    const bar = barRef.current
    if (!el || !bar || !duration) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    el.currentTime = ratio * duration
    setCurrent(el.currentTime)
  }

  const pct = duration ? Math.min(1, current / duration) : 0

  return (
    <article className="rounded-xl border border-line bg-surface p-4 transition hover:border-line/70">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Duraklat' : 'Oynat'}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-fg text-bg transition hover:opacity-90"
        >
          <Icon name={playing ? 'Pause' : 'Play'} size={17} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <h2 className="text-[0.9375rem] leading-snug font-bold text-fg">{episode.title}</h2>
              <p className="tnum mt-1 text-[0.6875rem] text-faint">
                {formatDate(episode.published_at, 'tr')}
                {duration ? ` · ${formatTime(duration)} dk` : ''}
              </p>
            </div>
            <a
              href={downloadSrc}
              download={`${episode.id}.mp3`}
              aria-label="Bölümü indir"
              title="Bölümü indir"
              className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:bg-surface-2 hover:text-fg"
            >
              <Icon name="Download" size={15} />
            </a>
          </div>

          {/* İlerleme çubuğu: tıklanınca istenen saniyeye atlanır */}
          <div
            ref={barRef}
            role="slider"
            tabIndex={0}
            aria-label="Konum"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(current)}
            onClick={seek}
            onKeyDown={(e) => {
              const el = audioRef.current
              if (!el || !duration) return
              if (e.key === 'ArrowRight') el.currentTime = Math.min(duration, el.currentTime + 10)
              if (e.key === 'ArrowLeft') el.currentTime = Math.max(0, el.currentTime - 10)
            }}
            className="group mt-3 cursor-pointer select-none"
          >
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-150 group-hover:bg-accent"
                style={{ width: `${Math.round(pct * 100)}%` }}
              />
            </div>
            <div className="tnum mt-1 flex justify-between text-[0.625rem] text-faint">
              <span>{formatTime(current)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {episode.description && (
            <p className="mt-2.5 line-clamp-3x text-[0.8125rem] leading-relaxed whitespace-pre-line text-muted">
              {episode.description}
            </p>
          )}
        </div>
      </div>
      <audio ref={audioRef} src={src} preload="metadata" />
    </article>
  )
}

export function PodcastPage() {
  const { data: episodes = [], isLoading } = usePodcastEpisodes()

  useEffect(() => {
    document.title = 'ZENPOD Eğitim — Eğitim Haberleri'
  }, [])

  return (
    <div className="mx-auto max-w-[760px] px-3 pb-20 sm:px-4">
      <header className="pt-10 pb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary/15 to-accent/15 px-3 py-1 text-[0.6875rem] font-bold tracking-[0.1em] text-primary uppercase">
          <Icon name="Mic" size={13} />
          Günlük ses bülteni
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
          ZENPOD Eğitim
        </h1>
        <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
          Her sabah eğitim gündeminden öne çıkan haberler, iki dakikada. Mesleki eğitimden
          Milli Eğitim Bakanlığı'na, Çorum'dan yabancı eğitim gündemine kadar bütün haberler{' '}
          <strong className="font-semibold text-fg">Eğitim Haberleri</strong> sitesinde
          yayımlanıyor. Sitemizi takip edin, yorumlarla bizi destekleyin — bölümler tam da bu
          yorumlarla şekilleniyor.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href="/podcast.xml"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-[0.8125rem] font-semibold text-fg transition hover:bg-surface-2"
          >
            <Icon name="Rss" size={14} />
            RSS ile takip et
          </a>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-fg px-4 py-2 text-[0.8125rem] font-semibold text-bg transition hover:opacity-90"
          >
            Haberleri oku
            <Icon name="ArrowRight" size={14} />
          </Link>
        </div>
      </header>

      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold tracking-tight text-fg">
        Günün Eğitim Haberleri
      </h2>

      {isLoading && <div className="skeleton h-28 rounded-xl" />}

      {!isLoading && episodes.length === 0 && (
        <div className="rounded-xl border border-line bg-surface p-8 text-center">
          <p className="text-sm font-semibold text-fg">İlk bölüm hazırlanıyor</p>
          <p className="mt-1.5 text-[0.8125rem] text-muted">
            Bülten günde bir kez, yeni haberler yayımlandıktan sonra hazırlanıyor. RSS
            adresine abone olursanız ilk bölümden itibaren haber vereceğiz.
          </p>
        </div>
      )}

      <div className={clsx('space-y-3')}>
        {episodes.map((e) => (
          <EpisodePlayer key={e.id} episode={e} />
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-line bg-surface p-5">
        <h2 className="text-sm font-bold text-fg">Bölümü beğendiniz mi?</h2>
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted">
          Eğitim Haberleri'ni takip edin, okuduğunuz haberlere yorum yazın. Yorumlar
          bültenin hangi konulara ağırlık vereceğini belirliyor. Yeni bölümler için bizi takip
          edin.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/"
            className="rounded-full border border-line px-4 py-2 text-[0.8125rem] font-semibold text-fg transition hover:bg-surface-2"
          >
            Siteye dön
          </Link>
          <a
            href="/podcast.xml"
            className="rounded-full border border-line px-4 py-2 text-[0.8125rem] font-semibold text-fg transition hover:bg-surface-2"
          >
            Podcast RSS
          </a>
        </div>
      </div>
    </div>
  )
}
