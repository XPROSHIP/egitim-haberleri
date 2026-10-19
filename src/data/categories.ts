import type { Category } from '../types'

/**
 * Renk aileleri:
 *   amber/turuncu  → mesleki eğitim ailesi
 *   mavi/indigo    → kurumsal aile (MEB, Maarif, ortaöğretim)
 *   yeşil→mavi     → eğitim kademesi (ilköğretim → üniversite)
 *   kırmızı/pembe  → yerel (Çorum) ve ölçme (sınavlar)
 */
export const categories: Category[] = [
  {
    slug: 'mesleki',
    name: 'Mesleki Eğitim',
    nameEn: 'Vocational',
    mark: 'gear',
    color: '#eab308',
    gradient: ['#eab308', '#713f12'],
    order: 1,
  },
  {
    slug: 'mesem',
    name: 'MESEM',
    nameEn: 'MESEM',
    mark: 'community',
    color: '#f97316',
    gradient: ['#f97316', '#7c2d12'],
    order: 2,
  },
  {
    slug: 'meb',
    name: 'MEB',
    nameEn: 'MEB',
    mark: 'institution',
    color: '#3b82f6',
    gradient: ['#3b82f6', '#1e3a8a'],
    order: 3,
  },
  {
    slug: 'corum',
    name: 'Çorum Eğitim',
    nameEn: 'Çorum',
    mark: 'locator',
    color: '#dc2626',
    gradient: ['#dc2626', '#7f1d1d'],
    order: 4,
  },
  {
    slug: 'liseler',
    name: 'Liseler',
    nameEn: 'High Schools',
    mark: 'school',
    color: '#8b5cf6',
    gradient: ['#8b5cf6', '#4c1d95'],
    order: 5,
  },
  {
    slug: 'ortaogretim',
    name: 'Ortaöğretim',
    nameEn: 'Secondary',
    mark: 'steps',
    color: '#6366f1',
    gradient: ['#6366f1', '#312e81'],
    order: 6,
  },
  {
    slug: 'ilkogretim',
    name: 'İlköğretim',
    nameEn: 'Primary',
    mark: 'sprout',
    color: '#10b981',
    gradient: ['#10b981', '#064e3b'],
    order: 7,
  },
  {
    slug: 'maarif',
    name: 'Maarif Modeli',
    nameEn: 'Maarif',
    mark: 'rosette',
    color: '#4f46e5',
    gradient: ['#4f46e5', '#1e1b4b'],
    order: 8,
  },
  {
    slug: 'universite',
    name: 'Üniversite / YKS',
    nameEn: 'University',
    mark: 'book',
    color: '#0ea5e9',
    gradient: ['#0ea5e9', '#0c4a6e'],
    order: 9,
  },
  {
    slug: 'sinav',
    name: 'Sınavlar',
    nameEn: 'Exams',
    mark: 'clipboard',
    color: '#f43f5e',
    gradient: ['#f43f5e', '#881337'],
    order: 10,
  },
  {
    slug: 'yabanci',
    name: 'Yabancı Eğitim',
    nameEn: 'Global',
    mark: 'globe',
    color: '#06b6d4',
    gradient: ['#06b6d4', '#164e63'],
    order: 11,
  },
  {
    slug: 'gundem',
    name: 'Gündem',
    nameEn: 'Headlines',
    mark: 'headlines',
    color: '#64748b',
    gradient: ['#64748b', '#1e293b'],
    order: 12,
  },
]

export const categoryMap: Record<string, Category> = Object.fromEntries(
  categories.map((c) => [c.slug, c]),
)

export function getCategory(slug: string): Category {
  return (
    categoryMap[slug] ?? {
      slug,
      name: slug,
      nameEn: slug,
      mark: 'headlines',
      color: '#64748b',
      gradient: ['#334155', '#0f172a'],
      order: 99,
    }
  )
}
