import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { useAllNews } from '../lib/api'
import { useStore, type FontScale, type ThemeMode } from '../lib/store'
import { categories } from '../data/categories'
import { CategoryMark } from '../components/CategoryMark'
import { Icon } from '../components/Icon'
import { signOut } from '../lib/auth'
import { bus, EVENTS } from '../lib/bus'
import { disablePush, enablePush, isPushEnabled, pushSupported } from '../lib/push'

/* ── iOS benzeri gruplandırılmış liste öğeleri ───────────────────────────── */

function Group({
  title,
  footer,
  children,
}: {
  title: string
  footer?: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-7">
      <h2 className="mb-2 px-3 text-[0.6875rem] font-semibold tracking-[0.07em] text-faint uppercase">
        {title}
      </h2>
      <div className="overflow-hidden rounded-xl border border-line bg-surface">{children}</div>
      {footer && <p className="mt-2 px-3 text-[0.71875rem] leading-relaxed text-faint">{footer}</p>}
    </section>
  )
}

function RowShell({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={clsx(
        'flex w-full items-center gap-3 px-4 py-3 text-left',
        onClick && 'transition active:bg-surface-2',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

function NavRow({
  to,
  icon,
  label,
  value,
  tone,
}: {
  to: string
  icon: string
  label: string
  value?: string
  tone?: string
}) {
  return (
    <Link to={to} className="block border-b border-line-soft last:border-b-0">
      <RowShell>
        {icon && (
          <span
            className="grid size-7 shrink-0 place-items-center rounded-lg text-white"
            style={{ background: tone ?? 'var(--surface-3)', color: tone ? '#fff' : undefined }}
          >
            <Icon name={icon} size={15} />
          </span>
        )}
        <span className="min-w-0 flex-1 text-[0.875rem] text-fg">{label}</span>
        {value && <span className="shrink-0 text-[0.8125rem] text-faint">{value}</span>}
        <Icon name="ChevronRight" size={15} className="shrink-0 text-faint" />
      </RowShell>
    </Link>
  )
}

function ActionRow({
  icon,
  label,
  tone = 'var(--surface-3)',
  onClick,
  danger,
}: {
  icon: string
  label: string
  tone?: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <div className="border-b border-line-soft last:border-b-0">
      <RowShell onClick={onClick}>
        <span
          className="grid size-7 shrink-0 place-items-center rounded-lg text-white"
          style={{ background: tone }}
        >
          <Icon name={icon} size={15} />
        </span>
        <span className={clsx('min-w-0 flex-1 text-[0.875rem]', danger ? 'text-accent' : 'text-fg')}>
          {label}
        </span>
        <Icon name="ChevronRight" size={15} className="shrink-0 text-faint" />
      </RowShell>
    </div>
  )
}

function ToggleRow({
  label,
  desc,
  on,
  onChange,
}: {
  label: string
  desc?: string
  on: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="border-b border-line-soft last:border-b-0">
      <RowShell onClick={() => onChange(!on)}>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.875rem] text-fg">{label}</span>
          {desc && <span className="mt-0.5 block text-[0.71875rem] text-faint">{desc}</span>}
        </span>
        <span
          className={clsx(
            'relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-200',
            on ? 'bg-[#30d158]' : 'bg-surface-3',
          )}
        >
          <span
            className={clsx(
              'absolute top-[2px] size-[22px] rounded-full bg-white shadow transition-all duration-200',
              on ? 'left-[22px]' : 'left-[2px]',
            )}
          />
        </span>
      </RowShell>
    </div>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  preview,
}: {
  value: T
  options: { key: T; label: string; icon?: string; size?: number }[]
  onChange: (v: T) => void
  preview?: boolean
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-line bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={clsx(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[0.78125rem] font-medium transition',
            value === o.key ? 'bg-fg text-bg' : 'text-muted hover:text-fg',
          )}
          style={preview ? { fontSize: `${(o.size ?? 13)}px` } : undefined}
        >
          {o.icon && <Icon name={o.icon} size={14} />}
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ── Sayfa ──────────────────────────────────────────────────────────────── */

export function SettingsPage() {
  const { t } = useTranslation()
  const store = useStore()
  const { data } = useAllNews()
  const [toast, setToast] = useState('')
  const [pushOn, setPushOn] = useState(false)

  // Bildirim durumu: tarayıcı izin verdiyse ve abonelik kayıtlıysa açık.
  useEffect(() => {
    setPushOn(isPushEnabled())
  }, [])

  const onPushToggle = async (v: boolean) => {
    if (!pushSupported()) {
      setToast(t('settings.pushUnsupported'))
      setTimeout(() => setToast(''), 2600)
      return
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      setToast(t('settings.pushBlocked'))
      setTimeout(() => setToast(''), 3200)
      return
    }
    const ok = v ? await enablePush(store.followed) : await disablePush()
    setPushOn(ok)
    setToast(ok ? t('settings.pushSaved') : t('settings.pushFailed'))
    setTimeout(() => setToast(''), 2600)
  }

  const themes: { key: ThemeMode; label: string; icon: string }[] = [
    { key: 'light', label: t('settings.themeLight'), icon: 'Sun' },
    { key: 'sepia', label: 'Sepya', icon: 'BookOpen' },
    { key: 'dark', label: t('settings.themeDark'), icon: 'Moon' },
    { key: 'system', label: t('settings.themeAuto'), icon: 'Settings' },
  ]
  const scales: { key: FontScale; label: string; size: number }[] = [
    { key: '1', label: 'A', size: 13 },
    { key: '1.25', label: 'A', size: 14 },
    { key: '1.5', label: 'A', size: 15 },
  ]

  const exportData = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'egitim-haberleri-verilerim.json'
    a.click()
    URL.revokeObjectURL(a.href)
    setToast(t('common.saved'))
    setTimeout(() => setToast(''), 1600)
  }

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-20">
      <h1 className="mb-6 pt-8 text-3xl font-bold tracking-tight text-fg">{t('settings.title')}</h1>

      <Group title="Görünüm">
        <div className="space-y-4 p-4">
          <div>
            <p className="mb-2 text-[0.75rem] text-muted">{t('settings.theme')}</p>
            <Segmented
              value={store.theme}
              options={themes}
              onChange={store.setTheme}
            />
          </div>
          <div>
            <p className="mb-2 text-[0.75rem] text-muted">{t('settings.font')}</p>
            <Segmented
              value={store.fontScale}
              options={scales}
              onChange={store.setFontScale}
              preview
            />
            <p className="mt-1.5 text-[0.6875rem] text-faint">{t('settings.fontHint')}</p>
          </div>
        </div>
        <div className="border-t border-line-soft p-4">
          <p className="text-[0.9375rem] font-semibold text-fg">{t('settings.previewTitle')}</p>
          <p className="mt-1 text-[0.8125rem] text-muted">{t('settings.previewBody')}</p>
        </div>
      </Group>

      {/* Okuma konforu */}
      <Group title="Okuma konforu" footer={t('settings.readerDesc')}>
        <div className="space-y-4 p-4">
          <div>
            <p className="mb-2 text-[0.75rem] text-muted">Yazı tipi</p>
            <Segmented
              value={store.readerFont}
              options={[
                { key: 'sans', label: 'Modern' },
                { key: 'serif', label: 'Klasik (Fraunces)' },
                { key: 'handwriting', label: 'El Yazısı (Playpen)' },
              ]}
              onChange={store.setReaderFont}
            />
          </div>
          <div>
            <p className="mb-2 text-[0.75rem] text-muted">Metin genişliği</p>
            <Segmented
              value={store.readerWidth}
              options={[
                { key: 'narrow', label: 'Dar' },
                { key: 'normal', label: 'Normal' },
                { key: 'wide', label: 'Geniş' },
              ]}
              onChange={store.setReaderWidth}
            />
          </div>
          <div>
            <p className="mb-2 text-[0.75rem] text-muted">Satır aralığı</p>
            <Segmented
              value={store.readerLine}
              options={[
                { key: 'compact', label: 'Sık' },
                { key: 'normal', label: 'Normal' },
                { key: 'relaxed', label: 'Açık' },
              ]}
              onChange={store.setReaderLine}
            />
          </div>
        </div>
        <div className="border-t border-line-soft p-4">
          <div className="article-prose">
            <p className="text-[0.9375rem] font-semibold text-fg">{t('settings.previewTitle')}</p>
            <p className="text-[0.8125rem] text-muted">{t('settings.previewBody')}</p>
          </div>
        </div>
      </Group>

      <Group title="Akış" footer={t('settings.personalDesc')}>
        <ToggleRow
          label="Kişiselleştirilmiş sıralama"
          desc="İlgi alanına göre sıralar"
          on={store.feedMode === 'foryou'}
          onChange={(v) => store.setFeedMode(v ? 'foryou' : 'latest')}
        />
        <ToggleRow
          label={t('feed.hideRead')}
          desc="Okuduğun haberler akışta görünmez"
          on={store.hideRead}
          onChange={store.setHideRead}
        />
        <ToggleRow
          label={t('settings.push')}
          desc={t('settings.pushDesc')}
          on={pushOn}
          onChange={onPushToggle}
        />
      </Group>

      <Group title={t('settings.categories')} footer={t('settings.categoriesDesc')}>
        {categories.map((c) => {
          const count = (data ?? []).filter((n) => n.category === c.slug).length
          return (
            <div key={c.slug} className="border-b border-line-soft last:border-b-0">
              <RowShell onClick={() => store.toggleFollow(c.slug)}>
                <span
                  className="grid size-7 shrink-0 place-items-center rounded-lg"
                  style={{
                    background: `color-mix(in srgb, ${c.color} 15%, transparent)`,
                    color: c.color,
                  }}
                >
                  <CategoryMark mark={c.mark} size={15} strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1 text-[0.875rem] text-fg">{c.name}</span>
                <span className="tnum shrink-0 text-[0.75rem] text-faint">{count}</span>
                <span
                  className={clsx(
                    'relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-200',
                    store.followed.includes(c.slug) ? 'bg-[#30d158]' : 'bg-surface-3',
                  )}
                >
                  <span
                    className={clsx(
                      'absolute top-[2px] size-[22px] rounded-full bg-white shadow transition-all duration-200',
                      store.followed.includes(c.slug) ? 'left-[22px]' : 'left-[2px]',
                    )}
                  />
                </span>
              </RowShell>
            </div>
          )
        })}
      </Group>

      <Group title={t('settings.account')}>
        {store.user ? (
          <>
            <RowShell>
              {store.user.avatarUrl ? (
                <img
                  src={store.user.avatarUrl}
                  alt=""
                  className="size-8 shrink-0 rounded-full"
                />
              ) : (
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-fg text-[0.8125rem] font-bold text-bg">
                  {(store.user.name || '?').charAt(0).toLocaleUpperCase('tr')}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.875rem] text-fg">{store.user.name}</span>
                <span className="block truncate text-[0.71875rem] text-faint">{store.user.email}</span>
              </span>
              {store.demoUser && (
                <span className="shrink-0 rounded-full bg-surface-3 px-2 py-0.5 text-[0.625rem] text-faint">
                  demo
                </span>
              )}
            </RowShell>
            <ActionRow
              icon="LogOut"
              label={t('nav.signOut')}
              tone="#ff453a"
              onClick={() => {
                void signOut()
                store.setUser(null)
              }}
            />
          </>
        ) : (
          <RowShell onClick={() => bus.emit(EVENTS.openLogin)}>
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface-3 text-muted">
              <Icon name="User" size={15} />
            </span>
            <span className="min-w-0 flex-1 text-[0.875rem] text-fg">{t('nav.signIn')}</span>
            <Icon name="ChevronRight" size={15} className="shrink-0 text-faint" />
          </RowShell>
        )}
      </Group>

      <Group title={t('settings.privacy')}>
        <NavRow to="/kvkk" icon="Landmark" label={t('legal.kvkk')} />
        <NavRow to="/gizlilik" icon="Lock" label={t('legal.privacy')} />
        <NavRow to="/cerez-politikasi" icon="Bookmark" label={t('legal.cookies')} />
        <NavRow to="/kullanim-sartlari" icon="Newspaper" label={t('legal.terms')} />
      </Group>

      <Group title={t('settings.data')}>
        <ActionRow icon="Copy" label={t('settings.exportData')} onClick={exportData} />
        <ActionRow
          icon="Trash2"
          label={t('settings.resetData')}
          tone="#ff453a"
          danger
          onClick={() => {
            if (confirm('Tüm yerel veriler silinsin mi?')) {
              localStorage.removeItem('eh.state.v1')
              location.reload()
            }
          }}
        />
      </Group>

      <Group title={t('settings.about')}>
        <NavRow to="/hakkimizda" icon="Newspaper" label={t('legal.about')} />
        <RowShell>
          <span className="min-w-0 flex-1 text-[0.875rem] text-fg">{t('settings.version')}</span>
          <span className="tnum text-[0.8125rem] text-faint">1.0.0</span>
        </RowShell>
        <RowShell>
          <span className="min-w-0 flex-1 text-[0.875rem] text-fg">{t('legal.preparedBy')}</span>
          <span className="text-[0.8125rem] font-semibold text-faint">OMERZEN</span>
        </RowShell>
      </Group>

      {toast && (
        <p className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-fg px-4 py-2 text-[0.75rem] font-medium text-bg">
          {toast}
        </p>
      )}
    </div>
  )
}
