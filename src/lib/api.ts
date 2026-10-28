import { useQuery } from '@tanstack/react-query'
import type { Comment, NewsItem } from '../types'
import { categories, resolveCategory } from '../data/categories'
import collectedRaw from '../data/collected.json'
import { authHeaders } from './auth'
import { decodeItem } from './entities'

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
  if (!BASE) return (collected as NewsItem[]).map(decodeItem)
  try {
    // Başlık "x-refresh" göndermiyordu: Worker'da tazeleme anlamına geliyordu ve
    // ücretsiz kademede her sayfa açılışında CPU limitini patlatıyordu. Toplama
    // artık GitHub Actions'ta, tek bir POST ile yapılıyor.
    const res = await fetch(`${BASE}/api/news?limit=500`)
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as { items: NewsItem[] }
    return data.items.map((i) => decodeItem(withImageBase(i)))
  } catch {
    return (collected as NewsItem[]).map(decodeItem)
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
  const cached = data?.find((n) => n.slug === slug)

  const single = useQuery({
    queryKey: ['news', 'item', slug],
    queryFn: async (): Promise<NewsItem | null> => {
      if (!slug || !BASE) return null
      const res = await fetch(`${BASE}/api/news/${encodeURIComponent(slug)}`)
      if (!res.ok) return null
      const item = (await res.json()) as NewsItem
      return decodeItem(withImageBase(item))
    },
    enabled: Boolean(slug && (!cached || !cached.body || cached.body.length === 0)),
    staleTime: 5 * 60_000,
  })

  const item = single.data ?? cached
  return { item, isLoading: (!item && isLoading) || single.isLoading }
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
  sort?: 'newest' | 'mostRead' | 'relevance'
  /** Bu tarihten sonrası (ISO) */
  dateFrom?: string
  /** Bu kategoride ara */
  filterCategory?: string
}

export function selectNews(items: NewsItem[], f: FeedFilters): NewsItem[] {
  let list = [...items]

  if (f.mode === 'featured') list = list.filter((n) => n.featured)
  if (f.mode === 'following' && f.followed?.length) {
    list = list.filter((n) => f.followed!.includes(n.category))
  }
  // Kategori filtresi etiketleri de kapsar: bir haberin ana kategorisi Çorum
  // olsa bile "mesem" etiketi taşıyorsa MESEM kategorisinde de görünür.
  // Birleşen kategoriler (liseler → ortaöğretim) çözümlenir.
  if (f.category) {
    const cat = f.category
    list = list.filter(
      (n) => resolveCategory(n.category) === cat || n.tags.includes(cat) || n.tags.includes('liseler'),
    )
  }
  if (f.filterCategory) {
    list = list.filter((n) => resolveCategory(n.category) === f.filterCategory)
  }
  if (f.tag) list = list.filter((n) => n.tags.includes(f.tag!))
  if (f.province) list = list.filter((n) => n.province === f.province)
  if (f.hideRead && f.readMarks?.length) {
    list = list.filter((n) => !f.readMarks!.includes(n.id))
  }
  if (f.dateFrom) {
    const from = +new Date(f.dateFrom)
    list = list.filter((n) => +new Date(n.publishedAt) >= from)
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
  else if (f.sort === 'relevance') list.sort((a, b) => relevanceScore(b) - relevanceScore(a))
  else list.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))

  return list
}

/** Arama sonuçlarında alaka puanı: başlık eşleşmesi + tazelik + etkileşim. */
function relevanceScore(n: NewsItem): number {
  const ageH = (Date.now() - +new Date(n.publishedAt)) / 3600_000
  return Math.exp(-ageH / 72) * 2 + Math.min(1, n.likes / 200) + Math.min(1, n.views / 8000) * 0.5
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
      const res = await fetch(`${BASE}/api/engagement?article=${encodeURIComponent(articleId)}`, {
        headers: authHeaders(),
      })
      if (!res.ok) return []
      const data = (await res.json()) as { comments?: Comment[] }
      return data.comments ?? []
    },
    enabled: Boolean(articleId) && Boolean(BASE),
    staleTime: 30_000,
  })
}

/** Hazır üretilmiş sesin adresi (EMA Lightning). Yoksa boş string. */
export function audioUrlFor(item: NewsItem): string {
  if (!item.hasAudio || !BASE) return ''
  return `${BASE}/api/audio/${encodeURIComponent(item.id)}`
}

export type Engagement = {
  likes: number
  bookmarks: number
  myLikes: string[]
  myBookmarks: string[]
  myCommentLikes: string[]
  comments: Comment[]
}

