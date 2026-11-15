import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Check,
  Eye,
  FileText,
  Heart,
  Image as ImageIcon,
  LayoutGrid,
  Lock,
  LogOut,
  MessageSquare,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Table,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { categories, getCategory } from '../data/categories'

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const ADMIN_LOCK_KEY = 'eh_admin_lock_until'
const ADMIN_TOKEN_KEY = 'eh_admin_token'
const ADMIN_LOCK_MS = 60_000

type TabKind = 'news' | 'columns' | 'comments' | 'subscribers'
type ViewMode = 'table' | 'cards'

interface AdminNewsRow {
  id: string
  slug: string
  title: string
  category: string
  publishedAt: string
  views: number
  likes: number
  featured: boolean
  status: 'published' | 'draft' | string
  sourceName: string
  sourceUrl: string
  sourceImage: string
}

interface AdminNewsFull extends AdminNewsRow {
  excerpt: string
  body: string[]
  tags: string[]
  province: string
}

interface AdminColumnRow {
  id: string
  slug: string
  title: string
  authorName: string
  authorImage: string
  authorTitle: string
  sourceName: string
  publishedAt: string
  views: number
  likes: number
}

interface AdminColumnFull extends AdminColumnRow {
  sourceUrl: string
  excerpt: string
  body: string[]
  tags: string[]
}

interface AdminCommentRow {
  id: string
  articleId: string
  articleTitle: string
  articleSlug: string
  userId: string
  authorName: string
  body: string
  parentId: string | null
  likes: number
  createdAt: string
}

interface AdminSubscriberRow {
  id: string
  email: string
  name: string
  avatar: string
  provider: string
  providers: string[]
  confirmed: boolean
  createdAt: string
  lastSignInAt: string
}

interface AdminStats {
  newsTotal: number
  newsPublished: number
  newsDraft: number
  columnsTotal: number
  commentsTotal?: number
  visitCount?: number
}

function getStoredLockUntil(): number {
  try {
    const raw = localStorage.getItem(ADMIN_LOCK_KEY)
    const n = raw ? Number(raw) : 0
    return Number.isFinite(n) && n > Date.now() ? n : 0
  } catch {
    return 0
  }
}

function getStoredToken(): string {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

function resolveImageUrl(src?: string | null): string {
  if (!src) return ''
  if (src.startsWith('/img/')) return `${BASE}${src}`
  return src
}

function formatShortDate(iso?: string): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return iso.slice(0, 10)
  }
}

