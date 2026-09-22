import type { Plugin } from 'vite'
import { fetchDashboard } from './fetchDashboard'
import type { DashboardData } from './types'

const REFRESH_INTERVAL_MS = 60_000

export function prDashboardPlugin(): Plugin {
  let cache: DashboardData | null = null
  let refreshing = false

  async function refresh() {
    if (refreshing) return
    refreshing = true
    try {
      cache = await fetchDashboard()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (cache) {
        cache = { ...cache, error: message }
      } else {
        cache = { viewerLogin: '', fetchedAt: new Date().toISOString(), prs: [], error: message }
      }
      console.error('[pr-dashboard] refresh failed:', message)
    } finally {
      refreshing = false
    }
  }

  return {
    name: 'pr-dashboard-api',
    configureServer(server) {
      refresh()
      const interval = setInterval(refresh, REFRESH_INTERVAL_MS)
      server.httpServer?.once('close', () => clearInterval(interval))

      server.middlewares.use('/api/prs', async (req, res) => {
        if (req.method === 'POST') {
          await refresh()
        }
        res.setHeader('Content-Type', 'application/json')
        const body: DashboardData = cache ?? {
          viewerLogin: '',
          fetchedAt: new Date().toISOString(),
          prs: [],
          error: 'Still loading initial data…',
        }
        res.end(JSON.stringify(body))
      })
    },
  }
}
