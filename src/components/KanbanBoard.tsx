import type { Pr, PrStatus } from '../../server/types'
import { STATUS_DOT, STATUS_LABEL, STATUS_ORDER } from '../lib/labels'
import { sortPrs, type SortMode } from '../lib/sortPrs'
import { PrCard } from './PrCard'

export function KanbanBoard({
  prs,
  onSelect,
  isDismissed,
  sortMode,
  collapsed,
  onToggleCollapse,
}: {
  prs: Pr[]
  onSelect: (pr: Pr) => void
  isDismissed: (url: string) => boolean
  sortMode: SortMode
  collapsed: Set<PrStatus>
  onToggleCollapse: (status: PrStatus) => void
}) {
  const columns = STATUS_ORDER.map((status) => ({
    status,
    prs: sortPrs(prs.filter((pr) => pr.status === status), sortMode),
  }))

  return (
    <div className="flex items-start gap-3 overflow-x-auto pb-4">
      {columns.map((col) =>
        collapsed.has(col.status) ? (
          <button
            key={col.status}
            onClick={() => onToggleCollapse(col.status)}
            title={`Show ${STATUS_LABEL[col.status].label}`}
            className="flex shrink-0 flex-col items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-1.5 py-3 hover:border-slate-700"
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[col.status]}`} />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400 [writing-mode:vertical-rl]">
              {STATUS_LABEL[col.status].label}
            </span>
            <span className="text-xs text-slate-600">{col.prs.length}</span>
          </button>
        ) : (
          <div key={col.status} className="min-w-[280px] flex-1">
            <button
              onClick={() => onToggleCollapse(col.status)}
              title="Collapse column"
              className="mb-2 flex w-full items-center gap-2 rounded px-1 py-0.5 hover:bg-slate-800/40"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[col.status]}`} />
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {STATUS_LABEL[col.status].label}
              </span>
              <span className="text-xs text-slate-600">{col.prs.length}</span>
            </button>
            <div className="flex flex-col gap-3">
              {col.prs.length > 0 ? (
                col.prs.map((pr) => (
                  <PrCard key={`${pr.repo}-${pr.number}`} pr={pr} onSelect={onSelect} isDismissed={isDismissed} />
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-800 p-4 text-center text-xs text-slate-600">
                  No PRs
                </div>
              )}
            </div>
          </div>
        ),
      )}
    </div>
  )
}
