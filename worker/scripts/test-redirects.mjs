/** Supabase'in dönüş adresi izin listesini yoklar. */
const KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiY3dxbHltaWtpcGdzdXZpbmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzODM4MjIsImV4cCI6MjEwNzk1OTgyMn0.ZlJpgeOf51-Wset59bLYRBdnmO3bi5xYWU7eKyYEnaU'
const BASE = 'https://jbcwqlymikipgsuvineb.supabase.co'
const CHALLENGE = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG'

const targets = [
  'http://localhost:5178/giris',
  'http://127.0.0.1:5178/giris',
  'https://egitim-haberleri.pages.dev/giris',
  'http://localhost:5178/haber/ornek',
  'https://ornek.example/giris',
]

for (const target of targets) {
  const q = new URL(`${BASE}/auth/v1/authorize`)
  q.searchParams.set('provider', 'google')
  q.searchParams.set('redirect_to', target)
  q.searchParams.set('code_challenge', CHALLENGE)
  q.searchParams.set('code_challenge_method', 's256')

  const res = await fetch(q, { headers: { apikey: KEY }, redirect: 'manual' })
  const loc = res.headers.get('location') ?? ''
  const err = res.headers.get('x-supabase-error') ?? ''
  let note = 'Google yönlendirmesi (izinli)'
  if (loc.includes('error=') || err) {
    try {
      const u = new URL(loc)
      note = `HATA -> ${u.searchParams.get('error') ?? ''} ${u.searchParams.get('error_description') ?? ''}`.trim()
    } catch {
      note = `HATA -> ${err}`
    }
  }
  console.log(`${res.status}  ${target.padEnd(42)} ${note}`)
}