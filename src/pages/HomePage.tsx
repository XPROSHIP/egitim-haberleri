import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { useAllNews, useFeed, useMostRead, useTrending } from '../lib/api'
import { useStore } from '../lib/store'
import { interestScore, useInterests } from '../lib/interest'
import { selectForYou } from '../lib/api'
import { NewsCard } from '../components/NewsCard'
import { StoryBar } from '../components/StoryBar'
import { PushBanner } from '../components/PushBanner'
import { Icon } from '../components/Icon'
import { groupByDay } from '../lib/format'

const MODES = ['latest', 'featured', 'following', 'foryou'] as const

/** Akışta bir seferde gösterilen haber sayısı. */
const PAGE_SIZE = 20

const MODE_KEYS: Record<(typeof MODES)[number], string> = {
  latest: 'feed.modeLatest',
  featured: 'feed.modeFeatured',
  following: 'feed.modeFollowing',
  foryou: 'feed.modeForYou',
}

export function HomePage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'tr'
  const { data, isLoading } = useAllNews()
  const { feedMode, setFeedMode, followed, likes, hideRead, readMarks, setHideRead, signedIn } =
    useStore()
  const { data: interests = [] } = useInterests(signedIn)

  const list = useMemo(() => {
    if (!data) return []
    if (feedMode === 'foryou') {
      const sorted = selectForYou(data, likes)
      // Öğrenilen ilgi alanları (kategori/etiket ağırlıkları) sıralamayı güçlendirir.
      const scored = sorted.map((n) => ({
        n,
        score: interestScore(n, interests),
      }))
      scored.sort((a, b) => b.score - a.score)
      const result = scored.map((x) => x.n)
      return hideRead ? result.filter((n) => !readMarks.includes(n.id)) : result
    }
    return null
  }, [data, feedMode, likes, hideRead, readMarks, interests])

  const { items } = useFeed({
    mode: feedMode,
    followed,
    hideRead,
    readMarks,
  })
  const trending = useTrending()
  const mostRead = useMostRead()

  const feed = list ?? items
  // Kapak fotoğrafı büyük çözünürlükte olan haberi öne al
  const hiRes = feed.find((n) => n.source.image?.startsWith('/img/'))
  const heroIdx = hiRes ? feed.indexOf(hiRes) : 0
  const hero = feed[heroIdx]
  const side = feed.filter((_, i) => i !== heroIdx).slice(0, 2)
  const rest = feed.filter((_, i) => i !== heroIdx)

  // Kademeli açılma: önce 20 haber, sonra "daha fazla" ile 20'şer artar.
  // Böylece sayfa dibindeki açıklamalara da kolayca ulaşılır.
  const [limit, setLimit] = useState(PAGE_SIZE)
  const visible = rest.slice(0, limit)
  const grouped = groupByDay(visible, (n) => n.publishedAt, lang)
  const remaining = rest.length - visible.length

  const modeLabel = (m: (typeof MODES)[number]) => t(MODE_KEYS[m])

  return (
    <div className="mx-auto max-w-[1400px] px-3 pb-16 sm:px-4">
      {/* Mod seçici */}
      <div className="sticky top-14 z-30 -mx-3 mb-4 border-b border-line bg-bg/90 px-3 py-3 backdrop-blur-xl sm:-mx-4 sm:px-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-surface p-1">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setFeedMode(m)
                  setLimit(PAGE_SIZE)
                }}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-[0.8125rem] font-medium whitespace-nowrap transition',
                  feedMode === m ? 'bg-fg text-bg' : 'text-muted hover:text-fg',
                )}
              >
                {modeLabel(m)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setHideRead(!hideRead)}
            className={clsx(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.75rem] transition',
              hideRead
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-line text-muted hover:text-fg',
            )}
          >
            <Icon name="Check" size={13} />
            {t('feed.hideRead')}
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-4 text-[0.75rem] text-muted">
            <span className="hidden items-center gap-1.5 sm:flex">
              <Icon name="TrendingUp" size={14} />
              {feed.length} {t('nav.all').toLocaleLowerCase('tr')}
            </span>
          </div>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <div className="skeleton h-56 rounded-xl" />
          <div className="skeleton h-96 rounded-xl" />
        </div>
      ) : feed.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-lg font-semibold text-fg">{t('feed.empty')}</p>
          <p className="mt-2 text-sm text-muted">{t('feed.emptyDesc')}</p>
          <Link
            to="/kategoriler"
            className="mt-5 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-fg"
          >
            {t('feed.emptyCta')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Sol sütun */}
          <aside className="order-2 space-y-6 lg:order-1">
            {side.map((n) => (
              <NewsCard key={n.id} item={n} variant="overlay" lang={lang} showExcerpt={false} />
            ))}

            <section className="rounded-xl border border-line bg-surface p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-fg">
                <Icon name="TrendingUp" size={16} className="text-accent" />
                {t('nav.digest')}
              </h3>
              <div className="space-y-1">
                {trending.slice(0, 5).map((n, i) => (
                  <Link
                    key={n.id}
                    to={`/haber/${n.slug}`}
                    className="flex gap-3 rounded-lg p-1.5 transition hover:bg-surface-2"
                  >
                    <span className="w-5 shrink-0 text-center text-lg font-black text-faint/50">
                      {i + 1}
                    </span>
                    <span className="line-clamp-2x text-[0.8125rem] leading-snug text-muted hover:text-fg">
                      {n.title}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </aside>

          {/* Ana sütun */}
          <main className="order-1 min-w-0 lg:order-2">
            <NewsCard item={hero} variant="hero" lang={lang} />

            <StoryBar items={data ?? []} />

            <PushBanner />

            <Link
              to="/podcast"
              className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-gradient-to-r from-primary/10 via-surface to-accent/10 p-4 transition hover:border-primary/30"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-white">
                <Icon name="Mic" size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.875rem] font-bold text-fg">
                  ZENPOD Eğitim — günün haberleri sesli
                </span>
                <span className="block truncate text-[0.75rem] text-muted">
                  Her sabah iki dakikada eğitim gündemi
                </span>
              </span>
              <Icon name="ArrowRight" size={16} className="shrink-0 text-muted" />
            </Link>

            <section className="mt-2">
              <div className="mb-1 flex items-end justify-between">
                <h2 className="text-xl font-extrabold tracking-tight text-fg">
                  {t('nav.latest')}
                </h2>
                <Link
                  to="/kategoriler"
                  className="text-[0.75rem] text-muted transition hover:text-fg"
                >
                  {t('common.all')} →
                </Link>
              </div>

              {grouped.map(([day, items]) => (
                <div key={day}>
                  <div className="sticky top-[108px] z-20 -mx-3 mb-1 bg-bg/90 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4">
                    <h3 className="text-[0.6875rem] font-bold tracking-[0.12em] text-faint uppercase">
                      {day}
                    </h3>
                  </div>
                  <div className="grid gap-4 pb-2 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((n) => (
                      <NewsCard key={n.id} item={n} variant="standard" lang={lang} />
                    ))}
                  </div>
                </div>
              ))}

              {remaining > 0 && (
                <div className="mt-6 flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLimit((v) => v + PAGE_SIZE)}
                    className="rounded-full border border-line bg-surface px-6 py-2.5 text-sm font-semibold text-fg transition hover:bg-surface-2"
                  >
                    Daha fazla göster
                  </button>
                  <span className="text-[0.71875rem] text-faint">
                    {remaining} haber daha var
                  </span>
                </div>
              )}
            </section>

            {/* En çok okunanlar */}
            <section className="mt-8">
              <h2 className="mb-3 flex items-center gap-2 text-xl font-extrabold tracking-tight text-fg">
                <Icon name="Flame" size={20} className="text-accent" />
                {lang === 'tr' ? 'En çok okunanlar' : 'Most read'}
              </h2>
              <div className="rounded-xl border border-line bg-surface p-2">
                {mostRead.slice(0, 6).map((n) => (
                  <NewsCard key={n.id} item={n} variant="compact" lang={lang} />
                ))}
              </div>
            </section>
          </main>
        </div>
      )}
    </div>
  )
}