/** Bir haberin beğeni/kaydetme/yorum durumu — gerçek kullanıcı verisinden. */
export function useEngagement(articleId: string | undefined) {
  return useQuery({
    queryKey: ['engagement', articleId],
    queryFn: async (): Promise<Engagement> => {
      const bos: Engagement = {
        likes: 0,
        bookmarks: 0,
        myLikes: [],
        myBookmarks: [],
        myCommentLikes: [],
        comments: [],
      }
      if (!BASE || !articleId) return bos
      const res = await fetch(`${BASE}/api/engagement?article=${encodeURIComponent(articleId)}`, {
        headers: authHeaders(),
      })
      if (!res.ok) return bos
      return { ...bos, ...((await res.json()) as Engagement) }
    },
    enabled: Boolean(articleId) && Boolean(BASE),
    staleTime: 15_000,
  })
}

/** Beğeniyi aç/kapat. Sunucu gerçek sayacı döner. */
export async function setLike(articleId: string, on: boolean): Promise<number> {
  if (!BASE) return 0
  const res = await fetch(`${BASE}/api/like`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ article: articleId, on }),
  })
  if (!res.ok) throw new Error('Beğeni kaydedilemedi')
  const data = (await res.json()) as { likes: number }
  return data.likes
}

/** Kaydetmeyi aç/kapat. */
export async function setBookmark(articleId: string, on: boolean): Promise<void> {
  if (!BASE) return
  const res = await fetch(`${BASE}/api/bookmark`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ article: articleId, on }),
  })
  if (!res.ok) throw new Error('Kaydedilemedi')
}

/** Yorum gönderir. */
export async function postComment(
  articleId: string,
  body: string,
  parentId?: string | null,
): Promise<Comment> {
  if (!BASE) throw new Error('Sunucuya bağlanılamadı')
  const res = await fetch(`${BASE}/api/comment`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ article: articleId, body, parentId: parentId ?? null }),
  })
  if (!res.ok) throw new Error('Yorum gönderilemedi')
  const data = (await res.json()) as { comment: Comment }
  return data.comment
}

/** Yorum beğenisi — veritabanına yazılır. */
export async function setCommentLike(commentId: string, on: boolean): Promise<number> {
  if (!BASE) return 0
  const res = await fetch(`${BASE}/api/comment-like`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ comment: commentId, on }),
  })
  if (!res.ok) throw new Error('Beğeni kaydedilemedi')
  const data = (await res.json()) as { likes: number }
  return data.likes
}

/* ── ZEN Asistan ──────────────────────────────────────────────────────────── */

export type AssistantQuota = { used: number; limit: number; remaining: number }

/** Web kaynağı ya da sitedeki bir haber. */
export type AssistantSource =
  | { type: 'web'; url: string }
  | { type: 'news'; slug: string; title: string }

export type AssistantMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  sources: AssistantSource[]
  createdAt: string
}

/** Asistan sohbet geçmişi (sunucuda saklanır). */
export function useAssistantHistory(enabled: boolean) {
  return useQuery({
    queryKey: ['assistant', 'history'],
    queryFn: async (): Promise<{ messages: AssistantMessage[]; quota: AssistantQuota }> => {
      if (!BASE) return { messages: [], quota: { used: 0, limit: 20, remaining: 20 } }
      const res = await fetch(`${BASE}/api/assistant/history`, { headers: authHeaders() })
      if (!res.ok) return { messages: [], quota: { used: 0, limit: 20, remaining: 20 } }
      return await res.json()
    },
    enabled: enabled && Boolean(BASE),
    staleTime: 60_000,
  })
}

/** Asistana soru sorar. */
export async function askAssistant(
  question: string,
): Promise<{ text: string; sources: AssistantSource[]; quota: AssistantQuota }> {
  if (!BASE) throw new Error('Sunucuya bağlanılamadı')
  const res = await fetch(`${BASE}/api/assistant`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ question }),
  })
  if (res.status === 401) throw new Error('Giriş yapmalısın.')
  if (res.status === 429) throw new Error('Günlük soru hakkın doldu.')
  if (!res.ok) throw new Error('Asistan şu an yanıt veremiyor.')
  return await res.json()
}

/** Görüntülenme sayacını bir kez artırır (oturum başına). */
export async function countView(articleId: string): Promise<number | null> {
  if (!BASE) return null
  const key = `eh.view.${articleId}`
  try {
    if (sessionStorage.getItem(key)) return null
    sessionStorage.setItem(key, '1')
  } catch {
    /* depolama kapalı olabilir */
  }
  try {
    const res = await fetch(`${BASE}/api/view`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ article: articleId }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { views: number }
    return data.views
  } catch {
    return null
  }
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
