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

const STORAGE_KEY = 'eh.supabase.auth'

/**
 * Depolamada oturum var mı? Bunu bilmeden istemciyi yüklemek gereksiz:
 * anonim ziyaretçi 200 KB'lık istemciyi indirmemeli.
 */
function hasStoredSession(): boolean {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEY))
  } catch {
    return false
  }
}

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
          // Kod değişimini elle yapıyoruz: hata mesajını görebilmek için.
          detectSessionInUrl: false,
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
  // Google, isimsiz hesaplarda full_name alanını boş string olarak döndürebiliyor.
  // "||" kullanıyoruz çünkü "??" boş stringi geçerli sayar ve isim boş kalırdı.
  const email = u.email ?? ''
  return {
    id: u.id,
    email,
    name: meta.full_name || meta.name || email.split('@')[0] || 'Kullanıcı',
    avatarUrl: meta.avatar_url || undefined,
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

/** Oturum değişikliklerini dinler. Oturum yoksa istemci hiç yüklenmez. */
export function watchSession(fn: (s: Session | null) => void): () => void {
  sessionListeners.add(fn)
  if (hasStoredSession()) void ensureSubscription()
  return () => sessionListeners.delete(fn)
}

/** Google'a yönlendirir. Dönüşte istemci `?code=`'ı kendisi işler. */
export async function signInWithGoogle(): Promise<void> {
  const client = await getClient()
  if (!client) throw new Error('SUPABASE_YAPILANDIRILMADI')
  setAuthError('')

  // Dönüş adresine "next" taşınır; girişten sonra kullanıcı kaldığı yere gider.
  const next = new URLSearchParams(window.location.search).get('next')
  const base = `${window.location.origin}/giris`
  const redirectTo = next && next.startsWith('/') ? `${base}?next=${encodeURIComponent(next)}` : base

  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })
  if (error) {
    setAuthError(`Google girişi başlatılamadı: ${error.message}`)
    throw new Error(error.message)
  }
}

/**
 * Dönüşten sonraki oturumu verir.
 * Kod değişimi elle yapılır ki hata mesajı görülebilir.
 */
export async function completeSignIn(code?: string): Promise<Session | null> {
  const client = await getClient()
  if (!client) return null

  if (code) {
    const { data, error } = await client.auth.exchangeCodeForSession(code)
    if (error) {
      setAuthError(`Oturum açılamadı: ${error.message}`)
      return null
    }
    if (data.session) {
      current = toSession(data.session)
      return current
    }
  }

  // Kod yoksa ya da değişim sessizce başarısız olduysa kayıtlı oturuma bak.
  for (let i = 0; i < 10; i++) {
    const { data, error } = await client.auth.getSession()
    if (data.session) {
      current = toSession(data.session)
      return current
    }
    if (error) {
      setAuthError(`Oturum açılamadı: ${error.message}`)
      return null
    }
    await new Promise((r) => setTimeout(r, 200))
  }

  setAuthError(
    'Google girişi tamamlanamadı. Bu genellikle aynı sekmede başlatılmayan bir ' +
      'girişten kaynaklanır; "Google ile devam et" düğmesine doğrudan basın.',
  )
  return null
}

/** Depolanan oturumu doğrular; geçersizse temizler. */
export async function restoreSession(): Promise<Session | null> {
  // Depolamada oturum yoksa istemciyi yüklemenin anlamı yok.
  if (!hasStoredSession()) {
    current = null
    return null
  }
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