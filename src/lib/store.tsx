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

export type ThemeMode = 'dark' | 'light' | 'system'
export type FontScale = '1' | '1.25' | '1.5'
export type FeedMode = 'latest' | 'featured' | 'following' | 'foryou'

type Persisted = {
  theme: ThemeMode
  fontScale: FontScale
  lang: Lang
  bookmarks: string[]
  likes: string[]
  readMarks: string[]
  followed: string[]
  hiddenCategories: string[]
  consent: 'all' | 'essential' | null
  feedMode: FeedMode
  hideRead: boolean
  user: User | null
  /** demo kullanıcı — Google girişi yapılandırılana kadar geçici çözüm */
  demoUser: boolean
}

const KEY = 'eh.state.v1'

const defaults: Persisted = {
  theme: 'system',
  fontScale: '1',
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
  resolvedTheme: 'dark' | 'light'
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
  setUser: (u: User | null, demo?: boolean) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load)
  const [systemDark, setSystemDark] = useState(
    () => !window.matchMedia('(prefers-color-scheme: light)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => setSystemDark(!mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolvedTheme: 'dark' | 'light' =
    state.theme === 'system' ? (systemDark ? 'dark' : 'light') : state.theme

  useEffect(() => {
    const el = document.documentElement
    el.classList.toggle('dark', resolvedTheme === 'dark')
    el.classList.toggle('light', resolvedTheme === 'light')
  }, [resolvedTheme])

  useEffect(() => {
    document.documentElement.style.fontSize = `${FONT_SCALE_PCT[state.fontScale] ?? 100}%`
  }, [state.fontScale])

  useEffect(() => {
    document.documentElement.lang = state.lang
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* kota dolu olabilir */
    }
  }, [state])

  const toggleIn = (key: 'bookmarks' | 'likes' | 'readMarks', id: string) =>
    setState((s) => ({
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
        setState((s) => (s.readMarks.includes(id) ? s : { ...s, readMarks: [...s.readMarks, id] })),
      markAllRead: (ids) =>
        setState((s) => ({ ...s, readMarks: [...new Set([...s.readMarks, ...ids])] })),
      toggleFollow: (slug) =>
        setState((s) => ({
          ...s,
          followed: s.followed.includes(slug)
            ? s.followed.filter((x) => x !== slug)
            : [...s.followed, slug],
        })),
      toggleHideCategory: (slug) =>
        setState((s) => ({
          ...s,
          hiddenCategories: s.hiddenCategories.includes(slug)
            ? s.hiddenCategories.filter((x) => x !== slug)
            : [...s.hiddenCategories, slug],
        })),
      setTheme: (theme) => setState((s) => ({ ...s, theme })),
      setFontScale: (fontScale) => setState((s) => ({ ...s, fontScale })),
      setLang: (lang) => setState((s) => ({ ...s, lang })),
      setConsent: (consent) => setState((s) => ({ ...s, consent })),
      setFeedMode: (feedMode) => setState((s) => ({ ...s, feedMode })),
      setHideRead: (hideRead) => setState((s) => ({ ...s, hideRead })),
      setUser: (user, demo = false) => setState((s) => ({ ...s, user, demoUser: demo })),
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
