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

/** Service worker'ı kaydeder (yoksa). */
export async function registerWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  } catch {
    return null
  }
}

/** Bildirimleri açar ve Worker'a abone olur. */
export async function enablePush(categories: string[] = []): Promise<boolean> {
  if (!pushSupported()) return false
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const reg = await registerWorker()
  if (!reg) return false

  const res = await fetch(`${API}/api/push/key`)
  const { publicKey } = (await res.json()) as { publicKey: string }
  if (!publicKey) return false

  const existing = await reg.pushManager.getSubscription()
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
    }))

  await fetch(`${API}/api/push/subscribe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      endpoint: sub.endpoint,
      keys: sub.toJSON().keys,
      categories,
    }),
  })
  localStorage.setItem('eh.push.enabled', '1')
  return true
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
