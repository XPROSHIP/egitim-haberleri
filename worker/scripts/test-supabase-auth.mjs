/** Supabase Google giriş akışını uçtan uca doğrular. */
const KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiY3dxbHltaWtpcGdzdXZpbmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzODM4MjIsImV4cCI6MjEwNzk1OTgyMn0.ZlJpgeOf51-Wset59bLYRBdnmO3bi5xYWU7eKyYEnaU'
const BASE = 'https://jbcwqlymikipgsuvineb.supabase.co'
const CHALLENGE = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG'

const settings = await (await fetch(`${BASE}/auth/v1/settings`, { headers: { apikey: KEY } })).json()
console.log('Google sağlayıcısı açık mı :', settings.external?.google)
console.log('E-posta girişi açık mı      :', settings.external?.email)
console.log('Yeni kayıt kapalı mı        :', settings.disable_signup)
console.log('')

for (const target of [
  'http://localhost:5178/giris',
  'https://egitim-haberleri.pages.dev/giris',
  'https://jbcwqlymikipgsuvineb.supabase.co',
]) {
  const q = new URL(`${BASE}/auth/v1/authorize`)
  q.searchParams.set('provider', 'google')
  q.searchParams.set('redirect_to', target)
  q.searchParams.set('code_challenge', CHALLENGE)
  q.searchParams.set('code_challenge_method', 's256')
  q.searchParams.set('skip_http_redirects', 'true')

  const res = await fetch(q, { headers: { apikey: KEY }, redirect: 'manual' })
  const body = await res.text()
  const where = res.headers.get('location') ?? ''
  console.log(`Hedef : ${target}`)
  console.log(`  HTTP ${res.status}${res.ok ? '' : ' (hata)'}`)
  if (where) {
    try {
      const u = new URL(where)
      console.log(`  -> ${u.origin}${u.pathname}`)
      const cid = u.searchParams.get('client_id')
      const rd = u.searchParams.get('redirect_uri')
      const sc = u.searchParams.get('scope')
      console.log(`  client_id    : ${cid ?? '(yok)'}`)
      console.log(`  redirect_uri : ${rd ?? '(yok)'}`)
      console.log(`  scope        : ${sc ?? '(yok)'}`)
    } catch {
      console.log(`  -> ${where.slice(0, 120)}`)
    }
  }
  if (!res.ok && body) console.log(`  Gövde : ${body.slice(0, 220)}`)
  console.log('')
}