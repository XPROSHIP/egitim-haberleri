import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StoreProvider, useStore } from './lib/store'
import { TopBar } from './components/TopBar'
import { SideDrawer } from './components/SideDrawer'
import { AssistantOrb, CookieBanner, LoginModal } from './components/Overlays'
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
import { LegalPage, LoginPage, NotFoundPage } from './pages/LegalPages'
import { bus, EVENTS } from './lib/bus'
import { completeSignIn, restoreSession } from './lib/auth'

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

/** Google'dan dönüşte `?code=` ile oturum açar, ardından adresi temizler. */
function AuthBootstrap() {
  const { setUser } = useStore()
  const [params] = useSearchParams()
  const code = params.get('code')

  useEffect(() => {
    let alive = true
    const run = async () => {
      if (code) {
        const session = await completeSignIn(code)
        // Adres çubuğu her durumda temizlenir: yenilemede aynı kod yeniden denenmesin
        // ve asıl hata "doğrulayıcı bulunamadı" ile örtülmesin.
        if (alive) window.history.replaceState({}, '', window.location.pathname)
        if (alive && session) {
          setUser(session.user)
          return
        }
        // Başarısız dönüş: kullanıcı sebebi görsün diye giriş penceresini aç.
        if (alive) bus.emit(EVENTS.openLogin)
      }
      const existing = await restoreSession()
      if (alive && existing) setUser(existing.user)
    }
    void run()
    return () => {
      alive = false
    }
  }, [code, setUser])

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

      <div className="flex-1">
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
          <Route path="/ayarlar" element={<SettingsPage />} />
          <Route path="/giris" element={<LoginPage onOpen={() => setLogin(true)} />} />
          <Route path="/hakkimizda" element={<LegalPage />} />
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
      <CookieBanner />
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
