import type { NewsItem } from '../types'

const STOP = new Set([
  'bir','bu','ve','ile','için','icin','ne','nedir','kaç','kac','hangi','var','yok','olan','oldu',
  'da','de','ta','te','en','daha','son','güncel','guncel','haber','haberleri','hakkında','hakkinda',
  'nasıl','nasil','neden','lütfen','lutfen','bana','bize','var','mi','mı','mu','mü','çok','cok',
  'the','a','an','of','to','is','in','for','and','what','how','many',
])

function norm(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c] as string)
}

function terms(q: string): string[] {
  return norm(q)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
}

export type Answer = {
  text: string
  sources: NewsItem[]
}

/** Arşivde tam dil modeli olmadan, terim eşleşmesiyle kaynaklı cevap üretir. */
export function answerFromArchive(items: NewsItem[], question: string): Answer {
  const ts = terms(question)
  if (ts.length === 0) {
    const recent = items.slice(0, 3)
    return {
      text:
        recent.length > 0
          ? 'Günün en güncel başlıklarına bakabilirsiniz. Daha net bir sonuç için konu ya da anahtar kelime yazabilirsiniz.'
          : 'Henüz arşivde haber yok.',
      sources: recent,
    }
  }

  const scored = items
    .map((n) => {
      const title = norm(n.title)
      const body = norm(`${n.excerpt} ${n.tags.join(' ')} ${n.category}`)
      let score = 0
      for (const t of ts) {
        if (title.includes(t)) score += 3
        if (n.tags.some((tag) => norm(tag).includes(t))) score += 3
        if (body.includes(t)) score += 1
      }
      score += Math.min(1, n.views / 12000) * 0.5
      const ageH = (Date.now() - +new Date(n.publishedAt)) / 3600_000
      score += Math.exp(-ageH / 120) * 0.6
      return { n, score }
    })
    .filter((x) => x.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)

  if (scored.length === 0) {
    return {
      text: `“${question}” için arşivde kayıt bulamadım. Farklı bir kelimeyle deneyebilir ya da kategoriler sekmesine göz atabilirsiniz.`,
      sources: [],
    }
  }

  const lead = scored[0].n
  const bullets = scored
    .map(
      (s) =>
        `• ${s.n.title} — ${s.n.excerpt.split('.')[0].trim()}. (${s.n.source.name}, ${new Date(
          s.n.publishedAt,
        ).toLocaleDateString('tr-TR')})`,
    )
    .join('\n')

  const text = `Arşivde ${scored.length} ilgili kayıt buldum. En günceli:\n\n${lead.title}\n${lead.excerpt}\n\nDiğer eşleşmeler:\n${bullets}`

  return { text, sources: scored.map((s) => s.n) }
}
