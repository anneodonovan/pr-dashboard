import { useCallback, useEffect, useRef, useState } from 'react'
import type { DashboardData } from '../../server/types'

const POLL_INTERVAL_MS = 60_000
const UPDATED_FLASH_MS = 4_000

function prKey(repo: string, number: number): string {
  return `${repo}#${number}`
}

export function usePrDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [justUpdated, setJustUpdated] = useState(0)
  const mounted = useRef(true)
  const prevUpdatedAtByKey = useRef<Map<string, string> | null>(null)
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (flashTimeout.current) clearTimeout(flashTimeout.current)
    }
  }, [])

  const load = useCallback(async (method: 'GET' | 'POST') => {
    if (method === 'POST') setRefreshing(true)
    try {
      const res = await fetch('/api/prs', { method })
      const json = (await res.json()) as DashboardData
      if (!mounted.current) return

      const nextByKey = new Map(json.prs.map((pr) => [prKey(pr.repo, pr.number), pr.updatedAt]))
      if (prevUpdatedAtByKey.current) {
        const prevByKey = prevUpdatedAtByKey.current
        let changed = 0
        for (const [key, updatedAt] of nextByKey) {
          if (prevByKey.get(key) !== updatedAt) changed++
        }
        if (changed > 0) {
          setJustUpdated(changed)
          if (flashTimeout.current) clearTimeout(flashTimeout.current)
          flashTimeout.current = setTimeout(() => {
            if (mounted.current) setJustUpdated(0)
          }, UPDATED_FLASH_MS)
        }
      }
      prevUpdatedAtByKey.current = nextByKey

      setData(json)
    } finally {
      if (mounted.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    load('GET')
    const interval = setInterval(() => load('GET'), POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [load])

  const refresh = useCallback(() => load('POST'), [load])

  return { data, loading, refreshing, refresh, justUpdated }
}
