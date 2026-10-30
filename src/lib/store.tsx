import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Lang } from './format'
import type { User } from '../types'

export type ThemeMode = 'dark' | 'light' | 'sepia' | 'system'
export type FontScale = '1' | '1.25' | '1.5'
export type FeedMode = 'latest' | 'featured' | 'following' | 'foryou'
/** Okuma konforu: yazı tipi, satır genişliği, satır aralığı. */
export type ReaderFont = 'sans' | 'serif' | 'handwriting'
export type ReaderWidth = 'narrow' | 'normal' | 'wide'
export type ReaderLine = 'compact' | 'normal' | 'relaxed'

type Persisted = {
  theme: ThemeMode
  fontScale: FontScale
  readerFont: ReaderFont
  readerWidth: ReaderWidth
  readerLine: ReaderLine
  lang: Lang
  bookmarks: string[]
  likes: string[]
  readMarks: string[]
  followed: string[]
  hiddenCategories: string[]
  consent: 'all' | 'essential' | null
  feedMode: FeedMode
  hideRead: boolean
  pushEnabled: boolean
  user: User | null
  /** demo kullanıcı — Google girişi yapılandırılana kadar geçici çözüm */
  demoUser: boolean
}

const KEY = 'eh.state.v1'

const defaults: Persisted = {
  theme: 'system',
  fontScale: '1',
  readerFont: 'sans',
  readerWidth: 'normal',
  readerLine: 'normal',
  lang: 'tr',
  bookmarks: [],
  likes: [],
  readMarks: [],
  followed: ['mesleki', 'meb', 'corum'],
  hiddenCategories: [],
  // Analitik kullanmadigimiz icin izin varsayilan olarak verilir; bildirim gosterilmez.
  consent: 'essential',
  feedMode: 'latest',
  // Okunanlar varsayilan olarak gizli: kullanici her giriste ayni ekrani gormesin.
  hideRead: true,
  pushEnabled: false,
  user: null,
  demoUser: false,
}

/**
 * Yazı boyutu ölçeği.
 *
 * Metin boyutları rem'e çevrildiği için kök font-size büyütmek bütün
 * yazıyı büyütür. Değerler bilinçli olarak yumuşak: tasarımı bozmadan
 * "bir tık" büyütüyor.
 */
const FONT_SCALE_PCT: Record<FontScale, number> = {
  '1': 100,
  '1.25': 106,
  '1.5': 112,
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaults
    return { ...defaults, ...(JSON.parse(raw) as Partial<Persisted>) }
  } catch {
    return defaults
  }
}

