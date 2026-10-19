/**
 * Google ile giriş — Supabase Auth.
 *
 * PKCE akışı elle yazılmıyor; resmi istemci (@supabase/supabase-js) kullanılıyor.
 * Bunun iki sebebi var:
 *   1) PKCE doğrulayıcısı sessionStorage'a yazılıyordu. Sekme kapandığında ya da
 *      geri dönüş başka sekmede açıldığında kayboluyor ve giriş sessizce başarısız
 *      oluyordu. İstemci localStorage kullanıyor, yani köken genelinde paylaşılıyor.
 *   2) Adres çubuğundaki kodun işlenmesi, oturum yenileme ve token yönetimi
 *      istemcinin sorumluluğunda; elle yazılan sürümde hata mesajı yutuluyordu.
 *
 * İstemci tembel yüklenir: her sayfa açılışında 200 KB indirilmez.
 *
 * Gerekli ortam değişkenleri (.env veya .env.local):
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJ...
 */
import type { User } from '../types'

const URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const isConfigured = Boolean(URL && KEY)

type SbClient = import('@supabase/supabase-js').SupabaseClient
type SbSession = import('@supabase/supabase-js').Session

let clientPromise: Promise<SbClient | null> | null = null

function getClient(): Promise<SbClient | null> {
  if (!isConfigured) return Promise.resolve(null)
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(URL, KEY, {
        auth: {
          flowType: 'pkce',
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'eh.supabase.auth',
        },
      }),
    )
  }
  return clientPromise
}

export type Session = { accessToken: string; user: User }

function toUser(u: SbSession['user']): User {
  const meta = (u.user_metadata ?? {}) as { full_name?: string; name?: string; avatar_url?: string }
  return {
    id: u.id,
    email: u.email ?? '',
    name: meta.full_name ?? meta.name ?? (u.email ?? '').split('@')[0],
    avatarUrl: meta.avatar_url ?? '',
  }
}

function toSession(s: SbSession): Session {
  return { accessToken: s.access_token, user: toUser(s.user) }
}

/** Son giriş hatası; giriş penceresinde gösterilir. */
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

// Son oturum, authHeaders() için bellekte tutulur.
let current: Session | null = null
const sessionListeners = new Set<(s: Session | null) => void>()
let subscribed = false

async function ensureSubscription() {
  if (subscribed) return
  subscribed = true
  const client = await getClient()
  if (!client) return
  client.auth.onAuthStateChange((event, session) => {
    current = session ? toSession(session) : null
    if (event === 'SIGNED_OUT') current = null
    for (const fn of sessionListeners) fn(current)
  })
}

export function readSession(): Session | null {
  return current
}

/** Oturum değişikliklerini dinler. */
export function watchSession(fn: (s: Session | null) => void): () => void {
  sessionListeners.add(fn)
  void ensureSubscription()
  return () => sessionListeners.delete(fn)
}

/** Google'a yönlendirir. Dönüşte istemci `?code=`'ı kendisi işler. */
export async function signInWithGoogle(): Promise<void> {
  const client = await getClient()
  if (!client) throw new Error('SUPABASE_YAPILANDIRILMADI')
  setAuthError('')
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/giris` },
  })
  if (error) {
    setAuthError(`Google girişi başlatılamadı: ${error.message}`)
    throw new Error(error.message)
  }
}

/**
 * Dönüşten sonraki oturumu verir.
 * Adres çubuğundaki kodu istemci zaten işlediği için burada yalnızca beklenir.
 */
export async function completeSignIn(_code?: string): Promise<Session | null> {
  const client = await getClient()
  if (!client) return null
  // İstemci kodu sayfa yüklenirken işler; hemen erişilemezse kısa süre bekleriz.
  for (let i = 0; i < 20; i++) {
    const { data, error } = await client.auth.getSession()
    if (data.session) {
      current = toSession(data.session)
      return current
    }
    if (error) {
      setAuthError(`Oturum açılamadı: ${error.message}`)
      return null
    }
    await new Promise((r) => setTimeout(r, 150))
  }
  setAuthError(
    'Oturum açılamadı. Google girişini aynı sekmede başlatıp ' +
      'tarayıcı önbelleğini temizleyerek tekrar deneyin.',
  )
  return null
}

/** Depolanan oturumu doğrular; geçersizse temizler. */
export async function restoreSession(): Promise<Session | null> {
  const client = await getClient()
  if (!client) return null
  const { data, error } = await client.auth.getSession()
  if (error || !data.session) {
    current = null
    return null
  }
  current = toSession(data.session)
  return current
}

export async function signOut(): Promise<void> {
  const client = await getClient()
  if (client) {
    await client.auth.signOut().catch(() => undefined)
  }
  current = null
}

/** Oturum açmış kullanıcının beğeni/kaydetme/yorumlarını saklayacağı kanal. */
export function authHeaders(): Record<string, string> {
  return current ? { Authorization: `Bearer ${current.accessToken}` } : {}
}