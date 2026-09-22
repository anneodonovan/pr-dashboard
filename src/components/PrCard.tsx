import type { Pr } from '../../server/types'
import { formatRelativeTime } from '../lib/formatRelativeTime'
import { CI_LABEL, REVIEW_CHIP, STALENESS_LABEL } from '../lib/labels'

export function PrCard({
  pr,
  onSelect,
  isDismissed,
}: {
  pr: Pr
  onSelect?: (pr: Pr) => void
  isDismissed: (url: string) => boolean
}) {
  const staleness = STALENESS_LABEL[pr.staleness]
  const ci = CI_LABEL[pr.ciStatus]
  const activeUnaddressed = pr.unaddressedThreads.filter((t) => !isDismissed(t.url))

  return (
    <div
      onClick={() => onSelect?.(pr)}
      className="cursor-pointer rounded-lg border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700"
    >
      <div className="flex items-start justify-between gap-3">
        <a
          href={pr.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-slate-100 hover:text-sky-400 hover:underline"
        >
          {pr.title}
        </a>
        <span className="whitespace-nowrap text-xs text-slate-500">{formatRelativeTime(pr.updatedAt)}</span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>
          {pr.repo.split('/')[1]} #{pr.number}
        </span>
        <span className="font-mono">
          <span className="text-emerald-500">+{pr.additions}</span> <span className="text-red-500">-{pr.deletions}</span>
        </span>
        {pr.stack && (
          <span
            title={`Stack: ${pr.stack.prNumbers.map((n) => `#${n}`).join(' → ')}`}
            className="rounded bg-indigo-500/15 px-1.5 py-0.5 font-medium text-indigo-300"
          >
            stack {pr.stack.position}/{pr.stack.total}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-1 text-xs font-medium ${ci.className}`}>{ci.label}</span>
        {staleness && <span className={`rounded px-2 py-1 text-xs font-medium ${staleness.className}`}>{staleness.label}</span>}
        {activeUnaddressed.length > 0 && (
          <span
            title={activeUnaddressed.map((t) => `${t.author}: ${t.body.slice(0, 140)}`).join('\n\n')}
            className="rounded bg-fuchsia-500/15 px-2 py-1 text-xs font-medium text-fuchsia-400"
          >
            {activeUnaddressed.length} unaddressed
          </span>
        )}
      </div>

      {pr.reviewers.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {pr.reviewers.map((r) => (
            <span
              key={r.login}
              title={r.login}
              className={`rounded-full border px-2 py-0.5 text-xs ${REVIEW_CHIP[r.state]}`}
            >
              {r.name || r.login}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
