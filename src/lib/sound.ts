/**
 * Arayüz sesleri (Web Audio).
 *
 * Beğeni/kaydetme düğmelerinde kısa, yumuşak bir "tık" duyulur. Harici
 * dosya yoktur; ses çalım anında üretilir. Tarayıcı sesi engellerse
 * sessizce vazgeçilir.
 */

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    if (!ctx) ctx = new Ctor()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(
  ac: AudioContext,
  freq: number,
  start: number,
  duration: number,
  gain: number,
  type: OscillatorType = 'sine',
) {
  const osc = ac.createOscillator()
  const amp = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ac.currentTime + start)
  amp.gain.setValueAtTime(0.0001, ac.currentTime + start)
  amp.gain.exponentialRampToValueAtTime(gain, ac.currentTime + start + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + duration)
  osc.connect(amp).connect(ac.destination)
  osc.start(ac.currentTime + start)
  osc.stop(ac.currentTime + start + duration + 0.02)
}

/** Beğeni: kalp atışını andıran iki yükselen nota. */
export function playLike() {
  const ac = audio()
  if (!ac) return
  tone(ac, 620, 0, 0.1, 0.06)
  tone(ac, 880, 0.07, 0.14, 0.05)
}

/** Kaydetme: tek yumuşak nota. */
export function playSave() {
  const ac = audio()
  if (!ac) return
  tone(ac, 480, 0, 0.11, 0.05, 'triangle')
}

/** Yorum beğenisi: kısa "pık". */
export function playTick() {
  const ac = audio()
  if (!ac) return
  tone(ac, 940, 0, 0.055, 0.035)
}
