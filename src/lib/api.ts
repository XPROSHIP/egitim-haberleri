import { useQuery } from '@tanstack/react-query'
import type { Comment, NewsItem } from '../types'
import { categories } from '../data/categories'
import collectedRaw from '../data/collected.json'

type CollectedItem = NewsItem & {
  status?: string
  score?: number
  rawTitle?: string
  fullText?: boolean
}

const collected = (collectedRaw as CollectedItem[]).filter((i) => i.status === 'published')

/**
 * Veri kaynağı sırası:
 *  1) VITE_API_URL tanımlıysa canlı Worker/Supabase API
 *  2) Toplayıcının ürettiği gerçek haberler (src/data/collected.json)
 */
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
export const isLive = Boolean(BASE)
export const dataSource: 'api' | 'collected' = isLive ? 'api' : 'collected'

/**
 * Görseller artık Worker'da (D1'de) saklanıyor ve veritabanında "/img/..."
 * olarak duruyor. Site adresinden okunabilmesi için API kökeni ekleniyor.
 * `collected.json`'dan gelen yerel veride bu ekleme yapılmaz.
 */
function withImageBase(item: NewsItem): NewsItem {
  const img = item.source?.image
  if (!img?.startsWith('/img/')) return item
  return { ...item, source: { ...item.source, image: `${BASE}${img}` } }
}

async function fetchAll(): Promise<NewsItem[]> {
  if (!BASE) return collected as NewsItem[]
  try {
    // Başlık "x-refresh" göndermiyordu: Worker'da tazeleme anlamına geliyordu ve
    // ücretsiz kademede her sayfa açılışında CPU limitini patlatıyordu. Toplama
    // artık GitHub Actions'ta, tek bir POST ile yapılıyor.
    const res = await fetch(`${BASE}/api/news?limit=500`)
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as { items: NewsItem[] }
    return data.items.map(withImageBase)
  } catch {
    return collected as NewsItem[]
  }
}

export function useAllNews() {
  return useQuery({
    queryKey: ['news', 'all'],
    queryFn: fetchAll,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  })
}

export function useArticle(slug: string | undefined) {
  const { data, isLoading } = useAllNews()
  const item = data?.find((n) => n.slug === slug)
  return { item, isLoading: isLoading && !data }
}

export type FeedFilters = {
  category?: string
  tag?: string
  province?: string
  query?: string
  mode?: 'latest' | 'featured' | 'following' | 'foryou'
  followed?: string[]
  hideRead?: boolean
  readMarks?: string[]
  sort?: 'newest' | 'mostRead'
}

export function selectNews(items: NewsItem[], f: FeedFilters): NewsItem[] {
  let list = [...items]

  if (f.mode === 'featured') list = list.filter((n) => n.featured)
  if (f.mode === 'following' && f.followed?.length) {
    list = list.filter((n) => f.followed!.includes(n.category))
  }
  // Kategori filtresi etiketleri de kapsar: bir haberin ana kategorisi Çorum
  // olsa bile "mesem" etiketi taşıyorsa MESEM kategorisinde de görünür.
  if (f.category) {
    const cat = f.category
    list = list.filter((n) => n.category === cat || n.tags.includes(cat))
  }
  if (f.tag) list = list.filter((n) => n.tags.includes(f.tag!))
  if (f.province) list = list.filter((n) => n.province === f.province)
  if (f.hideRead && f.readMarks?.length) {
    list = list.filter((n) => !f.readMarks!.includes(n.id))
  }
  if (f.query) {
    const q = f.query.toLocaleLowerCase('tr')
    list = list.filter(
      (n) =>
        n.title.toLocaleLowerCase('tr').includes(q) ||
        n.excerpt.toLocaleLowerCase('tr').includes(q) ||
        n.tags.some((t) => t.toLocaleLowerCase('tr').includes(q)) ||
        n.category.includes(q),
    )
  }

  if (f.sort === 'mostRead') list.sort((a, b) => b.views - a.views)
  else list.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))

  return list
}

/** İlgi alanı + güncellik + etkileşim ağırlıklı sıralama. */
export function selectForYou(items: NewsItem[], liked: string[]): NewsItem[] {
  const likedCats = new Set(items.filter((n) => liked.includes(n.id)).map((n) => n.category))
  const now = Date.now()
  return [...items]
    .map((n) => {
      const ageH = (now - +new Date(n.publishedAt)) / 3600_000
      const freshness = Math.exp(-ageH / 36)
      const affinity = likedCats.has(n.category) ? 0.35 : 0
      const quality = Math.min(1, n.likes / 300) * 0.2
      const pop = Math.min(1, n.views / 8000) * 0.15
      return { n, score: freshness * 0.5 + affinity + quality + pop + (n.featured ? 0.15 : 0) }
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.n)
}

export function useFeed(f: FeedFilters) {
  const { data, isLoading, isFetching, refetch } = useAllNews()
  const items = data ? selectNews(data, f) : []
  return { items, total: data?.length ?? 0, isLoading, isFetching, refetch, raw: data }
}

/**
 * Yorumlar veritabanından gelir. Canlı API yoksa liste boş kalır —
 * sahte yorum üretilmez.
 */
export function useComments(articleId: string | undefined) {
  return useQuery({
    queryKey: ['comments', articleId],
    queryFn: async (): Promise<Comment[]> => {
      if (!BASE || !articleId) return []
      const res = await fetch(`${BASE}/api/comments?article=${encodeURIComponent(articleId)}`)
      if (!res.ok) return []
      return ((await res.json()) as { items: Comment[] }).items
    },
    enabled: Boolean(articleId) && Boolean(BASE),
    staleTime: 30_000,
  })
}

export function useRelated(item: NewsItem | undefined) {
  const { data } = useAllNews()
  if (!data || !item) return []
  return data
    .filter((n) => n.id !== item.id)
    .map((n) => ({
      n,
      score:
        (n.category === item.category ? 2 : 0) +
        n.tags.filter((t) => item.tags.includes(t)).length +
        (n.province && n.province === item.province ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || +new Date(b.n.publishedAt) - +new Date(a.n.publishedAt))
    .slice(0, 6)
    .map((x) => x.n)
}

export function useTrending() {
  const { data } = useAllNews()
  if (!data) return []
  return [...data]
    .filter((n) => n.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 8)
    .concat(data.filter((n) => n.views === 0).slice(0, 4))
    .slice(0, 8)
}

export function useMostRead() {
  const { data } = useAllNews()
  if (!data) return []
  return [...data].sort((a, b) => b.views - a.views).slice(0, 8)
}

export function useAllTags() {
  const { data } = useAllNews()
  const counts = new Map<string, number>()
  for (const n of data ?? []) for (const t of n.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

export function useProvinces() {
  const { data } = useAllNews()
  const counts = new Map<string, number>()
  for (const n of data ?? [])
    if (n.province) counts.set(n.province, (counts.get(n.province) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

export { categories }
