/**
 * Eski adres → yeni adres yönlendirmesi.
 *
 * Site `egitim-haberleri.omerzen.workers.dev` adresinden
 * `egitim.omerzen.workers.dev` adresine taşındı. Paylaşılmış bağlantılar,
 * podcast beslemeleri ve arama motorlarındaki eski adresler kırılmasın diye
 * eski Worker adı bu küçük yönlendiriciyle ayakta tutuluyor.
 *
 * Kalıcı yönlendirme (301): arama motorları yeni adresi kalıcı sayar ve
 * eski adresteki sıralamayı yenisine taşır.
 */
const TARGET = 'https://egitim.omerzen.workers.dev'
const HOSTS = new Set(['egitim-haberleri.omerzen.workers.dev'])

export default {
  fetch(request, env) {
    const url = new URL(request.url)

    // Yalnızca eski site adresini yönlendir. (Worker'ın kendi version/preview
    // adresleri ve Cloudflare'in iç istekleri olduğu gibi geçsin.)
    if (!HOSTS.has(url.hostname)) return new Response('Not found', { status: 404 })

    const target = new URL(env?.TARGET || TARGET)
    target.pathname = url.pathname
    target.search = url.search

    return new Response(null, {
      status: 301,
      headers: {
        location: target.toString(),
        'cache-control': 'public, max-age=3600',
      },
    })
  },
}
