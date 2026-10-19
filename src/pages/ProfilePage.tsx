import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAllNews } from '../lib/api'
import { useStore } from '../lib/store'
import { categories } from '../data/categories'
import { CategoryMark } from '../components/CategoryMark'
import { Icon } from '../components/Icon'
import { formatCount } from '../lib/format'

export function ProfilePage() {
  const { t } = useTranslation()
  const store = useStore()
  const { data } = useAllNews()

  if (!store.signedIn) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-surface-2 text-muted">
          <Icon name="User" size={26} />
        </span>
        <h1 className="mt-5 text-xl font-bold text-fg">{t('nav.signIn')}</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">{t('auth.subtitle')}</p>
        <Link
          to="/giris"
          className="mt-6 inline-block rounded-full bg-fg px-5 py-2.5 text-sm font-semibold text-bg"
        >
          {t('nav.signIn')}
        </Link>
      </div>
    )
  }

  const readByCategory = categories
    .map((c) => ({
      c,
      count: (data ?? []).filter((n) => n.category === c.slug && store.readMarks.includes(n.id)).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  const maxCount = Math.max(1, ...readByCategory.map((x) => x.count))

  const stats = [
    { label: 'Toplam okuma', value: store.readMarks.length, icon: 'BookOpen' },
    { label: 'Kaydedilen', value: store.bookmarks.length, icon: 'Bookmark' },
    { label: 'Beğeni', value: store.likes.length, icon: 'Heart' },
    { label: 'Takip edilen', value: store.followed.length, icon: 'Check' },
  ]

  // Gerçek kullanıcı bilgisi; demo modunda demo kullanıcı gösterilir.
  const user = store.user
  const isDemo = store.demoUser
  const displayName = user?.name || (isDemo ? 'Demo Kullanıcı' : 'Kullanıcı')
  const displayEmail = user?.email || (isDemo ? 'Demo hesabı ile giriş yapıldı' : '')
  const initial = displayName.trim().charAt(0).toLocaleUpperCase('tr')

  return (
    <div className="mx-auto max-w-[760px] px-3 pb-16 sm:px-4">
      <header className="mb-6 flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="size-16 shrink-0 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-primary text-2xl font-black text-white">
            {initial}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold tracking-tight text-fg">{displayName}</h1>
          <p className="mt-0.5 truncate text-[12px] text-faint">
            {displayEmail || t('auth.devModeDesc')}
          </p>
        </div>
        <Link
          to="/ayarlar"
          className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-[12px] font-medium text-muted transition hover:bg-surface-2 hover:text-fg"
        >
          {t('nav.settings')}
        </Link>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-surface p-4 text-center">
            <Icon name={s.icon} size={17} className="mx-auto text-faint" />
            <p className="mt-2 text-2xl font-extrabold text-fg">{formatCount(s.value, 'tr')}</p>
            <p className="mt-0.5 text-[11px] text-faint">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="mb-6 rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-4 text-sm font-bold text-fg">En çok okuduğum kategoriler</h2>
        <div className="space-y-2.5">
          {readByCategory.map(({ c, count }) => (
            <div key={c.slug} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-[12px] text-muted">{c.name}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${(count / maxCount) * 100}%`,
                    background: `linear-gradient(90deg, ${c.gradient[0]}, ${c.gradient[1]})`,
                  }}
                />
              </span>
              <span className="w-6 text-right text-[11px] text-faint">{count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-3 text-sm font-bold text-fg">Takip edilen kategoriler</h2>
        <div className="flex flex-wrap gap-2">
          {store.followed.length === 0 && (
            <p className="text-[12px] text-faint">{t('settings.categoriesDesc')}</p>
          )}
          {store.followed.map((slug) => {
            const c = categories.find((x) => x.slug === slug)
            if (!c) return null
            return (
              <Link
                key={slug}
                to={`/kategori/${slug}`}
                className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12px] text-muted transition hover:bg-surface-2 hover:text-fg"
              >
                <CategoryMark mark={c.mark} color={c.color} size={13} strokeWidth={1.8} />
                {c.name}
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
