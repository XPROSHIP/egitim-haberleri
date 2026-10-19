import { Link } from 'react-router-dom'
import { Bookmark, Heart, Share2 } from 'lucide-react'
import clsx from 'clsx'
import type { NewsItem } from '../types'
import { getCategory } from '../data/categories'
import { formatCount, readMinutes, shortRelative, type Lang } from '../lib/format'
import { useStore } from '../lib/store'
import { Cover } from './Cover'
import { CategoryMark } from './CategoryMark'
import { shareUrl } from '../lib/share'

export function CategoryBadge({
  slug,
  className,
  size = 'md',
  overlay = false,
}: {
  slug: string
  className?: string
  size?: 'sm' | 'md'
  overlay?: boolean
}) {
  const cat = getCategory(slug)
  return (
    <span
      className={clsx(
        'inline-flex w-fit items-center self-start rounded-full font-semibold whitespace-nowrap',
        size === 'sm' ? 'gap-1 px-2 py-[3px] text-[10px]' : 'gap-1.5 px-2.5 py-1 text-[11px]',
        overlay
          ? 'bg-black/55 text-white backdrop-blur-md ring-1 ring-white/15'
          : 'text-white',
        className,
      )}
      style={overlay ? undefined : { background: cat.color }}
    >
      <CategoryMark mark={cat.mark} color="currentColor" size={size === 'sm' ? 10 : 12} strokeWidth={2} />
      {cat.name}
    </span>
  )
}

function Meta({ item, lang, className }: { item: NewsItem; lang: Lang; className?: string }) {
  return (
    <div className={clsx('tnum flex flex-wrap items-center gap-1.5 text-[11px] text-faint', className)}>
      <span>{shortRelative(item.publishedAt, lang)}</span>
      {item.views > 0 && (
        <>
          <span>·</span>
          <span>{formatCount(item.views, lang)} görüntülenme</span>
        </>
      )}
      {item.commentsCount > 0 && (
        <>
          <span>·</span>
          <span>{item.commentsCount} yorum</span>
        </>
      )}
    </div>
  )
}

function QuickActions({ item }: { item: NewsItem }) {
  const { bookmarks, likes, toggleBookmark, toggleLike } = useStore()
  const saved = bookmarks.includes(item.id)
  const liked = likes.includes(item.id)

  const btn =
    'grid size-8 place-items-center rounded-full bg-black/45 text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-black/70'

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label="Beğen"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleLike(item.id)
        }}
        className={clsx(btn, liked && 'text-accent ring-accent/60')}
      >
        <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
      </button>
      <button
        type="button"
        aria-label="Kaydet"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleBookmark(item.id)
        }}
        className={clsx(btn, saved && 'text-primary ring-primary/60')}
      >
        <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
      </button>
      <button
        type="button"
        aria-label="Paylaş"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          void shareUrl(item)
        }}
        className={btn}
      >
        <Share2 size={14} />
      </button>
    </div>
  )
}

type Variant = 'hero' | 'overlay' | 'standard' | 'compact' | 'row'

