import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Send, Loader2, Sparkles, User, Globe } from 'lucide-react'
import { useStore } from '../lib/store'
import { askAssistant, useAssistantHistory, type AssistantQuota } from '../lib/api'
import { bus, EVENTS } from '../lib/bus'

const QUOTA = 20

type Msg = { role: 'user' | 'assistant'; text: string; sources?: string[] }

const EXAMPLES_TR = [
  'Çorum\'da açılan mesleki eğitim laboratuvarları kaç tane?',
  'MESEM\'in çıraklara yönelik son desteği ne?',
  'Maarif Modeli pilot uygulamasında ne yapıldı?',
  'Öğretmen ataması takvimi ne zaman açıklandı?',
]

export function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { signedIn } = useStore()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [quota, setQuota] = useState<AssistantQuota>({ used: 0, limit: QUOTA, remaining: QUOTA })
  const endRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)

  // Sohbet geçmişi sunucuda saklanır: panel kapatılıp açıldığında mesajlar geri gelir.
  const { data: history } = useAssistantHistory(open && signedIn)

  useEffect(() => {
    if (!open || !signedIn || loadedRef.current) return
    if (!history) return
    loadedRef.current = true
    setQuota(history.quota)
    setMsgs(
      history.messages.map((m) => ({ role: m.role, text: m.text, sources: m.sources ?? [] })),
    )
  }, [open, signedIn, history])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, busy])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const send = async (text: string) => {
    const q = text.trim()
    if (!q || busy) return
    if (!signedIn) {
      bus.emit(EVENTS.openLogin)
      return
    }
    setBusy(true)
    setError('')
    setInput('')
    setMsgs((m) => [...m, { role: 'user', text: q }])
    try {
      const res = await askAssistant(q)
      setMsgs((m) => [...m, { role: 'assistant', text: res.text, sources: res.sources }])
      setQuota(res.quota)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Asistan yanıt veremedi.')
      setMsgs((m) => m.filter((x) => !(x.role === 'user' && x.text === q)))
    } finally {
      setBusy(false)
    }
  }

  const left = quota.remaining

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end bg-black/55 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[92vh] w-full flex-col overflow-hidden border border-line bg-surface shadow-2xl sm:h-[660px] sm:max-w-[460px] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık: sade bir degrade, keskin yeşil yok */}
        <header className="relative flex items-center gap-3 border-b border-line px-4 py-3">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/90 to-accent/90 text-white shadow-lg shadow-primary/20">
            <Sparkles size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-fg">{t('assistant.title')}</p>
            <p className="truncate text-[0.6875rem] text-faint">{t('assistant.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid size-8 shrink-0 place-items-center rounded-full text-faint transition hover:bg-surface-2 hover:text-fg"
          >
            <X size={17} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {!signedIn ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
                <Sparkles size={22} />
              </span>
              <div>
                <p className="text-sm font-semibold text-fg">{t('assistant.signInTitle')}</p>
                <p className="mt-1.5 text-[0.78125rem] leading-relaxed text-muted">
                  {t('assistant.signInDesc')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  bus.emit(EVENTS.openLogin)
                }}
                className="rounded-full bg-fg px-5 py-2 text-[0.8125rem] font-semibold text-bg transition hover:opacity-90"
              >
                {t('nav.signIn')}
              </button>
            </div>
          ) : msgs.length === 0 ? (
            <div className="flex h-full flex-col justify-center">
              <p className="text-center text-sm text-muted">{t('assistant.empty')}</p>
              <div className="mt-5">
                <p className="mb-2 text-center text-[0.6875rem] font-semibold tracking-wide text-faint uppercase">
                  {t('assistant.examples')}
                </p>
                <div className="flex flex-col gap-2">
                  {EXAMPLES_TR.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => void send(e)}
                      className="rounded-lg border border-line bg-surface-2/60 px-3 py-2.5 text-left text-[0.8125rem] text-muted transition hover:bg-surface-2 hover:text-fg"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {msgs.map((m, i) => (
                <div key={i} className="flex gap-2.5">
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full ${
                      m.role === 'assistant'
                        ? 'bg-gradient-to-br from-primary/85 to-accent/85 text-white'
                        : 'bg-surface-3 text-muted'
                    }`}
                  >
                    {m.role === 'assistant' ? <Sparkles size={14} /> : <User size={14} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.6875rem] font-semibold text-faint">
                      {m.role === 'assistant' ? t('assistant.title') : 'Sen'}
                    </p>
                    <div
                      className={`mt-1 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[0.8125rem] leading-relaxed whitespace-pre-line ${
                        m.role === 'assistant'
                          ? 'bg-surface-2 text-fg'
                          : 'bg-primary/8 text-fg'
                      }`}
                    >
                      {m.text}
                    </div>
                    {m.sources && m.sources.length > 0 && (
                      <details className="mt-1.5">
                        <summary className="cursor-pointer text-[0.6875rem] font-semibold text-faint uppercase hover:text-muted">
                          {t('assistant.sources')} · {m.sources.length}
                        </summary>
                        <ul className="mt-1.5 space-y-1">
                          {m.sources.map((s) => (
                            <li key={s} className="flex items-start gap-1.5">
                              <Globe size={11} className="mt-1 shrink-0 text-faint" />
                              <a
                                href={s}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate text-[0.6875rem] text-muted underline-offset-2 hover:text-fg hover:underline"
                              >
                                {s}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-[0.8125rem] text-faint">
                  <Loader2
                    size={15}
                    className="animate-spin"
                    style={{ animation: 'eh-spin 1s linear infinite' }}
                  />
                  {t('assistant.thinking')}
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-[0.75rem] text-accent">
              {error}
            </p>
          )}
        </div>

        {signedIn && (
          <footer className="border-t border-line p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void send(input)
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('assistant.placeholder')}
                className="flex-1 rounded-full border border-line bg-surface-2 px-4 py-2.5 text-[0.8125rem] text-fg outline-none placeholder:text-faint focus:border-primary/50"
              />
              <button
                type="submit"
                disabled={busy || !input.trim() || left <= 0}
                className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-fg transition hover:opacity-90 disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </form>
            <p className="mt-2 text-center text-[0.625rem] text-faint">
              {t('assistant.freeNote', { n: quota.used, t: quota.limit })}
            </p>
          </footer>
        )}
      </div>
    </div>
  )
}
