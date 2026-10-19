/** Basit uygulama içi olay veriyolu (modüller arası bağımlılık kurmadan). */
type Handler = (payload?: string) => void
const map = new Map<string, Set<Handler>>()

export const bus = {
  on(event: string, fn: Handler) {
    const set = map.get(event) ?? new Set<Handler>()
    set.add(fn)
    map.set(event, set)
    return () => {
      set.delete(fn)
    }
  },
  emit(event: string, payload?: string) {
    map.get(event)?.forEach((fn) => fn(payload))
  },
}

export const EVENTS = {
  openLogin: 'eh:open-login',
  openAssistant: 'eh:open-assistant',
  /** payload: kategori slug'ı. Verilmezse haberi olan ilk kategori açılır. */
  openStories: 'eh:open-stories',
} as const
