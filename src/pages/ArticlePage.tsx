import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Maximize2 } from 'lucide-react'
import { useAllNews, useArticle, useRelated, countView } from '../lib/api'
import { recordInterest } from '../lib/interest'
import { useStore } from '../lib/store'
import { formatCount, formatDateTime, readMinutes } from '../lib/format'
import { getCategory } from '../data/categories'
import { shareToWhatsApp, shareToX } from '../lib/share'
import { bus, EVENTS } from '../lib/bus'
import { Cover } from '../components/Cover'
import { CategoryMark } from '../components/CategoryMark'
import { NewsCard } from '../components/NewsCard'
import { Icon } from '../components/Icon'
import { CommentSection, EngagementBar } from '../components/Engagement'
import { AudioReader } from '../components/AudioReader'

export function ArticlePage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { item, isLoading } = useArticle(slug)
  const { data } = useAllNews()
  const related = useRelated(item)
  const { markRead, signedIn } = useStore()
  const [views, setViews] = useState<number | null>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      if (total > 0) {
        setScrollProgress(Math.min(1, Math.max(0, window.scrollY / total)))
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (item) markRead(item.id)
  }, [item, markRead])

  // Gerçek görüntülenme sayacı: haber sayfası açıldığında bir kez artar.
  useEffect(() => {
    if (!item?.id) return
    let alive = true
    void countView(item.id).then((views) => {
      if (alive && views !== null) setViews(views)
    })
    return () => {
      alive = false
    }
  }, [item?.id])

  // İlgi alanı: okunan haber "Sana Özel" akışını besler.
  useEffect(() => {
    if (!item || !signedIn) return
    void recordInterest(item, 0.4)
  }, [item, signedIn])

  const { prev, next } = useMemo(() => {
    if (!data || !item) return { prev: undefined, next: undefined }
    const sorted = [...data].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    const i = sorted.findIndex((n) => n.id === item.id)
    return { next: sorted[i + 1], prev: sorted[i - 1] }
  }, [data, item])

  useEffect(() => {
    if (!item) return
    document.title = `${item.title} — Eğitim Haberleri`
    const desc = document.querySelector('meta[name="description"]')
    desc?.setAttribute('content', item.excerpt)
    return () => {
      document.title = 'Eğitim Haberleri — Mesleki Eğitim, MEB ve Çorum Eğitim Gündemi'
    }
  }, [item])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="skeleton h-9 w-3/4 rounded" />
        <div className="skeleton mt-4 h-5 w-1/2 rounded" />
        <div className="skeleton mt-8 aspect-[16/9] rounded-xl" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-lg font-semibold text-fg">{t('news.notFound')}</p>
        <p className="mt-2 text-sm text-muted">{t('news.notFoundDesc')}</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-full bg-fg px-5 py-2.5 text-sm font-semibold text-bg"
        >
          {t('nav.latest')}
        </Link>
      </div>
    )
  }

  const cat = getCategory(item.category)
  const hasImage = Boolean(item.source.image)

  return (
    <div className="mx-auto max-w-[1180px] px-3 pb-20 sm:px-4">
      {/* Okuma ilerleme çizgisi (Kantan tarzı) */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-[width] duration-100 ease-out"
          style={{ width: `${Math.round(scrollProgress * 100)}%` }}
        />
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="min-w-0">
          {/* Başlık bloğu: sayfa kaydırılırken üstte sabit kalır */}
          <div className="sticky top-14 z-20 -mx-3 bg-bg/92 px-3 backdrop-blur-xl sm:-mx-4 sm:px-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-3 mb-3 inline-flex items-center gap-1.5 text-[0.8125rem] text-muted transition hover:text-fg"
            >
              <ArrowLeft size={15} />
              {t('common.back')}
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/kategori/${cat.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold text-white transition hover:opacity-90"
                style={{ background: cat.color }}
              >
                <CategoryMark mark={cat.mark} size={11} strokeWidth={2.1} />
                {cat.name}
              </Link>
              {item.province && (
                <span className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[0.6875rem] text-muted">
                  <Icon name="MapPin" size={11} />
                  {item.province}
                </span>
              )}
            </div>

            <h1 className="mt-2.5 mb-3 text-[1.4375rem] leading-[1.16] font-bold tracking-tight text-fg sm:text-[2.125rem]">
              {item.title}
            </h1>
          </div>

          <p className="mt-4 text-[0.96875rem] leading-relaxed text-muted sm:text-[1.0625rem]">{item.excerpt}</p>

          <div className="tnum mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-y border-line py-3 text-[0.75rem] text-faint">
            <span className="font-medium text-muted">{item.source.name}</span>
            <span>·</span>
            <time dateTime={item.publishedAt}>{formatDateTime(item.publishedAt)}</time>
            <span>·</span>
            <span>{t('news.readTime', { min: readMinutes(item) })}</span>
            {(views ?? item.views) > 0 && (
              <>
                <span>·</span>
                <span>{t('news.views', { count: formatCount(views ?? item.views) })}</span>
              </>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => shareToX(item)}
                title="X'te paylaş"
                aria-label="X'te paylaş"
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-muted transition hover:bg-surface-2 hover:text-fg"
              >
                <svg className="size-3 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>X'te paylaş</span>
              </button>
              <button
                type="button"
                onClick={() => shareToWhatsApp(item)}
                title="WhatsApp'ta paylaş"
                aria-label="WhatsApp'ta paylaş"
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-muted transition hover:bg-surface-2 hover:text-[#25D366]"
              >
                <svg className="size-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.03C9.36 7.03 9.08 7.09 8.84 7.35C8.6 7.61 7.92 8.25 7.92 9.55C7.92 10.85 8.87 12.1 9 12.28C9.13 12.45 10.87 15.14 13.53 16.29C14.16 16.56 14.66 16.73 15.04 16.85C15.68 17.05 16.26 17.02 16.72 16.95C17.24 16.87 18.33 16.29 18.56 15.65C18.79 15.01 18.79 14.46 18.72 14.35C18.65 14.24 18.48 14.17 18.22 14.04C17.96 13.91 16.7 13.29 16.47 13.2C16.24 13.11 16.07 13.07 15.9 13.33C15.73 13.59 15.24 14.17 15.09 14.35C14.94 14.52 14.79 14.54 14.53 14.41C14.27 14.28 13.44 14.01 12.45 13.13C11.68 12.44 11.16 11.59 11.01 11.33C10.86 11.07 11 10.93 11.13 10.8C11.25 10.68 11.39 10.49 11.52 10.34C11.65 10.19 11.69 10.08 11.78 9.91C11.87 9.74 11.82 9.59 11.76 9.46C11.69 9.33 11.18 8.08 10.97 7.56C10.76 7.06 10.55 7.13 10.39 7.12C10.24 7.11 10.07 7.03 9.9 7.03H9.53Z" />
                </svg>
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Haberi dinle / Ses oynatıcı (başlık ve sürenin hemen altında) */}
          <div className="mt-5">
            <AudioReader item={item} />
          </div>

          {hasImage && (
            <figure className="group relative mt-7 overflow-hidden rounded-2xl">
              <Cover
                id={item.id}
                category={item.category}
                image={item.source.image}
                className="aspect-[16/9] w-full sm:aspect-[2.05/1]"
              />
              <figcaption className="absolute right-3 bottom-3 rounded-full bg-black/55 px-2.5 py-1 text-[0.625rem] text-white/70 backdrop-blur-md">
                {item.source.name}
              </figcaption>
            </figure>
          )}

          {/* Tam metin — kaynaktan alındıysa başlık, değilse özet gövdesi.
              Kaynak bilgisi metnin sonundaki bağlantıda veriliyor. */}
          <div className="article-prose mt-8 space-y-5">
            {item.body.map((p, i) =>
              p.startsWith('## ') ? (
                <h2 key={i} className="text-lg font-bold tracking-tight text-fg sm:text-xl">
                  {p.slice(3).trim()}
                </h2>
              ) : (
                <p key={i}>{p}</p>
              ),
            )}
          </div>

          <a
            href={item.source.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-8 flex items-center gap-3 rounded-xl border border-line bg-surface p-4 transition hover:border-line"
          >
            <span
              className="grid size-10 shrink-0 place-items-center rounded-lg"
              style={{
                background: `color-mix(in srgb, ${cat.color} 14%, transparent)`,
                color: cat.color,
              }}
            >
              <Icon name="Link2" size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.6875rem] tracking-wide text-faint uppercase">
                {t('news.source')}
              </span>
              <span className="block truncate text-sm font-semibold text-fg">
                {item.source.name}
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[0.75rem] font-medium text-primary">
              {t('news.gotoSource')}
              <Maximize2 size={12} />
            </span>
          </a>

          <div className="mt-6">
            <EngagementBar item={item} />
          </div>

          {item.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-[0.75rem] text-faint">{t('news.tags')}:</span>
              {item.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/etiket/${encodeURIComponent(tag)}`}
                  className="rounded-full border border-line px-2.5 py-1 text-[0.75rem] text-muted transition hover:bg-surface-2 hover:text-fg"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          <CommentSection item={item} />

          <nav className="mt-8 grid gap-3 sm:grid-cols-2">
            {prev ? (
              <Link
                to={`/haber/${prev.slug}`}
                className="group rounded-xl border border-line bg-surface p-4 transition hover:border-line"
              >
                <span className="flex items-center gap-1.5 text-[0.6875rem] text-faint">
                  <ArrowLeft size={12} /> {t('news.prev')}
                </span>
                <span className="mt-1 line-clamp-2x text-[0.8125rem] font-medium text-fg group-hover:text-primary">
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                to={`/haber/${next.slug}`}
                className="group rounded-xl border border-line bg-surface p-4 text-right transition hover:border-line"
              >
                <span className="flex items-center justify-end gap-1.5 text-[0.6875rem] text-faint">
                  {t('news.next')} <ArrowRight size={12} />
                </span>
                <span className="mt-1 line-clamp-2x text-[0.8125rem] font-medium text-fg group-hover:text-primary">
                  {next.title}
                </span>
              </Link>
            )}
          </nav>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-5">
            <button
              type="button"
              onClick={() => bus.emit(EVENTS.openAssistant)}
              className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-4 text-left transition hover:border-line"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-3 text-fg">
                <Icon name="Sparkles" size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-fg">{t('nav.assistant')}</span>
                <span className="block truncate text-[0.6875rem] text-faint">
                  {t('assistant.subtitle')}
                </span>
              </span>
            </button>

            {related.length > 0 && (
              <section className="rounded-xl border border-line bg-surface p-4">
                <h3 className="mb-3 text-sm font-bold text-fg">{t('news.related')}</h3>
                <div className="space-y-1">
                  {related.map((n) => (
                    <NewsCard key={n.id} item={n} variant="compact" />
                  ))}
                </div>
              </section>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
