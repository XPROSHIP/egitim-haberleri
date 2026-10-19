import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import type { Comment, NewsItem } from '../types'
import { useComments, useEngagement, postComment, setLike as setLikeRemote, setBookmark as setBookmarkRemote } from '../lib/api'
import { useStore } from '../lib/store'
import { relativeTime } from '../lib/format'
import { shareUrl } from '../lib/share'
import { bus, EVENTS } from '../lib/bus'
import { Icon } from './Icon'

/** Nötr, tek renkli avatar — renkli daireler yerine sade bir monogram. */
function Avatar({ name, mine }: { name: string; mine?: boolean }) {
  return (
    <span
      className={clsx(
        'grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold select-none',
        mine ? 'bg-fg text-bg' : 'bg-surface-3 text-muted',
      )}
    >
      {name.trim().charAt(0).toLocaleUpperCase('tr')}
    </span>
  )
}

function CommentRow({ c, replies }: { c: Comment; replies: Comment[] }) {
  const [liked, setLiked] = useState(false)
  return (
    <div className="border-b border-line-soft py-4 last:border-b-0">
      <div className="flex gap-3">
        <Avatar name={c.authorName} mine={c.authorId === 'me'} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-fg">{c.authorName}</span>
            <span className="text-[11px] text-faint">{relativeTime(c.createdAt)}</span>
          </div>
          <p className="mt-1 text-[13.5px] leading-relaxed whitespace-pre-line text-muted">{c.body}</p>
          <div className="mt-2 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setLiked((v) => !v)}
              className={clsx(
                'flex items-center gap-1.5 text-[11px] transition',
                liked ? 'text-accent' : 'text-faint hover:text-fg',
              )}
            >
              <Icon name="ThumbsUp" size={13} /> {c.likes + (liked ? 1 : 0)}
            </button>
          </div>

          {replies.length > 0 && (
            <div className="mt-3 space-y-3 border-l border-line pl-3.5">
              {replies.map((r) => (
                <div key={r.id} className="flex gap-2.5">
                  <Avatar name={r.authorName} mine={r.authorId === 'me'} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-fg">{r.authorName}</span>
                      <span className="text-[10.5px] text-faint">{relativeTime(r.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{r.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function CommentSection({ item }: { item: NewsItem }) {
  const { t } = useTranslation()
  const { signedIn } = useStore()
  const { data, refetch } = useComments(item.id)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const all = data ?? []
  const roots = all.filter((c) => !c.parentId)
  const repliesOf = (id: string) => all.filter((c) => c.parentId === id)

  const submit = async () => {
    if (!signedIn) {
      bus.emit(EVENTS.openLogin)
      return
    }
    const body = text.trim()
    if (!body) return
    if (body.length > 500) {
      setError(t('comments.limit'))
      return
    }
    setError('')
    setSending(true)
    try {
      await postComment(item.id, body)
      setText('')
      await refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yorum gönderilemedi.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section id="yorumlar" className="mt-10">
      <h2 className="flex items-center gap-2 text-lg font-bold text-fg">
        {t('news.comments')}
        <span className="tnum text-sm font-normal text-faint">({all.length})</span>
      </h2>

      {/* Üye olmadan yorum yazılamaz */}
      <div className="mt-4 rounded-xl border border-line bg-surface p-4">
        {signedIn ? (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={600}
              rows={3}
              placeholder={t('comments.placeholder')}
              className="w-full resize-none rounded-lg border border-line bg-surface-2 p-3 text-[13.5px] leading-relaxed text-fg outline-none placeholder:text-faint focus:border-primary/50"
            />
            {error && <p className="mt-1.5 text-[11px] text-accent">{error}</p>}
            <div className="mt-2.5 flex items-center justify-between">
              <span className="tnum text-[11px] text-faint">{text.length}/500</span>
              <button
                type="button"
                onClick={submit}
                disabled={!text.trim() || sending}
                className="rounded-full bg-fg px-4 py-1.5 text-[13px] font-semibold text-bg transition hover:opacity-90 disabled:opacity-40"
              >
                {t('comments.submit')}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <p className="text-[13px] text-muted">{t('comments.loginToComment')}</p>
            <button
              type="button"
              onClick={() => bus.emit(EVENTS.openLogin)}
              className="rounded-full bg-fg px-5 py-2 text-[13px] font-semibold text-bg transition hover:opacity-90"
            >
              {t('nav.signIn')}
            </button>
          </div>
        )}
      </div>

      <div className="mt-1">
        {roots.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-faint">{t('comments.empty')}</p>
        ) : (
          roots.map((c) => <CommentRow key={c.id} c={c} replies={repliesOf(c.id)} />)
        )}
      </div>
    </section>
  )
}

export function EngagementBar({ item }: { item: NewsItem }) {
  const { t } = useTranslation()
  const { likes, bookmarks, toggleLike, toggleBookmark } = useStore()
  const { data } = useEngagement(item.id)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  // Sunucudaki gerçek veri öncelikli; giriş yoksa yerel liste kullanılır.
  const liked = data?.myLikes?.includes(item.id) ?? likes.includes(item.id)
  const saved = data?.myBookmarks?.includes(item.id) ?? bookmarks.includes(item.id)
  const likeCount = data?.likes ?? item.likes

  const btn =
    'flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[12.5px] font-medium text-muted transition hover:bg-surface-2 hover:text-fg'

  const onLike = async () => {
    if (!signedInGuard()) return
    toggleLike(item.id)
    setBusy(true)
    try {
      await setLikeRemote(item.id, !liked)
    } catch {
      toggleLike(item.id) // geri al
    } finally {
      setBusy(false)
    }
  }

  const onBookmark = async () => {
    if (!signedInGuard()) return
    toggleBookmark(item.id)
    setBusy(true)
    try {
      await setBookmarkRemote(item.id, !saved)
    } catch {
      toggleBookmark(item.id)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onLike}
        disabled={busy}
        className={clsx(btn, liked && 'border-accent/50 text-accent')}
      >
        <Icon name="Heart" size={15} fill={liked ? 'currentColor' : 'none'} />
        {liked ? t('news.liked') : t('news.like')}
        <span className="tnum text-faint">{likeCount}</span>
      </button>
      <button
        type="button"
        onClick={onBookmark}
        disabled={busy}
        className={clsx(btn, saved && 'border-primary/50 text-primary')}
      >
        <Icon name="Bookmark" size={15} fill={saved ? 'currentColor' : 'none'} />
        {saved ? t('news.bookmarked') : t('news.bookmark')}
      </button>
      <button
        type="button"
        onClick={() => {
          void shareUrl(item).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1600)
          })
        }}
        className={clsx(btn, copied && 'text-primary')}
      >
        <Icon name="Share2" size={15} />
        {copied ? t('common.copied') : t('common.share')}
      </button>
    </div>
  )
}

/** Giriş yoksa giriş penceresini açar ve false döner. */
function signedInGuard(): boolean {
  const raw = localStorage.getItem('eh.supabase.auth')
  const has = Boolean(raw && raw.length > 40)
  if (!has) {
    bus.emit(EVENTS.openLogin)
    return false
  }
  return true
}
