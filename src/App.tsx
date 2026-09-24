import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { usePrDashboard } from './api/dashboard'
import { CopyLinksButton } from './components/CopyLinksButton'
import { KanbanBoard } from './components/KanbanBoard'
import { PrDetailPanel } from './components/PrDetailPanel'
import { RepoFilter } from './components/RepoFilter'
import { SortToggle } from './components/SortToggle'
import { ThemeToggle } from './components/ThemeToggle'
import { UnaddressedToggle } from './components/UnaddressedToggle'
import { formatRelativeTime } from './lib/formatRelativeTime'
import { useCollapsedColumns } from './lib/useCollapsedColumns'
import { useDismissedComments } from './lib/useDismissedComments'
import { useExcludedRepos } from './lib/useExcludedRepos'
import { useSortMode } from './lib/useSortMode'
import { useTheme } from './lib/useTheme'
import { useUnaddressedOnly } from './lib/useUnaddressedOnly'
import type { Pr } from '../server/types'

export default function App() {
  const { data, loading, refreshing, refresh, justUpdated } = usePrDashboard()
  const [selected, setSelected] = useState<Pr | null>(null)
  const { dismiss, undismiss, isDismissed, prune } = useDismissedComments()
  const { excluded: excludedRepos, toggle: toggleRepo } = useExcludedRepos()
  const { mode: sortMode, setMode: setSortMode } = useSortMode()
  const { collapsed: collapsedColumns, toggle: toggleColumn } = useCollapsedColumns()
  const { theme, toggle: toggleTheme } = useTheme()
  const { enabled: unaddressedOnly, toggle: toggleUnaddressedOnly } = useUnaddressedOnly()

  useEffect(() => {
    if (!data) return
    const validIds = new Set<string>()
    for (const pr of data.prs) for (const t of pr.unaddressedThreads) validIds.add(t.url)
    prune(validIds)
  }, [data, prune])

  const repoCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const pr of data?.prs ?? []) counts.set(pr.repo, (counts.get(pr.repo) ?? 0) + 1)
    return [...counts.entries()].map(([repo, count]) => ({ repo, count })).sort((a, b) => a.repo.localeCompare(b.repo))
  }, [data])

  const visiblePrs = (data?.prs.filter((pr) => !excludedRepos.has(pr.repo)) ?? []).filter(
    (pr) => !unaddressedOnly || pr.unaddressedThreads.some((t) => !isDismissed(t.url)),
  )

  return (
    <div className="flex min-h-screen w-full flex-col px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-lg text-indigo-300 shadow-[0_0_24px_-6px_rgba(99,102,241,0.6)] light:bg-indigo-500/10 light:text-indigo-600">
            ✦
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-100 light:text-slate-900">PR Dashboard</h1>
            {data && (
              <p className="text-sm text-slate-500">
                {data.viewerLogin && `${data.viewerLogin} · `}
                updated {formatRelativeTime(data.fetchedAt)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {justUpdated > 0 && (
              <motion.span
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                className="rounded-full bg-indigo-500/15 px-3 py-1.5 text-xs font-medium text-indigo-300 light:bg-indigo-500/10 light:text-indigo-700"
              >
                ✨ {justUpdated} {justUpdated === 1 ? 'PR' : 'PRs'} updated
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50 light:bg-slate-100 light:text-slate-700 light:hover:bg-slate-200"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      {data?.error && (
        <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-400 light:text-amber-700">
          Last refresh failed: {data.error}. Showing the last successful snapshot.
        </div>
      )}

      {loading && !data && <p className="text-slate-500">Loading…</p>}

      {data && data.prs.length === 0 && <p className="text-slate-500">No open PRs found.</p>}

      {data && data.prs.length > 0 && (
        <div className="flex flex-1 flex-col">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <RepoFilter repos={repoCounts} excluded={excludedRepos} onToggle={toggleRepo} />
              <UnaddressedToggle enabled={unaddressedOnly} onToggle={toggleUnaddressedOnly} />
            </div>
            <div className="flex items-center gap-3">
              <CopyLinksButton prs={visiblePrs} sortMode={sortMode} />
              <SortToggle mode={sortMode} onChange={setSortMode} />
            </div>
          </div>
          {visiblePrs.length > 0 ? (
            <KanbanBoard
              prs={visiblePrs}
              onSelect={setSelected}
              isDismissed={isDismissed}
              sortMode={sortMode}
              collapsed={collapsedColumns}
              onToggleCollapse={toggleColumn}
            />
          ) : (
            <p className="text-slate-500">No PRs match the current filters.</p>
          )}
        </div>
      )}

      {selected && (
        <PrDetailPanel
          pr={selected}
          allPrs={data?.prs ?? []}
          onClose={() => setSelected(null)}
          onSelectPr={setSelected}
          isDismissed={isDismissed}
          dismiss={dismiss}
          undismiss={undismiss}
        />
      )}
    </div>
  )
}
