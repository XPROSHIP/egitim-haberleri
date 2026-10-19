import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { X, Send, Loader2, Sparkles, User } from 'lucide-react'
import type { NewsItem } from '../types'
import { useAllNews } from '../lib/api'
import { answerFromArchive } from '../lib/assistant'
import { useStore } from '../lib/store'
import { getCategory } from '../data/categories'

const QUOTA = 20

type Msg = { role: 'user' | 'assistant'; text: string; sources?: NewsItem[] }

const EXAMPLES_TR = [
  'Çorum\'da açılan mesleki eğitim laboratuvarları kaç tane?',
  'MESEM\'in çıraklara yönelik son desteği ne?',
  'Maarif Modeli pilot uygulamasında ne yapıldı?',
  'Öğretmen ataması takvimi ne zaman açıklandı?',
]
const EXAMPLES_EN = [
  'How many vocational labs opened in Çorum?',
  'What is the latest MESEM support for apprentices?',
  'What happened in the Maarif Model pilot?',
  'When was the teacher appointment calendar announced?',
]

export function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'tr'
  const { data } = useAllNews()
  const { signedIn } = useStore()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [used, setUsed] = useState(0)
  const endRef = useRef<HTMLDivElement>(null)

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

  const send = (text: string) => {
    const q = text.trim()
    if (!q || busy || !data) return
    setBusy(true)
    setInput('')
    setMsgs((m) => [...m, { role: 'user', text: q }])
    setTimeout(() => {
      const res = answerFromArchive(data, q)
      setMsgs((m) => [...m, { role: 'assistant', text: res.text, sources: res.sources }])
      setUsed((u) => u + 1)
      setBusy(false)
    }, 420)
  }

  const examples = lang === 'tr' ? EXAMPLES_TR : EXAMPLES_EN

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className="flex h-[92vh] w-full flex-col overflow-hidden border border-line bg-surface shadow-2xl sm:h-[640px] sm:max-w-[440px] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-accent to-primary text-white">
            <Sparkles size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-fg">{t('assistant.title')}</p>
            <p className="truncate text-[11px] text-faint">{t('assistant.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid size-8 place-items-center rounded-full text-faint transition hover:bg-surface-2 hover:text-fg"
          >
            <X size={17} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {msgs.length === 0 && (
            <div className="flex h-full flex-col justify-center">
              <p className="text-center text-sm text-muted">{t('assistant.empty')}</p>
              <div className="mt-5">
                <p className="mb-2 text-center text-[11px] font-semibold tracking-wide text-faint uppercase">
                  {t('assistant.examples')}
                </p>
                <div className="flex flex-col gap-2">
                  {examples.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => send(e)}
                      className="rounded-lg border border-line px-3 py-2.5 text-left text-[13px] text-muted transition hover:bg-surface-2 hover:text-fg"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              {!signedIn && (
                <p className="mt-5 text-center text-[11px] text-faint">
                  {lang === 'tr'
                    ? 'Giriş yaparak günlük sınırı artırabilirsiniz.'
                    : 'Sign in to raise the daily limit.'}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-4">
            {msgs.map((m, i) => (
              <div key={i} className="flex gap-2.5">
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full ${
                    m.role === 'assistant'
                      ? 'bg-gradient-to-br from-accent to-primary text-white'
                      : 'bg-surface-3 text-muted'
                  }`}
                >
                  {m.role === 'assistant' ? <Sparkles size={14} /> : <User size={14} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-faint">
                    {m.role === 'assistant' ? t('assistant.title') : 'Sen'}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed whitespace-pre-line text-fg">
                    {m.text}
                  </p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-2.5">
                      <p className="mb-1.5 text-[11px] font-semibold text-faint uppercase">
                        {t('assistant.sources')} · {m.sources.length}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.sources.map((s) => (
                          <Link
                            key={s.id}
                            to={`/haber/${s.slug}`}
                            onClick={onClose}
                            className="rounded-full border border-line px-2.5 py-1 text-[11px] text-muted transition hover:bg-surface-2 hover:text-fg"
                            style={{ borderColor: `${getCategory(s.category).gradient[0]}55` }}
                          >
                            {getCategory(s.category).name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-[13px] text-faint">
                <Loader2 size={15} className="animate-spin" style={{ animation: 'eh-spin 1s linear infinite' }} />
                {t('assistant.thinking')}
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        <footer className="border-t border-line p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('assistant.placeholder')}
              className="flex-1 rounded-full border border-line bg-surface-2 px-4 py-2.5 text-[13px] text-fg outline-none placeholder:text-faint focus:border-primary/50"
            />
            <button
              type="submit"
              disabled={busy || !input.trim() || used >= QUOTA}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-fg transition hover:opacity-90 disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>
          <p className="mt-2 text-center text-[10px] text-faint">
            {t('assistant.freeNote', { n: used, t: QUOTA })}
          </p>
        </footer>
      </div>
    </div>
  )
}
