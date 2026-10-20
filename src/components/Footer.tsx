import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { categories } from '../data/categories'
import { dataSource } from '../lib/api'
import { CategoryMark } from './CategoryMark'
import { Icon } from './Icon'
import { Logo } from './Logo'

const sourceLabel: Record<string, string> = {
  api: 'Canlı veri · otomatik güncelleme açık',
  collected: 'Toplayıcıdan otomatik derlenmiş güncel haberler',
  demo: 'Demo veri · toplayıcı henüz çalışmadı',
}

export function Footer() {
  const { t } = useTranslation()
  // Otomasyon durumu: erişim anahtarı bozulursa site kendisi uyarır,
  // böylece hatırlamaya gerek kalmaz.
  const [automationOk, setAutomationOk] = useState(true)

  useEffect(() => {
    let alive = true
    const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
    if (!BASE) return
    const check = async () => {
      try {
        const res = await fetch(`${BASE}/api/health`)
        if (!res.ok) return
        const data = (await res.json()) as {
          automation?: { dispatch?: { ok?: boolean } | null }
        }
        if (!alive) return
        const d = data.automation?.dispatch
        // Hiç kayıt yoksa (ilk kurulum) uyarı göstermeyelim.
        if (d && d.ok === false) setAutomationOk(false)
      } catch {
        /* ağ hatası: mevcut durumu koru */
      }
    }
    void check()
    const timer = setInterval(check, 10 * 60_000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [])

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-[1400px] px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-[12px] leading-relaxed text-muted">
              {t('legal.about') === 'Hakkımızda'
                ? 'Mesleki eğitimden MEB gündemine, Çorum yerel haberlerinden yabancı eğitim gelişmelerine kadar eğitim ekosisteminin güncel haber platformu.'
                : 'The current news platform for the education ecosystem.'}
            </p>
          </div>

          <nav>
            <h3 className="mb-3 text-[12px] font-bold tracking-wide text-fg uppercase">
              Kategoriler
            </h3>
            <ul className="space-y-2">
              {categories.slice(0, 7).map((c) => (
                <li key={c.slug}>
                  <Link
                    to={`/kategori/${c.slug}`}
                    className="flex items-center gap-2 text-[12px] text-muted transition hover:text-fg"
                  >
                    <CategoryMark mark={c.mark} color={c.color} size={13} strokeWidth={1.8} />
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav>
            <h3 className="mb-3 text-[12px] font-bold tracking-wide text-fg uppercase">Site</h3>
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
                  <Link to={to} className="text-[12px] text-muted transition hover:text-fg">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav>
            <h3 className="mb-3 text-[12px] font-bold tracking-wide text-fg uppercase">Yasal</h3>
            <ul className="space-y-2">
              {[
                ['/hakkimizda', t('legal.about')],
                ['/gizlilik', t('legal.privacy')],
                ['/kvkk', t('legal.kvkk')],
                ['/kullanim-sartlari', t('legal.terms')],
                ['/cerez-politikasi', t('cookie.policy')],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-[12px] text-muted transition hover:text-fg">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-line pt-6 text-center">
          <p className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-faint">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1">
              <span
                className={clsx(
                  'size-1.5 rounded-full',
                  automationOk ? 'bg-emerald-500' : 'bg-amber-500',
                )}
              />
              {automationOk ? sourceLabel[dataSource] : 'Güncelleme bekliyor — otomasyon durakladı'}
            </span>
            <span>
              © 2026 Eğitim Haberleri — {t('legal.preparedBy')}{' '}
              <span className="font-semibold tracking-wide text-muted">OMERZEN</span>
            </span>
          </p>
          <p className="max-w-2xl text-[10px] leading-relaxed text-faint/70">
            Haberler ilgili kaynaklardan otomatik olarak derlenir. Özetler yapay zekâ tarafından
            üretilmiştir; resmî bilgi için kaynak kurumların sitelerini esas alınız.
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
