import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  useColumns,
  useColumnArticle,
  useColumnAuthors,
  likeColumnArticle,
} from '../lib/api'
import type { ColumnArticle } from '../types'
import { Icon } from '../components/Icon'

export function KosePage() {
  const { slug } = useParams<{ slug?: string }>()

  if (slug) {
    return <ColumnDetail slug={slug} />
  }

  return <ColumnList />
}

function ColumnList() {
  const [selectedAuthor, setSelectedAuthor] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [debouncedQ, setDebouncedQ] = useState<string>('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery.trim()), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const { data: authors = [] } = useColumnAuthors()
  const { data: colData, isLoading: articlesLoading } = useColumns({
    author: selectedAuthor,
    q: debouncedQ,
    limit: 50,
  })

  const articles = colData?.items || []

  return (
    <div className="mx-auto max-w-[1300px] px-3 py-6 sm:px-6 sm:py-8">
      {/* Üst Başlık Banner */}
      <header className="mb-8 border-b border-line pb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Icon name="Feather" size={14} />
              Görüş, Analiz ve Yorum
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-fg sm:text-3xl md:text-4xl">
              Eğitim Köşe Yazıları
            </h1>
            <p className="mt-1 text-sm text-muted sm:text-base">
              Türk ve dünya basınından eğitim gündemine dair köşe yazıları, uzman görüşleri ve makaleler
            </p>
          </div>

          {/* Arama Kutusu */}
          <div className="relative w-full md:w-72">
            <Icon
              name="Search"
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Yazar veya konu ara..."
              className="w-full rounded-full border border-line bg-surface py-2 pl-10 pr-4 text-sm text-fg outline-none transition placeholder:text-faint focus:border-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-fg"
              >
                <Icon name="X" size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Yazarlar Çubuğu (Karusel / Seçici) */}
        {authors.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
              <span>Öne Çıkan Yazarlar</span>
              {selectedAuthor && (
                <button
                  type="button"
                  onClick={() => setSelectedAuthor('')}
                  className="font-medium text-primary hover:underline"
                >
                  Filtreyi Temizle ({selectedAuthor})
                </button>
              )}
            </div>

            <div className="no-scrollbar flex items-center gap-2.5 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => setSelectedAuthor('')}
                className={clsx(
                  'flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition',
                  !selectedAuthor
                    ? 'bg-fg text-bg shadow-sm'
                    : 'border border-line bg-surface text-muted hover:border-line-soft hover:text-fg'
                )}
              >
                Tümü
              </button>

              {authors.map((a) => {
                const isSelected = selectedAuthor === a.name
                return (
                  <button
                    key={a.name}
                    type="button"
                    onClick={() => setSelectedAuthor(isSelected ? '' : a.name)}
                    className={clsx(
                      'flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                      isSelected
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-line bg-surface text-fg hover:border-line-soft hover:bg-surface-2'
                    )}
                  >
                    {a.image ? (
                      <img
                        src={a.image}
                        alt=""
                        className="size-5 rounded-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="grid size-5 place-items-center rounded-full bg-surface-2 text-[0.625rem] font-bold">
                        {a.name.charAt(0)}
                      </span>
                    )}
                    <span>{a.name}</span>
                    <span
                      className={clsx(
                        'rounded-full px-1.5 text-[0.625rem]',
                        isSelected ? 'bg-white/20 text-white' : 'bg-surface-2 text-muted'
                      )}
                    >
                      {a.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </header>

      {/* Yazı Listesi */}
      {articlesLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-line bg-surface/50"
            />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface py-16 text-center">
          <Icon name="BookOpen" size={40} className="mx-auto text-faint" />
          <h3 className="mt-3 text-lg font-bold text-fg">Henüz köşe yazısı bulunamadı</h3>
          <p className="mt-1 text-sm text-muted">
            {selectedAuthor || debouncedQ
              ? 'Arama kriterlerinize uygun köşe yazısı bulunamadı.'
              : 'Köşe yazıları otomatik taranıyor, kısa süre içinde burada listelenecek.'}
          </p>
          {(selectedAuthor || debouncedQ) && (
            <button
              type="button"
              onClick={() => {
                setSelectedAuthor('')
                setSearchQuery('')
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-fg px-4 py-2 text-xs font-semibold text-bg transition hover:opacity-90"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((item) => (
            <ColumnCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}

function ColumnCard({ item }: { item: ColumnArticle }) {
  const dateFormatted = new Date(item.published_at).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-line bg-surface p-5 transition hover:border-line-soft hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">
      <div>
        {/* Yazar ve Kaynak Bilgisi */}
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {item.author_image ? (
              <img
                src={item.author_image}
                alt={item.author_name}
                className="size-10 shrink-0 rounded-full border border-line object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface-2 text-sm font-bold text-fg">
                {item.author_name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h4 className="truncate text-sm font-bold text-fg">{item.author_name}</h4>
              <p className="truncate text-xs text-muted">{item.source_name}</p>
            </div>
          </div>

          {item.translated === 1 && (
            <span
              title="Yabancı basından Türkçeye tam çeviri"
              className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-accent"
            >
              Çeviri ({item.original_lang})
            </span>
          )}
        </div>

        {/* Yazı Başlığı */}
        <Link to={`/kose/${item.slug}`} className="block">
          <h3 className="font-serif text-lg font-bold leading-snug text-fg transition group-hover:text-primary">
            {item.title}
          </h3>
        </Link>

        {/* Özet / Giriş */}
        <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-muted">
          {item.excerpt}
        </p>
      </div>

      {/* Alt Bilgi */}
      <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-3 text-[0.75rem] text-muted">
        <time dateTime={item.published_at}>{dateFormatted}</time>
        <Link
          to={`/kose/${item.slug}`}
          className="inline-flex items-center gap-1 font-semibold text-primary transition hover:underline"
        >
          Yazıyı Oku
          <Icon name="ArrowRight" size={14} />
        </Link>
      </div>
    </article>
  )
}

function ColumnDetail({ slug }: { slug: string }) {
  const navigate = useNavigate()
  const { data: item, isLoading, error } = useColumnArticle(slug)
  const [likes, setLikes] = useState<number>(0)
  const [liked, setLiked] = useState<boolean>(false)
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>('large')
  const [copied, setCopied] = useState<boolean>(false)

  useEffect(() => {
    if (item) setLikes(item.likes || 0)
  }, [item])

  const handleLike = async () => {
    if (!item || liked) return
    setLiked(true)
    setLikes((v) => v + 1)
    const newCount = await likeColumnArticle(item.id)
    if (newCount !== null) setLikes(newCount)
  }

  const handleShare = async () => {
    if (!item) return
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text: item.excerpt, url })
        return
      } catch {}
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 animate-pulse">
        <div className="h-6 w-32 rounded bg-surface-2" />
        <div className="mt-4 h-12 w-3/4 rounded bg-surface-2" />
        <div className="mt-8 space-y-4">
          <div className="h-4 rounded bg-surface-2" />
          <div className="h-4 rounded bg-surface-2" />
          <div className="h-4 w-5/6 rounded bg-surface-2" />
        </div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Icon name="AlertCircle" size={48} className="mx-auto text-amber-500" />
        <h2 className="mt-4 text-xl font-bold text-fg">Köşe yazısı bulunamadı</h2>
        <p className="mt-2 text-sm text-muted">
          Aradığınız yazı yayından kaldırılmış veya bağlantı hatalı olabilir.
        </p>
        <Link
          to="/kose"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2 text-sm font-semibold text-bg"
        >
          <Icon name="ArrowLeft" size={16} />
          Tüm Köşe Yazıları
        </Link>
      </div>
    )
  }

  const dateFormatted = new Date(item.published_at).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <article className="mx-auto max-w-[840px] px-4 py-8 sm:py-12">
      {/* Üst Gezinme */}
      <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
        <button
          type="button"
          onClick={() => navigate('/kose')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-fg"
        >
          <Icon name="ArrowLeft" size={16} />
          Köşe Yazılarına Dön
        </button>

        {/* Yazı Boyutu Seçici */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted mr-1">Metin:</span>
          <button
            type="button"
            onClick={() => setFontSize('normal')}
            className={clsx(
              'size-7 rounded border font-serif transition',
              fontSize === 'normal'
                ? 'border-primary bg-primary text-white'
                : 'border-line text-muted hover:text-fg'
            )}
          >
            A
          </button>
          <button
            type="button"
            onClick={() => setFontSize('large')}
            className={clsx(
              'size-7 rounded border font-serif text-sm font-bold transition',
              fontSize === 'large'
                ? 'border-primary bg-primary text-white'
                : 'border-line text-muted hover:text-fg'
            )}
          >
            A+
          </button>
          <button
            type="button"
            onClick={() => setFontSize('huge')}
            className={clsx(
              'size-7 rounded border font-serif text-base font-black transition',
              fontSize === 'huge'
                ? 'border-primary bg-primary text-white'
                : 'border-line text-muted hover:text-fg'
            )}
          >
            A++
          </button>
        </div>
      </div>

      {/* Yazar Profil Kartı (Gazete Sütunu Başlığı) */}
      <div className="mb-8 flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
        {item.author_image ? (
          <img
            src={item.author_image}
            alt={item.author_name}
            className="size-16 sm:size-20 shrink-0 rounded-full border-2 border-primary/20 object-cover shadow-sm"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="grid size-16 sm:size-20 shrink-0 place-items-center rounded-full border-2 border-line bg-surface-2 text-xl font-black text-fg">
            {item.author_name.charAt(0)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-fg">{item.author_name}</h2>
            <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted">
              {item.source_name}
            </span>
            {item.translated === 1 && (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[0.625rem] font-bold text-accent uppercase">
                {item.original_lang?.toUpperCase()} Çevirisi
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            {item.author_title || 'Köşe Yazarı'}
          </p>
          <time dateTime={item.published_at} className="mt-1 block text-xs text-faint">
            {dateFormatted}
          </time>
        </div>
      </div>

      {/* Makale Başlığı */}
      <h1 className="font-serif text-2xl font-black leading-tight text-fg sm:text-3xl md:text-4xl">
        {item.title}
      </h1>

      {/* Vurgulu Özet / Spot */}
      {item.excerpt && (
        <div className="my-6 border-l-4 border-primary pl-4 font-serif text-base italic leading-relaxed text-fg/80 sm:text-lg">
          {item.excerpt}
        </div>
      )}

      {/* Makale Gövdesi */}
      <div
        className={clsx(
          'mt-6 font-serif leading-relaxed text-fg space-y-5',
          fontSize === 'normal' && 'text-base sm:text-[1.0625rem]',
          fontSize === 'large' && 'text-lg sm:text-xl',
          fontSize === 'huge' && 'text-xl sm:text-2xl'
        )}
      >
        {item.body && item.body.length > 0 ? (
          item.body.map((paragraph, idx) => (
            <p key={idx} className="tracking-normal">
              {paragraph}
            </p>
          ))
        ) : (
          <p>{item.excerpt}</p>
        )}
      </div>

      {/* Etiketler */}
      {item.tags && item.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-lg border border-line bg-surface px-3 py-1 text-xs font-medium text-muted"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Alt Eylemler ve Kaynak Bağlantısı */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLike}
            className={clsx(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition',
              liked
                ? 'border-red-500/30 bg-red-500/10 text-red-500'
                : 'border-line text-muted hover:border-line-soft hover:text-fg'
            )}
          >
            <Icon name="Heart" size={16} className={clsx(liked && 'fill-current text-red-500')} />
            <span>{likes} Beğeni</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-xs font-semibold text-muted transition hover:border-line-soft hover:text-fg"
          >
            <Icon name="Share2" size={16} />
            <span>{copied ? 'Kopyalandı!' : 'Paylaş'}</span>
          </button>
        </div>

        {item.source_url && (
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition hover:underline"
          >
            <span>{item.source_name} Üzerinde Orijinalini Oku</span>
            <Icon name="ExternalLink" size={14} />
          </a>
        )}
      </div>
    </article>
  )
}