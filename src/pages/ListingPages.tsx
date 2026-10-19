import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { useAllNews, useFeed, useProvinces, useAllTags } from '../lib/api'
import { useStore } from '../lib/store'
import { categories, getCategory } from '../data/categories'
import { NewsCard } from '../components/NewsCard'
import { CategoryMark } from '../components/CategoryMark'
import { Icon } from '../components/Icon'
import { groupByDay } from '../lib/format'

function PageHeader({
  title,
  subtitle,
  mark,
  color,
  children,
}: {
  title: string
  subtitle?: string
  mark?: import('../types').MarkName
  color?: string
  children?: React.ReactNode
}) {
  return (
    <header className="mb-6 border-b border-line pb-5">
      <div className="flex items-start gap-3.5">
        {mark && (
          <span
            className="grid size-12 shrink-0 place-items-center rounded-2xl"
            style={{
              background: `color-mix(in srgb, ${color ?? '#64748b'} 14%, transparent)`,
              color: color ?? '#64748b',
            }}
          >
            <CategoryMark mark={mark} color="currentColor" size={22} strokeWidth={1.7} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{title}</h1>
          {subtitle && <p className="tnum mt-1 text-[13px] text-muted">{subtitle}</p>}
        </div>
      </div>
      {children}
    </header>
  )
}

function Feed({ items, lang }: { items: import('../types').NewsItem[]; lang: 'tr' | 'en' }) {
  const { t } = useTranslation()
  const grouped = groupByDay(items, (n) => n.publishedAt, lang)
  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted">{t('feed.empty')}</p>
      </div>
    )
  }
  return (
    <div>
      {grouped.map(([day, list]) => (
        <div key={day}>
          <h2 className="sticky top-14 z-20 -mx-3 bg-bg/90 px-3 py-2.5 text-[11px] font-bold tracking-[0.12em] text-faint uppercase backdrop-blur sm:-mx-4 sm:px-4">
            {day}
          </h2>
          <div className="space-y-1 pb-4">
            {list.map((n) => (
              <NewsCard key={n.id} item={n} variant="row" lang={lang} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function CategoryPage() {
  const { slug } = useParams()
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'tr'
  const cat = getCategory(slug ?? '')
  const { items } = useFeed({ category: slug })
  const { followed, toggleFollow } = useStore()
  const on = followed.includes(cat.slug)

  useEffect(() => {
    document.title = `${cat.name} — Eğitim Haberleri`
  }, [cat.name])

  return (
    <div className="mx-auto max-w-[1000px] px-3 pb-16 sm:px-4">
      <PageHeader
        title={cat.name}
        subtitle={`${items.length} haber`}
        mark={cat.mark}
        color={cat.color}
      >
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => toggleFollow(cat.slug)}
            className={clsx(
              'flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition',
              on ? 'border-primary/50 bg-primary/10 text-primary' : 'border-line text-muted hover:text-fg',
            )}
          >
            <Icon name={on ? 'Check' : 'Plus'} size={14} />
            {on ? t('feed.modeFollowing') : t('feed.emptyCta')}
          </button>
          {categories
            .filter((c) => c.slug !== cat.slug)
            .slice(0, 8)
            .map((c) => (
              <Link
                key={c.slug}
                to={`/kategori/${c.slug}`}
                className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12px] text-muted transition hover:bg-surface-2 hover:text-fg"
              >
                <CategoryMark mark={c.mark} color={c.color} size={12} strokeWidth={1.8} />
                {c.name}
              </Link>
            ))}
        </div>
      </PageHeader>
      <Feed items={items} lang={lang} />
    </div>
  )
}

export function TagPage() {
  const { tag } = useParams()
  const { i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'tr'
  const decoded = decodeURIComponent(tag ?? '')
  const { items } = useFeed({ tag: decoded })
  return (
    <div className="mx-auto max-w-[1000px] px-3 pb-16 sm:px-4">
      <PageHeader title={`#${decoded}`} subtitle={`${items.length} haber`} />
      <Feed items={items} lang={lang} />
    </div>
  )
}

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'tr'
  const q = params.get('q') ?? ''
  const [input, setInput] = useState(q)
  const { items } = useFeed({ query: q })
  const tags = useAllTags()

  useEffect(() => setInput(q), [q])

  return (
    <div className="mx-auto max-w-[1000px] px-3 pb-16 sm:px-4">
      <PageHeader
        title={t('common.search')}
        subtitle={q ? `“${q}” için ${items.length} sonuç` : 'Konu, kurum veya etiket ara'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setParams(input.trim() ? { q: input.trim() } : {})
          }}
          className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5"
        >
          <Icon name="Search" size={17} className="text-faint" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('common.searchPlaceholder')}
            className="flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-faint"
          />
          {input && (
            <button type="button" onClick={() => { setInput(''); setParams({}) }}>
              <Icon name="X" size={15} className="text-faint hover:text-fg" />
            </button>
          )}
        </form>
        {!q && tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.slice(0, 18).map(([tag, count]) => (
              <Link
                key={tag}
                to={`/etiket/${encodeURIComponent(tag)}`}
                className="rounded-full border border-line px-3 py-1.5 text-[12px] text-muted transition hover:bg-surface-2 hover:text-fg"
              >
                #{tag} <span className="text-faint">({count})</span>
              </Link>
            ))}
          </div>
        )}
      </PageHeader>
      <Feed items={items} lang={lang} />
    </div>
  )
}

export function ProvincePage() {
  const { province } = useParams()
  const { i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'tr'
  const { items } = useFeed({ province: decodeURIComponent(province ?? '') })
  return (
    <div className="mx-auto max-w-[1000px] px-3 pb-16 sm:px-4">
      <PageHeader
        title={decodeURIComponent(province ?? '')}
        subtitle={`${items.length} haber`}
        mark="locator"
        color="#dc2626"
      />
      <Feed items={items} lang={lang} />
    </div>
  )
}

export function SavedPage({ kind }: { kind: 'bookmarks' | 'likes' }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'tr'
  const { bookmarks, likes } = useStore()
  const { data } = useAllNews()
  const ids = kind === 'bookmarks' ? bookmarks : likes

  const items = useMemo(
    () => (data ?? []).filter((n) => ids.includes(n.id)),
    [data, ids],
  )

  return (
    <div className="mx-auto max-w-[1000px] px-3 pb-16 sm:px-4">
      <PageHeader
        title={kind === 'bookmarks' ? t('nav.bookmarks') : t('nav.likes')}
        subtitle={`${items.length} haber`}
      />
      <Feed items={items} lang={lang} />
    </div>
  )
}

export function CategoriesPage() {
  const { t } = useTranslation()
  const { data } = useAllNews()
  const provinces = useProvinces()
  const { followed, toggleFollow } = useStore()

  return (
    <div className="mx-auto max-w-[1000px] px-3 pb-16 sm:px-4">
      <PageHeader title={t('nav.categories')} subtitle={t('settings.categoriesDesc')} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const count = (data ?? []).filter((n) => n.category === c.slug).length
          const on = followed.includes(c.slug)
          return (
            <div
              key={c.slug}
              className="group flex items-center gap-3 rounded-xl border border-line bg-surface p-4 transition hover:border-line"
            >
              <Link
                to={`/kategori/${c.slug}`}
                className="grid size-11 shrink-0 place-items-center rounded-xl"
                style={{
                  background: `color-mix(in srgb, ${c.color} 14%, transparent)`,
                  color: c.color,
                }}
              >
                <CategoryMark mark={c.mark} color="currentColor" size={21} strokeWidth={1.7} />
              </Link>
              <Link to={`/kategori/${c.slug}`} className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-fg">{c.name}</span>
                <span className="tnum block text-[11px] text-faint">{count} haber</span>
              </Link>
              <button
                type="button"
                onClick={() => toggleFollow(c.slug)}
                aria-label="Takip et"
                className={clsx(
                  'grid size-8 shrink-0 place-items-center rounded-full border transition',
                  on ? 'border-primary/50 bg-primary/10 text-primary' : 'border-line text-faint hover:text-fg',
                )}
              >
                <Icon name={on ? 'Check' : 'Plus'} size={15} />
              </button>
            </div>
          )
        })}
      </div>

      {provinces.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-fg">
            <Icon name="MapPin" size={17} className="text-muted" />
            İl bazında
          </h2>
          <div className="flex flex-wrap gap-2">
            {provinces.map(([p, count]) => (
              <Link
                key={p}
                to={`/il/${encodeURIComponent(p)}`}
                className="rounded-full border border-line px-3.5 py-1.5 text-[13px] text-muted transition hover:bg-surface-2 hover:text-fg"
              >
                {p} <span className="text-faint">({count})</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
