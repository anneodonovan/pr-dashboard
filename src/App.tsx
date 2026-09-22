import { useEffect, useState } from 'react'
import { usePrDashboard } from './api/dashboard'
import { KanbanBoard } from './components/KanbanBoard'
import { PrDetailPanel } from './components/PrDetailPanel'
import { formatRelativeTime } from './lib/formatRelativeTime'
import { useDismissedComments } from './lib/useDismissedComments'
import type { Pr } from '../server/types'

export default function App() {
  const { data, loading, refreshing, refresh } = usePrDashboard()
  const [selected, setSelected] = useState<Pr | null>(null)
  const { dismiss, undismiss, isDismissed, prune } = useDismissedComments()

  useEffect(() => {
    if (!data) return
    const validIds = new Set<string>()
    for (const pr of data.prs) for (const t of pr.unaddressedThreads) validIds.add(t.url)
    prune(validIds)
  }, [data, prune])

  return (
    <div className="min-h-screen w-full px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">PR Dashboard</h1>
          {data && (
            <p className="text-sm text-slate-500">
              {data.viewerLogin && `${data.viewerLogin} · `}
              updated {formatRelativeTime(data.fetchedAt)}
            </p>
          )}
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      {data?.error && (
        <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
          Last refresh failed: {data.error}. Showing the last successful snapshot.
        </div>
      )}

      {loading && !data && <p className="text-slate-500">Loading…</p>}

      {data && data.prs.length === 0 && <p className="text-slate-500">No open PRs found.</p>}

      {data && data.prs.length > 0 && <KanbanBoard prs={data.prs} onSelect={setSelected} isDismissed={isDismissed} />}

      {selected && (
        <PrDetailPanel pr={selected} onClose={() => setSelected(null)} isDismissed={isDismissed} dismiss={dismiss} undismiss={undismiss} />
      )}
    </div>
  )
}
