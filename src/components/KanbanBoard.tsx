import type { Pr } from '../../server/types'
import { STATUS_DOT, STATUS_LABEL, STATUS_ORDER } from '../lib/labels'
import { PrCard } from './PrCard'

export function KanbanBoard({
  prs,
  onSelect,
  isDismissed,
}: {
  prs: Pr[]
  onSelect: (pr: Pr) => void
  isDismissed: (url: string) => boolean
}) {
  const columns = STATUS_ORDER.map((status) => ({
    status,
    prs: prs
      .filter((pr) => pr.status === status)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  })).filter((col) => col.prs.length > 0)

  return (
    <div className="flex items-start gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div key={col.status} className="w-80 shrink-0">
          <div className="mb-2 flex items-center gap-2 px-1">
            <span className={`h-2 w-2 rounded-full ${STATUS_DOT[col.status]}`} />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {STATUS_LABEL[col.status].label}
            </span>
            <span className="text-xs text-slate-600">{col.prs.length}</span>
          </div>
          <div className="flex flex-col gap-3">
            {col.prs.map((pr) => (
              <PrCard key={`${pr.repo}-${pr.number}`} pr={pr} onSelect={onSelect} isDismissed={isDismissed} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
