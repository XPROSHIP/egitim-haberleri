import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useStore } from '../lib/store'
import { getCategory } from '../data/categories'
import { isConfigured, signInWithGoogle, getAuthError, subscribeAuthError } from '../lib/auth'

export function AssistantOrb({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="ZEN Asistan"
      className="fixed right-4 bottom-4 z-40 grid size-12 place-items-center rounded-full border border-line bg-surface/90 text-fg shadow-xl backdrop-blur transition hover:bg-surface-2 active:scale-95 sm:right-6 sm:bottom-6 sm:size-14"
    >
      <svg viewBox="0 0 24 24" className="relative size-6 sm:size-7" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity=".5" />
        <circle cx="12" cy="12" r="3.2" fill="currentColor" />
        <path
          d="M12 3v3M12 18v3M3 12h3M18 12h3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity=".75"
        />
      </svg>
    </button>
  )
}

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { setUser } = useStore()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Google'dan dönüşte oluşan hata (ör. hatalı Client Secret) burada görünür olsun.
  const [authError, setAuthErrorState] = useState(getAuthError())
  useEffect(() => subscribeAuthError(() => setAuthErrorState(getAuthError())), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const google = async () => {
    setBusy(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (err) {
      setBusy(false)
      setError(err instanceof Error ? err.message : 'Google girişi başlatılamadı.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute top-3 right-3 grid size-8 place-items-center rounded-full text-faint transition hover:bg-surface-2 hover:text-fg"
        >
          <X size={17} />
        </button>

        <h2 className="text-lg font-bold tracking-tight text-fg">{t('auth.title')}</h2>
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted">{t('auth.subtitle')}</p>

        {isConfigured ? (
          <button
            type="button"
            onClick={google}
            disabled={busy}
            className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-fg transition hover:bg-surface-2 disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden="true">
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8" />
              <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8h-4v3.1A12 12 0 0 0 12 24" />
              <path fill="#FBBC05" d="M5.3 14.3a7.1 7.1 0 0 1 0-4.6v-3h-4a12 12 0 0 0 0 10.7z" />
              <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.7l4 3.1A7.2 7.2 0 0 1 12 4.8" />
            </svg>
            {t('auth.withGoogle')}
          </button>
        ) : (
          <div className="mt-5 rounded-lg border border-line bg-surface-2 p-3.5">
            <p className="text-[0.78125rem] leading-relaxed text-muted">
              Google girişi için hesap yönetimi gerekiyor. Supabase projesi ve
              <code className="mx-1 rounded bg-surface-3 px-1 py-0.5 text-[0.6875rem]">
                VITE_SUPABASE_URL
              </code>
              /
              <code className="ml-1 rounded bg-surface-3 px-1 py-0.5 text-[0.6875rem]">
                VITE_SUPABASE_ANON_KEY
              </code>
              değerleri tanımlanınca bu düğme kendiliğinden çalışır.
            </p>
          </div>
        )}

        {(error || authError) && (
          <p className="mt-3 rounded-lg bg-surface-2 p-2.5 text-[0.75rem] leading-relaxed text-accent">
            {error || authError}
          </p>
        )}

        <div className="my-4 flex items-center gap-3 text-[0.6875rem] text-faint">
          <span className="h-px flex-1 bg-line" />
          veya
          <span className="h-px flex-1 bg-line" />
        </div>

        <button
          type="button"
          onClick={() => {
            setUser({ id: 'demo', email: '', name: 'Demo Kullanıcı' }, true)
            onClose()
          }}
          className="w-full rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-fg transition hover:bg-surface-2"
        >
          {t('auth.devMode')}
        </button>
        <p className="mt-2 text-center text-[0.6875rem] leading-relaxed text-faint">
          {t('auth.devModeDesc')}
        </p>
      </div>
    </div>
  )
}

export function categoryLabel(slug: string) {
  return getCategory(slug).name
}
