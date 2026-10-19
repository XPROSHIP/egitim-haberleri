import { useMemo } from 'react'
import { Link, NavLink } from 'react-router-dom'
import clsx from 'clsx'
import type { NewsItem } from '../types'
import { categories } from '../data/categories'
import { selectForYou, useAllNews, useAllTags, useFeed, useTrending } from '../lib/api'
import { useStore, type FeedMode } from '../lib/store'
import { formatCount, shortRelative } from '../lib/format'
import { CategoryBadge } from '../components/NewsCard'
import { CategoryMark } from '../components/CategoryMark'
import { Cover } from '../components/Cover'
import { Icon } from '../components/Icon'
import { StoryBar } from '../components/StoryBar'

const MODES: { key: FeedMode; label: string }[] = [
  { key: 'latest', label: 'Güncel' },
  { key: 'featured', label: 'Seçilmiş' },
  { key: 'following', label: 'Takip' },
  { key: 'foryou', label: 'Sana Özel' },
]

const NAV: { to: string; label: string; icon: string; end?: boolean }[] = [
  { to: '/', label: 'Ana sayfa', icon: 'Newspaper', end: true },
  { to: '/feed', label: 'Akış', icon: 'Sparkles' },
  { to: '/kategoriler', label: 'Kategoriler', icon: 'Compass' },
  { to: '/ara', label: 'Ara', icon: 'Search' },
  { to: '/kaydedilenler', label: 'Kaydedilenler', icon: 'Bookmark' },
  { to: '/begeniler', label: 'Beğeniler', icon: 'Heart' },
  { to: '/profil', label: 'Profil', icon: 'User' },
  { to: '/ayarlar', label: 'Ayarlar', icon: 'Settings' },
]

/** X tarzı akış kartı — sayfaya özel, NewsCard varyantı değil */
function FeedCard({ item }: { item: NewsItem }) {
  const { likes, bookmarks, toggleLike, toggleBookmark, lang } = useStore()
  const liked = likes.includes(item.id)
  const saved = bookmarks.includes(item.id)
  const likeCount = item.likes + (liked ? 1 : 0)

  const actionBtn =
    'flex items-center gap-1.5 rounded-full px-2 py-1 text-[12px] transition hover:bg-surface-3'

  return (
    <Link
      to={`/haber/${item.slug}`}
      className="group block bg-surface p-4 transition hover:bg-surface-2"
    >
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-surface-2">
        <Cover
          id={item.id}
          category={item.category}
          image={item.source.image}
          className="absolute inset-0 size-full"
        />
        <div className="absolute top-2 left-2">
          <CategoryBadge slug={item.category} size="sm" overlay />
        </div>
      </div>

      <h3 className="mt-3 line-clamp-3x text-[15px] leading-snug font-semibold text-fg transition-colors group-hover:text-primary">
        {item.title}
      </h3>
      <p className="mt-1.5 line-clamp-2x text-[12.5px] leading-relaxed text-muted">
        {item.excerpt}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <span className="tnum flex items-center gap-1.5 rounded-full px-2 py-1 text-[12px] text-muted">
            <Icon name="MessageCircle" size={15} />
            {formatCount(item.commentsCount, lang)}
          </span>
          <button
            type="button"
            aria-label="Beğen"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleLike(item.id)
            }}
            className={clsx(actionBtn, liked ? 'text-accent' : 'text-muted hover:text-fg')}
          >
            <Icon name="Heart" size={15} fill={liked ? 'currentColor' : 'none'} />
            <span className="tnum">{formatCount(likeCount, lang)}</span>
          </button>
          <button
            type="button"
            aria-label="Kaydet"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleBookmark(item.id)
            }}
            className={clsx(
              'grid size-8 place-items-center rounded-full transition hover:bg-surface-3',
              saved ? 'text-primary' : 'text-muted hover:text-fg',
            )}
          >
            <Icon name="Bookmark" size={15} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="tnum flex shrink-0 items-center gap-2 text-[11px] text-faint">
          {item.likes > 0 && <span>{formatCount(item.likes, lang)} beğeni</span>}
          <span>{shortRelative(item.publishedAt, lang)}</span>
        </div>
      </div>
    </Link>
  )
}

