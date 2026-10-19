/**
 * Kategori işaretleri.
 *
 * Jenerik ikon kütüphanesi yerine, her kategori için elle çizilmiş minimum
 * stroke işaretler. Benzer kategoriler aynı renk ailesini paylaşır:
 *   eğitim kademesi  → ilköğretim yeşil → ortaöğretim indigo → liseler mor → üniversite mavi
 *   mesleki aile    → amber / turuncu
 *   kurumsal aile   → mavi / derin indigo
 */
import type { MarkName } from '../types'

export type { MarkName }

const PATHS: Record<MarkName, React.ReactNode> = {
  // Mesleki Eğitim — dişli çark (zanaat)
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.4v2.2M12 18.4v2.2M20.6 12h-2.2M5.6 12H3.4M18.1 5.9l-1.6 1.6M7.5 16.5l-1.6 1.6M18.1 18.1l-1.6-1.6M7.5 7.5 5.9 5.9" />
    </>
  ),
  // MESEM — topluluk
  community: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M6.4 19.6a5.6 5.6 0 0 1 11.2 0" />
      <circle cx="5" cy="10.2" r="1.6" />
      <circle cx="19" cy="10.2" r="1.6" />
    </>
  ),
  // MEB — kurumsal bina
  institution: (
    <>
      <path d="M3 9.6 12 4.2l9 5.4" />
      <path d="M4.6 11h14.8" />
      <path d="M6.8 11v6.6M10.4 11v6.6M13.6 11v6.6M17.2 11v6.6" />
      <path d="M3.6 20.4h16.8" />
    </>
  ),
  // Çorum — konum göstergesi
  locator: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1.6v2.6M12 19.8v2.6M1.6 12h2.6M19.8 12h2.6" />
    </>
  ),
  // Liseler — okul çatısı
  school: (
    <>
      <path d="M12 3.4 2.6 8.5 12 13.6l9.4-5.1L12 3.4Z" />
      <path d="M6.2 11v5.2c0 1.7 2.6 3 5.8 3s5.8-1.3 5.8-3V11" />
      <path d="M21.4 8.5v5" />
    </>
  ),
  // Ortaöğretim — basamaklar
  steps: <path d="M3.4 20.6h4.2v-4.2h4.2v-4.2h4.2V8h4.6" />,
  // İlköğretim — filiz
  sprout: (
    <>
      <path d="M12 20.6v-7.4" />
      <path d="M12 13.4C12 9.9 9.9 7.4 6.6 7.4c0 3.6 2.1 6 5.4 6Z" />
      <path d="M12 13.4c0-3 1.9-5.2 5-5.2 0 3.2-2 5.2-5 5.2Z" />
    </>
  ),
  // Maarif Modeli — sekiz köşeli yıldız
  rosette: (
    <>
      <rect x="5.6" y="5.6" width="12.8" height="12.8" rx="1.6" />
      <rect
        x="5.6"
        y="5.6"
        width="12.8"
        height="12.8"
        rx="1.6"
        transform="rotate(45 12 12)"
      />
    </>
  ),
  // Üniversite — açık kitap
  book: (
    <>
      <path d="M12 6.6S9.7 4.6 4 4.6v12.8c5.7 0 8 2 8 2s2.3-2 8-2V4.6c-5.7 0-8 2-8 2Z" />
      <path d="M12 6.6v12.8" />
    </>
  ),
  // Sınavlar — onaylı form
  clipboard: (
    <>
      <path d="M6.4 3.6h8.4l4 4v12.8H6.4V3.6Z" />
      <path d="M14.8 3.6V8h4" />
      <path d="m9 14.6 2 2 4-4" />
    </>
  ),
  // Yabancı Eğitim — küre
  globe: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M3.6 12h16.8" />
      <path d="M12 3.6c2.2 2.4 3.3 5.4 3.3 8.4s-1.1 6-3.3 8.4c-2.2-2.4-3.3-5.4-3.3-8.4S9.8 6 12 3.6Z" />
    </>
  ),
  // Gündem — başlık satırları
  headlines: (
    <>
      <path d="M3.6 6.4h16.8M3.6 11.4h16.8M3.6 16.4h10.4" />
    </>
  ),
}

export function CategoryMark({
  mark,
  size = 20,
  strokeWidth = 1.6,
  className,
}: {
  mark: MarkName
  /** `currentColor` kullanılır; renk kapsayıcıdan gelir. */
  color?: string
  size?: number | string
  strokeWidth?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[mark]}
    </svg>
  )
}
