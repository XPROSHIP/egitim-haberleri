import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import { disablePush, enablePush, isPushEnabled, pushSupported } from '../lib/push'
import { Icon } from './Icon'
import clsx from 'clsx'

const DISMISS_KEY = 'eh.push.dismissed'

/**
 * Bildirim izni isteyen küçük afiş.
 * Siteye ilk girişte bir kez gösterilir; karar verilince bir daha çıkmaz.
 */
export function PushBanner() {
  const { signedIn, followed } = useStore()
  const [state, setState] = useState<'hidden' | 'ask' | 'on' | 'off'>('hidden')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!pushSupported()) return
    if (isPushEnabled()) {
      setState('on')
      return
    }
    if (localStorage.getItem(DISMISS_KEY)) return
    // İzni reddedenler için tarayıcı "blocked" der, bir daha sormayalım.
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      localStorage.setItem(DISMISS_KEY, '1')
      return
    }
    setState('ask')
  }, [])

  if (state !== 'ask') return null

  const decide = async (v: boolean) => {
    localStorage.setItem(DISMISS_KEY, '1')
    if (!v) {
      setState('off')
      return
    }
    setBusy(true)
    const ok = await enablePush(followed)
    setState(ok ? 'on' : 'off')
    setBusy(false)
  }

  return (
    <div
      className={clsx(
        'mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-line',
        'bg-gradient-to-r from-primary/10 via-surface to-accent/10 p-3.5',
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
        <Icon name="Bell" size={17} />
      </span>
      <p className="min-w-0 flex-1 text-[0.8125rem] leading-relaxed text-muted">
        <span className="font-semibold text-fg">Haber bildirimleri açık olsun mu?</span> Takip
        ettiğiniz kategorilerden yeni haber geldiğinde haber vereceğiz.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => void decide(false)}
          className="rounded-full px-3 py-1.5 text-[0.75rem] font-medium text-muted transition hover:text-fg"
        >
          Sonra
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void decide(true)}
          className="rounded-full bg-fg px-3.5 py-1.5 text-[0.75rem] font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? '…' : 'Aç'}
        </button>
      </div>
      {signedIn === false && (
        <span className="w-full text-[0.6875rem] text-faint">
          Bildirimler giriş yapmadan da açılabilir; tarayıcı izni yeterli.
        </span>
      )}
    </div>
  )
}

export { disablePush }
