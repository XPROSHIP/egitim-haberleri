import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, ExternalLink, Maximize2 } from 'lucide-react'
import { useAllNews, useArticle, useRelated } from '../lib/api'
import { useStore } from '../lib/store'
import { formatCount, formatDateTime, readMinutes } from '../lib/format'
import { getCategory } from '../data/categories'
import { shareToX } from '../lib/share'
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
  const { markRead } = useStore()

  useEffect(() => {
    if (item) markRead(item.id)
  }, [item, markRead])

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
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 mb-5 inline-flex items-center gap-1.5 text-[13px] text-muted transition hover:text-fg"
          >
            <ArrowLeft size={15} />
            {t('common.back')}
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/kategori/${cat.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white transition hover:opacity-90"
              style={{ background: cat.color }}
            >
              <CategoryMark mark={cat.mark} size={11} strokeWidth={2.1} />
              {cat.name}
            </Link>
            {item.province && (
              <span className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11px] text-muted">
                <Icon name="MapPin" size={11} />
                {item.province}
              </span>
            )}
          </div>

          <h1 className="mt-3.5 text-[26px] leading-[1.15] font-bold tracking-tight text-fg sm:text-[40px]">
            {item.title}
          </h1>

          <p className="mt-4 text-[15.5px] leading-relaxed text-muted sm:text-[17px]">{item.excerpt}</p>

          <div className="tnum mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-y border-line py-3 text-[12px] text-faint">
            <span className="font-medium text-muted">{item.source.name}</span>
            <span>·</span>
            <time dateTime={item.publishedAt}>{formatDateTime(item.publishedAt)}</time>
            <span>·</span>
            <span>{t('news.readTime', { min: readMinutes(item) })}</span>
            {item.views > 0 && (
              <>
                <span>·</span>
                <span>{t('news.views', { count: formatCount(item.views) })}</span>
              </>
            )}
            <button
              type="button"
              onClick={() => shareToX(item)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 transition hover:bg-surface-2 hover:text-fg"
            >
              {t('news.shareOnX')}
              <ExternalLink size={12} />
            </button>
          </div>

          {hasImage && (
            <figure className="group relative mt-7 overflow-hidden rounded-2xl">
              <Cover
                id={item.id}
                category={item.category}
                image={item.source.image}
                className="aspect-[16/9] w-full sm:aspect-[2.05/1]"
              />
              <figcaption className="absolute right-3 bottom-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] text-white/70 backdrop-blur-md">
                {item.source.name}
              </figcaption>
            </figure>
          )}

          {/* Tam metin — kaynaktan alındıysa başlık, değilse özet gövdesi */}
          <div className="mt-8 space-y-5">
            {item.lang === 'en' && (
              <p className="border-l-2 border-line pl-4 text-[12px] text-faint">
                {item.source.name} · İngilizce kaynaktan çevrildi
              </p>
            )}
            {item.fullText && item.lang !== 'en' && (
              <p className="border-l-2 border-line pl-4 text-[12px] text-faint">
                {t('news.fullText')} · {item.source.name}
              </p>
            )}
            {item.body.map((p, i) => (
              <p
                key={i}
                className="text-[16px] leading-[1.8] text-fg/90 sm:text-[17px] sm:leading-[1.85]"
              >
                {p}
              </p>
            ))}
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
              <span className="block text-[11px] tracking-wide text-faint uppercase">
                {t('news.source')}
              </span>
              <span className="block truncate text-sm font-semibold text-fg">
                {item.source.name}
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-primary">
              {t('news.gotoSource')}
              <Maximize2 size={12} />
            </span>
          </a>

          <div className="mt-6">
            <EngagementBar item={item} />
          </div>

          {item.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-[12px] text-faint">{t('news.tags')}:</span>
              {item.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/etiket/${encodeURIComponent(tag)}`}
                  className="rounded-full border border-line px-2.5 py-1 text-[12px] text-muted transition hover:bg-surface-2 hover:text-fg"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6 max-w-md">
            <AudioReader item={item} />
          </div>

          <CommentSection item={item} />

          <nav className="mt-8 grid gap-3 sm:grid-cols-2">
            {prev ? (
              <Link
                to={`/haber/${prev.slug}`}
                className="group rounded-xl border border-line bg-surface p-4 transition hover:border-line"
              >
                <span className="flex items-center gap-1.5 text-[11px] text-faint">
                  <ArrowLeft size={12} /> {t('news.prev')}
                </span>
                <span className="mt-1 line-clamp-2x text-[13px] font-medium text-fg group-hover:text-primary">
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
                <span className="flex items-center justify-end gap-1.5 text-[11px] text-faint">
                  {t('news.next')} <ArrowRight size={12} />
                </span>
                <span className="mt-1 line-clamp-2x text-[13px] font-medium text-fg group-hover:text-primary">
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
                <span className="block truncate text-[11px] text-faint">
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
