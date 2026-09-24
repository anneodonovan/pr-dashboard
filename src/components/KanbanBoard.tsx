import { AnimatePresence } from 'motion/react'
import type { Pr, PrStatus } from '../../server/types'
import { groupIntoStacks } from '../lib/groupIntoStacks'
import { STATUS_DOT, STATUS_GLOW, STATUS_LABEL, STATUS_LANE_BG, STATUS_ORDER } from '../lib/labels'
import { sortPrs, type SortMode } from '../lib/sortPrs'
import { ColumnEmptyState } from './ColumnEmptyState'
import { PrCard } from './PrCard'
import { StackBlock } from './StackBlock'

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
    <div className="flex flex-1 items-stretch gap-3 overflow-x-auto pb-4">
      {columns.map((col) =>
        collapsed.has(col.status) ? (
          <button
            key={col.status}
            onClick={() => onToggleCollapse(col.status)}
            title={`Show ${STATUS_LABEL[col.status].label}`}
            className="flex shrink-0 flex-col items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-1.5 py-3 hover:border-slate-700 light:border-slate-200 light:bg-white/60 light:hover:border-slate-300"
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[col.status]} ${STATUS_GLOW[col.status]}`} />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400 light:text-slate-600 [writing-mode:vertical-rl]">
              {STATUS_LABEL[col.status].label}
            </span>
            <span className="text-xs text-slate-600">{col.prs.length}</span>
          </button>
        ) : (
          <div
            key={col.status}
            className={`flex min-w-[280px] flex-1 flex-col rounded-2xl border p-2.5 ${STATUS_LANE_BG[col.status]}`}
          >
            <button
              onClick={() => onToggleCollapse(col.status)}
              title="Collapse column"
              className="mb-2 flex w-full items-center gap-2 rounded px-1 py-0.5 hover:bg-slate-800/40 light:hover:bg-slate-200/60"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[col.status]} ${STATUS_GLOW[col.status]}`} />
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400 light:text-slate-600">
                {STATUS_LABEL[col.status].label}
              </span>
              <span className="text-xs text-slate-600">{col.prs.length}</span>
            </button>
            <div className="flex flex-col gap-3">
              {col.prs.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  {groupIntoStacks(col.prs).map((group) =>
                    group.length > 1 ? (
                      <StackBlock key={`${group[0].repo}-${group[0].stack!.prNumbers.join(',')}`} prs={group} onSelect={onSelect} isDismissed={isDismissed} />
                    ) : (
                      <PrCard key={`${group[0].repo}-${group[0].number}`} pr={group[0]} onSelect={onSelect} isDismissed={isDismissed} />
                    ),
                  )}
                </AnimatePresence>
              ) : (
                <ColumnEmptyState status={col.status} />
              )}
            </div>
          </div>
        ),
      )}
    </div>
  )
}
