import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import type { NewsItem } from '../types'
import { Icon } from './Icon'
import { audioUrlFor } from '../lib/api'
import { cleanForTts } from '../lib/ttsText'

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

/** Okuma hızları. 0,9 çok ağırdı; en hızlı seçenek 2×. */
const RATES = [1, 1.25, 1.5, 2]

/** Saniyeyi "d:sn" biçimine çevirir. */
function formatTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

/**
 * Aynı anda tek ses çalsın.
 *
 * Sayfadan başka bir habere geçildiğinde ya da ikinci bir oynatıcı açıldığında
 * önceki ses durur. Hem tarayıcı TTS'i hem de hazır MP3 için geçerlidir
 * (MP3, bileşen çıkarılınca susturulmazdı).
 */
let aktifOynatici: (() => void) | null = null

function digeriniDurdur() {
  if (aktifOynatici) {
    aktifOynatici()
    aktifOynatici = null
  }
}

/**
 * Haber seslendirici.
 *
 * Sunucuda hazır üretilmiş ses varsa (EMA Lightning) onu çalar; yoksa
 * tarayıcının kendi Türkçe sesine düşer. Ses hazır olana kadar tarayıcı
 * TTS'i kullanılabilir.
 */
export function AudioReader({ item, className }: { item: NewsItem; className?: string }) {
  const [voices, setVoices] = useState<Voice[]>([])
  const [voiceIdx, setVoiceIdx] = useState(0)
  const [state, setState] = useState<'idle' | 'playing' | 'paused'>('idle')
  const [rate, setRate] = useState(1)
  const [progress, setProgress] = useState(0)
  const [mode, setMode] = useState<'audio' | 'tts'>('tts')
  const [currentTime, setCurrentTime] = useState(0)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)
  const cancelRef = useRef(false)

  const audioUrl = useMemo(() => audioUrlFor(item), [item])

  const script = useMemo(() => {
    const body = item.fullText ? item.body : [item.excerpt]
    return cleanForTts(`${item.title}. ${body.join(' ')}`)
  }, [item])

  /** Bu oynatıcıyı durduran fonksiyon (kayıt defterinde kullanılır). */
  const durdur = useCallback(() => {
    cancelRef.current = true
    window.speechSynthesis?.cancel()
    const el = audioRef.current
    if (el) {
      el.pause()
      el.currentTime = 0
    }
    setState('idle')
    setProgress(0)
    setCurrentTime(0)
  }, [])

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

  // Bileşen çıkarılırken (başka habere geçildiğinde) ses de dursun.
  useEffect(() => {
    return () => {
      durdur()
      if (aktifOynatici === durdur) aktifOynatici = null
    }
  }, [durdur])

  // Haber değişince durdur: aynı anda iki ses çalmamalı.
  useEffect(() => {
    cancelRef.current = true
    setState('idle')
    setProgress(0)
    setCurrentTime(0)
    window.speechSynthesis?.cancel()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [item.id])

  // Hazır ses oynarken geçen süreyi ve ilerlemeyi takip et
  useEffect(() => {
    if (mode !== 'audio') return
    const el = audioRef.current
    if (!el) return
    const onTime = () => {
      setCurrentTime(el.currentTime)
      const dur = el.duration || item.audioDuration || 1
      if (dur > 0) setProgress(el.currentTime / dur)
    }
    el.addEventListener('timeupdate', onTime)
    return () => el.removeEventListener('timeupdate', onTime)
  }, [mode, item.audioDuration])

  // Tarayıcı seslendirmesinde süreyi saniyelik say (kalan süre göstergesi)
  useEffect(() => {
    if (state !== 'playing' || mode !== 'tts') return
    const timer = window.setInterval(() => setCurrentTime((c) => c + 1), 1000)
    return () => window.clearInterval(timer)
  }, [state, mode])

  const stop = useCallback(() => {
    cancelRef.current = true
    window.speechSynthesis?.cancel()
    audioRef.current?.pause()
    if (audioRef.current) audioRef.current.currentTime = 0
    setState('idle')
    setProgress(0)
    setCurrentTime(0)
  }, [])

  /* --- Sunucuda hazır olan ses --- */
  const playAudio = useCallback(() => {
    if (!audioUrl) return false
    // Başka bir ses çalıyorsa onu durdur (aynı anda tek ses).
    digeriniDurdur()
    let el = audioRef.current
    if (!el) {
      el = new Audio()
      audioRef.current = el
    }
    el.src = audioUrl
    el.playbackRate = rate
    el.onended = () => {
      if (!cancelRef.current) {
        setState('idle')
        setProgress(1)
      }
    }
    el.ontimeupdate = () => {
      if (el.duration) setProgress(Math.min(1, el.currentTime / el.duration))
    }
    el.onerror = () => {
      // Hazır ses açılamadıysa tarayıcı TTS'ine düş.
      setMode('tts')
      setState('idle')
    }
    cancelRef.current = false
    void el.play().catch(() => {
      setMode('tts')
      setState('idle')
    })
    setMode('audio')
    setState('playing')
    // Bu oynatıcıyı kaydet: başka bir oynatıcı açılırsa durdurulsun.
    aktifOynatici = durdur
    return true
  }, [audioUrl, rate, durdur])

  /* --- Tarayıcı TTS --- */
  const speak = useCallback(() => {
    if (!('speechSynthesis' in window)) return
    // Başka bir ses çalıyorsa onu durdur (aynı anda tek ses).
    digeriniDurdur()
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
    setMode('tts')
    setState('playing')
    // Bu oynatıcıyı kaydet: başka bir oynatıcı açılırsa durdurulsun.
    aktifOynatici = durdur
  }, [script, voices, voiceIdx, rate, durdur])

  const toggle = () => {
    if (state === 'playing') {
      if (mode === 'audio') audioRef.current?.pause()
      else window.speechSynthesis.pause()
      setState('paused')
    } else if (state === 'paused') {
      if (mode === 'audio') void audioRef.current?.play()
      else window.speechSynthesis.resume()
      setState('playing')
    } else {
      // Öncelik hazır sentezlenmiş ses: daha doğal ve tutarlı.
      // Yoksa tarayıcının kendi Türkçe sesine düşülür.
      if (audioUrl && playAudio()) return
      speak()
    }
  }

  const changeVoice = (delta: number) => {
    const next = (voiceIdx + delta + voices.length) % Math.max(voices.length, 1)
    setVoiceIdx(next)
    if (state !== 'idle') setTimeout(speak, 60)
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current
    const bar = barRef.current
    if (!el || !bar) return
    const total = el.duration || totalSeconds || item.audioDuration || 0
    if (!total || !Number.isFinite(total)) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const target = ratio * total
    try {
      el.currentTime = target
      setCurrentTime(target)
      setProgress(ratio)
    } catch {}
  }

  const supported =
    typeof window !== 'undefined' && ('speechSynthesis' in window || Boolean(audioUrl))

  // Süre bilgisi: hazır seste sunucudan, tarayıcı sesinde metin uzunluğundan.
  const estimatedSeconds = useMemo(
    () => Math.round(script.length / 14), // Türkçe TTS için yaklaşık 14 karakter/saniye
    [script],
  )
  const totalSeconds =
    mode === 'audio'
      ? (audioRef.current?.duration || item.audioDuration || 0)
      : estimatedSeconds
  const remaining = Math.max(0, Math.round(totalSeconds - currentTime))

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
          <p className="text-[0.8125rem] font-semibold text-fg">
            {state === 'idle' ? 'Haberi dinle' : state === 'playing' ? 'Okunuyor…' : 'Duraklatıldı'}
          </p>
          <p className="tnum truncate text-[0.6875rem] text-faint">
            {totalSeconds > 0 ? (
              <>
                {formatTime(totalSeconds)} · {state === 'idle' ? 'kaldı' : `${formatTime(remaining)} kaldı`}
              </>
            ) : mode === 'audio' ? (
              'Sesli bülten'
            ) : audioUrl ? (
              (voices[voiceIdx]?.name ?? (supported ? 'Türkçe ses bulunamadı' : 'Desteklenmiyor'))
            ) : (
              'Tarayıcı sesi'
            )}
          </p>

          {/* İlerleme çubuğu / Slider: Tıklanınca istenen saniyeye atlanır */}
          <div
            ref={barRef}
            role="slider"
            tabIndex={0}
            aria-label="Ses konumu"
            aria-valuemin={0}
            aria-valuemax={Math.round(totalSeconds)}
            aria-valuenow={Math.round(currentTime)}
            onClick={seek}
            className="group mt-2 cursor-pointer select-none py-0.5"
          >
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-150 group-hover:bg-accent"
                style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%` }}
              />
            </div>
            <div className="tnum mt-1 flex justify-between text-[0.625rem] text-faint">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(totalSeconds)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        {mode === 'tts' && (
          <>
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
              className="rounded-full border border-line px-2.5 py-1 text-[0.6875rem] font-semibold text-muted transition hover:text-fg"
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
          </>
        )}
        {mode === 'audio' && (
          <button
            type="button"
            onClick={() => {
              const i = RATES.indexOf(rate)
              const next = RATES[(i + 1) % RATES.length]
              setRate(next)
              if (audioRef.current) audioRef.current.playbackRate = next
            }}
            className="rounded-full border border-line px-2.5 py-1 text-[0.6875rem] font-semibold text-muted transition hover:text-fg"
          >
            {rate}×
          </button>
        )}
        {state !== 'idle' && (
          <button
            type="button"
            onClick={stop}
            className="ml-auto rounded-full border border-line px-2.5 py-1 text-[0.6875rem] font-medium text-muted transition hover:text-fg"
          >
            Durdur
          </button>
        )}
      </div>
    </div>
  )
}