export function FeedPage() {
  const { data, isLoading } = useAllNews()
  const { feedMode, setFeedMode, likes, followed, toggleFollow, hideRead, readMarks } = useStore()
  const trending = useTrending()
  const tagEntries = useAllTags()

  const { items } = useFeed({ mode: feedMode, followed, hideRead, readMarks })

  const feed = useMemo(
    () => (feedMode === 'foryou' && data ? selectForYou(data, likes) : items),
    [data, feedMode, items, likes],
  )

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const n of data ?? []) map.set(n.category, (map.get(n.category) ?? 0) + 1)
    return map
  }, [data])

  return (
    <div className="mx-auto max-w-[1400px] px-4">
      <div className="grid lg:grid-cols-[260px_minmax(0,1fr)_320px]">
        {/* Sol kolon — gezinme */}
        <aside className="sticky top-14 hidden self-start px-0 py-5 lg:block">
          <h2 className="mb-2 px-3 text-[11px] font-bold tracking-[0.14em] text-faint uppercase">
            Menü
          </h2>
          <nav className="space-y-0.5">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                    isActive ? 'bg-surface-2 text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
                  )
                }
              >
                <Icon name={item.icon} size={17} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <h2 className="mt-6 mb-2 px-3 text-[11px] font-bold tracking-[0.14em] text-faint uppercase">
            Kategoriler
          </h2>
          <nav className="space-y-0.5">
            {categories.slice(0, 6).map((c) => (
              <NavLink
                key={c.slug}
                to={`/kategori/${c.slug}`}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition',
                    isActive ? 'bg-surface-2 text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
                  )
                }
              >
                <CategoryMark mark={c.mark} color={c.color} size={16} />
                <span className="min-w-0 flex-1 truncate">{c.name}</span>
                <span className="tnum text-[11px] text-faint">{counts.get(c.slug) ?? 0}</span>
              </NavLink>
            ))}
          </nav>

          <p className="mt-8 px-3 text-[11px] text-faint">
            <span className="font-semibold tracking-wide">OMERZEN</span> © 2026
          </p>
        </aside>

        {/* Orta kolon — akış */}
        <main className="min-w-0 border-x border-line">
          <div className="sticky top-14 z-20 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-[17px] font-extrabold tracking-tight text-fg">Akış</h1>
              <span className="tnum text-[12px] text-muted">{feed.length} haber</span>
            </div>

            <div className="no-scrollbar mt-3 flex items-center gap-1 overflow-x-auto">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setFeedMode(m.key)}
                  className={clsx(
                    'shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition',
                    feedMode === m.key
                      ? 'bg-fg text-bg'
                      : 'text-muted hover:bg-surface-2 hover:text-fg',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Yuvarlak kategori (hikâye) düğmeleri */}
          {data && data.length > 0 && (
            <div className="border-b border-line px-4 py-3">
              <StoryBar items={data} />
            </div>
          )}

          {isLoading && !data ? (
            <div className="grid gap-px bg-line sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-surface p-4">
                  <div className="skeleton aspect-[16/9] w-full rounded-xl" />
                  <div className="skeleton mt-3 h-4 w-4/5 rounded" />
                  <div className="skeleton mt-2 h-3 w-full rounded" />
                </div>
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div className="px-6 py-24 text-center">
              <Icon name="Newspaper" size={28} className="mx-auto text-faint" />
              <p className="mt-4 text-[15px] font-semibold text-fg">Bu modda haber yok</p>
              <p className="mt-2 text-[13px] text-muted">
                Farklı bir akış modu seçebilir ya da kategorilere göz atabilirsin.
              </p>
              <Link
                to="/kategoriler"
                className="mt-5 inline-block rounded-full bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-fg transition hover:opacity-90"
              >
                Kategorilere git
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-px bg-line sm:grid-cols-2">
                {feed.map((item) => (
                  <FeedCard key={item.id} item={item} />
                ))}
              </div>

              <div className="flex items-center gap-3 px-4 py-6">
                <span className="h-px flex-1 bg-line" />
                <span className="tnum text-[11px] text-faint">
                  Daha fazla yüklendi · {feed.length} haber
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <p className="pb-10 text-center text-[11px] text-faint">
                Yeni haberler geldiğinde yukarıda
              </p>
            </>
          )}
        </main>

        {/* Sağ kolon — gündem, takipler, etiketler */}
        <aside className="sticky top-14 hidden self-start px-0 py-5 xl:block">
          <div className="space-y-6">
            <section className="rounded-xl border border-line bg-surface p-4">
              <h2 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-fg">
                <Icon name="Flame" size={15} className="text-accent" />
                Gündem
              </h2>
              <div className="space-y-1">
                {trending.slice(0, 6).map((n, i) => (
                  <Link
                    key={n.id}
                    to={`/haber/${n.slug}`}
                    className="group flex gap-2.5 rounded-lg px-1.5 py-1.5 transition hover:bg-surface-2"
                  >
                    <span className="w-5 shrink-0 text-center text-lg leading-none font-black text-faint/40">
                      {i + 1}
                    </span>
                    <span className="line-clamp-2x text-[13px] leading-snug text-muted transition-colors group-hover:text-fg">
                      {n.title}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-line bg-surface p-4">
              <h2 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-fg">
                <Icon name="Bookmark" size={15} className="text-primary" />
                Takip edilenler
              </h2>
              <div className="space-y-0.5">
                {categories.map((c) => {
                  const on = followed.includes(c.slug)
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => toggleFollow(c.slug)}
                      className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-surface-2"
                    >
                      <CategoryMark mark={c.mark} color={c.color} size={14} />
                      <span
                        className={clsx(
                          'min-w-0 flex-1 truncate text-[12.5px]',
                          on ? 'font-medium text-fg' : 'text-muted',
                        )}
                      >
                        {c.name}
                      </span>
                      {on ? (
                        <Icon name="Check" size={14} className="text-accent" />
                      ) : (
                        <Icon name="Plus" size={14} className="text-faint" />
                      )}
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="rounded-xl border border-line bg-surface p-4">
              <h2 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-fg">
                <Icon name="Hash" size={15} className="text-muted" />
                Etiketler
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {tagEntries.slice(0, 14).map(([tag, count]) => (
                  <Link
                    key={tag}
                    to={`/etiket/${encodeURIComponent(tag)}`}
                    className="rounded-full border border-line px-2.5 py-1 text-[11px] text-muted transition hover:border-faint/40 hover:text-fg"
                  >
                    #{tag}
                    <span className="tnum ml-1 text-faint">{count}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  )
}