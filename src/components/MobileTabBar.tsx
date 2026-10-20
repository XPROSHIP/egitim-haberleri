import { NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { Icon } from './Icon'
import { useStore } from '../lib/store'
import { bus, EVENTS } from '../lib/bus'

// Beş düğme: profil ve giriş ayrı değil — giriş yapılmamışsa beşinci düğme
// "Giriş" olur ve giriş penceresini açar.
const TABS = [
  { to: '/', label: 'Haberler', icon: 'Newspaper' as const, end: true },
  { to: '/feed', label: 'Akış', icon: 'TrendingUp' as const, end: false },
  { to: '/kategoriler', label: 'Kategoriler', icon: 'Compass' as const, end: false },
  { to: '/ayarlar', label: 'Ayarlar', icon: 'Settings' as const, end: false },
]

/**
 * Mobilde her sayfada erişilebilen sabit alt çubuk.
 * Sayfa içeriğinin altında kalmaması için gövdeye alt boşluk bırakılır.
 */
export function MobileTabBar() {
  const { pathname } = useLocation()
  const { signedIn, user } = useStore()

  // Hikâye oynatıcı tam ekran olduğu için çubuk gizlenir
  if (pathname.startsWith('/hikaye')) return null

  return (
    <nav
      aria-label="Alt gezinme"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/60 bg-bg/55 backdrop-blur-xl backdrop-saturate-150 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex w-full max-w-md items-stretch justify-between px-1 py-1.5">
        {TABS.map((tab) => (
          <li key={tab.to} className="min-w-0 flex-1">
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-0.5 rounded-lg px-0.5 py-1 text-[10px] transition',
                  isActive ? 'text-fg' : 'text-faint hover:text-muted',
                )
              }
            >
              <Icon name={tab.icon} size={18} />
              <span className="max-w-full truncate">{tab.label}</span>
            </NavLink>
          </li>
        ))}

        {/* Beşinci düğme: giriş yapıldıysa profil, yapılmadıysa giriş */}
        <li className="min-w-0 flex-1">
          {signedIn ? (
            <NavLink
              to="/profil"
              className="flex flex-col items-center gap-0.5 rounded-lg px-0.5 py-1 text-[10px] text-faint transition hover:text-muted"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="size-[18px] rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="grid size-[18px] place-items-center rounded-full bg-fg text-[9px] font-bold text-bg">
                  {(user?.name || user?.email || '?').trim().charAt(0).toLocaleUpperCase('tr')}
                </span>
              )}
              <span className="max-w-full truncate">Profil</span>
            </NavLink>
          ) : (
            <button
              type="button"
              onClick={() => bus.emit(EVENTS.openLogin)}
              className="flex w-full flex-col items-center gap-0.5 rounded-lg px-0.5 py-1 text-[10px] text-faint transition hover:text-muted"
            >
              <Icon name="User" size={18} />
              <span className="max-w-full truncate">Giriş</span>
            </button>
          )}
        </li>
      </ul>
    </nav>
  )
}