export function NewsCard({
  item,
  variant = 'standard',
  lang = 'tr',
  showExcerpt = true,
}: {
  item: NewsItem
  variant?: Variant
  lang?: Lang
  showExcerpt?: boolean
}) {
  const cat = getCategory(item.category)

  /* Hero ve yan kartlar: görsel, başlık ve özet tek kutuda, alttan yukarı karartmayla */
  if (variant === 'hero' || variant === 'overlay') {
    const isHero = variant === 'hero'
    return (
      <Link
        to={`/haber/${item.slug}`}
        className="group relative block overflow-hidden rounded-2xl border border-line bg-surface-2 transition hover:border-line/80"
      >
        <div className={clsx('relative w-full', isHero ? 'aspect-[4/3] sm:aspect-[2.05/1]' : 'aspect-[4/3]')}>
          <Cover
            id={item.id}
            category={item.category}
            image={item.source.image}
            className="absolute inset-0 size-full"
          />
          <div
            className={clsx(
              'absolute inset-0',
              isHero
                ? 'bg-gradient-to-t from-black via-black/75 to-black/5'
                : 'bg-gradient-to-t from-black/95 via-black/55 to-black/5',
            )}
          />
          <div className="absolute top-3 right-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <QuickActions item={item} />
          </div>
          <div className={clsx('absolute inset-x-0 bottom-0', isHero ? 'p-5 sm:p-6' : 'p-3.5')}>
            <CategoryBadge slug={item.category} size="sm" overlay />
            <h2
              className={clsx(
                'mt-2.5 font-bold tracking-tight text-white',
                isHero
                  ? 'text-xl leading-[1.2] sm:text-[28px]'
                  : 'line-clamp-3x text-[15px] leading-[1.28]',
              )}
            >
              {item.title}
            </h2>
            {showExcerpt && isHero && (
              <p className="mt-2.5 line-clamp-2x max-w-2xl text-[13.5px] leading-relaxed text-white/70">
                {item.excerpt}
              </p>
            )}
            <Meta item={item} lang={lang} className={isHero ? 'mt-3 text-white/55' : 'mt-2 text-white/50'} />
          </div>
        </div>
      </Link>
    )
  }

  if (variant === 'standard') {
    return (
      <Link
        to={`/haber/${item.slug}`}
        className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition hover:border-faint/30"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <Cover
            id={item.id}
            category={item.category}
            image={item.source.image}
            className="absolute inset-0 size-full"
          />
          <div className="absolute top-2.5 left-2.5">
            <CategoryBadge slug={item.category} size="sm" overlay />
          </div>
          <div className="absolute top-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <QuickActions item={item} />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3.5">
          <h3 className="line-clamp-3x text-[15px] leading-[1.32] font-semibold text-fg">
            {item.title}
          </h3>
          {showExcerpt && (
            <p className="line-clamp-2x text-[12.5px] leading-relaxed text-muted">{item.excerpt}</p>
          )}
          <Meta item={item} lang={lang} className="mt-auto pt-1.5" />
        </div>
      </Link>
    )
  }

  if (variant === 'compact') {
    return (
      <Link
        to={`/haber/${item.slug}`}
        className="group flex items-start gap-3 rounded-lg p-2 transition hover:bg-surface-2"
      >
        <div className="size-16 shrink-0 overflow-hidden rounded-lg">
          <Cover
            id={item.id}
            category={item.category}
            image={item.source.image}
            className="size-full"
            showIcon={false}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2x text-[13px] leading-snug font-medium text-fg group-hover:text-primary">
            {item.title}
          </h4>
          <div className="tnum mt-1 flex items-center gap-1.5 text-[10.5px] text-faint">
            <span style={{ color: cat.color }}>{cat.name}</span>
            <span>·</span>
            <span>{shortRelative(item.publishedAt, lang)}</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`/haber/${item.slug}`}
      className="group flex gap-4 border-b border-line-soft py-4 last:border-b-0"
    >
      <div className="min-w-0 flex-1">
        <CategoryBadge slug={item.category} size="sm" className="mb-2" />
        <h3 className="line-clamp-2x text-[16px] leading-snug font-semibold text-fg group-hover:text-primary">
          {item.title}
        </h3>
        {showExcerpt && (
          <p className="mt-1.5 line-clamp-2x text-[13px] leading-relaxed text-muted">{item.excerpt}</p>
        )}
        <div className="mt-2 flex items-center gap-3">
          <Meta item={item} lang={lang} />
          <span className="text-[11px] text-faint">· {readMinutes(item)} dk okuma</span>
        </div>
      </div>
      <div className="hidden aspect-[4/3] w-44 shrink-0 overflow-hidden rounded-xl sm:block">
        <Cover
          id={item.id}
          category={item.category}
          image={item.source.image}
          className="size-full"
        />
      </div>
    </Link>
  )
}
