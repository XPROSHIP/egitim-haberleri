import { useEffect, useMemo, useState } from 'react'
import { useAllNews } from '../lib/api'
import { bus, EVENTS } from '../lib/bus'
import { StoryViewer } from './StoryViewer'

/**
 * Hikâye oynatıcısının sahibi.
 * Uygulama kabuğunda bir kez takılır; yuvarlak kategori düğmelerinden veya
 * üst bardaki "Hikâyeler" düğmesinden açılabilir.
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

  const items = useMemo(
    () => (slug ? (data ?? []).filter((n) => n.category === slug) : []),
    [data, slug],
  )

  if (!slug || items.length === 0) return null

  return <StoryViewer open items={items} startIndex={0} onClose={() => setSlug(null)} />
}
