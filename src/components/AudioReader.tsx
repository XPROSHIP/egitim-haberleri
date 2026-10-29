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

const RATES = [1, 1.25, 1.5, 2]

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

/**
 * Haber seslendirici.
 *
 * Hazır üretilmiş yüksek kaliteli ses kaydı (MP3) doğrudan DOM <audio> elementi
 * üzerinden çalınır. Bu sayede mobil tarayıcılarda (iOS Safari, Android Chrome)
 * kesintisiz çalışır, ileri/geri sarma (seek) hassas çalışır ve arka planda çalmaya devam eder.
 */
export function AudioReader({ item, className }: { item: NewsItem; className?: string }) {
  const audioUrl = useMemo(() => audioUrlFor(item), [item])
  const [hasMp3, setHasMp3] = useState<boolean>(Boolean(audioUrl))
  const [state, setState] = useState<'idle' | 'playing' | 'paused'>('idle')
  const [rate, setRate] = useState<number>(1)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState<number>(item.audioDuration || 0)

  // Tarayıcı yedek TTS durumları (yalnızca henüz hazır MP3 bulunmayan yeni haberler için)
  const [voices, setVoices] = useState<Voice[]>([])
  const [voiceIdx, setVoiceIdx] = useState(0)
  const [mode, setMode] = useState<'audio' | 'tts'>(audioUrl ? 'audio' : 'tts')
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const available = Boolean(audioUrl)
    setHasMp3(available)
    setMode(available ? 'audio' : 'tts')
    if (item.audioDuration) setDuration(item.audioDuration)
  }, [audioUrl, item.audioDuration])

  const script = useMemo(() => {
    const body = item.fullText && item.body?.length ? item.body : [item.excerpt]
    return cleanForTts(`${item.title}. ${body.join(' ')}`)
  }, [item])

  // Tarayıcı seslerini yükle
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

  // Haber değiştiğinde oynatıcıyı sıfırla
  useEffect(() => {
    setState('idle')
    setProgress(0)
    setCurrentTime(0)
    window.speechSynthesis?.cancel()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [item.id])

  // Sayfadan ayrılınca durdur
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  // DOM <audio> olayları
  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    const onTimeUpdate = () => {
      setCurrentTime(el.currentTime)
      const d = el.duration || duration || item.audioDuration || 0
      if (d > 0) setProgress(Math.min(1, Math.max(0, el.currentTime / d)))
    }
    const onLoadedMetadata = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) {
        setDuration(el.duration)
      }
    }
    const onEnded = () => {
      setState('idle')
      setProgress(1)
      setCurrentTime(0)
    }
    const onError = () => {
      if (mode === 'audio') {
        // MP3 yüklenemezse tarayıcı TTS'ine geç
        setMode('tts')
        setState('idle')
      }
    }

    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('loadedmetadata', onLoadedMetadata)
    el.addEventListener('ended', onEnded)
    el.addEventListener('error', onError)
    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate)
      el.removeEventListener('loadedmetadata', onLoadedMetadata)
      el.removeEventListener('ended', onEnded)
      el.removeEventListener('error', onError)
    }
  }, [mode, duration, item.audioDuration])

  // Tarayıcı TTS saniyelik sayaç
  useEffect(() => {
    if (state !== 'playing' || mode !== 'tts') return
    const timer = window.setInterval(() => setCurrentTime((c) => c + 1), 1000)
    return () => window.clearInterval(timer)
  }, [state, mode])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setState('idle')
    setProgress(0)
    setCurrentTime(0)
  }, [])

  const playMp3 = () => {
    const el = audioRef.current
    if (!el) return
    // Sayfadaki diğer tüm sesleri durdur
    document.querySelectorAll('audio').forEach((a) => {
      if (a !== el) a.pause()
    })
    window.speechSynthesis?.cancel()

    el.playbackRate = rate
    void el.play().then(() => {
      setState('playing')
    }).catch(() => {
      // Oynatma başarısız olduysa
      setState('idle')
    })
  }

  const playTts = () => {
    if (!('speechSynthesis' in window)) return
    document.querySelectorAll('audio').forEach((a) => a.pause())
    window.speechSynthesis.cancel()

    const u = new SpeechSynthesisUtterance(script)
    const list = voices.length ? voices : rankVoices(window.speechSynthesis.getVoices())
    if (list[voiceIdx]) u.voice = list[voiceIdx]
    u.lang = list[voiceIdx]?.lang ?? 'tr-TR'
    u.rate = rate

    u.onboundary = (e) => {
      if (typeof e.charIndex === 'number') {
        setProgress(Math.min(1, e.charIndex / Math.max(script.length, 1)))
      }
    }
    u.onend = () => {
      setState('idle')
      setProgress(1)
    }
    u.onerror = () => setState('idle')

    utterRef.current = u
    window.speechSynthesis.speak(u)
    setState('playing')
  }

  const toggle = () => {
    if (state === 'playing') {
      if (mode === 'audio' && audioRef.current) {
        audioRef.current.pause()
      } else {
        window.speechSynthesis?.pause()
      }
      setState('paused')
    } else if (state === 'paused') {
      if (mode === 'audio' && audioRef.current) {
        void audioRef.current.play()
      } else {
        window.speechSynthesis?.resume()
      }
      setState('playing')
    } else {
      if (hasMp3 && audioUrl) {
        setMode('audio')
        playMp3()
      } else {
        playTts()
      }
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const bar = barRef.current
    if (!bar) return
    const total = duration || audioRef.current?.duration || item.audioDuration || (script.length / 14)
    if (!total || !Number.isFinite(total)) return

    const rect = bar.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const target = ratio * total

    if (mode === 'audio' && audioRef.current) {
      try {
        audioRef.current.currentTime = target
      } catch {}
    }
    setCurrentTime(target)
    setProgress(ratio)
  }

  const cycleRate = () => {
    const i = RATES.indexOf(rate)
    const next = RATES[(i + 1) % RATES.length]
    setRate(next)
    if (audioRef.current) audioRef.current.playbackRate = next
    if (mode === 'tts' && state === 'playing') {
      setTimeout(playTts, 60)
    }
  }

  const changeVoice = (delta: number) => {
    const next = (voiceIdx + delta + voices.length) % Math.max(voices.length, 1)
    setVoiceIdx(next)
    if (state === 'playing') setTimeout(playTts, 60)
  }

  const estimatedTtsSeconds = useMemo(() => Math.round(script.length / 14), [script])
  const totalSeconds = mode === 'audio' ? (duration || item.audioDuration || 0) : estimatedTtsSeconds
  const remaining = Math.max(0, Math.round(totalSeconds - currentTime))

  return (
    <div className={clsx('rounded-xl border border-line bg-surface p-3.5', className)}>
      {/* Gerçek in-DOM Audio elementi — mobil tarayıcılar ve arka planda oynatma için şart */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          playsInline
        />
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={state === 'playing' ? 'Duraklat' : 'Haberi Dinle'}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-fg text-bg transition hover:opacity-90 active:scale-95"
        >
          <Icon name={state === 'playing' ? 'Pause' : 'Play'} size={16} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[0.8125rem] font-semibold text-fg">
              {state === 'idle' ? 'Haberi dinle' : state === 'playing' ? 'Okunuyor…' : 'Duraklatıldı'}
            </p>
            {!hasMp3 && (
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[0.625rem] font-medium text-muted">
                Ses hazırlanıyor
              </span>
            )}
          </div>

          <p className="tnum truncate text-[0.6875rem] text-faint">
            {totalSeconds > 0 ? (
              <>
                {formatTime(totalSeconds)} · {state === 'idle' ? 'süre' : `${formatTime(remaining)} kaldı`}
              </>
            ) : hasMp3 ? (
              'Ses kaydı hazır'
            ) : (
              'Ses hazırlanıyor'
            )}
          </p>

          {/* İlerleme çubuğu / Slider: Tıklanınca veya dokunulunca istenen saniyeye atlar */}
          <div
            ref={barRef}
            role="slider"
            tabIndex={0}
            aria-label="Ses konumu"
            aria-valuemin={0}
            aria-valuemax={Math.round(totalSeconds)}
            aria-valuenow={Math.round(currentTime)}
            onClick={seek}
            onTouchStart={seek}
            className="group mt-2 cursor-pointer select-none py-1"
          >
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-100 group-hover:bg-accent"
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

      <div className="mt-2.5 flex items-center gap-1.5">
        <button
          type="button"
          onClick={cycleRate}
          className="rounded-full border border-line px-2.5 py-1 text-[0.6875rem] font-semibold text-muted transition hover:text-fg active:scale-95"
        >
          {rate}×
        </button>

        {mode === 'tts' && !hasMp3 && voices.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => changeVoice(-1)}
              aria-label="Önceki ses"
              className="grid size-7 place-items-center rounded-full border border-line text-muted transition hover:text-fg"
            >
              <Icon name="SkipForward" size={13} className="rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => changeVoice(1)}
              aria-label="Sonraki ses"
              className="grid size-7 place-items-center rounded-full border border-line text-muted transition hover:text-fg"
            >
              <Icon name="SkipForward" size={13} />
            </button>
          </>
        )}

        {state !== 'idle' && (
          <button
            type="button"
            onClick={stop}
            className="ml-auto rounded-full border border-line px-2.5 py-1 text-[0.6875rem] font-medium text-muted transition hover:text-fg active:scale-95"
          >
            Durdur
          </button>
        )}
      </div>
    </div>
  )
}
