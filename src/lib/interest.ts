/**
 * Kullanıcı ilgi alanı.
 *
 * Okunan ve beğenilen haberlerin kategori/etiket ağırlıkları sunucuda
 * tutulur; "Sana Özel" akışı bu ağırlıklarla sıralanır. Çerez yok,
 * kimlik yalnızca oturum jetonundan gelir.
 */
import { useQuery } from '@tanstack/react-query'
import type { NewsItem } from '../types'
import { authHeaders } from './auth'

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export type Interest = { kind: string; value: string; weight: number }

/** Bir haberin ilgi ağırlıklarını artırır (okuma = 0,4, beğeni = 1). */
export async function recordInterest(item: NewsItem, delta: number) {
  if (!BASE) return
  const rows: [string, string][] = [
    ['category', item.category],
    ...item.tags.slice(0, 4).map((t): [string, string] => ['tag', t]),
  ]
  for (const [kind, value] of rows) {
    try {
      await fetch(`${BASE}/api/interest`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ kind, value, delta }),
      })
    } catch {
      /* ilgi kaydı kritik değil */
    }
  }
}

/** Kullanıcının ilgi ağırlıkları. */
export function useInterests(enabled: boolean) {
  return useQuery({
    queryKey: ['interests'],
    queryFn: async (): Promise<Interest[]> => {
      if (!BASE) return []
      const res = await fetch(`${BASE}/api/interest`, { headers: authHeaders() })
      if (!res.ok) return []
      const data = (await res.json()) as { interests?: Interest[] }
      return data.interests ?? []
    },
    enabled: enabled && Boolean(BASE),
    staleTime: 5 * 60_000,
  })
}

/** İlgi ağırlıklarından haber puanı üretir. */
export function interestScore(item: NewsItem, interests: Interest[]): number {
  if (!interests.length) return 0
  const cat = interests.find((i) => i.kind === 'category' && i.value === item.category)
  let score = cat ? cat.weight : 0
  for (const tag of item.tags) {
    const hit = interests.find((i) => i.kind === 'tag' && i.value === tag)
    if (hit) score += hit.weight * 0.6
  }
  return score
}
