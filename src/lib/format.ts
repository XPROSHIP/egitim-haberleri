import { format, formatDistanceToNowStrict, isToday, isYesterday } from 'date-fns'
import { tr } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'

export type Lang = 'tr' | 'en'

export function formatDate(iso: string, lang: Lang = 'tr'): string {
  const d = new Date(iso)
  return format(d, lang === 'tr' ? 'd MMMM yyyy' : 'MMM d, yyyy', {
    locale: lang === 'tr' ? tr : enUS,
  })
}

export function formatDateTime(iso: string, lang: Lang = 'tr'): string {
  const d = new Date(iso)
  return format(d, lang === 'tr' ? 'd MMM yyyy, HH:mm' : 'MMM d, yyyy, HH:mm', {
    locale: lang === 'tr' ? tr : enUS,
  })
}

export function relativeTime(iso: string, lang: Lang = 'tr'): string {
  const d = new Date(iso)
  const diffSec = Math.round((Date.now() - d.getTime()) / 1000)
  if (diffSec < 60) return lang === 'tr' ? 'az önce' : 'just now'
  if (lang === 'tr') return formatDistanceToNowStrict(d, { addSuffix: true, locale: tr })
  return formatDistanceToNowStrict(d, { addSuffix: true, locale: enUS })
}

export function shortRelative(iso: string, lang: Lang = 'tr'): string {
  const d = new Date(iso)
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return lang === 'tr' ? 'az önce' : 'now'
  if (mins < 60) return lang === 'tr' ? `${mins} dk önce` : `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return lang === 'tr' ? `${hours} sa önce` : `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return lang === 'tr' ? `${days} gün önce` : `${days}d ago`
  return formatDate(iso, lang)
}

export function dayLabel(iso: string, lang: Lang = 'tr'): string {
  const d = new Date(iso)
  if (isToday(d)) return lang === 'tr' ? 'Bugün' : 'Today'
  if (isYesterday(d)) return lang === 'tr' ? 'Dün' : 'Yesterday'
  return formatDate(iso, lang)
}

export function readMinutes(item: { body: string[] }): number {
  const words = item.body.join(' ').split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

export function formatCount(n: number, lang: Lang = 'tr'): string {
  if (lang === 'tr') {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} M`
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.', ',')} B`
    return String(n)
  }
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export function groupByDay<T>(items: T[], getDate: (i: T) => string, lang: Lang = 'tr'): [string, T[]][] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = dayLabel(getDate(item), lang)
    const arr = map.get(key) ?? []
    arr.push(item)
    map.set(key, arr)
  }
  return [...map.entries()]
}
