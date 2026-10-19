import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import type { NewsItem } from '../types'
import { Icon } from './Icon'

type Voice = SpeechSynthesisVoice

/** Tarayıcıdaki Türkçe sesleri kaliteye göre sıralar. */
function rankVoices(voices: Voice[]): Voice[] {
  const score = (v: Voice) => {
    const name = v.name.toLocaleLowerCase('tr')
    const lang = v.lang.toLocaleLowerCase('tr')
    let s = 0
    if (lang.startsWith('tr-tr')) s += 100
    else if (lang.startsWith('tr')) s += 70
    if (/(enhanced|premium|natural|neural|neural2|plus|pro)/.test(name)) s += 40
    if (/google/.test(name)) s += 25
    if (/microsoft/.test(name)) s += 20
    if (/(siri|selda|okur|yelda|emre|female|kadın)/.test(name)) s += 12
    if (/(compact|esnek)/.test(name)) s -= 20
    if (v.localService) s += 15
    return s
  }
  return [...voices].filter((v) => v.lang.toLowerCase().startsWith('tr')).sort((a, b) => score(b) - score(a))
}

const RATES = [0.9, 1, 1.25, 1.5]

export function AudioReader({ item, className }: { item: NewsItem; className?: string }) {
  const [voices, setVoices] = useState<Voice[]>([])
  const [voiceIdx, setVoiceIdx] = useState(0)
  const [state, setState] = useState<'idle' | 'playing' | 'paused'>('idle')
  const [rate, setRate] = useState(1)
  const [progress, setProgress] = useState(0)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)
  const cancelRef = useRef(false)

  const script = useMemo(() => {
    const body = item.fullText ? item.body : [item.excerpt]
    return `${item.title}. ${body.join(' ')} Kaynak: ${item.source.name}.`
  }, [item])

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const load = () => {
      const list = rankVoices(window.speechSynthesis.getVoices())
      setVoices(list)
      setVoiceIdx((i) => Math.min(i, Math.max(list.length - 1, 0)))
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load)
      window.speechSynthesis.cancel()
    }
  }, [])

  // Haber değişince durdur
  useEffect(() => {
    cancelRef.current = true
    setState('idle')
    setProgress(0)
  }, [item.id])

  const stop = useCallback(() => {
    cancelRef.current = true
    window.speechSynthesis?.cancel()
    setState('idle')
    setProgress(0)
  }, [])

  const speak = useCallback(() => {
    if (!('speechSynthesis' in window)) return
    cancelRef.current = false
    window.speechSynthesis.cancel()

    const u = new SpeechSynthesisUtterance(script)
    const list = voices.length ? voices : rankVoices(window.speechSynthesis.getVoices())
    if (list[voiceIdx]) u.voice = list[voiceIdx]
    u.lang = list[voiceIdx]?.lang ?? 'tr-TR'
    u.rate = rate

    let char = 0
    u.onboundary = (e) => {
      if (typeof e.charIndex === 'number') {
        char = e.charIndex
        setProgress(Math.min(1, char / Math.max(script.length, 1)))
      }
    }
    u.onend = () => {
      if (!cancelRef.current) {
        setState('idle')
        setProgress(1)
      }
    }
    u.onerror = () => setState('idle')

    utterRef.current = u
    window.speechSynthesis.speak(u)
    setState('playing')
  }, [script, voices, voiceIdx, rate])

  const toggle = () => {
    if (state === 'playing') {
      window.speechSynthesis.pause()
      setState('paused')
    } else if (state === 'paused') {
      window.speechSynthesis.resume()
      setState('playing')
    } else {
      speak()
    }
  }

  const changeVoice = (delta: number) => {
    const next = (voiceIdx + delta + voices.length) % Math.max(voices.length, 1)
    setVoiceIdx(next)
    if (state !== 'idle') setTimeout(speak, 60)
  }

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  return (
    <div className={clsx('rounded-xl border border-line bg-surface p-3.5', className)}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          disabled={!supported}
          aria-label={state === 'playing' ? 'Duraklat' : 'Oku'}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-fg text-bg transition hover:opacity-90 disabled:opacity-40"
        >
          <Icon name={state === 'playing' ? 'Pause' : 'Play'} size={16} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-fg">
            {state === 'idle' ? 'Haberi dinle' : state === 'playing' ? 'Okunuyor…' : 'Duraklatıldı'}
          </p>
          <p className="truncate text-[11px] text-faint">
            {voices[voiceIdx]?.name ?? (supported ? 'Türkçe ses bulunamadı' : 'Desteklenmiyor')}
          </p>
          <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-fg transition-[width] duration-200"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => changeVoice(-1)}
          disabled={voices.length < 2}
          aria-label="Önceki ses"
          className="grid size-7 place-items-center rounded-full border border-line text-muted transition hover:text-fg disabled:opacity-30"
        >
          <Icon name="SkipForward" size={13} className="rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => {
            const i = RATES.indexOf(rate)
            setRate(RATES[(i + 1) % RATES.length])
            if (state !== 'idle') setTimeout(speak, 60)
          }}
          className="rounded-full border border-line px-2.5 py-1 text-[11px] font-semibold text-muted transition hover:text-fg"
        >
          {rate}×
        </button>
        <button
          type="button"
          onClick={() => changeVoice(1)}
          disabled={voices.length < 2}
          aria-label="Sonraki ses"
          className="grid size-7 place-items-center rounded-full border border-line text-muted transition hover:text-fg disabled:opacity-30"
        >
          <Icon name="SkipForward" size={13} />
        </button>
        {state !== 'idle' && (
          <button
            type="button"
            onClick={stop}
            className="ml-auto rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-muted transition hover:text-fg"
          >
            Durdur
          </button>
        )}
      </div>
    </div>
  )
}
