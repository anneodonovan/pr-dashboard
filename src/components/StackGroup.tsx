import type { Pr, PrStack } from '../../server/types'
import { PrCard } from './PrCard'

export function StackGroup({ stack, onSelect }: { stack: PrStack; onSelect?: (pr: Pr) => void }) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
      <div className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        {stack.repo.split('/')[1]} stack &middot; {stack.prs.length} PRs
      </div>
      <div className="space-y-2">
        {stack.prs.map((pr, i) => (
          <div key={pr.number} className="relative pl-4">
            {i > 0 && <div className="absolute left-1.5 top-0 h-3 w-px bg-slate-700" />}
            <div className="absolute left-0 top-4 h-1.5 w-1.5 rounded-full bg-slate-600" />
            <PrCard pr={pr} onSelect={onSelect} />
          </div>
        ))}
      </div>
    </div>
  )
}
