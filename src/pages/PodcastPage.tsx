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

function durationLabel(seconds: number | null): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * ZENPOD Eğitim — günün eğitim haberlerinin sesli bülteni.
 */
export function PodcastPage() {
  const { data: episodes = [], isLoading } = usePodcastEpisodes()
  const [playing, setPlaying] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    document.title = 'ZENPOD Eğitim — Eğitim Haberleri'
  }, [])

  const play = (id: string) => {
    const el = audioRef.current
    if (!el) return
    if (playing === id) {
      el.pause()
      setPlaying(null)
      return
    }
    el.src = `https://egitim-haberleri.omerzen.workers.dev/podcast/${id}.mp3`
    void el.play().catch(() => setPlaying(null))
    setPlaying(id)
  }

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
          Milli Eğitim Bakanlığı'na, Çorum'dan yabancı eğitim gündemine kadar bütün
          haberler <strong className="font-semibold text-fg">Eğitim Haberleri</strong>{' '}
          sitesinde yayımlanıyor. Sitemizi takip edin, yorumlarla bizi destekleyin — bölümler
          tam da bu yorumlarla şekilleniyor.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/feed.xml"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-[0.8125rem] font-semibold text-fg transition hover:bg-surface-2"
          >
            <Icon name="Rss" size={14} />
            RSS ile takip et
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-fg px-4 py-2 text-[0.8125rem] font-semibold text-bg transition hover:opacity-90"
          >
            Haberleri oku
            <Icon name="ArrowRight" size={14} />
          </Link>
        </div>
      </header>

      {isLoading && <div className="skeleton h-24 rounded-xl" />}

      {!isLoading && episodes.length === 0 && (
        <div className="rounded-xl border border-line bg-surface p-8 text-center">
          <p className="text-sm font-semibold text-fg">İlk bölüm hazırlanıyor</p>
          <p className="mt-1.5 text-[0.8125rem] text-muted">
            Bülten günde bir kez, yeni haberler yayımlandıktan sonra hazırlanıyor. RSS
            adresine abone olursanız ilk bölümden itibaren haber vereceğiz.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {episodes.map((e) => (
          <article
            key={e.id}
            className="rounded-xl border border-line bg-surface p-4 transition hover:border-line/70"
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => play(e.id)}
                aria-label={playing === e.id ? 'Duraklat' : 'Oynat'}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-fg text-bg transition hover:opacity-90"
              >
                <Icon name={playing === e.id ? 'Pause' : 'Play'} size={17} />
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="text-[0.9375rem] leading-snug font-bold text-fg">{e.title}</h2>
                <p className="tnum mt-1 text-[0.6875rem] text-faint">
                  {formatDate(e.published_at, 'tr')}
                  {e.duration ? ` · ${durationLabel(e.duration)} dk` : ''}
                </p>
                {e.description && (
                  <p className="mt-2 line-clamp-3x text-[0.8125rem] leading-relaxed whitespace-pre-line text-muted">
                    {e.description}
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <audio
        ref={audioRef}
        onEnded={() => setPlaying(null)}
        onPause={() => setPlaying(null)}
        className="hidden"
      />

      <div className="mt-10 rounded-xl border border-line bg-surface p-5">
        <h2 className="text-sm font-bold text-fg">Bölümü beğendiniz mi?</h2>
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted">
          Eğitim Haberleri'ni takip edin, okuduğunuz haberlere yorum yazın. Yorumlar
          bültenin hangi konulara ağırlık vereceğini belirliyor. Yeni bölümler için
          bizi takip edin.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/"
            className={clsx(
              'rounded-full border border-line px-4 py-2 text-[0.8125rem] font-semibold text-fg transition hover:bg-surface-2',
            )}
          >
            Siteye dön
          </Link>
          <a
            href="/feed.xml"
            className="rounded-full border border-line px-4 py-2 text-[0.8125rem] font-semibold text-fg transition hover:bg-surface-2"
          >
            RSS
          </a>
        </div>
      </div>
    </div>
  )
}
