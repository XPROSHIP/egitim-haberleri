/**
 * Google ile giriş — Supabase Auth (PKCE akışı), SDK'sız.
 *
 * Gerekli ortam değişkenleri (.env.production veya .env.local):
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJ...
 *
 * Tanımlı değilse `isConfigured` false döner ve arayüz dürüstçe
 * "Google girişi için hesap yönetimi gerekiyor" uyarısı gösterir.
 */
import type { User } from '../types'

const URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const isConfigured = Boolean(URL && KEY)

const STORAGE_KEY = 'eh.session'

/** Google'dan dönüşte oluşan son hata; giriş penceresinde gösterilir. */
let authError = ''
const authErrorListeners = new Set<() => void>()

export function setAuthError(message: string) {
  authError = message
  if (authError) console.warn('[auth]', message)
  for (const fn of authErrorListeners) fn()
}

export function getAuthError(): string {
  return authError
}

export function subscribeAuthError(fn: () => void): () => void {
  authErrorListeners.add(fn)
  return () => authErrorListeners.delete(fn)
}

function b64url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomVerifier(): string {
  const buf = new Uint8Array(32)
  crypto.getRandomValues(buf)
  return b64url(buf)
}

async function challenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return b64url(new Uint8Array(digest))
}

function headers(): HeadersInit {
  return {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    'content-type': 'application/json',
  }
}

export type Session = { accessToken: string; user: User }

function save(session: Session | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* kota dolu */
  }
}

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Session
    return parsed?.accessToken ? parsed : null
  } catch {
    return null
  }
}

/** Google'a yönlendirir. Dönüşte `?code=` ile geri gelir. */
export async function signInWithGoogle(): Promise<void> {
  if (!isConfigured) throw new Error('SUPABASE_YAPILANDIRILMADI')

  const verifier = randomVerifier()
  const redirectTo = `${window.location.origin}/giris`
  const next = new URLSearchParams(window.location.search)
  const state = b64url(crypto.getRandomValues(new Uint8Array(16)))
  sessionStorage.setItem('eh.pkce', JSON.stringify({ verifier, state }))

  const params = new URLSearchParams({
    provider: 'google',
    redirect_to: redirectTo,
    code_challenge: await challenge(verifier),
    code_challenge_method: 's256',
    state,
  })
  if (next.toString()) params.set('next', window.location.search)

  window.location.href = `${URL}/auth/v1/authorize?${params.toString()}`
}

/** Dönüşteki `code` ile oturum açar. Hata durumunda gerekçeyi yazar. */
export async function completeSignIn(code: string): Promise<Session | null> {
  if (!isConfigured) return null
  const stored = sessionStorage.getItem('eh.pkce')
  if (!stored) {
    setAuthError(
      'PKCE doğrulayıcısı bulunamadı. Sayfa yeni sekmede ya da farklı adreste açılmış olabilir; ' +
        'girişi aynı sekmeden başlatın.',
    )
    return null
  }
  const { verifier } = JSON.parse(stored) as { verifier: string }

  const res = await fetch(`${URL}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
  })
  if (!res.ok) {
    // Supabase neden reddettiğini söylüyor; sessizce yutmak hatayı görünmez kılıyor.
    const detail = await res
      .json()
      .then((d) => `${d.error_description ?? d.msg ?? d.error ?? res.status}`)
      .catch(() => String(res.status))
    setAuthError(`Oturum açılamadı (${res.status}): ${detail}`)
    return null
  }

  const data = (await res.json()) as { access_token: string; refresh_token?: string }
  const user = await fetchUser(data.access_token)
  if (!user) {
    setAuthError('Oturum açıldı ama kullanıcı bilgisi okunamadı.')
    return null
  }

  const session: Session = { accessToken: data.access_token, user }
  sessionStorage.removeItem('eh.pkce')
  save(session)
  return session
}

export async function fetchUser(accessToken: string): Promise<User | null> {
  const res = await fetch(`${URL}/auth/v1/user`, {
    headers: { apikey: KEY, Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  const u = (await res.json()) as {
    id: string
    email?: string
    user_metadata?: { full_name?: string; name?: string; avatar_url?: string }
  }
  return {
    id: u.id,
    email: u.email ?? '',
    name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? (u.email ?? '').split('@')[0],
    avatarUrl: u.user_metadata?.avatar_url ?? '',
  }
}

/** Depolanan oturumu doğrular; geçersizse temizler. */
export async function restoreSession(): Promise<Session | null> {
  const session = readSession()
  if (!session || !isConfigured) return session
  const user = await fetchUser(session.accessToken)
  if (!user) {
    save(null)
    return null
  }
  return { ...session, user }
}

export async function signOut(): Promise<void> {
  const session = readSession()
  if (session && isConfigured) {
    await fetch(`${URL}/auth/v1/logout`, {
      method: 'POST',
      headers: { ...headers(), Authorization: `Bearer ${session.accessToken}` },
    }).catch(() => undefined)
  }
  save(null)
}

/** Oturum açmış kullanıcının beğeni/kaydetme/yorumlarını saklayacağı kanal. */
export function authHeaders(): Record<string, string> {
  const session = readSession()
  return session ? { Authorization: `Bearer ${session.accessToken}` } : {}
}
