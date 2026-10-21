#!/usr/bin/env node
/**
 * Web push bildirimi gönderimi.
 *
 * Toplayıcıdan sonra çalışır: yeni yayınlanan haberleri, o kategorileri
 * takip eden abonelere bildirim olarak gönderir. Abone listesi ve VAPID
 * anahtarları Worker'dan gelir.
 *
 * Gönderim `web-push` kütüphanesiyle yapılır (kriptografik şifreleme).
 */
import webpush from 'web-push'

const API = (process.env.VITE_API_URL ?? '').replace(/\/$/, '')
const SECRET = process.env.COLLECT_SECRET ?? ''

if (!API || !SECRET) {
  console.error('[push] VITE_API_URL / COLLECT_SECRET eksik')
  process.exit(1)
}

/** Bildirimi kaç saatte bir tekrarlamayalım (saat). */
const COOLDOWN_HOURS = 20

async function main() {
  const res = await fetch(`${API}/api/push/subscribers`, {
    headers: { 'x-collect-secret': SECRET },
  })
  if (!res.ok) {
    console.error(`[push] abone listesi alınamadı: ${res.status}`)
    process.exit(1)
  }
  const data = await res.json()
  const subscribers = data.subscribers ?? []
  const publicKey = data.publicKey
  const privateKey = data.privateKey

  if (!subscribers.length) {
    console.log('[push] abone yok')
    return
  }
  if (!publicKey || !privateKey) {
    console.error('[push] VAPID anahtarları eksik')
    return
  }

  webpush.setVapidDetails(
    'mailto:destek@egitim-haberleri.omerzen.workers.dev',
    publicKey,
    privateKey,
  )

  // Bu turda yayınlanan haberler
  const news = await (await fetch(`${API}/api/news?limit=40`)).json()
  const items = (news.items ?? []).filter((i) => {
    const ageH = (Date.now() - +new Date(i.publishedAt)) / 3600_000
    return ageH <= 6 && i.source?.image
  })

  if (!items.length) {
    console.log('[push] yeni haber yok')
    return
  }

  const head = items[0]
  const payload = JSON.stringify({
    title: head.title,
    body: head.excerpt?.slice(0, 160) ?? '',
    url: `/haber/${head.slug}`,
    icon: head.source.image,
    tag: `zen-${head.slug}`,
  })

  let sent = 0
  let failed = 0
  const dead = []

  for (const sub of subscribers) {
    // Yalnızca ilgilendiği kategorilere bildirim gönder.
    const wanted = sub.categories ?? []
    if (wanted.length && !wanted.includes(head.category) && !wanted.includes('*')) {
      continue
    }
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        payload,
        { TTL: 3600, urgency: 'normal' },
      )
      sent++
    } catch (err) {
      const status = err?.statusCode
      if (status === 404 || status === 410) dead.push(sub.endpoint)
      failed++
    }
  }

  // Artık geçersiz olan abonelikleri temizle.
  for (const endpoint of dead) {
    await fetch(`${API}/api/push/unsubscribe`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-collect-secret': SECRET },
      body: JSON.stringify({ endpoint }),
    })
  }

  console.log(
    `[push] ${sent} bildirim gönderildi · ${failed} hata · ${dead.length} ölü abone temizlendi · ${items.length} yeni haber`,
  )
}

main().catch((err) => {
  console.error('[push] hata:', err?.message ?? err)
  process.exit(1)
})
