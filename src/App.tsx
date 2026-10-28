import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StoreProvider, useStore } from './lib/store'
import { TopBar } from './components/TopBar'
import { SideDrawer } from './components/SideDrawer'
import { AssistantOrb, LoginModal } from './components/Overlays'
import { AssistantPanel } from './components/AssistantPanel'
import { StoryHost } from './components/StoryHost'
import { Footer, ScrollToTop } from './components/Footer'
import { HomePage } from './pages/HomePage'
import { FeedPage } from './pages/FeedPage'
import { ArticlePage } from './pages/ArticlePage'
import {
  CategoriesPage,
  CategoryPage,
  ProvincePage,
  SavedPage,
  SearchPage,
  TagPage,
} from './pages/ListingPages'
import { SettingsPage } from './pages/SettingsPage'
import { ProfilePage } from './pages/ProfilePage'
import { PodcastPage } from './pages/PodcastPage'
import { LegalPage, LoginPage, NotFoundPage } from './pages/LegalPages'
import { MobileTabBar } from './components/MobileTabBar'
import { bus, EVENTS } from './lib/bus'
import { completeSignIn, restoreSession, setSessionTokens, watchSession } from './lib/auth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: true, staleTime: 60_000, retry: 1 },
  },
})

function ScrollManager() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname, search])
  return null
}

/** Google'dan dönüşte oturumu açar, ardından adresi temizler. */
function AuthBootstrap() {
  const { setUser } = useStore()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const code = params.get('code')
  const done = useRef(false)

  useEffect(() => {
    let alive = true
    const run = async () => {
      // setUser her state değişiminde yeni bir fonksiyon olduğu için bu efekt
      // yeniden çalışabiliyor. Bayrak gövdenin yalnızca bir kez çalışmasını
      // garanti eder; aksi halde render döngüsü oluşur.
      if (done.current) return
      done.current = true

      // URL hash'inde (#access_token=...&refresh_token=...) dönebilir
      const hash = window.location.hash.replace(/^#/, '')
      const hashParams = new URLSearchParams(hash)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      let session = null

      if (accessToken) {
        session = await setSessionTokens(accessToken, refreshToken || undefined)
      } else if (code) {
        session = await completeSignIn(code)
      }

      if (session) {
        // workers.dev adresinde oturum açıldıysa ama asıl alan adı corummesem.com.tr ise:
        // Oturumu corummesem.com.tr'ye güvenle aktar!
        const isWorkersDev = window.location.hostname.endsWith('workers.dev')
        if (isWorkersDev && session.accessToken) {
          const nextTarget = new URLSearchParams(window.location.search).get('next') || '/profil'
          const transferUrl = `https://corummesem.com.tr/giris#access_token=${encodeURIComponent(session.accessToken)}&refresh_token=${encodeURIComponent(session.refreshToken || '')}&next=${encodeURIComponent(nextTarget)}`
          window.location.replace(transferUrl)
          return
        }

        // Adres çubuğu temizlenir: yenilemede aynı kod tekrar denenmesin.
        if (alive) {
          window.history.replaceState({}, '', window.location.pathname)
          setUser(session.user)
          // Giriş başarılı: kullanıcıyı profiline götür
          const next = new URLSearchParams(window.location.search).get('next') || hashParams.get('next')
          navigate(next && next.startsWith('/') ? next : '/profil', { replace: true })
          return
        }
      } else if (code || accessToken) {
        // Başarısız dönüş: kullanıcı sebebi görsün diye giriş penceresini aç.
        if (alive) {
          window.history.replaceState({}, '', window.location.pathname)
          bus.emit(EVENTS.openLogin)
        }
      }

      const existing = await restoreSession()
      if (alive && existing) setUser(existing.user)
    }
    void run()
    // İstemci oturumu kendisi de bildirebilir (sayfa yenileme, token yenileme,
    // çıkış). Çıkışta da kullanıcı temizlenmeli.
    const off = watchSession((s) => {
      if (alive) setUser(s?.user ?? null)
    })
    return () => {
      alive = false
      off()
    }
  }, [code, setUser, navigate])

  return null
}

function Shell() {
  const [drawer, setDrawer] = useState(false)
  const [login, setLogin] = useState(false)
  const [assistant, setAssistant] = useState(false)

  useEffect(() => {
    const offLogin = bus.on(EVENTS.openLogin, () => setLogin(true))
    const offAssistant = bus.on(EVENTS.openAssistant, () => setAssistant(true))
    return () => {
      offLogin()
      offAssistant()
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar
        onOpenDrawer={() => setDrawer(true)}
        onOpenLogin={() => setLogin(true)}
        onOpenAssistant={() => setAssistant(true)}
      />
      <SideDrawer open={drawer} onClose={() => setDrawer(false)} onOpenLogin={() => setLogin(true)} />
      <ScrollManager />
      <AuthBootstrap />

      {/* Mobilde sabit alt çubuk içeriği kapatmasın */}
      <div className="flex-1 pb-16 lg:pb-0">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/haber/:slug" element={<ArticlePage />} />
          <Route path="/kategori/:slug" element={<CategoryPage />} />
          <Route path="/kategoriler" element={<CategoriesPage />} />
          <Route path="/etiket/:tag" element={<TagPage />} />
          <Route path="/il/:province" element={<ProvincePage />} />
          <Route path="/ara" element={<SearchPage />} />
          <Route path="/kaydedilenler" element={<SavedPage kind="bookmarks" />} />
          <Route path="/begeniler" element={<SavedPage kind="likes" />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/podcast" element={<PodcastPage />} />
          <Route path="/ayarlar" element={<SettingsPage />} />
          <Route path="/giris" element={<LoginPage onOpen={() => setLogin(true)} />} />
          <Route path="/hakkimizda" element={<LegalPage />} />
          <Route path="/kurumsal" element={<LegalPage />} />
          <Route path="/gizlilik" element={<LegalPage />} />
          <Route path="/kvkk" element={<LegalPage />} />
          <Route path="/kullanim-sartlari" element={<LegalPage />} />
          <Route path="/cerez-politikasi" element={<LegalPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      <Footer />
      <ScrollToTop />
      <AssistantOrb onClick={() => setAssistant(true)} />
      <StoryHost />
      {assistant && <AssistantPanel open onClose={() => setAssistant(false)} />}
      <LoginModal open={login} onClose={() => setLogin(false)} />
      <MobileTabBar />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </StoreProvider>
    </QueryClientProvider>
  )
}