type Store = Persisted & {
  resolvedTheme: 'dark' | 'light' | 'sepia'
  signedIn: boolean
  toggleBookmark: (id: string) => void
  toggleLike: (id: string) => void
  toggleFollow: (slug: string) => void
  toggleHideCategory: (slug: string) => void
  markRead: (id: string) => void
  markAllRead: (ids: string[]) => void
  setTheme: (t: ThemeMode) => void
  setFontScale: (f: FontScale) => void
  setLang: (l: Lang) => void
  setConsent: (c: 'all' | 'essential') => void
  setFeedMode: (m: FeedMode) => void
  setHideRead: (v: boolean) => void
  setReaderFont: (f: ReaderFont) => void
  setReaderWidth: (w: ReaderWidth) => void
  setReaderLine: (l: ReaderLine) => void
  setPushEnabled: (v: boolean) => void
  setUser: (u: User | null, demo?: boolean) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load)
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return true
    try {
      return !window.matchMedia('(prefers-color-scheme: light)').matches
    } catch {
      return true
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    try {
      const mq = window.matchMedia('(prefers-color-scheme: light)')
      const onChange = () => setSystemDark(!mq.matches)
      if (mq.addEventListener) {
        mq.addEventListener('change', onChange)
        return () => mq.removeEventListener('change', onChange)
      } else if ('addListener' in mq) {
        // Eski Safari / eski Android WebView uyumluluğu
        const legacyMq = mq as unknown as { addListener: (cb: () => void) => void; removeListener: (cb: () => void) => void }
        legacyMq.addListener(onChange)
        return () => legacyMq.removeListener(onChange)
      }
    } catch {}
  }, [])

  const resolvedTheme: 'dark' | 'light' | 'sepia' =
    state.theme === 'system' ? (systemDark ? 'dark' : 'light') : state.theme

  useEffect(() => {
    const el = document.documentElement
    el.classList.remove('dark', 'light', 'sepia')
    el.classList.add(resolvedTheme)
    el.dataset.theme = resolvedTheme
  }, [resolvedTheme])

  useEffect(() => {
    document.documentElement.style.fontSize = `${FONT_SCALE_PCT[state.fontScale] ?? 100}%`
  }, [state.fontScale])

  // Okuma konforu ayarları: CSS değişkenleri üzerinden uygulanır.
  useEffect(() => {
    const el = document.documentElement
    el.dataset.readerFont = state.readerFont
    el.dataset.readerWidth = state.readerWidth
    el.dataset.readerLine = state.readerLine
  }, [state.readerFont, state.readerWidth, state.readerLine])

  useEffect(() => {
    document.documentElement.lang = state.lang
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* kota dolu olabilir */
    }
  }, [state])

  // Eşzamanlı yerel kayıt: state değiştiği anda localStorage'a yazılır.
  const updateState = (updater: (prev: Persisted) => Persisted) => {
    setState((prev) => {
      const next = updater(prev)
      try {
        localStorage.setItem(KEY, JSON.stringify(next))
      } catch (err) {
        console.warn('Storage save failed:', err)
      }
      return next
    })
  }

  const toggleIn = (key: 'bookmarks' | 'likes' | 'readMarks', id: string) =>
    updateState((s) => ({
      ...s,
      [key]: s[key].includes(id) ? s[key].filter((x) => x !== id) : [...s[key], id],
    }))

  const store: Omit<Store, 'signedIn'> = useMemo(
    () => ({
      ...state,
      resolvedTheme,
      toggleBookmark: (id) => toggleIn('bookmarks', id),
      toggleLike: (id) => toggleIn('likes', id),
      markRead: (id) =>
        updateState((s) => (s.readMarks.includes(id) ? s : { ...s, readMarks: [...s.readMarks, id] })),
      markAllRead: (ids) =>
        updateState((s) => ({ ...s, readMarks: [...new Set([...s.readMarks, ...ids])] })),
      toggleFollow: (slug) =>
        updateState((s) => ({
          ...s,
          followed: s.followed.includes(slug)
            ? s.followed.filter((x) => x !== slug)
            : [...s.followed, slug],
        })),
      toggleHideCategory: (slug) =>
        updateState((s) => ({
          ...s,
          hiddenCategories: s.hiddenCategories.includes(slug)
            ? s.hiddenCategories.filter((x) => x !== slug)
            : [...s.hiddenCategories, slug],
        })),
      setTheme: (theme) => updateState((s) => ({ ...s, theme })),
      setFontScale: (fontScale) => updateState((s) => ({ ...s, fontScale })),
      setLang: (lang) => updateState((s) => ({ ...s, lang })),
      setConsent: (consent) => updateState((s) => ({ ...s, consent })),
      setFeedMode: (feedMode) => updateState((s) => ({ ...s, feedMode })),
      setHideRead: (hideRead) => updateState((s) => ({ ...s, hideRead })),
      setReaderFont: (readerFont) => updateState((s) => ({ ...s, readerFont })),
      setReaderWidth: (readerWidth) => updateState((s) => ({ ...s, readerWidth })),
      setReaderLine: (readerLine) => updateState((s) => ({ ...s, readerLine })),
      setPushEnabled: (pushEnabled) => updateState((s) => ({ ...s, pushEnabled })),
      setUser: (user, demo = false) => updateState((s) => ({ ...s, user, demoUser: demo })),
    }),
    [state, resolvedTheme],
  )

  const withSignedIn = { ...store, signedIn: Boolean(store.user) }

  return <Ctx.Provider value={withSignedIn}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore must be used inside StoreProvider')
  return v
}

export function useToggle() {
  const { bookmarks, likes, toggleBookmark, toggleLike } = useStore()
  return {
    isBookmarked: useCallback((id: string) => bookmarks.includes(id), [bookmarks]),
    isLiked: useCallback((id: string) => likes.includes(id), [likes]),
    toggleBookmark,
    toggleLike,
  }
}
