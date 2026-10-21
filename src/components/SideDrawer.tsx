import { useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { categories } from '../data/categories'
import { useStore } from '../lib/store'
import { CategoryMark } from './CategoryMark'
import { Icon } from './Icon'
import { Logo } from './Logo'
import { bus, EVENTS } from '../lib/bus'

export function SideDrawer({
  open,
  onClose,
  onOpenLogin,
}: {
  open: boolean
  onClose: () => void
  onOpenLogin: () => void
}) {
  const { t } = useTranslation()
  const { signedIn, followed, toggleFollow, setUser, bookmarkCount } = useDrawerState()

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const items = [
    { to: '/', label: t('nav.latest'), icon: 'Clock', end: true },
    { to: '/feed', label: 'Akış', icon: 'ListFilter' },
    { to: '/kategoriler', label: t('nav.categories'), icon: 'Compass' },
    { to: '/ara', label: t('nav.search'), icon: 'Search' },
    { to: '/kaydedilenler', label: t('nav.bookmarks'), icon: 'Bookmark' },
    { to: '/begeniler', label: t('nav.likes'), icon: 'Heart' },
    { to: '/profil', label: t('nav.profile'), icon: 'User' },
    { to: '/ayarlar', label: t('nav.settings'), icon: 'Settings' },
    { to: '/hakkimizda', label: t('legal.about'), icon: 'Newspaper' },
  ]

  return (
    <>
      <div
        onClick={onClose}
        className={clsx(
          'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />
      <aside
        className={clsx(
          'fixed top-0 left-0 z-50 flex h-full w-[290px] flex-col border-r border-line bg-surface transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-line px-4">
          <Logo compact />
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid size-9 place-items-center rounded-full text-fg transition hover:bg-surface-2"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <button
            type="button"
            onClick={() => {
              bus.emit(EVENTS.openStories)
              onClose()
            }}
            className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-fg transition hover:bg-surface-2"
          >
            <Icon name="Play" size={17} />
            Hikâyeler
          </button>

          <NavLink
            to="/podcast"
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                isActive ? 'bg-surface-2 text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
              )
            }
          >
            <Icon name="Mic" size={17} />
            ZENPOD Eğitim
          </NavLink>

          {items.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isActive ? 'bg-surface-2 text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
                )
              }
            >
              <Icon name={i.icon} size={17} />
              {i.label}
            </NavLink>
          ))}

          <div className="mt-4 px-3 text-[0.6875rem] font-semibold tracking-wide text-faint uppercase">
            {t('nav.categories')}
          </div>
          <div className="mt-1">
            {categories.map((c) => {
              const on = followed.includes(c.slug)
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => toggleFollow(c.slug)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surface-2 hover:text-fg"
                >
                  <span
                    className="grid size-6 shrink-0 place-items-center rounded-md text-white"
                    style={{ background: c.color }}
                  >
                    <CategoryMark mark={c.mark} color="currentColor" size={13} strokeWidth={2} />
                  </span>
                  <span className="flex-1 text-left">{c.name}</span>
                  {on ? (
                    <Icon name="Check" size={15} className="text-primary" />
                  ) : (
                    <Icon name="Plus" size={15} className="text-faint" />
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-line p-3">
          {signedIn ? (
            <button
              type="button"
              onClick={() => setUser(null)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition hover:bg-surface-2 hover:text-fg"
            >
              <Icon name="LogOut" size={17} />
              {t('nav.signOut')}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="w-full rounded-lg bg-fg px-4 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90"
            >
              {t('nav.signIn')}
            </button>
          )}
          <p className="mt-3 text-center text-[0.6875rem] text-faint">
            {t('legal.preparedBy')} <span className="font-semibold">OMERZEN</span> © 2026
          </p>
          <Link
            to="/kvkk"
            onClick={onClose}
            className="mt-1 block text-center text-[0.6875rem] text-faint underline-offset-2 hover:underline"
          >
            {t('legal.kvkk')}
          </Link>
        </div>
        <span className="hidden">{bookmarkCount}</span>
      </aside>
    </>
  )
}

function useDrawerState() {
  const store = useStore()
  return {
    ...store,
    bookmarkCount: store.bookmarks.length,
  }
}
