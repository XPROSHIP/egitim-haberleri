import { useEffect, useMemo, useState } from 'react'
import { useAllNews } from '../lib/api'
import { bus, EVENTS } from '../lib/bus'
import { categories } from '../data/categories'
import { StoryViewer } from './StoryViewer'

/**
 * Hikâye oynatıcısının sahibi.
 * Uygulama kabuğunda bir kez takılır; yuvarlak kategori düğmelerinden veya
 * üst bardaki "Hikâyeler" düğmesinden açılabilir.
 *
 * Bir kategorinin hikâyeleri bitince oynatıcı kapanmaz, sıradaki kategorinin
 * hikâyelerine devam eder.
 */
export function StoryHost() {
  const { data } = useAllNews()
  const [slug, setSlug] = useState<string | null>(null)

  useEffect(() => {
    return bus.on(EVENTS.openStories, (requested) => {
      if (requested) {
        setSlug(requested)
        return
      }
      // Kategori verilmediyse en güncel haberin kategorisiyle aç
      const all = data ?? []
      if (all.length === 0) return
      const newest = [...all].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))[0]
      setSlug(newest.category)
    })
  }, [data])

  const items = useMemo(() => {
    const all = data ?? []
    if (!slug) return []
    // Seçilen kategori başta, ardından diğer kategoriler sırayla.
    const order = [slug, ...categories.map((c) => c.slug).filter((s) => s !== slug)]
    const out: typeof all = []
    for (const s of order) {
      const inCategory = all
        .filter((n) => n.category === s)
        .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
      if (inCategory.length) out.push(...inCategory)
    }
    return out
  }, [data, slug])

  if (!slug || items.length === 0) return null

  return <StoryViewer open items={items} startIndex={0} onClose={() => setSlug(null)} />
}
