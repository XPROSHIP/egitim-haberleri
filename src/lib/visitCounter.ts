import { useEffect, useState } from 'react'

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

let cachedCount: number | null = null
let inflight: Promise<number | null> | null = null

function fetchAndIncrementVisit(): Promise<number | null> {
  if (cachedCount !== null) return Promise.resolve(cachedCount)
  if (inflight) return inflight
  if (!API_BASE) return Promise.resolve(null)

  inflight = fetch(`${API_BASE}/api/visit`, { method: 'POST' })
    .then(async (res) => {
      if (!res.ok) return null
      const data = await res.json().catch(() => null)
      const n = Number(data?.count ?? 0)
      if (Number.isFinite(n) && n > 0) {
        cachedCount = n
        return n
      }
      return null
    })
    .catch(() => null)

  return inflight
}

export function formatVisitCount(n: number | null): string {
  if (n === null || !Number.isFinite(n) || n <= 0) return ''
  return String(Math.floor(n)).padStart(5, '0')
}

export function useVisitCount(): number | null {
  const [count, setCount] = useState<number | null>(cachedCount)

  useEffect(() => {
    let active = true
    fetchAndIncrementVisit().then((n) => {
      if (active && n !== null) setCount(n)
    })
    return () => {
      active = false
    }
  }, [])

  return count
}

