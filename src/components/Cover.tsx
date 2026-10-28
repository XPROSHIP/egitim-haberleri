import { useMemo } from 'react'
import clsx from 'clsx'
import { getCategory } from '../data/categories'
import { CategoryMark } from './CategoryMark'
import { hashOf } from '../lib/coverHash'

/**
 * Haber görseli. Kaynağın kapağı varsa onu gösterir; yoksa
 * kategori rengine dayalı, üretim gibi durmayan sade bir yedek üretir.
 */
export function Cover({
  id,
  category,
  image,
  className,
  iconScale = 0.3,
  showIcon = true,
}: {
  id: string
  category: string
  image?: string
  className?: string
  iconScale?: number
  showIcon?: boolean
}) {
  if (image) {
    return (
      <div className={clsx('relative overflow-hidden bg-surface-2', className)}>
        <img
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.045]"
        />
        <FallbackCover
          id={id}
          category={category}
          className="absolute inset-0 -z-10"
          iconScale={iconScale}
          showIcon={showIcon}
        />
      </div>
    )
  }

  return (
    <FallbackCover
      id={id}
      category={category}
      className={clsx('relative overflow-hidden', className)}
      iconScale={iconScale}
      showIcon={showIcon}
    />
  )
}

function FallbackCover({
  id,
  category,
  className,
  iconScale,
  showIcon,
}: {
  id: string
  category: string
  className?: string
  iconScale?: number
  showIcon?: boolean
}) {
  const cat = getCategory(category)
  const h = hashOf(id)
  const angle = h % 360
  const [c1, c2] = cat.gradient

  const style = useMemo(
    () =>
      ({
        backgroundImage: `
          radial-gradient(110% 110% at ${20 + (h % 40)}% ${12 + ((h >> 2) % 26)}%, ${c1}66 0%, transparent 62%),
          linear-gradient(${angle}deg, ${c2} 0%, ${c1} 100%)
        `,
      }) as React.CSSProperties,
    [c1, c2, angle, h],
  )

  return (
    <div className={clsx('relative overflow-hidden select-none', className)} style={style} aria-hidden="true">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10" />
      {showIcon && (
        <div
          className="pointer-events-none absolute grid place-items-center text-white/20"
          style={{
            right: '7%',
            bottom: '6%',
            width: `${(iconScale ?? 0.3) * 100}%`,
            height: `${(iconScale ?? 0.3) * 100}%`,
          }}
        >
          <CategoryMark mark={cat.mark} size="70%" strokeWidth={1.1} />
        </div>
      )}
    </div>
  )
}
