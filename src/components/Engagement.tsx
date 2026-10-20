import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import type { Comment, NewsItem } from '../types'
import {
  useComments,
  useEngagement,
  postComment,
  setLike as setLikeRemote,
  setBookmark as setBookmarkRemote,
  setCommentLike,
} from '../lib/api'
import { useStore } from '../lib/store'
import { relativeTime } from '../lib/format'
import { shareUrl } from '../lib/share'
import { bus, EVENTS } from '../lib/bus'
import { playLike, playSave, playTick } from '../lib/sound'
import { Icon } from './Icon'

/** Nötr, tek renkli avatar — renkli daireler yerine sade bir monogram. */
function Avatar({ name, mine }: { name: string; mine?: boolean }) {
  return (
    <span
      className={clsx(
        'grid size-7 shrink-0 place-items-center rounded-full text-[0.6875rem] font-semibold select-none',
        mine ? 'bg-fg text-bg' : 'bg-surface-3 text-muted',
      )}
    >
      {name.trim().charAt(0).toLocaleUpperCase('tr')}
    </span>
  )
}

function CommentRow({
  c,
  replies,
  myLikes,
}: {
  c: Comment
  replies: Comment[]
  myLikes: string[]
}) {
  const serverLiked = myLikes.includes(c.id)
  const [liked, setLiked] = useState(serverLiked)
  const [count, setCount] = useState(c.likes)
  const [pulse, setPulse] = useState(0)

  useEffect(() => {
    setLiked(serverLiked)
    setCount(c.likes)
  }, [serverLiked, c.likes])

  const onLike = async () => {
    if (!signedInGuard()) return
    const next = !liked
    setLiked(next)
    setCount((v) => Math.max(0, v + (next ? 1 : -1)))
    setPulse((p) => p + 1)
    playTick()
    try {
      const real = await setCommentLike(c.id, next)
      setCount(real)
    } catch {
      setLiked(!next)
      setCount((v) => Math.max(0, v + (next ? -1 : 1)))
    }
  }

  return (
    <div className="border-b border-line-soft py-4 last:border-b-0">
      <div className="flex gap-3">
        <Avatar name={c.authorName} mine={c.authorId === 'me'} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[0.8125rem] font-semibold text-fg">{c.authorName}</span>
            <span className="text-[0.6875rem] text-faint">{relativeTime(c.createdAt)}</span>
          </div>
          <p className="mt-1 text-[0.84375rem] leading-relaxed whitespace-pre-line text-muted">{c.body}</p>
          <div className="mt-2 flex items-center gap-4">
            <button
              type="button"
              onClick={onLike}
              aria-pressed={liked}
              className={clsx(
                'flex items-center gap-1.5 text-[0.6875rem] transition',
                liked ? 'text-accent' : 'text-faint hover:text-fg',
              )}
            >
              <span
                key={pulse}
                className={clsx('inline-flex', pulse > 0 && 'eh-heart-pop')}
              >
                <Icon name="ThumbsUp" size={13} fill={liked ? 'currentColor' : 'none'} />
              </span>
              <span className="tnum">{count}</span>
            </button>
          </div>

          {replies.length > 0 && (
            <div className="mt-3 space-y-3 border-l border-line pl-3.5">
              {replies.map((r) => (
                <div key={r.id} className="flex gap-2.5">
                  <Avatar name={r.authorName} mine={r.authorId === 'me'} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[0.75rem] font-semibold text-fg">{r.authorName}</span>
                      <span className="text-[0.65625rem] text-faint">{relativeTime(r.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-[0.78125rem] leading-relaxed text-muted">{r.body}</p>
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
  const { data: engagement } = useEngagement(item.id)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const all = data ?? []
  const roots = all.filter((c) => !c.parentId)
  const repliesOf = (id: string) => all.filter((c) => c.parentId === id)
  const myLikes = engagement?.myCommentLikes ?? []

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
              className="w-full resize-none rounded-lg border border-line bg-surface-2 p-3 text-[0.84375rem] leading-relaxed text-fg outline-none placeholder:text-faint focus:border-primary/50"
            />
            {error && <p className="mt-1.5 text-[0.6875rem] text-accent">{error}</p>}
            <div className="mt-2.5 flex items-center justify-between">
              <span className="tnum text-[0.6875rem] text-faint">{text.length}/500</span>
              <button
                type="button"
                onClick={submit}
                disabled={!text.trim() || sending}
                className="rounded-full bg-fg px-4 py-1.5 text-[0.8125rem] font-semibold text-bg transition hover:opacity-90 disabled:opacity-40"
              >
                {t('comments.submit')}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <p className="text-[0.8125rem] text-muted">{t('comments.loginToComment')}</p>
            <button
              type="button"
              onClick={() => bus.emit(EVENTS.openLogin)}
              className="rounded-full bg-fg px-5 py-2 text-[0.8125rem] font-semibold text-bg transition hover:opacity-90"
            >
              {t('nav.signIn')}
            </button>
          </div>
        )}
      </div>

      <div className="mt-1">
        {roots.length === 0 ? (
          <p className="py-10 text-center text-[0.8125rem] text-faint">{t('comments.empty')}</p>
        ) : (
          roots.map((c) => (
            <CommentRow key={c.id} c={c} replies={repliesOf(c.id)} myLikes={myLikes} />
          ))
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

  // Sunucudaki gerçek veri öncelikli; giriş yoksa yerel liste kullanılır.
  const serverLiked = data?.myLikes?.includes(item.id) ?? likes.includes(item.id)
  const serverSaved = data?.myBookmarks?.includes(item.id) ?? bookmarks.includes(item.id)
  const serverCount = data?.likes ?? item.likes

  // Anında tepki: tıklayınca düğme hemen kırmızıya döner, sayaç artar.
  const [liked, setLiked] = useState(serverLiked)
  const [count, setCount] = useState(serverCount)
  const [saved, setSaved] = useState(serverSaved)
  const [beat, setBeat] = useState(0)
  const [pop, setPop] = useState(0)

  useEffect(() => {
    if (!beat && !pop) return
    const t = setTimeout(() => {
      setBeat(0)
      setPop(0)
    }, 700)
    return () => clearTimeout(t)
  }, [beat, pop])

  const onLike = async () => {
    if (!signedInGuard()) return
    const next = !liked
    setLiked(next)
    setCount((v) => Math.max(0, v + (next ? 1 : -1)))
    setBeat((b) => b + 1)
    toggleLike(item.id)
    if (next) playLike()
    try {
      const real = await setLikeRemote(item.id, next)
      setCount(real)
    } catch {
      setLiked(!next)
      setCount((v) => Math.max(0, v + (next ? -1 : 1)))
      toggleLike(item.id)
    }
  }

  const onBookmark = async () => {
    if (!signedInGuard()) return
    const next = !saved
    setSaved(next)
    setPop((p) => p + 1)
    toggleBookmark(item.id)
    if (next) playSave()
    try {
      await setBookmarkRemote(item.id, next)
    } catch {
      setSaved(!next)
      toggleBookmark(item.id)
    }
  }

  const btn =
    'flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[0.78125rem] font-medium text-muted transition hover:bg-surface-2 hover:text-fg'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onLike}
        aria-pressed={liked}
        className={clsx(
          btn,
          liked && 'border-accent/60 bg-accent/10 text-accent',
        )}
      >
        <span className="relative inline-flex">
          {beat > 0 && (
            <span
              key={beat}
              aria-hidden="true"
              className="eh-ring pointer-events-none absolute inset-0 rounded-full bg-accent/60"
            />
          )}
          <span key={`h${beat}`} className={clsx('inline-flex', beat > 0 && 'eh-heart-pop')}>
            <Icon name="Heart" size={15} fill={liked ? 'currentColor' : 'none'} />
          </span>
        </span>
        {liked ? t('news.liked') : t('news.like')}
        <span className="tnum text-faint">{count}</span>
      </button>
      <button
        type="button"
        onClick={onBookmark}
        aria-pressed={saved}
        className={clsx(
          btn,
          saved && 'border-primary/60 bg-primary/10 text-primary',
        )}
      >
        <span key={`b${pop}`} className={clsx('inline-flex', pop > 0 && 'eh-pop')}>
          <Icon name="Bookmark" size={15} fill={saved ? 'currentColor' : 'none'} />
        </span>
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
