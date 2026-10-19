import { useCallback, useMemo, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import clsx from 'clsx'
import { categories } from '../data/categories'
import type { NewsItem } from '../types'
import { CategoryMark } from './CategoryMark'
import { bus, EVENTS } from '../lib/bus'

/**
 * Yuvarlak kategori çubuğu.
 *
 * Daireye tıklandığında `openStories` olayı yayınlanır; oynatıcıyı
 * `StoryHost` (uygulama kabuğu) yönetir — böylece hikâyeler site genelinde
 * üst bardaki düğmeden de açılabilir.
 */
export function StoryBar({ items }: { items: NewsItem[] }) {
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([])

  const rows = useMemo(
    () => categories.map((cat) => ({ cat, count: items.filter((n) => n.category === cat.slug).length })),
    [items],
  )

  const open = useCallback((slug: string) => bus.emit(EVENTS.openStories, slug), [])

  const focusRelative = useCallback(
    (from: number, dir: 1 | -1) => {
      const len = rows.length
      let i = from
      for (let n = 0; n < len; n++) {
        i = (i + dir + len) % len
        const el = btnRefs.current[i]
        if (el && !el.disabled) {
          el.focus()
          return
        }
      }
    },
    [rows.length],
  )

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLButtonElement>, i: number) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        focusRelative(i, 1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        focusRelative(i, -1)
      }
    },
    [focusRelative],
  )

  return (
    <div
      role="group"
      aria-label="Kategoriler — hikâye modu"
      className="no-scrollbar -mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 py-4 sm:mx-0 sm:px-0"
    >
      {rows.map(({ cat, count }, i) => {
        const empty = count === 0
        return (
          <button
            key={cat.slug}
            ref={(el) => {
              btnRefs.current[i] = el
            }}
            type="button"
            disabled={empty}
            aria-label={empty ? `${cat.name} kategorisinde henüz haber yok` : `${cat.name}, ${count} haber`}
            onClick={() => open(cat.slug)}
            onKeyDown={(e) => onKeyDown(e, i)}
            title={empty ? undefined : `${cat.name} hikâyelerini başlat`}
            className={clsx(
              'group flex w-[72px] shrink-0 snap-start flex-col items-center gap-2 rounded-xl transition-opacity',
              empty ? 'cursor-default opacity-35' : 'opacity-100 hover:opacity-80',
            )}
          >
            <span
              className="relative grid size-[72px] place-items-center rounded-full transition-transform duration-300 group-hover:scale-[1.04]"
              style={{
                background: `color-mix(in srgb, ${cat.color} 14%, transparent)`,
                border: `1px solid color-mix(in srgb, ${cat.color} 35%, transparent)`,
              }}
            >
              <CategoryMark mark={cat.mark} size={24} strokeWidth={2} />
              {!empty && (
                <span
                  className="tnum absolute -top-0.5 -right-0.5 grid min-w-[19px] place-items-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ background: cat.color }}
                >
                  {count}
                </span>
              )}
            </span>
            <span className="line-clamp-2x text-center text-[11px] leading-tight font-medium text-muted group-hover:text-fg">
              {cat.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
