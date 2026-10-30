import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { categories } from '../data/categories'
import { CategoryMark } from './CategoryMark'
import { Icon } from './Icon'
import { Logo } from './Logo'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-[1400px] px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-[0.75rem] leading-relaxed text-muted">
              {t('legal.about') === 'Hakkımızda'
                ? 'Mesleki eğitimden MEB gündemine, Çorum yerel haberlerinden yabancı eğitim gelişmelerine kadar eğitim ekosisteminin güncel haber platformu.'
                : 'The current news platform for the education ecosystem.'}
            </p>
          </div>

          <nav>
            <h3 className="mb-3 text-[0.75rem] font-bold tracking-wide text-fg uppercase">
              Kategoriler
            </h3>
            <ul className="space-y-2">
              {categories.slice(0, 7).map((c) => (
                <li key={c.slug}>
                  <Link
                    to={`/kategori/${c.slug}`}
                    className="flex items-center gap-2 text-[0.75rem] text-muted transition hover:text-fg"
                  >
                    <CategoryMark mark={c.mark} color={c.color} size={13} strokeWidth={1.8} />
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav>
            <h3 className="mb-3 text-[0.75rem] font-bold tracking-wide text-fg uppercase">Site</h3>
            <ul className="space-y-2">
              {[
                ['/kategoriler', t('nav.categories')],
                ['/ara', t('nav.search')],
                ['/kaydedilenler', t('nav.bookmarks')],
                ['/begeniler', t('nav.likes')],
                ['/profil', t('nav.profile')],
                ['/ayarlar', t('nav.settings')],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-[0.75rem] text-muted transition hover:text-fg">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav>
            <h3 className="mb-3 text-[0.75rem] font-bold tracking-wide text-fg uppercase">Yasal</h3>
            <ul className="space-y-2">
              {[
                ['/hakkimizda', t('legal.about')],
                ['/kurumsal', 'Kurumsal ve Editoryal Politika'],
                ['/gizlilik', t('legal.privacy')],
                ['/kvkk', t('legal.kvkk')],
                ['/kullanim-sartlari', t('legal.terms')],
                ['/cerez-politikasi', t('cookie.policy')],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-[0.75rem] text-muted transition hover:text-fg">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-line pt-6 text-center">
          <p className="flex flex-wrap items-center justify-center gap-2 text-[0.6875rem] text-faint">
            <span>
              © 2026 Eğitim Haberleri ·{' '}
              <a
                href="https://corummesem.com.tr"
                className="underline hover:text-fg"
              >
                www.corummesem.com.tr
              </a>{' '}
              · {t('legal.preparedBy')}{' '}
              <span className="font-semibold tracking-wide text-muted">OMERZEN</span>
              {' '}· Tüm hakları saklıdır.
            </span>
          </p>
        </div>
      </div>
    </footer>
  )
}

export function ScrollToTop() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!show) return null
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Başa dön"
      className="fixed bottom-20 left-4 z-40 grid size-10 place-items-center rounded-full border border-line bg-surface/90 text-fg shadow-lg backdrop-blur transition hover:bg-surface-2 sm:bottom-6"
    >
      <Icon name="ChevronDown" size={18} className="rotate-180" />
    </button>
  )
}
