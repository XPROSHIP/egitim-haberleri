import { NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { Icon } from './Icon'
import { useStore } from '../lib/store'

const TABS = [
  { to: '/', label: 'Haberler', icon: 'Newspaper' as const, end: true },
  { to: '/feed', label: 'Akış', icon: 'TrendingUp' as const, end: false },
  { to: '/kategoriler', label: 'Kategoriler', icon: 'Compass' as const, end: false },
  { to: '/ayarlar', label: 'Ayarlar', icon: 'Settings' as const, end: false },
  { to: '/profil', label: 'Profil', icon: 'User' as const, end: false },
]

/**
 * Mobilde her sayfada erişilebilen sabit alt çubuk.
 * Sayfa içeriğinin altında kalmaması için gövdeye alt boşluk bırakılır.
 */
export function MobileTabBar() {
  const { pathname } = useLocation()
  const { signedIn } = useStore()

  // Hikâye oynatıcı tam ekran olduğu için çubuk gizlenir
  if (pathname.startsWith('/hikaye')) return null

  return (
    <nav
      aria-label="Alt gezinme"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/85 backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1 py-1.5">
        {TABS.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-[10.5px] transition',
                  isActive ? 'text-fg' : 'text-faint hover:text-muted',
                )
              }
            >
              <Icon name={tab.icon} size={19} />
              <span className="truncate">{tab.label}</span>
            </NavLink>
          </li>
        ))}
        {!signedIn && (
          <li className="flex-1">
            <NavLink
              to="/giris"
              className="flex flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-[10.5px] text-faint transition hover:text-muted"
            >
              <Icon name="User" size={19} />
              <span className="truncate">Giriş</span>
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  )
}
