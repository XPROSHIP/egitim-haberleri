/**
 * Service worker: web push bildirimleri + çevrimdışı okuma.
 *
 * Bildirimler kullanıcı izin verdiğinde açılır; "MESEM'den yeni haber"
 * gibi abonelikler CI tarafından gönderilir.
 */

const VERSION = 'zen-v1'
const SHELL = `shell-${VERSION}`
const DATA = `data-${VERSION}`

const SHELL_FILES = ['/', '/manifest.webmanifest', '/app-icon.svg', '/icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(SHELL_FILES).catch(() => undefined))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== SHELL && k !== DATA).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

/**
 * Ağ önce, önbellek sonra. Ağ yoksa önbellekten sun.
 * API yanıtları çapraz kökenli olduğu için CORS başlıklarıyla saklanır.
 */
self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  // Analitik ve bildirim uçları önbelleğe alınmaz.
  if (url.pathname.startsWith('/api/track') || url.pathname.startsWith('/api/push')) return

  event.respondWith(
    (async () => {
      const cache = await caches.open(DATA)
      try {
        const res = await fetch(req)
        if (res && (res.ok || res.type === 'opaque')) {
          cache.put(req, res.clone()).catch(() => undefined)
          // Önbellek sınırsız büyümesin: en eski 40 girdiyi at.
          const keys = await cache.keys()
          if (keys.length > 60) {
            for (const k of keys.slice(0, keys.length - 60)) {
              await cache.delete(k).catch(() => undefined)
            }
          }
        }
        return res
      } catch {
        const hit = await cache.match(req)
        if (hit) return hit
        if (url.pathname.startsWith('/haber/')) {
          const shell = await caches.open(SHELL)
          const home = await shell.match('/')
          if (home) return home
        }
        return new Response('Çevrimdışı', { status: 503, headers: { 'content-type': 'text/plain' } })
      }
    })(),
  )
})

/* ── Web push ───────────────────────────────────────────────────────────── */

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'Eğitim Haberleri', body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'Eğitim Haberleri'
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'zen-news',
    renotify: true,
    data: { url: data.url || '/' },
    actions: [{ action: 'open', title: 'Haberi aç' }],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = event.notification.data?.url || '/'
  event.waitUntil(
    (async () => {
      const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of list) {
        if (client.url.includes(target) && 'focus' in client) {
          client.navigate(target)
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    })(),
  )
})
