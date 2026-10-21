/**
 * Web push aboneliği.
 *
 * Tarayıcı izni ister, PushManager'a abone olur ve abonelik bilgisi
 * Worker'a yazılır. CI (GitHub Actions) yeni haber olduğunda bu
 * aboneliklere bildirim gönderir.
 */

const API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(normalized)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function isPushEnabled(): boolean {
  if (!pushSupported()) return false
  return (
    localStorage.getItem('eh.push.enabled') === '1' &&
    Notification.permission === 'granted'
  )
}

/** Service worker'ı kaydeder ve aktif olmasını bekler. */
export async function registerWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    // Abonelik için worker'ın "active" olması gerekiyor.
    if (reg.active && reg.active.state === 'activated') return reg
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((r) => setTimeout(r, 4000)),
    ])
    return reg
  } catch {
    return null
  }
}

/** Bildirimleri açar ve Worker'a abone olur. */
export async function enablePush(categories: string[] = []): Promise<boolean> {
  if (!pushSupported()) return false
  if (typeof Notification === 'undefined') return false

  let permission = Notification.permission
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission()
    } catch {
      return false
    }
  }
  if (permission !== 'granted') return false

  const reg = await registerWorker()
  if (!reg) return false

  let publicKey = ''
  try {
    const res = await fetch(`${API}/api/push/key`)
    const data = (await res.json()) as { publicKey?: string }
    publicKey = data.publicKey ?? ''
  } catch {
    return false
  }
  if (!publicKey) return false

  try {
    const existing = await reg.pushManager.getSubscription()
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
      }))

    const res = await fetch(`${API}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: sub.toJSON().keys,
        categories,
      }),
    })
    if (!res.ok) return false
    localStorage.setItem('eh.push.enabled', '1')
    return true
  } catch {
    return false
  }
}

/** Aboneliği kaldırır. */
export async function disablePush(): Promise<boolean> {
  if (!pushSupported()) return false
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    if (sub) {
      await fetch(`${API}/api/push/unsubscribe`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
    }
  } catch {
    /* yoksay */
  }
  localStorage.setItem('eh.push.enabled', '0')
  return true
}
