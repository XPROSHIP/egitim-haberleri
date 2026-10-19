import { useEffect, useRef, useState } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { categories } from '../data/categories'
import { useStore, type FeedMode } from '../lib/store'
import { Icon } from './Icon'
import { Logo } from './Logo'
import { bus, EVENTS } from '../lib/bus'

const MODE_KEYS: Record<FeedMode, string> = {
  latest: 'feed.modeLatest',
  featured: 'feed.modeFeatured',
  following: 'feed.modeFollowing',
  foryou: 'feed.modeForYou',
}

const MODE_ICONS: Record<FeedMode, string> = {
  latest: 'Clock',
  featured: 'Sparkles',
  following: 'Bookmark',
  foryou: 'Wand2',
}

export function TopBar({
  onOpenDrawer,
  onOpenLogin,
  onOpenAssistant,
}: {
  onOpenDrawer: () => void
  onOpenLogin: () => void
  onOpenAssistant: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { resolvedTheme, setTheme, feedMode, setFeedMode, hiddenCategories, signedIn, user } = useStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ] = useState('')
  const [modeOpen, setModeOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setModeOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const visible = categories.filter((c) => !hiddenCategories.includes(c.slug))
  const currentLabel = t(MODE_KEYS[feedMode])
  // Akış (Twitter benzeri) modunda mıyız?
  const { pathname } = useLocation()
  const isFeed = pathname.startsWith('/feed')

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-3 sm:px-4">
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label={t('nav.menu')}
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:text-fg lg:hidden"
        >
          <Icon name="Menu" size={19} />
        </button>

        <Logo />

        {searchOpen ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (q.trim()) navigate(`/ara?q=${encodeURIComponent(q.trim())}`)
              setSearchOpen(false)
            }}
            className="mx-auto flex w-full max-w-md items-center gap-2"
          >
            <div className="flex w-full items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2">
              <Icon name="Search" size={16} className="shrink-0 text-faint" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('common.searchPlaceholder')}
                className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-faint"
              />
              <button type="button" onClick={() => setSearchOpen(false)} aria-label={t('common.close')}>
                <Icon name="X" size={16} className="text-faint transition hover:text-fg" />
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Akış modu — seçili olan yuvarlatılmış beyaz dikdörtgen */}
            <div className="relative ml-1 hidden shrink-0 sm:block">
              <button
                type="button"
                onClick={() => setModeOpen((v) => !v)}
                className={clsx(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition',
                  feedMode === 'latest'
                    ? 'bg-fg text-bg'
                    : 'text-muted hover:bg-surface-2 hover:text-fg',
                )}
              >
                {currentLabel}
                <Icon name="ChevronDown" size={14} className="opacity-60" />
              </button>
              {modeOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setModeOpen(false)} />
                  <div className="absolute left-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
                    {/* Akış modu (Twitter benzeri) ile blog modu arasındaki geçiş */}
                    <button
                      type="button"
                      onClick={() => {
                        setModeOpen(false)
                        navigate(isFeed ? '/' : '/feed')
                      }}
                      className={clsx(
                        'flex w-full items-center gap-2.5 border-b border-line-soft px-3.5 py-2.5 text-sm transition hover:bg-surface-2',
                        isFeed ? 'text-primary' : 'text-fg',
                      )}
                    >
                      <Icon name="Newspaper" size={16} />
                      {t('feed.feedMode')}
                      {isFeed && <Icon name="Check" size={14} className="ml-auto" />}
                    </button>

                    {(Object.keys(MODE_KEYS) as FeedMode[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setFeedMode(m)
                          setModeOpen(false)
                          navigate('/')
                        }}
                        className={clsx(
                          'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm transition hover:bg-surface-2',
                          feedMode === m ? 'text-primary' : 'text-fg',
                        )}
                      >
                        <Icon name={MODE_ICONS[m]} size={16} />
                        {t(MODE_KEYS[m])}
                        {feedMode === m && <Icon name="Check" size={14} className="ml-auto" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <nav className="no-scrollbar hidden flex-1 items-center gap-1 overflow-x-auto lg:flex">
              {visible.slice(0, 6).map((c) => (
                <NavLink
                  key={c.slug}
                  to={`/kategori/${c.slug}`}
                  className={({ isActive }) =>
                    clsx(
                      'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] whitespace-nowrap transition',
                      isActive
                        ? 'bg-fg font-medium text-bg'
                        : 'text-muted hover:bg-surface-2 hover:text-fg',
                    )
                  }
                >
                  {c.name}
                </NavLink>
              ))}
              <NavLink
                to="/kategoriler"
                className={({ isActive }) =>
                  clsx(
                    'flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[13px] transition',
                    isActive ? 'bg-fg font-medium text-bg' : 'text-muted hover:text-fg',
                  )
                }
              >
                Diğer
                <Icon name="ChevronDown" size={13} />
              </NavLink>
            </nav>
          </>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => bus.emit(EVENTS.openStories)}
            title="Hikâyeler"
            aria-label="Hikâyeler"
            className="hidden size-9 place-items-center rounded-full text-muted transition hover:text-fg md:grid"
          >
            <Icon name="Play" size={17} />
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={t('common.search')}
            className="grid size-9 place-items-center rounded-full text-muted transition hover:text-fg"
          >
            <Icon name="Search" size={17} />
          </button>
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Tema"
            className="grid size-9 place-items-center rounded-full text-muted transition hover:text-fg"
          >
            <Icon name={resolvedTheme === 'dark' ? 'Sun' : 'Moon'} size={17} />
          </button>
          <button
            type="button"
            onClick={onOpenAssistant}
            aria-label={t('nav.assistant')}
            className="hidden size-9 place-items-center rounded-full text-muted transition hover:text-fg sm:grid"
          >
            <Icon name="Sparkles" size={17} />
          </button>

          {/* Profil, kaydedilenler, beğeniler ve ayarlar kısayolları.
              Alt menüde de var; buradaki düğmeler hızlı erişim sağlar. */}
          <Link
            to="/kaydedilenler"
            aria-label="Kaydedilenler"
            title="Kaydedilenler"
            className="grid size-9 place-items-center rounded-full text-muted transition hover:text-fg"
          >
            <Icon name="Bookmark" size={17} />
          </Link>
          <Link
            to="/begeniler"
            aria-label="Beğenilerim"
            title="Beğenilerim"
            className="grid size-9 place-items-center rounded-full text-muted transition hover:text-fg"
          >
            <Icon name="Heart" size={17} />
          </Link>
          <Link
            to="/profil"
            aria-label="Profil"
            title="Profil"
            className="grid size-9 place-items-center rounded-full text-muted transition hover:text-fg"
          >
            <Icon name="User" size={17} />
          </Link>
          <Link
            to="/ayarlar"
            aria-label="Ayarlar"
            title="Ayarlar"
            className="grid size-9 place-items-center rounded-full text-muted transition hover:text-fg"
          >
            <Icon name="Settings" size={17} />
          </Link>

          {/* Giriş durumu: girildiyse kullanıcı düğmesi, girilmediyse "Giriş Yap" */}
          {signedIn ? (
            <Link
              to="/profil"
              className="ml-1.5 flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 transition hover:bg-surface-2"
              title={user?.name ? `${user.name} · ${user.email}` : 'Profil'}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="size-7 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="grid size-7 place-items-center rounded-full bg-fg text-[11px] font-semibold text-bg">
                  {(user?.name || user?.email || '?').trim().charAt(0).toLocaleUpperCase('tr')}
                </span>
              )}
              <span className="max-w-[110px] truncate text-[13px] font-semibold text-fg">
                {user?.name || user?.email || 'Profil'}
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="ml-1.5 rounded-full bg-fg px-3.5 py-1.5 text-[13px] font-semibold text-bg transition hover:opacity-90"
            >
              {t('nav.signIn')}
            </button>
          )}
        </div>
      </div>

      {/* Mobil kategori şeridi */}
      {!searchOpen && (
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto border-t border-line-soft px-3 py-2 lg:hidden">
          {visible.map((c) => (
            <NavLink
              key={c.slug}
              to={`/kategori/${c.slug}`}
              className={({ isActive }) =>
                clsx(
                  'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] whitespace-nowrap transition',
                  isActive ? 'bg-fg font-medium text-bg' : 'text-muted',
                )
              }
            >
              {c.name}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}
