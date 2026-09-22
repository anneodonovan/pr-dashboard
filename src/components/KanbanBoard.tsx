import type { Pr } from '../../server/types'
import { STATUS_DOT, STATUS_LABEL, STATUS_ORDER } from '../lib/labels'
import { sortPrs, type SortMode } from '../lib/sortPrs'
import { PrCard } from './PrCard'

export function KanbanBoard({
  prs,
  onSelect,
  isDismissed,
  sortMode,
}: {
  prs: Pr[]
  onSelect: (pr: Pr) => void
  isDismissed: (url: string) => boolean
  sortMode: SortMode
}) {
  const columns = STATUS_ORDER.map((status) => ({
    status,
    prs: sortPrs(prs.filter((pr) => pr.status === status), sortMode),
  }))

  return (
    <div className="flex items-start gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div key={col.status} className="min-w-[280px] flex-1">
          <div className="mb-2 flex items-center gap-2 px-1">
            <span className={`h-2 w-2 rounded-full ${STATUS_DOT[col.status]}`} />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {STATUS_LABEL[col.status].label}
            </span>
            <span className="text-xs text-slate-600">{col.prs.length}</span>
          </div>
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
      ))}
    </div>
  )
}
