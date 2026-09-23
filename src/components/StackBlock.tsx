import type { Pr } from '../../server/types'
import { PrCard } from './PrCard'

export function StackBlock({
  prs,
  onSelect,
  isDismissed,
}: {
  prs: Pr[]
  onSelect: (pr: Pr) => void
  isDismissed: (url: string) => boolean
}) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3 light:border-slate-200 light:bg-slate-100/50">
      <div className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        {prs[0].repo.split('/')[1]} stack &middot; {prs.length} PRs
      </div>
      <div className="space-y-2">
        {prs.map((pr, i) => (
          <div key={pr.number} className="relative pl-4">
            {i > 0 && <div className="absolute left-1.5 top-0 h-3 w-px bg-slate-700 light:bg-slate-300" />}
            <div className="absolute left-0 top-4 h-1.5 w-1.5 rounded-full bg-slate-600 light:bg-slate-400" />
            <PrCard pr={pr} onSelect={onSelect} isDismissed={isDismissed} />
          </div>
        ))}
      </div>
    </div>
  )
}
