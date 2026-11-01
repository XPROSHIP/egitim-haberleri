/** Kategori işaretlerinin adları (bkz. components/CategoryMark) */
export type MarkName =
  | 'gear'
  | 'community'
  | 'institution'
  | 'locator'
  | 'school'
  | 'steps'
  | 'sprout'
  | 'rosette'
  | 'book'
  | 'clipboard'
  | 'globe'
  | 'headlines'

export type Category = {
  slug: string
  name: string
  nameEn: string
  mark: MarkName
  color: string
  /** gradient stops used for generated covers */
  gradient: [string, string]
  order: number
}

export type NewsSource = {
  name: string
  url: string
  /** haberin kapak görseli (kendi sunucumuzda saklanır) */
  image?: string
}

export type NewsItem = {
  id: string
  slug: string
  title: string
  excerpt: string
  /** kaynaktan çıkarılan tam haber metni; yoksa AI özeti kullanılır */
  body: string[]
  category: string
  tags: string[]
  source: NewsSource
  publishedAt: string
  views: number
  likes: number
  commentsCount: number
  featured: boolean
  province?: string
  /** metin kaynaktan mı alındı, yoksa özet mi */
  fullText?: boolean
  /** Haberin kaynak dili. 'en' ise Türkçeye çevrilmiş yabancı kaynak haberidir. */
  lang?: 'tr' | 'en'
  /** Sunucuda hazır üretilmiş ses var mı (EMA Lightning ile). */
  hasAudio?: boolean
  /** Hazır sesin süresi (saniye). */
  audioDuration?: number
}

export type User = {
  id: string
  email: string
  name: string
  avatarUrl?: string
}

export type Comment = {
  id: string
  articleId: string
  authorId: string
  authorName: string
  avatarUrl?: string
  body: string
  createdAt: string
  likes: number
  parentId?: string
  pending?: boolean
}

export type NewsStatus = 'draft' | 'review' | 'published' | 'rejected'

export type CollectorRun = {
  startedAt: string
  finishedAt?: string
  fetched: number
  newCount: number
  published: number
  errors: string[]
}

export type ColumnArticle = {
  id: string
  slug: string
  title: string
  author_name: string
  author_image?: string | null
  author_title?: string | null
  source_name: string
  source_url: string
  excerpt: string
  body?: string[]
  published_at: string
  views: number
  likes: number
  lang: string
  original_lang?: string | null
  translated: number
  tags: string[]
  created_at?: string
}

export type ColumnAuthor = {
  name: string
  image?: string | null
  source: string
  count: number
  last_published?: string
}