function toDatetimeLocalValue(iso?: string): string {
  const d = iso ? new Date(iso) : new Date()
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function MinimalImagePlaceholder({ label = 'Kapak Görseli Yok' }: { label?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-surface-2 text-ink-3">
      <svg viewBox="0 0 64 48" className="h-9 w-12 opacity-60" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="60" height="44" rx="6" stroke="currentColor" strokeWidth="2" />
        <circle cx="20" cy="17" r="4.5" stroke="currentColor" strokeWidth="2" />
        <path d="M8 38L23 23L34 33L43 25L56 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[11px] font-medium">{label}</span>
    </div>
  )
}

function CoverPreview({ src }: { src?: string }) {
  const [broken, setBroken] = useState(false)
  useEffect(() => {
    setBroken(false)
  }, [src])

  const resolved = resolveImageUrl(src)
  if (!resolved || broken) {
    return <MinimalImagePlaceholder />
  }
  return (
    <img
      src={resolved}
      alt="Kapak önizleme"
      onError={() => setBroken(true)}
      className="h-full w-full object-cover"
    />
  )
}

export function AdminPage() {
  const queryClient = useQueryClient()

  // Kilit / Oturum Durumu
  const [token, setToken] = useState<string>(() => getStoredToken())
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [lockUntil, setLockUntil] = useState<number>(() => getStoredLockUntil())
  const [nowMs, setNowMs] = useState(() => Date.now())

  const remainingSec = lockUntil > nowMs ? Math.ceil((lockUntil - nowMs) / 1000) : 0
  const isLockedOut = remainingSec > 0

  useEffect(() => {
    if (!lockUntil) return
    const id = window.setInterval(() => {
      const now = Date.now()
      setNowMs(now)
      if (now >= lockUntil) {
        setLockUntil(0)
        try {
          localStorage.removeItem(ADMIN_LOCK_KEY)
        } catch {}
      }
    }, 500)
    return () => window.clearInterval(id)
  }, [lockUntil])

  // Panel Durumu
  const [tab, setTab] = useState<TabKind>('news')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'err' } | null>(null)

  // Filtreler
  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [featuredOnly, setFeaturedOnly] = useState(false)

  // Listeler
  const [newsItems, setNewsItems] = useState<AdminNewsRow[]>([])
  const [newsTotal, setNewsTotal] = useState(0)
  const [colItems, setColItems] = useState<AdminColumnRow[]>([])
  const [colTotal, setColTotal] = useState(0)
  const [commentItems, setCommentItems] = useState<AdminCommentRow[]>([])
  const [commentTotal, setCommentTotal] = useState(0)
  const [subItems, setSubItems] = useState<AdminSubscriberRow[]>([])
  const [subTotal, setSubTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkCategory, setBulkCategory] = useState('gundem')

  // Yorum Düzenleme Modalı
  const [editingComment, setEditingComment] = useState<AdminCommentRow | null>(null)
  const [commentAuthor, setCommentAuthor] = useState('')
  const [commentBody, setCommentBody] = useState('')
  const [commentSaving, setCommentSaving] = useState(false)

  // Modal (Ekle / Düzenle)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalKind, setModalKind] = useState<TabKind>('news')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImg, setUploadingImg] = useState(false)

  // Haber / Köşe Yazısı Form Alanları
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState('gundem')
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published')
  const [formFeatured, setFormFeatured] = useState(false)
  const [formDate, setFormDate] = useState(() => toDatetimeLocalValue())
  const [formSourceName, setFormSourceName] = useState('')
  const [formSourceUrl, setFormSourceUrl] = useState('')
  const [formImage, setFormImage] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formExcerpt, setFormExcerpt] = useState('')
  const [formBody, setFormBody] = useState('')
  const [formAuthorName, setFormAuthorName] = useState('')
  const [formAuthorTitle, setFormAuthorTitle] = useState('')

  const showToast = useCallback((msg: string, kind: 'ok' | 'err' = 'ok') => {
    setToast({ msg, kind })
    window.setTimeout(() => setToast((cur) => (cur?.msg === msg ? null : cur)), 3200)
  }, [])

  const logout = useCallback(() => {
    setToken('')
    try {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY)
    } catch {}
  }, [])

  const apiFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers || {})
      if (token) headers.set('x-admin-token', token)
      const res = await fetch(`${BASE}${path}`, { ...init, headers })
      if (res.status === 401 && !path.includes('/login')) {
        logout()
        throw new Error('Oturum süresi doldu, lütfen yeniden giriş yapın.')
      }
      return res
    },
    [token, logout],
  )

  const loadData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setSelectedIds([])
    try {
      const statusRes = await apiFetch('/api/admin/status')
      if (statusRes.ok) setStats(await statusRes.json())

      if (tab === 'news') {
        const params = new URLSearchParams({ limit: '150' })
        if (q.trim()) params.set('q', q.trim())
        if (catFilter) params.set('category', catFilter)
        if (statusFilter) params.set('status', statusFilter)
        if (featuredOnly) params.set('featured', '1')
        const res = await apiFetch(`/api/admin/news?${params}`)
        const data = await res.json()
        setNewsItems(data.items || [])
        setNewsTotal(data.total || 0)
      } else if (tab === 'columns') {
        const params = new URLSearchParams({ limit: '150' })
        if (q.trim()) params.set('q', q.trim())
        const res = await apiFetch(`/api/admin/columns?${params}`)
        const data = await res.json()
        setColItems(data.items || [])
        setColTotal(data.total || 0)
      } else if (tab === 'comments') {
        const params = new URLSearchParams({ limit: '150' })
        if (q.trim()) params.set('q', q.trim())
        const res = await apiFetch(`/api/admin/comments?${params}`)
        const data = await res.json()
        setCommentItems(data.items || [])
        setCommentTotal(data.total || 0)
      } else {
        const params = new URLSearchParams({ perPage: '200' })
        if (q.trim()) params.set('q', q.trim())
        const res = await apiFetch(`/api/admin/subscribers?${params}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Aboneler alınamadı')
        setSubItems(data.items || [])
        setSubTotal(data.total || 0)
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Veriler alınamadı', 'err')
    } finally {
      setLoading(false)
    }
  }, [token, tab, q, catFilter, statusFilter, featuredOnly, apiFetch, showToast])

  useEffect(() => {
    if (token) void loadData()
  }, [token, loadData])

  const loadMore = async (showAll = false) => {
    if (!token || loadingMore) return
    setLoadingMore(true)
    try {
      const limit = showAll ? '5000' : '150'
      if (tab === 'news') {
        const params = new URLSearchParams({ limit, offset: showAll ? '0' : String(newsItems.length) })
        if (q.trim()) params.set('q', q.trim())
        if (catFilter) params.set('category', catFilter)
        if (statusFilter) params.set('status', statusFilter)
        if (featuredOnly) params.set('featured', '1')
        const data = await apiFetch(`/api/admin/news?${params}`).then((r) => r.json())
        const incoming: AdminNewsRow[] = data.items || []
        setNewsItems((prev) => (showAll ? incoming : [...prev, ...incoming.filter((x) => !prev.some((p) => p.id === x.id))]))
        setNewsTotal(data.total || 0)
      } else if (tab === 'columns') {
        const params = new URLSearchParams({ limit, offset: showAll ? '0' : String(colItems.length) })
        if (q.trim()) params.set('q', q.trim())
        const data = await apiFetch(`/api/admin/columns?${params}`).then((r) => r.json())
        const incoming: AdminColumnRow[] = data.items || []
        setColItems((prev) => (showAll ? incoming : [...prev, ...incoming.filter((x) => !prev.some((p) => p.id === x.id))]))
        setColTotal(data.total || 0)
      } else if (tab === 'comments') {
        const params = new URLSearchParams({ limit, offset: showAll ? '0' : String(commentItems.length) })
        if (q.trim()) params.set('q', q.trim())
        const data = await apiFetch(`/api/admin/comments?${params}`).then((r) => r.json())
        const incoming: AdminCommentRow[] = data.items || []
        setCommentItems((prev) => (showAll ? incoming : [...prev, ...incoming.filter((x) => !prev.some((p) => p.id === x.id))]))
        setCommentTotal(data.total || 0)
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Devamı yüklenemedi', 'err')
    } finally {
      setLoadingMore(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLockedOut || authBusy) return
    const trimmed = password.trim()
    if (!trimmed) {
      setAuthError('Lütfen şifreyi girin.')
      return
    }
    setAuthBusy(true)
    setAuthError('')
    try {
      const res = await fetch(`${BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: trimmed }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.token) {
        setToken(data.token)
        setPassword('')
        try {
          sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token)
          localStorage.removeItem(ADMIN_LOCK_KEY)
        } catch {}
        return
      }
      const sec = Number(data.retryAfterSec) || 60
      const until = Date.now() + Math.max(sec * 1000, ADMIN_LOCK_MS)
      setLockUntil(until)
      setNowMs(Date.now())
      setPassword('')
      try {
        localStorage.setItem(ADMIN_LOCK_KEY, String(until))
      } catch {}
      setAuthError(res.status === 429 ? `Çok fazla hatalı deneme. ${sec} saniye bekleyin.` : 'Hatalı şifre! Güvenlik için 60 saniye bekleyin.')
    } catch {
      setAuthError('Sunucuya bağlanılamadı.')
    } finally {
      setAuthBusy(false)
    }
  }

  const openCreateModal = (kind: TabKind) => {
    setModalKind(kind)
    setEditingId(null)
    setFormTitle('')
    setFormCategory('gundem')
    setFormStatus('published')
    setFormFeatured(false)
    setFormDate(toDatetimeLocalValue())
    setFormSourceName('')
    setFormSourceUrl('')
    setFormImage('')
    setFormTags('')
    setFormExcerpt('')
    setFormBody('')
    setFormAuthorName('')
    setFormAuthorTitle('')
    setModalOpen(true)
  }

  const openEditNews = async (id: string) => {
    try {
      const res = await apiFetch(`/api/admin/news/${encodeURIComponent(id)}`)
      if (!res.ok) throw new Error('Haber detayı alınamadı')
      const item = (await res.json()) as AdminNewsFull
      setModalKind('news')
      setEditingId(item.id)
      setFormTitle(item.title || '')
      setFormCategory(item.category || 'gundem')
      setFormStatus(item.status === 'draft' ? 'draft' : 'published')
      setFormFeatured(Boolean(item.featured))
      setFormDate(toDatetimeLocalValue(item.publishedAt))
      setFormSourceName(item.sourceName || '')
      setFormSourceUrl(item.sourceUrl || '')
      setFormImage(item.sourceImage || '')
      setFormTags(Array.isArray(item.tags) ? item.tags.join(', ') : '')
      setFormExcerpt(item.excerpt || '')
      setFormBody(Array.isArray(item.body) ? item.body.join('\n\n') : '')
      setModalOpen(true)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Hata oluştu', 'err')
    }
  }

  const openEditColumn = async (id: string) => {
    try {
      const res = await apiFetch(`/api/admin/columns/${encodeURIComponent(id)}`)
      if (!res.ok) throw new Error('Köşe yazısı alınamadı')
      const item = (await res.json()) as AdminColumnFull
      setModalKind('columns')
      setEditingId(item.id)
      setFormTitle(item.title || '')
      setFormAuthorName(item.authorName || '')
      setFormAuthorTitle(item.authorTitle || '')
      setFormImage(item.authorImage || '')
      setFormSourceName(item.sourceName || '')
      setFormSourceUrl(item.sourceUrl || '')
      setFormDate(toDatetimeLocalValue(item.publishedAt))
      setFormTags(Array.isArray(item.tags) ? item.tags.join(', ') : '')
      setFormExcerpt(item.excerpt || '')
      setFormBody(Array.isArray(item.body) ? item.body.join('\n\n') : '')
      setModalOpen(true)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Hata oluştu', 'err')
    }
  }

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2_000_000) {
      showToast('Görsel 2 MB sınırını aşamaz.', 'err')
      return
    }
    setUploadingImg(true)
    try {
      const buf = await file.arrayBuffer()
      const res = await apiFetch('/api/admin/image', {
        method: 'POST',
        headers: { 'content-type': file.type || 'image/jpeg' },
        body: buf,
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Yükleme başarısız')
      setFormImage(data.url)
      showToast('Görsel yüklendi.')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Görsel yüklenemedi', 'err')
    } finally {
      setUploadingImg(false)
      e.target.value = ''
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      showToast('Başlık zorunludur.', 'err')
      return
    }
    setSaving(true)
    try {
      const isoDate = formDate ? new Date(formDate).toISOString() : new Date().toISOString()
      if (modalKind === 'news') {
        const payload = {
          title: formTitle.trim(),
          category: formCategory || 'gundem',
          status: formStatus,
          featured: formFeatured,
          publishedAt: isoDate,
          sourceName: formSourceName.trim(),
          sourceUrl: formSourceUrl.trim(),
          sourceImage: formImage.trim(),
          tags: formTags,
          excerpt: formExcerpt.trim(),
          body: formBody,
        }
        const path = editingId ? `/api/admin/news/${encodeURIComponent(editingId)}` : '/api/admin/news'
        const method = editingId ? 'PUT' : 'POST'
        const res = await apiFetch(path, {
          method,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Kaydedilemedi')
        showToast(editingId ? 'Haber güncellendi ve canlıya alındı.' : 'Yeni haber yayınlandı.')
      } else {
        const payload = {
          title: formTitle.trim(),
          authorName: formAuthorName.trim() || 'Editör',
          authorTitle: formAuthorTitle.trim(),
          authorImage: formImage.trim(),
          sourceName: formSourceName.trim() || 'Eğitim Haberleri',
          sourceUrl: formSourceUrl.trim(),
          publishedAt: isoDate,
          tags: formTags,
          excerpt: formExcerpt.trim(),
          body: formBody,
        }
        const path = editingId ? `/api/admin/columns/${encodeURIComponent(editingId)}` : '/api/admin/columns'
        const method = editingId ? 'PUT' : 'POST'
        const res = await apiFetch(path, {
          method,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Kaydedilemedi')
        showToast(editingId ? 'Köşe yazısı güncellendi.' : 'Yeni köşe yazısı eklendi.')
      }
      setModalOpen(false)
      void queryClient.invalidateQueries()
      await loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Kayıt hatası', 'err')
    } finally {
      setSaving(false)
    }
  }

  const quickToggleNews = async (row: AdminNewsRow, patch: { status?: string; featured?: boolean }) => {
    try {
      const res = await apiFetch(`/api/admin/news/${encodeURIComponent(row.id)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error('İşlem başarısız')
      void queryClient.invalidateQueries()
      await loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Güncellenemedi', 'err')
    }
  }

  const deleteSingle = async (id: string, title: string) => {
    if (!window.confirm(`"${title}" kalıcı olarak silinsin mi?`)) return
    try {
      const path =
        tab === 'news'
          ? `/api/admin/news/${encodeURIComponent(id)}`
          : tab === 'columns'
            ? `/api/admin/columns/${encodeURIComponent(id)}`
            : tab === 'comments'
              ? `/api/admin/comments/${encodeURIComponent(id)}`
              : `/api/admin/subscribers/${encodeURIComponent(id)}`
      const res = await apiFetch(path, { method: 'DELETE' })
      if (!res.ok) throw new Error('Silinemedi')
      showToast('Kayıt silindi.')
      void queryClient.invalidateQueries()
      await loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Silme hatası', 'err')
    }
  }

  const openEditComment = (c: AdminCommentRow) => {
    setEditingComment(c)
    setCommentAuthor(c.authorName)
    setCommentBody(c.body)
  }

  const handleSaveComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingComment) return
    if (!commentBody.trim()) {
      showToast('Yorum metni boş olamaz.', 'err')
      return
    }
    setCommentSaving(true)
    try {
      const res = await apiFetch(`/api/admin/comments/${encodeURIComponent(editingComment.id)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          authorName: commentAuthor.trim() || 'Okur',
          body: commentBody.trim(),
        }),
      })
      if (!res.ok) throw new Error('Yorum güncellenemedi')
      showToast('Yorum güncellendi.')
      setEditingComment(null)
      void queryClient.invalidateQueries()
      await loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Hata', 'err')
    } finally {
      setCommentSaving(false)
    }
  }

  const handleBulk = async (action: string) => {
    if (selectedIds.length === 0) return
    if (action === 'delete' && !window.confirm(`Seçili ${selectedIds.length} kayıt kalıcı olarak silinsin mi?`)) return
    try {
      const path =
        tab === 'news'
          ? '/api/admin/news/bulk'
          : tab === 'columns'
            ? '/api/admin/columns/bulk'
            : tab === 'comments'
              ? '/api/admin/comments/bulk'
              : '/api/admin/subscribers/bulk'
      const res = await apiFetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, ids: selectedIds, category: bulkCategory }),
      })
      if (!res.ok) throw new Error('Toplu işlem başarısız')
      showToast(`${selectedIds.length} kayıt güncellendi.`)
      void queryClient.invalidateQueries()
      await loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Hata', 'err')
    }
  }

  const handleRefreshGazeteler = async () => {
    try {
      showToast('eGazete önbelleği yenileniyor...')
      const res = await apiFetch('/api/admin/refresh-gazeteler', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error('Yenilenemedi')
      showToast(`eGazete güncellendi (${data.tamSayi} gazete, ${data.dergiler} dergi).`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Hata', 'err')
    }
  }

  const activeListIds = useMemo(() => {
    if (tab === 'news') return newsItems.map((n) => n.id)
    if (tab === 'columns') return colItems.map((c) => c.id)
    if (tab === 'comments') return commentItems.map((c) => c.id)
    return subItems.map((s) => s.id)
  }, [tab, newsItems, colItems, commentItems, subItems])
  const allSelected = activeListIds.length > 0 && selectedIds.length === activeListIds.length

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : activeListIds)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  // Şifre Giriş Ekranı
  if (!token) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-[1280px] items-center justify-center px-4 py-12">
        <div className="w-full max-w-[380px] rounded-2xl border border-hairline bg-surface p-6 shadow-xl sm:p-8">
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Lock className="size-6" />
            </div>
            <h1 className="text-[18px] font-bold text-ink">Yönetici Paneli</h1>
            <p className="mt-1 text-[13px] text-ink-3">Devam etmek için yönetici şifresini girin.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLockedOut || authBusy}
              placeholder="••••"
              className="w-full rounded-xl border border-hairline bg-bg px-4 py-3 text-center text-[18px] font-semibold tracking-[0.25em] text-ink outline-none transition focus:border-accent disabled:opacity-50"
            />

            {authError && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-[12px] font-medium text-red-500">
                {authError}
              </p>
            )}

            {isLockedOut && (
              <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-center text-[12px] font-semibold text-amber-500">
                {remainingSec} saniye sonra tekrar deneyin
              </p>
            )}

            <button
              type="submit"
              disabled={isLockedOut || authBusy || !password.trim()}
              className="w-full rounded-xl bg-accent py-3 text-[14px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {authBusy ? 'Doğrulanıyor...' : isLockedOut ? `Kilitli (${remainingSec} sn)` : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-[1440px] px-3 py-5 sm:px-6 sm:py-7">
      {toast && (
        <div
          className={`fixed right-4 top-20 z-50 rounded-xl border px-4 py-2.5 text-[13px] font-medium shadow-lg ${
            toast.kind === 'err'
              ? 'border-red-500/30 bg-red-500/15 text-red-400 backdrop-blur'
              : 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400 backdrop-blur'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Üst Başlık ve Araç Çubuğu */}
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-hairline bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[19px] font-bold text-ink">Yönetim Paneli</h1>
            {stats && (
              <div className="hidden flex-wrap items-center gap-1.5 sm:flex">
                <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-ink-2">
                  {stats.newsPublished} Yayında
                </span>
                <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-ink-3">
                  {stats.newsDraft} Taslak
                </span>
                <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-ink-2">
                  {stats.columnsTotal} Köşe Yazısı
                </span>
                <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-ink-2">
                  {stats.commentsTotal ?? 0} Yorum
                </span>
                {typeof stats.visitCount === 'number' && stats.visitCount > 0 && (
                  <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-accent">
                    Sayaç: {String(stats.visitCount).padStart(5, '0')}
                  </span>
                )}
              </div>
            )}
          </div>
          <p className="mt-0.5 text-[12px] text-ink-3">
            Değişiklikler anında D1 veritabanına yazılır ve her iki sitede yayınlanır.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(tab === 'news' || tab === 'columns') && (
            <button
              type="button"
              onClick={() => openCreateModal(tab)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
            >
              <Plus className="size-4" />
              {tab === 'news' ? 'Yeni Haber Ekle' : 'Yeni Köşe Yazısı'}
            </button>
          )}
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-bg px-3 py-2 text-[12.5px] font-medium text-ink-2 hover:text-ink"
            title="Listeyi yenile"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
          <button
            type="button"
            onClick={() => void handleRefreshGazeteler()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-bg px-3 py-2 text-[12.5px] font-medium text-ink-2 hover:text-ink"
          >
            <Newspaper className="size-3.5" />
            eGazete Yenile
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-bg px-3 py-2 text-[12.5px] font-medium text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="size-3.5" />
            Çıkış
          </button>
        </div>
      </div>

      {/* Sekmeler + Filtreler + Görünüm Modu */}
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-hairline bg-surface p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex flex-wrap rounded-xl border border-hairline bg-bg p-1">
            <button
              type="button"
              onClick={() => setTab('news')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition ${
                tab === 'news' ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink'
              }`}
            >
              <Newspaper className="size-3.5" />
              Haberler ({newsTotal || stats?.newsTotal || 0})
            </button>
            <button
              type="button"
              onClick={() => setTab('columns')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition ${
                tab === 'columns' ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink'
              }`}
            >
              <FileText className="size-3.5" />
              Köşe Yazıları ({colTotal || stats?.columnsTotal || 0})
            </button>
            <button
              type="button"
              onClick={() => setTab('comments')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition ${
                tab === 'comments' ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink'
              }`}
            >
              <MessageSquare className="size-3.5" />
              Yorumlar ({commentTotal || stats?.commentsTotal || 0})
            </button>
            <button
              type="button"
              onClick={() => setTab('subscribers')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition ${
                tab === 'subscribers' ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink'
              }`}
            >
              <Users className="size-3.5" />
              Aboneler ({subTotal})
            </button>
          </div>

          <div className="inline-flex rounded-xl border border-hairline bg-bg p-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
                viewMode === 'table' ? 'bg-surface-2 text-ink' : 'text-ink-3 hover:text-ink'
              }`}
              title="Kompakt Tablo (Excel görünümü)"
            >
              <Table className="size-3.5" />
              Tablo
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
                viewMode === 'cards' ? 'bg-surface-2 text-ink' : 'text-ink-3 hover:text-ink'
              }`}
              title="Kart Görünümü"
            >
              <LayoutGrid className="size-3.5" />
              Kart
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={
                tab === 'news'
                  ? 'Başlık veya kaynak ara...'
                  : tab === 'columns'
                    ? 'Başlık veya yazar ara...'
                    : tab === 'comments'
                      ? 'Yorum, yazar veya haber başlığı ara...'
                      : 'Ad, e-posta veya sağlayıcı ara...'
              }
              className="w-full rounded-xl border border-hairline bg-bg py-2 pl-9 pr-3 text-[13px] text-ink outline-none focus:border-accent"
            />
          </div>

          {tab === 'news' && (
            <>
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="rounded-xl border border-hairline bg-bg px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
              >
                <option value="">Tüm Kategoriler</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-hairline bg-bg px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
              >
                <option value="">Tüm Durumlar</option>
                <option value="published">Yayında</option>
                <option value="draft">Taslak</option>
              </select>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-hairline bg-bg px-3 py-2 text-[13px] text-ink-2">
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(e) => setFeaturedOnly(e.target.checked)}
                  className="accent-accent"
                />
                Yalnızca Manşetler
              </label>
            </>
          )}
        </div>
      </div>

      {/* Toplu İşlem Çubuğu */}
      {selectedIds.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/40 bg-accent/10 px-3.5 py-2.5 text-[12.5px]">
          <span className="font-semibold text-ink">{selectedIds.length} kayıt seçildi</span>
          <div className="flex flex-wrap items-center gap-2">
            {tab === 'news' && (
              <>
                <button
                  type="button"
                  onClick={() => void handleBulk('publish')}
                  className="rounded-lg bg-surface px-2.5 py-1 font-medium text-ink hover:bg-surface-2"
                >
                  Yayına Al
                </button>
                <button
                  type="button"
                  onClick={() => void handleBulk('draft')}
                  className="rounded-lg bg-surface px-2.5 py-1 font-medium text-ink hover:bg-surface-2"
                >
                  Taslağa Çek
                </button>
                <button
                  type="button"
                  onClick={() => void handleBulk('feature')}
                  className="rounded-lg bg-surface px-2.5 py-1 font-medium text-ink hover:bg-surface-2"
                >
                  Manşet Yap
                </button>
                <div className="inline-flex items-center gap-1">
                  <select
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    className="rounded-lg border border-hairline bg-surface px-2 py-1 text-[12px] text-ink"
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void handleBulk('category')}
                    className="rounded-lg bg-surface px-2 py-1 font-medium text-ink hover:bg-surface-2"
                  >
                    Taşı
                  </button>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => void handleBulk('delete')}
              className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1 font-semibold text-white hover:opacity-90"
            >
              <Trash2 className="size-3.5" />
              Seçilileri Sil
            </button>
          </div>
        </div>
      )}

      {/* Liste İçeriği */}
      {loading ? (
        <div className="rounded-2xl border border-hairline bg-surface p-10 text-center text-[13px] text-ink-3">
          Yükleniyor...
        </div>
      ) : tab === 'news' ? (
        newsItems.length === 0 ? (
          <div className="rounded-2xl border border-hairline bg-surface p-10 text-center text-[13px] text-ink-3">
            Eşleşen haber bulunamadı.
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
            <table className="w-full min-w-[780px] border-collapse text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-hairline bg-surface-2/60 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                  <th className="w-9 px-3 py-2.5">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="accent-accent" />
                  </th>
                  <th className="px-3 py-2.5">Başlık</th>
                  <th className="w-36 px-3 py-2.5">Kategori</th>
                  <th className="w-28 px-3 py-2.5">Tarih</th>
                  <th className="w-16 px-2 py-2.5 text-center">Beğeni</th>
                  <th className="w-16 px-2 py-2.5 text-center">Okunma</th>
                  <th className="w-24 px-3 py-2.5">Durum</th>
                  <th className="w-36 px-3 py-2.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {newsItems.map((item) => {
                  const cat = getCategory(item.category)
                  return (
                    <tr key={item.id} className="transition hover:bg-surface-2/40">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="accent-accent"
                        />
                      </td>
                      <td className="max-w-[380px] truncate px-3 py-2 font-medium text-ink" title={item.title}>
                        {item.title}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className="inline-block rounded-md px-2 py-0.5 text-[11px] font-medium"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          {cat.name}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-ink-3">{formatShortDate(item.publishedAt)}</td>
                      <td className="px-2 py-2 text-center text-ink-2">{item.likes}</td>
                      <td className="px-2 py-2 text-center text-ink-2">{item.views}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            item.status === 'published'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {item.status === 'published' ? 'Yayında' : 'Taslak'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => void quickToggleNews(item, { featured: !item.featured })}
                            title={item.featured ? 'Manşetten çıkar' : 'Manşet yap'}
                            className={`rounded-lg p-1.5 transition ${
                              item.featured ? 'text-amber-400 bg-amber-500/10' : 'text-ink-3 hover:text-ink'
                            }`}
                          >
                            <Star className="size-3.5" fill={item.featured ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void quickToggleNews(item, { status: item.status === 'published' ? 'draft' : 'published' })
                            }
                            title={item.status === 'published' ? 'Taslağa çek' : 'Yayınla'}
                            className="rounded-lg p-1.5 text-ink-3 transition hover:text-ink"
                          >
                            <Check className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void openEditNews(item.id)}
                            title="Düzenle"
                            className="rounded-lg p-1.5 text-ink-2 transition hover:bg-surface-2 hover:text-ink"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteSingle(item.id, item.title)}
                            title="Sil"
                            className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-500/10"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {newsItems.map((item) => {
              const cat = getCategory(item.category)
              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-hairline bg-surface p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="accent-accent"
                      />
                      <span
                        className="rounded-md px-2 py-0.5 text-[11px] font-medium"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      >
                        {cat.name}
                      </span>
                    </label>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                        item.status === 'published'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {item.status === 'published' ? 'Yayında' : 'Taslak'}
                    </span>
                  </div>

                  <h3 className="line-clamp-2 text-[14px] font-semibold text-ink">{item.title}</h3>

                  <div className="flex items-center justify-between border-t border-hairline pt-2.5 text-[12px] text-ink-3">
                    <div className="flex items-center gap-3">
                      <span>{formatShortDate(item.publishedAt)}</span>
                      <span className="inline-flex items-center gap-1">
                        <Heart className="size-3" /> {item.likes}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="size-3" /> {item.views}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void quickToggleNews(item, { featured: !item.featured })}
                        className={`rounded-lg p-1.5 ${item.featured ? 'text-amber-400' : 'text-ink-3'}`}
                      >
                        <Star className="size-3.5" fill={item.featured ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void openEditNews(item.id)}
                        className="rounded-lg p-1.5 text-ink-2 hover:bg-surface-2"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteSingle(item.id, item.title)}
                        className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : tab === 'columns' ? (
        colItems.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface p-10 text-center text-[13px] text-ink-3">
          Eşleşen köşe yazısı bulunamadı.
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
          <table className="w-full min-w-[720px] border-collapse text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-hairline bg-surface-2/60 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                <th className="w-9 px-3 py-2.5">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="accent-accent" />
                </th>
                <th className="px-3 py-2.5">Başlık</th>
                <th className="w-40 px-3 py-2.5">Yazar</th>
                <th className="w-28 px-3 py-2.5">Tarih</th>
                <th className="w-16 px-2 py-2.5 text-center">Beğeni</th>
                <th className="w-16 px-2 py-2.5 text-center">Okunma</th>
                <th className="w-24 px-3 py-2.5 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {colItems.map((col) => (
                <tr key={col.id} className="transition hover:bg-surface-2/40">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(col.id)}
                      onChange={() => toggleSelect(col.id)}
                      className="accent-accent"
                    />
                  </td>
                  <td className="max-w-[380px] truncate px-3 py-2 font-medium text-ink" title={col.title}>
                    {col.title}
                  </td>
                  <td className="truncate px-3 py-2 text-ink-2">{col.authorName || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-ink-3">{formatShortDate(col.publishedAt)}</td>
                  <td className="px-2 py-2 text-center text-ink-2">{col.likes}</td>
                  <td className="px-2 py-2 text-center text-ink-2">{col.views}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => void openEditColumn(col.id)}
                        title="Düzenle"
                        className="rounded-lg p-1.5 text-ink-2 transition hover:bg-surface-2 hover:text-ink"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteSingle(col.id, col.title)}
                        title="Sil"
                        className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-500/10"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {colItems.map((col) => (
            <div key={col.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-hairline bg-surface p-3.5">
              <div className="flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-[12px] font-medium text-ink-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(col.id)}
                    onChange={() => toggleSelect(col.id)}
                    className="accent-accent"
                  />
                  {col.authorName || 'Editör'}
                </label>
                <span className="text-[11px] text-ink-3">{formatShortDate(col.publishedAt)}</span>
              </div>

              <h3 className="line-clamp-2 text-[14px] font-semibold text-ink">{col.title}</h3>

              <div className="flex items-center justify-between border-t border-hairline pt-2.5 text-[12px] text-ink-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Heart className="size-3" /> {col.likes}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="size-3" /> {col.views}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void openEditColumn(col.id)}
                    className="rounded-lg p-1.5 text-ink-2 hover:bg-surface-2"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteSingle(col.id, col.title)}
                    className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
      ) : tab === 'comments' ? (
        commentItems.length === 0 ? (
          <div className="rounded-2xl border border-hairline bg-surface p-10 text-center text-[13px] text-ink-3">
            Eşleşen yorum bulunamadı.
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
            <table className="w-full min-w-[760px] border-collapse text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-hairline bg-surface-2/60 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                  <th className="w-9 px-3 py-2.5">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="accent-accent" />
                  </th>
                  <th className="px-3 py-2.5">Yorum</th>
                  <th className="w-36 px-3 py-2.5">Yazar</th>
                  <th className="w-56 px-3 py-2.5">Haber</th>
                  <th className="w-28 px-3 py-2.5">Tarih</th>
                  <th className="w-16 px-2 py-2.5 text-center">Beğeni</th>
                  <th className="w-24 px-3 py-2.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {commentItems.map((c) => (
                  <tr key={c.id} className="transition hover:bg-surface-2/40">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="accent-accent"
                      />
                    </td>
                    <td className="max-w-[340px] truncate px-3 py-2 font-medium text-ink" title={c.body}>
                      {c.body}
                    </td>
                    <td className="truncate px-3 py-2 text-ink-2">{c.authorName || 'Okur'}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-ink-3" title={c.articleTitle}>
                      {c.articleSlug ? (
                        <a href={`/haber/${c.articleSlug}`} target="_blank" rel="noreferrer" className="hover:text-accent hover:underline">
                          {c.articleTitle}
                        </a>
                      ) : (
                        c.articleTitle
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-ink-3">{formatShortDate(c.createdAt)}</td>
                    <td className="px-2 py-2 text-center text-ink-2">{c.likes}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditComment(c)}
                          title="Düzenle"
                          className="rounded-lg p-1.5 text-ink-2 transition hover:bg-surface-2 hover:text-ink"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteSingle(c.id, c.body.slice(0, 40))}
                          title="Sil"
                          className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-500/10"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {commentItems.map((c) => (
              <div key={c.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-hairline bg-surface p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-2 text-[12px] font-medium text-ink-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      className="accent-accent"
                    />
                    {c.authorName || 'Okur'}
                  </label>
                  <span className="text-[11px] text-ink-3">{formatShortDate(c.createdAt)}</span>
                </div>
                <p className="line-clamp-3 text-[13.5px] text-ink">{c.body}</p>
                <p className="truncate text-[11.5px] text-ink-3" title={c.articleTitle}>
                  Haber: {c.articleTitle}
                </p>
                <div className="flex items-center justify-between border-t border-hairline pt-2.5 text-[12px] text-ink-3">
                  <span className="inline-flex items-center gap-1">
                    <Heart className="size-3" /> {c.likes}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditComment(c)}
                      className="rounded-lg p-1.5 text-ink-2 hover:bg-surface-2"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteSingle(c.id, c.body.slice(0, 40))}
                      className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : subItems.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface p-10 text-center text-[13px] text-ink-3">
          Kayıtlı abone bulunamadı.
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
          <table className="w-full min-w-[760px] border-collapse text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-hairline bg-surface-2/60 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                <th className="w-9 px-3 py-2.5">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="accent-accent" />
                </th>
                <th className="px-3 py-2.5">Ad Soyad</th>
                <th className="px-3 py-2.5">E-posta</th>
                <th className="w-28 px-3 py-2.5">Sağlayıcı</th>
                <th className="w-28 px-3 py-2.5">Kayıt</th>
                <th className="w-28 px-3 py-2.5">Son Giriş</th>
                <th className="w-20 px-3 py-2.5 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {subItems.map((u) => (
                <tr key={u.id} className="transition hover:bg-surface-2/40">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(u.id)}
                      onChange={() => toggleSelect(u.id)}
                      className="accent-accent"
                    />
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2 font-medium text-ink">{u.name || '—'}</td>
                  <td className="max-w-[260px] truncate px-3 py-2 text-ink-2">{u.email || '—'}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-2">
                      {u.provider}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-ink-3">{formatShortDate(u.createdAt)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-ink-3">{formatShortDate(u.lastSignInAt)}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => void deleteSingle(u.id, u.email || u.name || u.id)}
                      title="Aboneyi Sil"
                      className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-500/10"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subItems.map((u) => (
            <div key={u.id} className="flex flex-col justify-between gap-2.5 rounded-2xl border border-hairline bg-surface p-3.5">
              <div className="flex items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-[12px] font-medium text-ink-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(u.id)}
                    onChange={() => toggleSelect(u.id)}
                    className="accent-accent"
                  />
                  <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px]">{u.provider}</span>
                </label>
                <span className="text-[11px] text-ink-3">{formatShortDate(u.createdAt)}</span>
              </div>
              <div>
                <h3 className="truncate text-[14px] font-semibold text-ink">{u.name || 'İsimsiz Kullanıcı'}</h3>
                <p className="truncate text-[12.5px] text-ink-2">{u.email || '—'}</p>
              </div>
              <div className="flex items-center justify-between border-t border-hairline pt-2 text-[11.5px] text-ink-3">
                <span>Son giriş: {formatShortDate(u.lastSignInAt)}</span>
                <button
                  type="button"
                  onClick={() => void deleteSingle(u.id, u.email || u.name || u.id)}
                  className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sayfalama / Devamını Listele */}
      {(() => {
        const shown =
          tab === 'news'
            ? newsItems.length
            : tab === 'columns'
              ? colItems.length
              : tab === 'comments'
                ? commentItems.length
                : subItems.length
        const total =
          tab === 'news'
            ? newsTotal
            : tab === 'columns'
              ? colTotal
              : tab === 'comments'
                ? commentTotal
                : subTotal
        if (tab === 'subscribers' || total === 0 || shown >= total) return null
        return (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-surface px-4 py-3 text-[12.5px]">
            <span className="text-ink-3">
              <strong className="text-ink">{shown}</strong> / {total} kayıt listeleniyor
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void loadMore(false)}
                className="rounded-xl border border-hairline bg-bg px-3.5 py-1.5 font-medium text-ink hover:border-accent disabled:opacity-50"
              >
                {loadingMore ? 'Yükleniyor...' : 'Sonraki 150 Yükle'}
              </button>
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void loadMore(true)}
                className="rounded-xl bg-accent px-3.5 py-1.5 font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                Tümünü Listele ({total})
              </button>
            </div>
          </div>
        )
      })()}

      {/* Ekle / Düzenle Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-[780px] overflow-y-auto rounded-2xl border border-hairline bg-surface p-4 shadow-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-hairline pb-3">
              <h2 className="text-[17px] font-bold text-ink">
                {editingId
                  ? modalKind === 'news'
                    ? 'Haberi Düzenle'
                    : 'Köşe Yazısını Düzenle'
                  : modalKind === 'news'
                    ? 'Yeni Haber Ekle'
                    : 'Yeni Köşe Yazısı Ekle'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-ink-2">Başlık *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Haber veya yazı başlığı..."
                  className="w-full rounded-xl border border-hairline bg-bg px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-accent"
                />
              </div>

              {modalKind === 'news' ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-ink-2">Kategori</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full rounded-xl border border-hairline bg-bg px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
                    >
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-ink-2">Yayın Durumu</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value === 'draft' ? 'draft' : 'published')}
                      className="w-full rounded-xl border border-hairline bg-bg px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
                    >
                      <option value="published">Yayında</option>
                      <option value="draft">Taslak (Gizli)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-ink-2">Yayın Tarihi (Opsiyonel)</label>
                    <input
                      type="datetime-local"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full rounded-xl border border-hairline bg-bg px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-ink-2">Yazar Adı (Opsiyonel)</label>
                    <input
                      type="text"
                      value={formAuthorName}
                      onChange={(e) => setFormAuthorName(e.target.value)}
                      placeholder="Örn: Ömer Zen"
                      className="w-full rounded-xl border border-hairline bg-bg px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-ink-2">Yazar Unvanı (Opsiyonel)</label>
                    <input
                      type="text"
                      value={formAuthorTitle}
                      onChange={(e) => setFormAuthorTitle(e.target.value)}
                      placeholder="Eğitim Yazarı"
                      className="w-full rounded-xl border border-hairline bg-bg px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-ink-2">Tarih (Opsiyonel)</label>
                    <input
                      type="datetime-local"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full rounded-xl border border-hairline bg-bg px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
                    />
                  </div>
                </div>
              )}

              {/* Görsel Yükleme & Önizleme */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
                <div className="h-28 overflow-hidden rounded-xl border border-hairline bg-bg">
                  <CoverPreview src={formImage} />
                </div>
                <div className="space-y-2">
                  <label className="block text-[12px] font-semibold text-ink-2">
                    {modalKind === 'news' ? 'Kapak Görseli (Opsiyonel)' : 'Yazar / Yazı Görseli (Opsiyonel)'}
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-hairline bg-bg px-3 py-2 text-[12.5px] font-medium text-ink hover:bg-surface-2">
                      <Upload className="size-3.5" />
                      {uploadingImg ? 'Yükleniyor...' : 'Cihazdan Yükle'}
                      <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                    </label>
                    {formImage && (
                      <button
                        type="button"
                        onClick={() => setFormImage('')}
                        className="rounded-xl border border-hairline bg-bg px-3 py-2 text-[12px] text-red-400 hover:bg-red-500/10"
                      >
                        Görseli Kaldır
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <ImageIcon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" />
                    <input
                      type="text"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      placeholder="veya harici görsel URL'si yapıştırın..."
                      className="w-full rounded-xl border border-hairline bg-bg py-2 pl-8 pr-3 text-[12.5px] text-ink outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-ink-2">Kaynak Adı (Opsiyonel)</label>
                  <input
                    type="text"
                    value={formSourceName}
                    onChange={(e) => setFormSourceName(e.target.value)}
                    placeholder="Örn: MEB / Özel Haber (boş bırakılabilir)"
                    className="w-full rounded-xl border border-hairline bg-bg px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-ink-2">Kaynak Bağlantısı (Opsiyonel)</label>
                  <input
                    type="text"
                    value={formSourceUrl}
                    onChange={(e) => setFormSourceUrl(e.target.value)}
                    placeholder="https://... (boş bırakılabilir)"
                    className="w-full rounded-xl border border-hairline bg-bg px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[12px] font-semibold text-ink-2">Etiketler (Virgülle, opsiyonel)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    placeholder="duyuru, mesem, sınav"
                    className="w-full rounded-xl border border-hairline bg-bg px-3 py-2 text-[13px] text-ink outline-none focus:border-accent"
                  />
                </div>

                {modalKind === 'news' && (
                  <div className="flex items-end">
                    <label className="inline-flex w-full cursor-pointer items-center gap-2 rounded-xl border border-hairline bg-bg px-3.5 py-2 text-[13px] font-medium text-ink">
                      <input
                        type="checkbox"
                        checked={formFeatured}
                        onChange={(e) => setFormFeatured(e.target.checked)}
                        className="accent-accent"
                      />
                      Manşette / Öne Çıkanlarda Göster
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-ink-2">Kısa Özet (Opsiyonel)</label>
                <textarea
                  rows={2}
                  value={formExcerpt}
                  onChange={(e) => setFormExcerpt(e.target.value)}
                  placeholder="Boş bırakırsanız metnin ilk paragrafından otomatik alınır..."
                  className="w-full rounded-xl border border-hairline bg-bg px-3.5 py-2 text-[13px] text-ink outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-ink-2">
                  Tam Metin (Paragraflar boş satırla ayrılır, opsiyonel)
                </label>
                <textarea
                  rows={7}
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Haber veya köşe yazısı metni..."
                  className="w-full rounded-xl border border-hairline bg-bg px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-hairline pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-hairline bg-bg px-4 py-2.5 text-[13px] font-medium text-ink-2 hover:text-ink"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-accent px-5 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : editingId ? 'Değişiklikleri Kaydet' : 'Yayınla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Yorum Düzenleme Modalı */}
      {editingComment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setEditingComment(null)}
        >
          <div
            className="w-full max-w-[520px] rounded-2xl border border-hairline bg-surface p-4 shadow-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-hairline pb-3">
              <h2 className="text-[16px] font-bold text-ink">Yorumu Düzenle</h2>
              <button
                type="button"
                onClick={() => setEditingComment(null)}
                className="rounded-lg p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleSaveComment} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-ink-2">Yazar Adı</label>
                <input
                  type="text"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  className="w-full rounded-xl border border-hairline bg-bg px-3.5 py-2 text-[13px] text-ink outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-ink-2">Yorum Metni *</label>
                <textarea
                  rows={4}
                  required
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  className="w-full rounded-xl border border-hairline bg-bg px-3.5 py-2 text-[13px] text-ink outline-none focus:border-accent"
                />
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-hairline pt-3">
                <button
                  type="button"
                  onClick={() => setEditingComment(null)}
                  className="rounded-xl border border-hairline bg-bg px-4 py-2 text-[13px] font-medium text-ink-2 hover:text-ink"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={commentSaving}
                  className="rounded-xl bg-accent px-5 py-2 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {commentSaving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

