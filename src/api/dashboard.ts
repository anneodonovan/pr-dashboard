import { useCallback, useEffect, useRef, useState } from 'react'
import type { DashboardData } from '../../server/types'

const POLL_INTERVAL_MS = 60_000

export function usePrDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const load = useCallback(async (method: 'GET' | 'POST') => {
    if (method === 'POST') setRefreshing(true)
    try {
      const res = await fetch('/api/prs', { method })
      const json = (await res.json()) as DashboardData
      if (mounted.current) setData(json)
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

  return { data, loading, refreshing, refresh }
}
